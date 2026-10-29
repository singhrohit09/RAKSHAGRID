import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { db } from './db/connection.js';
import { seedDatabase } from './scripts/seed.js';
import { validateProductionEnvironment } from './config/security.js';
import { csrfProtection } from './middleware/csrf.js';

// Route modules
import authRoutes from './routes/auth.routes.js';
import incidentsRoutes from './routes/incidents.routes.js';
import teamsRoutes from './routes/teams.routes.js';
import sheltersRoutes from './routes/shelters.routes.js';
import resourcesRoutes from './routes/resources.routes.js';
import tasksRoutes from './routes/tasks.routes.js';
import alertsRoutes from './routes/alerts.routes.js';
import auditRoutes from './routes/audit.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';

dotenv.config();

// Fail safely if production environment variables are missing or insecure
validateProductionEnvironment();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// CORS configuration supporting credentials (cookies)
const allowedOrigins = [
  CLIENT_ORIGIN,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:4173'
];

app.use(cors({
  origin: (origin, callback) => {
    // Non-browser or direct requests without an Origin header are permitted
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Strictly reject unapproved origins; never reflect arbitrary origins when credentials=true
    return callback(new Error(`CORS blocked: Origin '${origin}' is not authorized.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Raksha-CSRF', 'X-Test-Rate-Limit']
}));

app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(csrfProtection(allowedOrigins));

// Lightweight request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// System Health Check
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    const isReady = await db.get<{ ok: number }>('SELECT 1 as ok');
    res.json({
      status: 'healthy',
      service: 'RakshaGrid Operational Backend API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: isReady ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      service: 'RakshaGrid Operational Backend API',
      error: error instanceof Error ? error.message : 'Database connectivity check failed'
    });
  }
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentsRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/shelters', sheltersRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationsRoutes);

// Catch-all 404 for undefined API endpoints
app.use('/api', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `API endpoint '${req.method} ${req.originalUrl}' does not exist`
  });
});

// Centralized error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err.message && err.message.startsWith('CORS blocked:')) {
    return res.status(403).json({
      success: false,
      error: err.message
    });
  }

  console.error('Unhandled server exception:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error occurred.' : err.message
  });
});

// Auto-initialize schema & baseline seed on start
export async function initializeDatabase() {
  try {
    await db.initSchema();
    const count = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM users');
    if (!count || count.count === 0) {
      console.log('📦 Database empty. Auto-seeding baseline data...');
      await seedDatabase(false);
    }
  } catch (err) {
    console.error('Database initialization warning:', err);
  }
}

// Start server if executed directly
if (process.env.NODE_ENV !== 'test') {
  initializeDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`🛡️  RakshaGrid Operations API running on port ${PORT}`);
      console.log(`   Healthcheck: http://localhost:${PORT}/api/health`);
    });
  });
}

export default app;

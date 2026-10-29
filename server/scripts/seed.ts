import bcrypt from 'bcryptjs';
import { db } from '../db/connection.js';
import { INITIAL_INCIDENTS } from '../../src/data/mockIncidents.js';
import { INITIAL_TEAMS } from '../../src/data/mockTeams.js';
import { INITIAL_SHELTERS } from '../../src/data/mockShelters.js';
import { INITIAL_RESOURCES } from '../../src/data/mockResources.js';
import { INITIAL_TASKS } from '../../src/data/mockTasks.js';
import { INITIAL_ALERTS } from '../../src/data/mockAlerts.js';
import { INITIAL_AUDIT_LOGS } from '../../src/data/mockAuditLogs.js';
import { DEFAULT_SETTINGS } from '../../src/data/seedData.js';
import { generateSecurePassword, isPasswordStrong } from '../config/security.js';

export interface SeedResult {
  adminEmail: string;
  adminPassword?: string;
  devCredentials?: Record<string, string>;
}

export async function seedDatabase(force = false): Promise<SeedResult> {
  console.log('🔄 Initializing database schema...');
  await db.initSchema();

  const userCount = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM users');
  if (userCount && userCount.count > 0 && !force) {
    console.log('ℹ️  Database already contains records. Skipping seed.');
    return { adminEmail: 'admin@rakshagrid.gov.in' };
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const salt = await bcrypt.genSalt(10);
  const now = new Date().toISOString();
  let adminPassword = process.env.INITIAL_ADMIN_PASSWORD || process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const devCredentials: Record<string, string> = {};

  if (isProduction) {
    console.log('🔒 Production mode detected: Skipping dummy development user accounts.');
    if (adminPassword) {
      const strength = isPasswordStrong(adminPassword);
      if (!strength.valid) {
        throw new Error(`Insecure INITIAL_ADMIN_PASSWORD in production: ${strength.reason}`);
      }
      const hash = await bcrypt.hash(adminPassword, salt);
      await db.run(
        `INSERT OR REPLACE INTO users (id, email, password_hash, display_name, role, department, callsign, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'admin', 'State Disaster Management Authority (SDMA)', 'COMMAND-01', ?, ?)`,
        ['USR-ADMIN-01', 'admin@rakshagrid.gov.in', hash, 'Director Rajesh Verma', now, now]
      );
      console.log('✅ Initial administrator provisioned from secure environment variable.');
    } else {
      console.log('ℹ️  No INITIAL_ADMIN_PASSWORD provided. Run "npm run server:bootstrap-admin" to provision initial administrator.');
    }
  } else {
    // Non-production (Development & Test): Provision secure development personas
    console.log('🌱 Seeding development persona accounts...');
    const defaultDevSecret = process.env.DEV_BOOTSTRAP_PASSWORD || process.env.TEST_PASSWORD || generateSecurePassword(14);
    adminPassword = adminPassword || defaultDevSecret;

    const devUsers = [
      {
        id: 'USR-ADMIN-01',
        email: 'admin@rakshagrid.gov.in',
        password: adminPassword,
        name: 'Director Rajesh Verma',
        role: 'admin',
        department: 'State Disaster Management Authority (SDMA)',
        callsign: 'COMMAND-01'
      },
      {
        id: 'USR-CMDR-02',
        email: 'commander@rakshagrid.gov.in',
        password: process.env.DEV_BOOTSTRAP_PASSWORD || generateSecurePassword(14),
        name: 'Cmdr. Ananya Sen',
        role: 'commander',
        department: 'Unified Incident Command Post',
        callsign: 'EOC-ALPHA'
      },
      {
        id: 'USR-RESP-03',
        email: 'responder@rakshagrid.gov.in',
        password: process.env.DEV_BOOTSTRAP_PASSWORD || generateSecurePassword(14),
        name: 'Vikramaditya Rao',
        role: 'responder',
        department: 'NDRF Battalion 8',
        callsign: 'RESCUE-LEAD-8'
      },
      {
        id: 'USR-LOG-04',
        email: 'logistics@rakshagrid.gov.in',
        password: process.env.DEV_BOOTSTRAP_PASSWORD || generateSecurePassword(14),
        name: 'Pooja Kulkarni',
        role: 'logistics',
        department: 'Relief Supply & Shelters Section',
        callsign: 'SUPPLY-BASE'
      },
      {
        id: 'USR-ANAL-05',
        email: 'analyst@rakshagrid.gov.in',
        password: process.env.DEV_BOOTSTRAP_PASSWORD || generateSecurePassword(14),
        name: 'Dr. Siddharth Mehta',
        role: 'analyst',
        department: 'Meteorological & Impact Assessment Group',
        callsign: 'IMPACT-OBSERVER'
      }
    ];

    for (const u of devUsers) {
      devCredentials[u.email] = u.password;
      const hash = await bcrypt.hash(u.password, salt);
      await db.run(
        `INSERT OR REPLACE INTO users (id, email, password_hash, display_name, role, department, callsign, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [u.id, u.email, hash, u.name, u.role, u.department, u.callsign, now, now]
      );
    }

    if (process.env.NODE_ENV !== 'test') {
      console.log('\n======================================================');
      console.log('🔑 Development Persona Credentials (Ephemeral / Local)');
      console.log('======================================================');
      for (const [em, pw] of Object.entries(devCredentials)) {
        console.log(`  ${em.padEnd(30)} : ${pw}`);
      }
      console.log('======================================================\n');
    }
  }

  console.log('🌱 Seeding teams...');
  for (const t of INITIAL_TEAMS) {
    await db.run(
      `INSERT OR REPLACE INTO teams (id, name, type, staff_count, skills, home_base, status, current_assignment, contact_callsign, contact_phone, latitude, longitude, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        t.id,
        t.name,
        t.type,
        t.staffCount,
        JSON.stringify(t.skills),
        t.homeBase,
        t.status,
        t.currentAssignment || null,
        t.contactCallsign,
        t.contactPhone,
        t.latitude,
        t.longitude,
        t.updatedAt
      ]
    );
  }

  console.log('🌱 Seeding shelters...');
  for (const s of INITIAL_SHELTERS) {
    await db.run(
      `INSERT OR REPLACE INTO shelters (id, name, address, region, latitude, longitude, capacity, current_occupancy, status, facilities, contact_person, contact_phone, notes, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        s.id,
        s.name,
        s.address,
        s.region,
        s.latitude,
        s.longitude,
        s.capacity,
        s.currentOccupancy,
        s.status,
        JSON.stringify(s.facilities),
        s.contactPerson,
        s.contactPhone,
        s.notes,
        s.updatedAt
      ]
    );
  }

  console.log('🌱 Seeding resources...');
  for (const r of INITIAL_RESOURCES) {
    await db.run(
      `INSERT OR REPLACE INTO resources (id, name, category, quantity_available, quantity_allocated, unit, storage_location, min_threshold, status, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        r.id,
        r.name,
        r.category,
        r.quantityAvailable,
        r.quantityAllocated,
        r.unit,
        r.storageLocation,
        r.minThreshold,
        r.status,
        r.updatedAt
      ]
    );
  }

  console.log('🌱 Seeding incidents and timelines...');
  for (const inc of INITIAL_INCIDENTS) {
    await db.run(
      `INSERT OR REPLACE INTO incidents (id, title, description, category, severity, status, priority, location_name, latitude, longitude, reported_at, updated_at, assigned_team_id, affected_population, casualties, source, estimated_radius_meters)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        inc.id,
        inc.title,
        inc.description,
        inc.category,
        inc.severity,
        inc.status,
        inc.priority,
        inc.locationName,
        inc.latitude,
        inc.longitude,
        inc.reportedAt,
        inc.updatedAt,
        inc.assignedTeamId || null,
        inc.affectedPopulation,
        inc.casualties,
        inc.source,
        inc.estimatedRadiusMeters || 1000
      ]
    );

    for (const tl of inc.timeline) {
      await db.run(
        `INSERT OR REPLACE INTO incident_timeline (id, incident_id, timestamp, actor, note, type)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [tl.id, inc.id, tl.timestamp, tl.actor, tl.note, tl.type]
      );
    }
  }

  console.log('🌱 Seeding tasks...');
  for (const t of INITIAL_TASKS) {
    await db.run(
      `INSERT OR REPLACE INTO tasks (id, title, description, related_incident_id, assigned_team_id, priority, status, due_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        t.id,
        t.title,
        t.description,
        t.relatedIncidentId || null,
        t.assignedTeamId || null,
        t.priority,
        t.status,
        t.dueDate,
        t.createdAt,
        t.updatedAt
      ]
    );
  }

  console.log('🌱 Seeding alerts...');
  for (const a of INITIAL_ALERTS) {
    await db.run(
      `INSERT OR REPLACE INTO alerts (id, title, body, type, severity, target_region, related_incident_id, safety_actions, channels, status, created_at, updated_at, approved_by, approved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        a.id,
        a.title,
        a.body,
        a.type,
        a.severity,
        a.targetRegion,
        a.relatedIncidentId || null,
        JSON.stringify(a.safetyActions),
        JSON.stringify(a.channels),
        a.status,
        a.createdAt,
        a.updatedAt,
        a.approvedBy || null,
        a.approvedAt || null
      ]
    );
  }

  console.log('🌱 Seeding audit events...');
  for (const log of INITIAL_AUDIT_LOGS) {
    await db.run(
      `INSERT OR REPLACE INTO audit_events (id, timestamp, actor_id, actor_name, actor_role, action, entity_type, entity_id, description, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        log.id,
        log.timestamp,
        'SYSTEM',
        log.actor,
        log.actorRole,
        log.action,
        log.entityType,
        log.entityId,
        log.description,
        log.metadata ? JSON.stringify(log.metadata) : null
      ]
    );
  }

  console.log('🌱 Seeding settings...');
  await db.run(
    `INSERT OR REPLACE INTO system_settings (key, value, updated_at)
     VALUES (?, ?, ?)`,
    ['app_settings', JSON.stringify(DEFAULT_SETTINGS), new Date().toISOString()]
  );

  console.log('✅ Database successfully seeded with baseline disaster intelligence records.');
  return { adminEmail: 'admin@rakshagrid.gov.in', adminPassword, devCredentials };
}

// Allow direct CLI invocation
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase(process.argv.includes('--force'))
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}


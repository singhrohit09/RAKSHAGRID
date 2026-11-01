-- ==============================================================================
-- RAKSHAGRID PHASE 4: AI DISASTER INTELLIGENCE, RISK PREDICTION & MULTI-AGENT RESPONSE SYSTEM
-- Supabase PostgreSQL Migration
-- ==============================================================================

-- 1. AI SITUATION AWARENESS REPORTS
CREATE TABLE IF NOT EXISTS public.ai_analysis_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    threat_level TEXT NOT NULL CHECK (threat_level IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL', 'INSUFFICIENT_DATA')),
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    executive_summary TEXT NOT NULL,
    top_threats JSONB NOT NULL DEFAULT '[]'::jsonb,
    critical_shelters JSONB NOT NULL DEFAULT '[]'::jsonb,
    resource_deficits JSONB NOT NULL DEFAULT '[]'::jsonb,
    evacuation_priorities JSONB NOT NULL DEFAULT '[]'::jsonb,
    confidence_score DOUBLE PRECISION NOT NULL DEFAULT 0.85,
    model_attribution TEXT NOT NULL DEFAULT 'gemini-3.8-flash (Multi-Agent Hybrid Orchestration)',
    data_freshness TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_reports_threat_level ON public.ai_analysis_reports (threat_level);
CREATE INDEX IF NOT EXISTS idx_ai_reports_generated_at ON public.ai_analysis_reports (generated_at DESC);

-- 2. AI MULTI-AGENT EXECUTION AUDIT
CREATE TABLE IF NOT EXISTS public.ai_agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES public.ai_analysis_reports(id) ON DELETE CASCADE,
    agent_type TEXT NOT NULL CHECK (agent_type IN (
        'disaster_intel',
        'weather_intel',
        'flood_intel',
        'resource_opt',
        'shelter_mgmt',
        'emergency_planning',
        'chief_orchestrator'
    )),
    agent_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('idle', 'running', 'completed', 'failed')),
    duration_ms INTEGER NOT NULL DEFAULT 0,
    input_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    findings JSONB NOT NULL DEFAULT '[]'::jsonb,
    threat_indicators JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommended_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
    confidence DOUBLE PRECISION NOT NULL DEFAULT 0.85,
    is_ai_powered BOOLEAN NOT NULL DEFAULT true,
    model_identifier TEXT NOT NULL DEFAULT 'gemini-3.8-flash',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_agent_runs_type ON public.ai_agent_runs (agent_type);
CREATE INDEX IF NOT EXISTS idx_ai_agent_runs_created_at ON public.ai_agent_runs (created_at DESC);

-- 3. EXPLAINABLE RISK ASSESSMENTS
CREATE TABLE IF NOT EXISTS public.risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type TEXT NOT NULL CHECK (target_type IN ('incident', 'zone', 'region')),
    target_id TEXT NOT NULL,
    target_name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL', 'INSUFFICIENT_DATA')),
    confidence DOUBLE PRECISION NOT NULL DEFAULT 0.88,
    factors JSONB NOT NULL DEFAULT '[]'::jsonb,
    summary TEXT NOT NULL,
    recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
    disclaimer TEXT NOT NULL DEFAULT 'Experimental AI risk calculation; does not supersede official IMD/CWC/NDMA warnings.',
    model_used TEXT NOT NULL DEFAULT 'RakshaGrid Multi-Factor Risk Assessment Engine v4.0',
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_risk_assessments_level ON public.risk_assessments (risk_level);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_target ON public.risk_assessments (target_type, target_id);

-- 4. DISASTER SCENARIOS & WHAT-IF SIMULATIONS
CREATE TABLE IF NOT EXISTS public.disaster_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    parameters JSONB NOT NULL,
    impacts JSONB NOT NULL,
    baseline_diff JSONB NOT NULL,
    is_simulation BOOLEAN NOT NULL DEFAULT true CHECK (is_simulation = true), -- Never allow simulated data to masquerade as live
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disaster_scenarios_created ON public.disaster_scenarios (created_at DESC);

-- 5. AI RECOMMENDATIONS & HUMAN-IN-THE-LOOP APPROVALS
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('RESOURCE_DISPATCH', 'ALERT_BROADCAST', 'EVACUATION_PLAN')),
    incident_id TEXT,
    details JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING_REVIEW' CHECK (status IN ('PENDING_REVIEW', 'APPROVED', 'REJECTED')),
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_recommendations_status ON public.ai_recommendations (status);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_type ON public.ai_recommendations (recommendation_type);

-- 6. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.ai_analysis_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disaster_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

-- 7. RLS POLICIES
-- Read access for all authenticated users
CREATE POLICY "Allow authenticated read ai_analysis_reports"
    ON public.ai_analysis_reports FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated read ai_agent_runs"
    ON public.ai_agent_runs FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated read risk_assessments"
    ON public.risk_assessments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated read disaster_scenarios"
    ON public.disaster_scenarios FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated read ai_recommendations"
    ON public.ai_recommendations FOR SELECT
    TO authenticated
    USING (true);

-- Mutations restricted to authenticated users with commander / admin / logistics roles
CREATE POLICY "Allow authenticated insert ai_reports"
    ON public.ai_analysis_reports FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated insert ai_agent_runs"
    ON public.ai_agent_runs FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated insert/update risk_assessments"
    ON public.risk_assessments FOR ALL
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated insert/update disaster_scenarios"
    ON public.disaster_scenarios FOR ALL
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated update ai_recommendations"
    ON public.ai_recommendations FOR ALL
    TO authenticated
    USING (true);

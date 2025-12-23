-- Admin Dashboard Schema with Owner-Only RLS
-- Owner email: watfa003@gmail.com

-- Helper function to check if current user is the owner
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT auth.jwt() ->> 'email' = 'watfa003@gmail.com'
$$;

-- Master Prompt Versions table
CREATE TABLE public.master_prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version INTEGER NOT NULL,
  content JSONB NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,
  change_summary TEXT,
  metadata JSONB DEFAULT '{}'
);

ALTER TABLE public.master_prompt_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner only access for master_prompt_versions"
ON public.master_prompt_versions
FOR ALL
USING (public.is_owner())
WITH CHECK (public.is_owner());

-- Strategy Definitions Versions table
CREATE TABLE public.strategy_definitions_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version INTEGER NOT NULL,
  strategies JSONB NOT NULL,
  hierarchy JSONB DEFAULT '{}',
  weights JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT false,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,
  change_summary TEXT,
  metadata JSONB DEFAULT '{}'
);

ALTER TABLE public.strategy_definitions_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner only access for strategy_definitions_versions"
ON public.strategy_definitions_versions
FOR ALL
USING (public.is_owner())
WITH CHECK (public.is_owner());

-- Weekly Change Requests table
CREATE TABLE public.weekly_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'implemented', 'rolled_back')),
  analysis_summary JSONB NOT NULL,
  findings JSONB DEFAULT '[]',
  proposed_changes JSONB NOT NULL,
  master_prompt_diff TEXT,
  strategy_changes JSONB DEFAULT '[]',
  expected_impact JSONB DEFAULT '{}',
  risk_assessment JSONB DEFAULT '{}',
  rollback_plan JSONB DEFAULT '{}',
  confidence_score NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  review_notes TEXT,
  implemented_at TIMESTAMPTZ,
  implemented_by TEXT,
  rolled_back_at TIMESTAMPTZ,
  rolled_back_by TEXT,
  rollback_reason TEXT
);

ALTER TABLE public.weekly_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner only access for weekly_change_requests"
ON public.weekly_change_requests
FOR ALL
USING (public.is_owner())
WITH CHECK (public.is_owner());

-- Approvals table
CREATE TABLE public.admin_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_request_id UUID REFERENCES public.weekly_change_requests(id) ON DELETE CASCADE,
  approval_type TEXT NOT NULL CHECK (approval_type IN ('master_prompt', 'strategy', 'full_request')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  metadata JSONB DEFAULT '{}'
);

ALTER TABLE public.admin_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner only access for admin_approvals"
ON public.admin_approvals
FOR ALL
USING (public.is_owner())
WITH CHECK (public.is_owner());

-- Deployments table
CREATE TABLE public.admin_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_request_id UUID REFERENCES public.weekly_change_requests(id),
  master_prompt_version_id UUID REFERENCES public.master_prompt_versions(id),
  strategy_version_id UUID REFERENCES public.strategy_definitions_versions(id),
  deployment_type TEXT NOT NULL CHECK (deployment_type IN ('master_prompt', 'strategy', 'full')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'deploying', 'deployed', 'failed', 'rolled_back')),
  deployed_by TEXT NOT NULL,
  deployed_at TIMESTAMPTZ DEFAULT NOW(),
  rollback_at TIMESTAMPTZ,
  rollback_by TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

ALTER TABLE public.admin_deployments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner only access for admin_deployments"
ON public.admin_deployments
FOR ALL
USING (public.is_owner())
WITH CHECK (public.is_owner());

-- Audit Log table (IMMUTABLE - insert only)
CREATE TABLE public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  actor_email TEXT NOT NULL,
  actor_ip TEXT,
  actor_user_agent TEXT,
  before_state JSONB,
  after_state JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Audit log: owner can only INSERT and SELECT (no UPDATE/DELETE)
CREATE POLICY "Owner can view audit log"
ON public.admin_audit_log
FOR SELECT
USING (public.is_owner());

CREATE POLICY "Owner can insert audit log"
ON public.admin_audit_log
FOR INSERT
WITH CHECK (public.is_owner());

-- Strategy Events table (for tracking strategy performance)
CREATE TABLE public.admin_strategy_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_name TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('optimization', 'feedback', 'score_change', 'tier_change')),
  score NUMERIC(4,2),
  feedback_type TEXT,
  feedback_reason TEXT,
  old_tier TEXT,
  new_tier TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_strategy_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner only access for admin_strategy_events"
ON public.admin_strategy_events
FOR ALL
USING (public.is_owner())
WITH CHECK (public.is_owner());

-- Admin Dashboard Stats (aggregated metrics)
CREATE TABLE public.admin_dashboard_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date DATE NOT NULL UNIQUE,
  total_optimizations INTEGER DEFAULT 0,
  avg_score NUMERIC(4,2) DEFAULT 0,
  avg_latency_ms INTEGER DEFAULT 0,
  total_users INTEGER DEFAULT 0,
  positive_feedback_count INTEGER DEFAULT 0,
  negative_feedback_count INTEGER DEFAULT 0,
  top_strategies JSONB DEFAULT '[]',
  weak_pillars JSONB DEFAULT '[]',
  model_distribution JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_dashboard_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner only access for admin_dashboard_stats"
ON public.admin_dashboard_stats
FOR ALL
USING (public.is_owner())
WITH CHECK (public.is_owner());

-- Create indexes for performance
CREATE INDEX idx_master_prompt_versions_active ON public.master_prompt_versions(is_active) WHERE is_active = true;
CREATE INDEX idx_strategy_definitions_active ON public.strategy_definitions_versions(is_active) WHERE is_active = true;
CREATE INDEX idx_weekly_change_requests_status ON public.weekly_change_requests(status);
CREATE INDEX idx_weekly_change_requests_dates ON public.weekly_change_requests(week_start, week_end);
CREATE INDEX idx_admin_audit_log_created ON public.admin_audit_log(created_at DESC);
CREATE INDEX idx_admin_audit_log_entity ON public.admin_audit_log(entity_type, entity_id);
CREATE INDEX idx_admin_strategy_events_name ON public.admin_strategy_events(strategy_name, created_at DESC);
CREATE INDEX idx_admin_dashboard_stats_date ON public.admin_dashboard_stats(stat_date DESC);
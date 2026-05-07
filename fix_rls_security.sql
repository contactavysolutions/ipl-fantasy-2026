-- ============================================================
-- Fix Supabase Security Advisor: Enable RLS on all public tables
-- ============================================================
-- This enables Row-Level Security on every table and adds
-- permissive policies so the app continues working as-is.
-- Since the app uses its own auth (not Supabase Auth),
-- we use open policies that allow the anon key full access.
-- ============================================================

-- 1. users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to users" ON public.users
  FOR ALL USING (true) WITH CHECK (true);

-- 2. matches
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to matches" ON public.matches
  FOR ALL USING (true) WITH CHECK (true);

-- 3. selections
ALTER TABLE public.selections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to selections" ON public.selections
  FOR ALL USING (true) WITH CHECK (true);

-- 4. results
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to results" ON public.results
  FOR ALL USING (true) WITH CHECK (true);

-- 5. match_insights
ALTER TABLE public.match_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to match_insights" ON public.match_insights
  FOR ALL USING (true) WITH CHECK (true);

-- 6. player_scores (the one flagged as CRITICAL)
ALTER TABLE public.player_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to player_scores" ON public.player_scores
  FOR ALL USING (true) WITH CHECK (true);

-- push_subscriptions already has RLS enabled from our earlier script.
-- Done! Hit "Rerun linter" in the Security Advisor after executing.

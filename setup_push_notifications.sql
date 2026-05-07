-- 1. Create the Push Subscriptions Table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    endpoint TEXT NOT NULL,
    keys_p256dh TEXT NOT NULL,
    keys_auth TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Configure read/write rules if necessary
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read/write for all" ON public.push_subscriptions FOR ALL USING (true) WITH CHECK (true);

-- 2. Enable Native CRON extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 3. Schedule the Hourly Vercel Ping
-- This tells your database to anonymously ping your Vercel URL every hour exactly at the top of the hour.
SELECT cron.schedule(
  'invoke-vercel-push-reminders',
  '0 * * * *', -- Every hour
  $$
    SELECT net.http_post(
        url:='https://ipl-fantasy-2026-xi.vercel.app/api/cron-reminders',
        headers:='{"Content-Type": "application/json"}'::jsonb
    );
  $$
);

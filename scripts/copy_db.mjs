import { createClient } from '@supabase/supabase-js';

const PROD_URL = "https://olewyqrxgwjjjspeonon.supabase.co";
const PROD_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXd5cXJ4Z3dqampzcGVvbm9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MzM3NjMsImV4cCI6MjA5MDMwOTc2M30.mbY5GR8eZu7BH1UD0Yq2B_l5dr4bPB-RkYXa-vgRwYI";

const TEST_URL = "https://hwxerifljeeysmnoahfj.supabase.co";
const TEST_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3eGVyaWZsamVleXNtbm9haGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MDQ2MDEsImV4cCI6MjA5Mjk4MDYwMX0.SN-NXeE5axBMBnE0gjoR4FFoVCxz-NjOCRz3xT7CtbE";

const prod = createClient(PROD_URL, PROD_KEY);
const test = createClient(TEST_URL, TEST_KEY);

const tables = [
  'users',
  'matches',
  'selections',
  'results',
  'match_insights',
  'player_scores',
  'challenges'
];

async function sync() {
  console.log("Starting DB Sync...");
  for (const table of tables) {
    console.log(`Fetching ${table} from PROD...`);
    // Fetch all records (assuming under 1000 for now based on counts)
    const { data: records, error: fetchErr } = await prod.from(table).select('*');
    if (fetchErr) {
      console.error(`Error fetching ${table}:`, fetchErr);
      continue;
    }
    
    if (!records || records.length === 0) {
      console.log(`No records found for ${table}. Skipping.`);
      continue;
    }
    
    console.log(`Found ${records.length} records. Inserting into TEST...`);
    const { error: insertErr } = await test.from(table).upsert(records);
    if (insertErr) {
      console.error(`Error inserting ${table}:`, insertErr);
    } else {
      console.log(`Successfully synced ${table}.`);
    }
  }
  console.log("Sync complete!");
}

sync();

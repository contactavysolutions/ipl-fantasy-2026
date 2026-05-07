import { createClient } from "@supabase/supabase-js";
import fs from "fs";

function getSupabaseConfig() {
  const content = fs.readFileSync('src/App.jsx', 'utf-8');
  const urlMatch = content.match(/const SUPABASE_URL = "(.*?)";/);
  // Get service role key from .env file directly
  const envContent = fs.readFileSync('.env', 'utf-8');
  const srvKeyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);
  
  if (!urlMatch || !srvKeyMatch) throw new Error("Could not find Supabase credentials");
  return { url: urlMatch[1], srvKey: srvKeyMatch[1].trim() };
}

const config = getSupabaseConfig();
const supabase = createClient(config.url, config.srvKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function addVijay() {
  const username = "vijay";
  const p = "VijayPass2026!";

  console.log("Creating user via Admin API...");
  const { data, error } = await supabase.auth.admin.createUser({
    email: `${username}@iplfantasy.app`,
    password: p,
    email_confirm: true,
    user_metadata: { display_name: "Vijay" }
  });

  if (error) {
    console.error("Auth creation error:", error.message);
    if (!error.message.includes("User already registered")) return;
  } else {
    console.log(`✅ Auth user created successfully.`);
  }

  // Insert into public.users
  const { error: dbErr } = await supabase.from("users").upsert({
    username: username,
    display_name: "Vijay",
    is_admin: false,
    role: "player"
  }, { onConflict: "username" });

  if (dbErr) {
    console.error("DB Error:", dbErr.message);
  } else {
    console.log("✅ DB User upserted!");
  }
}

addVijay();

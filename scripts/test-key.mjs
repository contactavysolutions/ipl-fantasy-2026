import { createClient } from "@supabase/supabase-js";
import fs from "fs";

function testIt() {
  const content = fs.readFileSync('src/App.jsx', 'utf-8');
  const urlMatch = content.match(/const SUPABASE_URL = "(.*?)";/);
  const keyMatch = content.match(/const SUPABASE_ANON_KEY = "(.*?)";/);
  
  const envContent = fs.readFileSync('.env', 'utf-8');
  const srvMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

  console.log("URL:", urlMatch[1]);
  console.log("Anon Key Length:", keyMatch[1].length);
  console.log("Srv Key Length:", srvMatch[1].trim().length);

  const supabase = createClient(urlMatch[1], srvMatch[1].trim());
  supabase.from('users').select('*').limit(1).then(r => console.log('Srv Key DB Test:', r.data ? 'Success' : r.error));
}
testIt();

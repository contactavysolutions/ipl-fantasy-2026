import fs from 'fs';
import https from 'https';

// --- Helper Functions ---
function fetchCSV(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow redirect for Google Sheets
        https.get(res.headers.location, (res2) => {
          let data = '';
          res2.on('data', chunk => data += chunk);
          res2.on('end', () => resolve(data));
          res2.on('error', reject);
        });
      } else if (res.statusCode === 200) {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
        res.on('error', reject);
      } else {
        reject(new Error(`Failed to fetch CSV: HTTP ${res.statusCode}`));
      }
    }).on('error', reject);
  });
}

function extractSheetId(url) {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) throw new Error("Invalid Google Sheets URL.");
  return match[1];
}

// Extract credentials from App.jsx so we don't rely on dotenv
function getSupabaseConfig() {
  const content = fs.readFileSync('src/App.jsx', 'utf-8');
  const urlMatch = content.match(/const SUPABASE_URL = "(.*?)";/);
  const keyMatch = content.match(/const SUPABASE_ANON_KEY = "(.*?)";/);
  if (!urlMatch || !keyMatch) throw new Error("Could not find Supabase credentials in src/App.jsx");
  return { url: urlMatch[1], key: keyMatch[1] };
}

// --- Main Execution ---
async function run() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log(`
🏏 IPL Fantasy 2026 - Bulk Import Utility
------------------------------------------
Usage: node scripts/import-sheet.mjs <username> <google-sheet-url>

Example:
  node scripts/import-sheet.mjs peddi "https://docs.google.com/spreadsheets/d/1IORlfDhTJdd4.../edit"
`);
    process.exit(1);
  }

  const username = args[0].toLowerCase().replace(/\s/g, '_');
  const rawUrl = args[1];

  console.log(`\n⏳ Validating user & extracting sheet ID...`);
  
  const sheetId = extractSheetId(rawUrl);
  // Default to exporting whatever the default active sheet is, in CSV format
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

  console.log(`⏳ Downloading match selections for [${username}]...`);
  const csvData = await fetchCSV(csvUrl);
  
  const lines = csvData.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    console.error("❌ The sheet appears to be empty or failed to download. Ensure the link has 'Anyone with the link' access.");
    process.exit(1);
  }

  console.log(`✅ CSV downloaded successfully (${lines.length - 1} rows found). Connecting to database...`);
  const { url: supabaseUrl, key: supabaseKey } = getSupabaseConfig();
  
  const headers = { 
    'apikey': supabaseKey, 
    'Authorization': 'Bearer ' + supabaseKey,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation' // For upserting
  };

  let successCount = 0;
  let errorCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim() || null);
    
    // Parse match ID like "Match 1" or "Match 19"
    const matchCol = cols[0] || "";
    const matchIdMatch = matchCol.match(/Match (\d+)/i);
    if (!matchIdMatch) continue; // Skip non-match rows (like playoffs if unnumbered)
    
    const matchId = parseInt(matchIdMatch[1]);

    const sel = {
      username: username,
      match_id: matchId,
      winning_team: cols[1],
      best_batsman: cols[2],
      best_bowler: cols[3],
      powerplay_winner: cols[4],
      dot_ball_bowler: cols[5],
      total_wickets: cols[6],
      duck_batsman: cols[7],
      double_category: cols[8],
      winning_horse: cols[9],
      losing_horse: cols[10]
    };

    // Check if exists
    const getUrl = `${supabaseUrl}/rest/v1/selections?username=eq.${username}&match_id=eq.${matchId}`;
    const getRes = await fetch(getUrl, { headers: { ...headers, Prefer: 'count=exact' } });
    const existing = await getRes.json();

    let res;
    if (existing && existing.length > 0) {
      const id = existing[0].id;
      res = await fetch(`${supabaseUrl}/rest/v1/selections?id=eq.${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(sel)
      });
    } else {
      res = await fetch(`${supabaseUrl}/rest/v1/selections`, {
        method: 'POST',
        headers,
        body: JSON.stringify(sel)
      });
    }

    if (res.ok) {
      process.stdout.write(`\r✅ Uploaded M${matchId}... `);
      successCount++;
    } else {
      const err = await res.text();
      console.error(`\n❌ Failed M${matchId}: ${err}`);
      errorCount++;
    }
  }

  console.log(`\n\n🎉 Import Complete!`);
  console.log(`------------------------------------------`);
  console.log(`User: ${username}`);
  console.log(`Successfully Saved: ${successCount} matches`);
  console.log(`Failed: ${errorCount} matches`);
}

run().catch(err => {
  console.error(`\n❌ Error: ${err.message}`);
});

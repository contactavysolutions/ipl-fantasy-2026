import fs from 'fs';

function testLogin() {
  const content = fs.readFileSync('src/App.jsx', 'utf-8');
  const urlMatch = content.match(/const SUPABASE_URL = "(.*?)";/);
  const keyMatch = content.match(/const SUPABASE_ANON_KEY = "(.*?)";/);
  
  const SUPABASE_URL = urlMatch[1];
  const SUPABASE_ANON_KEY = keyMatch[1];

  fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: "vijay@iplfantasy.app",
      password: "VijayWin2026!!!"
    })
  })
  .then(res => res.json())
  .then(data => console.log("Login Result:", data))
  .catch(err => console.error("Login Error:", err));
}

testLogin();

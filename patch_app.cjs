const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf-8');

// Insert isMatchLocked before getStatus
content = content.replace(
  '// ─── MATCH STATUS ─────────────────────────────────────────────────────────────\nfunction getStatus',
  `// ─── MATCH STATUS ─────────────────────────────────────────────────────────────
function isMatchLocked(match, now) {
  if (match.is_locked === true) return true;
  if (match.is_locked === false) return false;
  return now >= new Date(match.lock_time);
}

function getStatus`
);

// Replace now >= new Date(match.lock_time) inside getStatus
content = content.replace(
  'if (now >= new Date(match.lock_time)) return "locked";',
  'if (isMatchLocked(match, now)) return "locked";'
);

// Replace now>=new Date(match.lock_time) universally
content = content.replace(/now\s*>=\s*new Date\(match\.lock_time\)/g, 'isMatchLocked(match, now)');
content = content.replace(/now\s*>=\s*new Date\(m\.lock_time\)/g, 'isMatchLocked(m, now)');

// Insert AdminLocksTab UI before AdminPage
const adminLocksTab = `
function AdminLocksTab({matches}) {
  const [now] = useState(new Date());
  
  const toggleLock = async (matchId, val) => {
    await fetch(\`\${SUPABASE_URL}/rest/v1/matches?id=eq.\${matchId}\`, {
      method: "PATCH",
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: \`Bearer \${SUPABASE_ANON_KEY}\`, "Content-Type": "application/json" },
      body: JSON.stringify({ is_locked: val })
    });
    window.location.reload();
  };

  return (
    <div style={S.card}>
      <div style={S.sectionTitle}>Manual Lock & Unlock Overrides</div>
      <p style={{color:"#888",fontSize:"13px",marginBottom:"16px"}}>Override the automatic match timer. Setting to Auto respects the scheduled time.</p>
      {matches.map(m => {
        const overrides = m.is_locked === true ? "Force Locked" : m.is_locked === false ? "Force Unlocked" : "Auto";
        return (
          <div key={m.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.05)',flexWrap:"wrap",gap:"8px"}}>
            <div>
              <span style={{fontWeight:"bold",color:"#60a5fa",marginRight:"8px"}}>M{m.id}</span>
              {m.home} vs {m.away} 
              <span style={{fontSize:'12px',color:'#888',marginLeft:'8px'}}>({m.date}) - Mode: <strong style={{color:m.is_locked===true?"#f87171":m.is_locked===false?"#4ade80":"#64748b"}}>{overrides}</strong></span>
            </div>
            <div style={{display:'flex',gap:'6px'}}>
              <button style={{...S.btn(m.is_locked===false?"primary":"ghost"),padding:'4px 10px',fontSize:'12px'}} onClick={()=>toggleLock(m.id, false)}>Unlock</button>
              <button style={{...S.btn(m.is_locked===null?"primary":"ghost"),padding:'4px 10px',fontSize:'12px'}} onClick={()=>toggleLock(m.id, null)}>Auto</button>
              <button style={{...S.btn(m.is_locked===true?"primary":"ghost"),padding:'4px 10px',fontSize:'12px'}} onClick={()=>toggleLock(m.id, true)}>Lock</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AdminPage`;

content = content.replace('function AdminPage', adminLocksTab);

// Add the button to AdminPage tab menu
content = content.replace(
  '<button style={S.navBtn(adminTab==="users")} onClick={()=>setAdminTab("users")}>Player Passwords</button>\n      </div>',
  '<button style={S.navBtn(adminTab==="users")} onClick={()=>setAdminTab("users")}>Player Passwords</button>\n        <button style={S.navBtn(adminTab==="locks")} onClick={()=>setAdminTab("locks")}>Lock Overrides</button>\n      </div>'
);

// Map the tab view
content = content.replace(
  'adminTab==="insights"?<AIInsightsTab matches={matches}/>:(',
  'adminTab==="insights"?<AIInsightsTab matches={matches}/>:adminTab==="locks"?<AdminLocksTab matches={matches} />:('
);

fs.writeFileSync('src/App.jsx', content);
console.log("App.jsx patched successfully!");

import { useState, useEffect, useCallback } from "react";

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
const SUPABASE_URL = "https://olewyqrxgwjjjspeonon.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXd5cXJ4Z3dqampzcGVvbm9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MzM3NjMsImV4cCI6MjA5MDMwOTc2M30.mbY5GR8eZu7BH1UD0Yq2B_l5dr4bPB-RkYXa-vgRwYI";

// ─── SUPABASE CLIENT ──────────────────────────────────────────────────────────
const supa = {
  async query(table, opts = {}) {
    let url = `${SUPABASE_URL}/rest/v1/${table}?`;
    if (opts.select) url += `select=${opts.select}&`;
    if (opts.eq) Object.entries(opts.eq).forEach(([k,v]) => url += `${k}=eq.${encodeURIComponent(v)}&`);
    if (opts.order) url += `order=${opts.order}&`;
    const res = await fetch(url, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } });
    return res.json();
  },
  async upsert(table, data, onConflict) {
    const url = `${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async update(table, data, eq) {
    let url = `${SUPABASE_URL}/rest/v1/${table}?`;
    Object.entries(eq).forEach(([k,v]) => url += `${k}=eq.${encodeURIComponent(v)}&`);
    const res = await fetch(url, {
      method: "PATCH",
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
};

// ─── STATIC DATA ──────────────────────────────────────────────────────────────
const TEAMS = {
  RCB: { name:"Royal Challengers Bengaluru", color:"#CC0000", accent:"#FFD700" },
  MI:  { name:"Mumbai Indians",              color:"#004BA0", accent:"#88CFFF" },
  CSK: { name:"Chennai Super Kings",         color:"#F5A623", accent:"#ffffff" },
  KKR: { name:"Kolkata Knight Riders",       color:"#3A225D", accent:"#F5C518" },
  SRH: { name:"Sunrisers Hyderabad",         color:"#FF6B00", accent:"#ffffff" },
  DC:  { name:"Delhi Capitals",              color:"#0A2D6E", accent:"#ffffff" },
  GT:  { name:"Gujarat Titans",              color:"#1C4F8C", accent:"#00D4FF" },
  RR:  { name:"Rajasthan Royals",            color:"#EA1A85", accent:"#ffffff" },
  PBKS:{ name:"Punjab Kings",               color:"#ED1B24", accent:"#DCDDDF" },
  LSG: { name:"Lucknow Super Giants",        color:"#00B4D8", accent:"#FFD700" },
};

const PLAYERS = {
  CSK: ["Ruturaj Gaikwad","MS Dhoni","Sanju Samson","Kartik Sharma","Urvil Patel","Dewald Brevis","Ayush Mhatre","Sarfaraz Khan","Shivam Dube","Matthew Short","Jamie Overton","Ramakrishna Ghosh","Anshul Kamboj","Prashant Veer","Aman Khan","Zak Foulkes","Khaleel Ahmed","Mukesh Choudhary","Gurjapneet Singh","Matt Henry","Spencer Johnson","Shreyas Gopal","Rahul Chahar","Noor Ahmad","Akeal Hosein"],
  DC:  ["Axar Patel","KL Rahul","Prithvi Shaw","David Miller","Tristan Stubbs","Abhishek Porel","Karun Nair","Sameer Rizvi","Ashutosh Sharma","Mitchell Starc","T. Natarajan","Mukesh Kumar","Dushmantha Chameera","Lungi Ngidi","Kyle Jamieson","Nitish Rana","Kuldeep Yadav","Ajay Mandal","Tripurana Vijay","Madhav Tiwari","Auqib Dar","Pathum Nissanka","Sahil Parakh","Vipraj Nigam"],
  GT:  ["Shubman Gill","Jos Buttler","Sai Sudharsan","Shahrukh Khan","Anuj Rawat","Kumar Kushagra","Nishant Sindhu","Rahul Tewatia","Washington Sundar","Rashid Khan","Jason Holder","Kagiso Rabada","Mohammed Siraj","Prasidh Krishna","Ishant Sharma","Sai Kishore","Jayant Yadav","Manav Suthar","Arshad Khan","Gurnoor Singh Brar","Kulwant Khejroliya","Glenn Phillips","Tom Banton","Luke Wood","Ashok Sharma"],
  KKR: ["Ajinkya Rahane","Cameron Green","Rinku Singh","Shreyas Iyer","Venkatesh Iyer","Nitish Rana","Sunil Narine","Andre Russell","Varun Chakravarthy","Navdeep Saini","Saurabh Dubey","Blessing Muzarabani","Angkrish Raghuvanshi","KS Bharat","Vaibhav Arora","Matheesha Pathirana","Umran Malik","Manish Pandey","Rovman Powell","Finn Allen","Rachin Ravindra","Daksh Kamra","Tim Seifert","Kartik Tyagi","Prashant Solanki"],
  LSG: ["Rishabh Pant","Nicholas Pooran","Ayush Badoni","Mohammed Shami","Avesh Khan","Mohsin Khan","Arshin Kulkarni","Shahbaz Ahmed","Aiden Markram","Abdul Samad","Wanindu Hasaranga","Himmat Singh","Akshat Raghuwanshi","Mitchell Marsh","Arjun Tendulkar","Matthew Breetzke","Josh Inglis","Mukul Choudhary","Akash Maharaj Singh","Anrich Nortje","Prince Yadav","Digvesh Singh Rathi","Mayank Yadav","Naman Tiwari","Manimaran Siddharth"],
  MI:  ["Hardik Pandya","Rohit Sharma","Suryakumar Yadav","Tilak Varma","Quinton de Kock","Ryan Rickelton","Naman Dhir","Danish Malewar","Sherfane Rutherford","Will Jacks","Mitchell Santner","Shardul Thakur","Raj Bawa","Corbin Bosch","Jasprit Bumrah","Trent Boult","Deepak Chahar","Mayank Markande","Atharva Ankolekar","AM Ghazanfar","Mayank Rawat","Mohammad Izhar","Raghu Sharma","Robin Minz","Ashwani Kumar"],
  PBKS:["Marcus Stoinis","Shreyas Iyer","Prabhsimran Singh","Arshdeep Singh","Harpreet Brar","Shashank Singh","Yuzvendra Chahal","Marco Jansen","Priyansh Arya","Pyla Avinash","Nehal Wadhera","Harnoor Singh","Mitchell Owen","Musheer Khan","Suryansh Shedge","Cooper Connolly","Azmatullah Omarzai","Praveen Dubey","Vishnu Vinod","Lockie Ferguson","Xavier Bartlett","Ben Dwarshuis","Vishal Nishad","Vijaykumar Vyshak","Yash Thakur"],
  RCB: ["Rajat Patidar","Virat Kohli","Devdutt Padikkal","Tim David","Phil Salt","Jitesh Sharma","Jordan Cox","Jacob Bethell","Venkatesh Iyer","Krunal Pandya","Romario Shepherd","Swapnil Singh","Bhuvneshwar Kumar","Rasikh Salam","Suyash Sharma","Vicky Ostwal","Jacob Duffy","Nuwan Thushara","Abhinandan Singh","Mangesh Yadav","Kanishk Chouhan","Vihaan Malhotra","Satvik Deswal","Josh Hazlewood"],
  RR:  ["Riyan Parag","Yashasvi Jaiswal","Dhruv Jurel","Shimron Hetmyer","Shubham Dubey","Ravindra Jadeja","Dasun Shanaka","Kuldeep Sen","Prasidh Krishna","Navdeep Saini","Nandre Burger","Donovan Ferreira","Aman Rao Perala","Vaibhav Suryavanshi","Ravi Singh","Lhuan-dre Pretorius","Jofra Archer","Tushar Deshpande","Kwena Maphaka","Sandeep Sharma","Vignesh Puthur","Brijesh Sharma","Sushant Mishra","Yash Raj Punja","Adam Milne"],
  SRH: ["Liam Livingstone","Harshal Patel","Pat Cummins","Ishan Kishan","Travis Head","Heinrich Klaasen","Abhishek Sharma","Nitish Kumar Reddy","Jaydev Unadkat","David Payne","Aniket Verma","Smaran Ravichandran","Kamindu Mendis","Harsh Dubey","Shivang Kumar","Salil Arora","Brydon Carse","Eshan Malinga","Zeeshan Ansari","Sakib Hussain","Onkar Tarmale","Amit Kumar","Praful Hinge","Shivam Mavi"],
};

const WICKET_RANGES = ["<5","5-8","9-11","12-14","15-17","18-20"];
const DOUBLE_CATEGORIES = ["Winning Team","Best Batsman","Best Bowler","Powerplay Winner","Dot-Ball Bowler","Total Wickets"];
const FANTASY_PLAYERS = ["Ani","Haren","Ganga","Jitendar","Mahesh","Nag","Naren","Navdeep","Omkar","Peddi","Praveen","Raghav","Ranga","Rohit","Sandeep","Santhosh","Soma","Sridhar K","Krishna","Venky","Naresh","Srikanth B","Prashanth","Sreeram","Santhosh Male"].sort();

// ─── SCORING ENGINE ───────────────────────────────────────────────────────────
function camelize(str) {
  const map = {"Winning Team":"winningTeam","Best Batsman":"bestBatsman","Best Bowler":"bestBowler","Powerplay Winner":"powerplayWinner","Dot-Ball Bowler":"dotBallBowler","Total Wickets":"totalWickets"};
  return map[str]||str;
}

function calcPoints(sel, res, pScores = {}) {
  if (!sel) return {breakdown:{},total:0};
  const bd = {};
  
  const getB = (player) => pScores[player]?.batsman_score || 0;
  const getBW = (player) => pScores[player]?.bowler_score || 0;
  const getDB = (player) => pScores[player]?.dot_ball_score || 0;

  const r = res || {};

  bd.winningTeam = sel.winningTeam===r.winningTeam ? 50+Math.round((r.runMargin||0)/((r.wicketMargin||1)*5)) : 0;
  bd.bestBatsman = getB(sel.bestBatsman) + (sel.bestBatsman===r.topScorer ? (r.topScorerRuns||0)+50 : 0);
  bd.bestBowler = getBW(sel.bestBowler) + (sel.bestBowler===r.bestBowler ? (r.bestBowlerPoints||0)+50 : 0);
  bd.powerplayWinner = sel.powerplayWinner===r.powerplayWinner ? (r.powerplayScore||0)+(r.powerplayDiff||0) : 0;
  bd.dotBallBowler = getDB(sel.dotBallBowler) + (sel.dotBallBowler===r.dotBallLeader ? 50+(r.dotBalls||0)*5 : 0);
  bd.totalWickets = sel.totalWickets===r.wicketsRange ? (r.totalWickets||0)*5 : 0;
  bd.duckBatsman = (r.duckBatsmen||[]).includes(sel.duckBatsman) ? 100 : 0;
  bd.winningHorse = sel.winningHorse&&r.matchTopPlayer&&sel.winningHorse===r.matchTopPlayer ? 100 : 0;
  bd.losingHorse = sel.losingHorse&&r.matchBottomPlayer&&sel.losingHorse===r.matchBottomPlayer ? 100 : 0;
  if (sel.doubleCategory&&bd[camelize(sel.doubleCategory)]!==undefined) {
    const key = camelize(sel.doubleCategory);
    bd[key] = bd[key]*2;
    bd._doubled = sel.doubleCategory;
  }
  const total = Object.entries(bd).filter(([k])=>!k.startsWith("_")).reduce((s,[,v])=>s+(v||0),0);
  return {breakdown:bd,total};
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  app:{minHeight:"100vh",background:"linear-gradient(160deg,#080b12 0%,#0c1220 40%,#0a0f1a 100%)",fontFamily:"'Inter',sans-serif",color:"#e2e8f0",position:"relative"},
  noise:{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")",opacity:0.3},
  content:{position:"relative",zIndex:1,paddingBottom:"72px"},
  header:{padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(8,11,18,0.85)",backdropFilter:"blur(20px)",position:"sticky",top:0,zIndex:100,borderBottom:"1px solid rgba(255,255,255,0.06)"},
  logo:{fontSize:"16px",fontWeight:800,letterSpacing:"1.5px",background:"linear-gradient(135deg,#FF8C00,#FFD700)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"},
  page:{maxWidth:"960px",margin:"0 auto",padding:"20px 16px"},
  card:{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"16px",padding:"20px",backdropFilter:"blur(8px)"},
  navBtn:(a)=>({padding:"8px 16px",borderRadius:"8px",border:"none",cursor:"pointer",fontSize:"13px",fontWeight:a?600:400,fontFamily:"'Inter',sans-serif",background:a?"rgba(255,140,0,0.15)":"transparent",color:a?"#FFD700":"#64748b",transition:"all 0.2s ease"}),
  teamBadge:(t)=>({display:"inline-flex",alignItems:"center",padding:"6px 12px",borderRadius:"8px",fontSize:"14px",fontWeight:700,letterSpacing:"0.5px",background:(TEAMS[t]?.color||"#333")+"20",color:TEAMS[t]?.accent||"#fff",border:`1px solid ${(TEAMS[t]?.color||"#333")}40`}),
  statusPill:(st)=>({display:"inline-flex",alignItems:"center",gap:"4px",padding:"4px 10px",borderRadius:"20px",fontSize:"11px",fontWeight:600,background:st==="completed"?"rgba(34,197,94,0.12)":st==="locked"?"rgba(239,68,68,0.12)":st==="submitted"?"rgba(59,130,246,0.12)":"rgba(255,140,0,0.12)",color:st==="completed"?"#4ade80":st==="locked"?"#f87171":st==="submitted"?"#60a5fa":"#fbbf24",border:`1px solid ${st==="completed"?"rgba(34,197,94,0.2)":st==="locked"?"rgba(239,68,68,0.2)":st==="submitted"?"rgba(59,130,246,0.2)":"rgba(255,140,0,0.2)"}`}),
  h1:{fontSize:"24px",fontWeight:800,marginBottom:"6px",color:"#f8fafc",letterSpacing:"-0.5px"},
  label:{display:"block",fontSize:"11px",color:"#64748b",marginBottom:"6px",letterSpacing:"0.5px",textTransform:"uppercase",fontWeight:600},
  select:{width:"100%",padding:"10px 12px",borderRadius:"10px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#e2e8f0",fontSize:"14px",outline:"none",cursor:"pointer",fontFamily:"'Inter',sans-serif",transition:"border-color 0.2s"},
  input:{width:"100%",padding:"10px 12px",borderRadius:"10px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#e2e8f0",fontSize:"14px",outline:"none",fontFamily:"'Inter',sans-serif",boxSizing:"border-box",transition:"border-color 0.2s"},
  btn:(v="primary")=>({padding:"11px 24px",borderRadius:"10px",border:"none",cursor:"pointer",fontSize:"14px",fontWeight:700,fontFamily:"'Inter',sans-serif",background:v==="primary"?"linear-gradient(135deg,#FF8C00,#FFD700)":v==="danger"?"rgba(239,68,68,0.15)":"rgba(255,255,255,0.06)",color:v==="primary"?"#000":v==="danger"?"#f87171":"#e2e8f0",transition:"all 0.2s ease",border:v==="ghost"?"1px solid rgba(255,255,255,0.1)":"none"}),
  grid2:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"16px"},
  sectionTitle:{fontSize:"11px",letterSpacing:"1.5px",textTransform:"uppercase",color:"#FF8C00",marginBottom:"12px",fontWeight:700},
  logoutBtn:{background:"transparent",border:"1px solid rgba(239,68,68,0.3)",color:"#f87171",borderRadius:"8px",padding:"7px 14px",cursor:"pointer",fontSize:"13px",fontWeight:600,fontFamily:"'Inter',sans-serif",transition:"all 0.2s"},
  bottomNav:{position:"fixed",bottom:0,left:0,right:0,zIndex:100,background:"rgba(8,11,18,0.95)",backdropFilter:"blur(20px)",borderTop:"1px solid rgba(255,255,255,0.08)",display:"flex",justifyContent:"space-around",alignItems:"center",padding:"8px 0 env(safe-area-inset-bottom, 10px)",height:"72px"},
  tabBtn:(a)=>({display:"flex",flexDirection:"column",alignItems:"center",gap:"4px",background:"none",border:"none",cursor:"pointer",padding:"6px 16px",color:a?"#fbbf24":"#475569",transition:"all 0.2s",position:"relative",fontFamily:"'Inter',sans-serif"}),
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginPage({onLogin}) {
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);

  const handleLogin = async () => {
    if (!username||!password) { setError("Please enter username and password"); return; }
    setLoading(true); setError("");
    try {
      const data = await supa.query("users",{select:"*",eq:{username:username.toLowerCase().trim()}});
      if (!data||data.length===0||data.error) { setError("User not found"); setLoading(false); return; }
      const user = data[0];
      if (user.password!==password) { setError("Incorrect password"); setLoading(false); return; }
      onLogin({username:user.username,displayName:user.display_name,isAdmin:user.is_admin});
    } catch(e) { setError("Connection error. Please try again."); }
    setLoading(false);
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
      <style>{`
        @keyframes floatLogo{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        .login-card{position:relative;overflow:hidden;}
        .login-card::before{content:'';position:absolute;inset:-1px;borderRadius:17px;padding:1px;background:linear-gradient(135deg,rgba(255,140,0,0.3),rgba(255,215,0,0.1),rgba(255,140,0,0.05));mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);mask-composite:exclude;-webkit-mask-composite:xor;pointer-events:none;}
        .login-input:focus{border-color:rgba(255,140,0,0.4)!important;box-shadow:0 0 0 3px rgba(255,140,0,0.08)!important;}
        .login-btn:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(255,140,0,0.25)!important;}
        .login-btn:active{transform:translateY(0);}
      `}</style>
      <div style={{width:"100%",maxWidth:"380px"}}>
        <div style={{textAlign:"center",marginBottom:"40px",animation:"floatLogo 4s ease-in-out infinite"}}>
          <div style={{fontSize:"40px",marginBottom:"8px"}}>🏏</div>
          <div style={{...S.logo,fontSize:"28px",display:"block",marginBottom:"6px"}}>IPL FANTASY</div>
          <div style={{color:"#475569",fontSize:"13px",fontWeight:500}}>2026 Season — Friends League</div>
        </div>
        <div className="login-card" style={{...S.card,padding:"32px",background:"rgba(255,255,255,0.03)"}}>
          <div style={{marginBottom:"20px"}}>
            <label style={S.label}>Username</label>
            <input className="login-input" style={S.input} placeholder="e.g. sandeep" value={username} onChange={e=>setUsername(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
            <div style={{fontSize:"11px",color:"#475569",marginTop:"4px"}}>Lowercase, spaces as underscore e.g. santhosh_male</div>
          </div>
          <div style={{marginBottom:"24px"}}>
            <label style={S.label}>Password</label>
            <input className="login-input" style={S.input} type="password" placeholder="Your password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
          </div>
          {error&&<div style={{color:"#f87171",fontSize:"13px",marginBottom:"16px",display:"flex",alignItems:"center",gap:"6px"}}>⚠ {error}</div>}
          <button className="login-btn" style={{...S.btn("primary"),width:"100%",padding:"12px",fontSize:"15px"}} onClick={handleLogin} disabled={loading}>
            {loading?"Signing in...":"Sign In"}
          </button>
        </div>
        <div style={{textAlign:"center",marginTop:"20px",fontSize:"12px",color:"#334155"}}>
          Forgot your password? Ask the admin to reset it.
        </div>
      </div>
    </div>
  );
}

// ─── MATCH STATUS ─────────────────────────────────────────────────────────────
function getStatus(match, now, results, userSel) {
  if (results[match.id]) return "completed";
  if (now >= new Date(match.lock_time)) return "locked";
  if (userSel[match.id]) return "submitted";
  return "open";
}

// ─── TEAM LOGO COMPONENT ──────────────────────────────────────────────────────
function TeamLogo({team,size=48}) {
  const t=TEAMS[team]||{color:"#333",accent:"#fff"};
  return (
    <div style={{width:size,height:size,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,position:"relative"}}>
      <img 
        src={`/logos/${team}.png`} 
        alt={team} 
        style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain",filter:`drop-shadow(0 0 10px ${(t.color||'#333')}66)`}}
        onError={(e)=>{e.target.style.display='none'; e.target.nextSibling.style.display='flex'}}
      />
      <div style={{
        display:'none', 
        width:size,height:size,borderRadius:"50%",
        background:`linear-gradient(135deg, ${t.color} 0%, ${t.color}dd 60%, ${t.accent}44 100%)`,
        alignItems:"center",justifyContent:"center",
        border:`2px solid ${t.color}88`,boxShadow:`0 0 12px ${t.color}33`,
        position:"relative",overflow:"hidden"
      }}>
        <div style={{position:"absolute",inset:0,background:`radial-gradient(circle at 35% 30%, rgba(255,255,255,0.25) 0%, transparent 60%)`,borderRadius:"50%"}}/>
        <span style={{fontSize:size*0.3,fontWeight:900,letterSpacing:"1px",color:t.accent,textShadow:`0 1px 3px rgba(0,0,0,0.5)`,position:"relative",zIndex:1,fontFamily:"'Arial Black',sans-serif"}}>{team}</span>
      </div>
    </div>
  );
}

// ─── MATCHES LIST ─────────────────────────────────────────────────────────────
function MatchesPage({user,onSelectMatch,matches,results,userSel}) {
  const [now]=useState(new Date());
  const [filter,setFilter]=useState("all");
  const filtered = matches.filter(m=>{
    const st=getStatus(m,now,results,userSel);
    if(filter==="open") return st==="open"||st==="submitted";
    if(filter==="locked") return st==="locked";
    if(filter==="completed") return st==="completed";
    return true;
  });

  const stBorder=(st)=>st==="completed"?"rgba(0,200,100,0.25)":st==="locked"?"rgba(255,100,100,0.2)":st==="submitted"?"rgba(0,150,255,0.2)":"rgba(255,165,0,0.15)";
  const stBg=(st)=>st==="completed"?"rgba(0,200,100,0.03)":st==="locked"?"rgba(255,80,80,0.03)":st==="submitted"?"rgba(0,150,255,0.03)":"rgba(255,255,255,0.03)";

  return (
    <div style={S.page}>
      <style>{`
        .mcard2{transition:all 0.25s ease;cursor:pointer;}
        .mcard2:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(0,0,0,0.4)!important;}
        .mcard2:active{transform:translateY(0);box-shadow:none!important;}
        .vs-glow{animation:vsGlow 2s ease-in-out infinite alternate;}
        @keyframes vsGlow{0%{text-shadow:0 0 8px rgba(255,165,0,0.3)}100%{text-shadow:0 0 16px rgba(255,165,0,0.6)}}
      `}</style>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"12px",marginBottom:"24px"}}>
        <div><h1 style={S.h1}>Matches</h1><p style={{color:"#666",fontSize:"13px"}}>IPL 2026 · 70 matches</p></div>
        <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
          {["all","open","locked","completed"].map(f=>(
            <button key={f} style={S.navBtn(filter===f)} onClick={()=>setFilter(f)}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>
          ))}
        </div>
      </div>
      {filtered.map(match=>{
        const st=getStatus(match,now,results,userSel);
        const res=results[match.id];
        const homeT=TEAMS[match.home]||{};
        const awayT=TEAMS[match.away]||{};
        const isWinnerHome=res?.winningTeam===match.home;
        const isWinnerAway=res?.winningTeam===match.away;
        return (
          <div key={match.id} className="mcard2" onClick={()=>onSelectMatch(match)}
            style={{background:stBg(st),border:`1px solid ${stBorder(st)}`,borderRadius:"14px",padding:"16px 20px",marginBottom:"10px",backdropFilter:"blur(4px)",position:"relative",overflow:"hidden"}}>
            {/* Subtle team color gradient at edges */}
            <div style={{position:"absolute",top:0,left:0,bottom:0,width:"4px",background:`linear-gradient(180deg, ${homeT.color||'#333'}, transparent)`,borderRadius:"14px 0 0 14px"}}/>
            <div style={{position:"absolute",top:0,right:0,bottom:0,width:"4px",background:`linear-gradient(180deg, ${awayT.color||'#333'}, transparent)`,borderRadius:"0 14px 14px 0"}}/>

            {/* Header: Match number + status + date */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                <span style={{fontSize:"11px",color:"#555",fontWeight:"bold",letterSpacing:"1px"}}>M{match.id}</span>
                <span style={{fontSize:"12px",color:"#555"}}>{match.date} · {match.time_label}</span>
              </div>
              <span style={S.statusPill(st)}>{st==="submitted"?"✓ Submitted":st==="completed"?"✓ Done":st==="locked"?"🔒 Locked":"🟢 Open"}</span>
            </div>

            {/* Main matchup: Logo - Team - VS - Team - Logo */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"0",padding:"4px 0"}}>
              {/* Home team */}
              <div style={{flex:1,display:"flex",alignItems:"center",gap:"12px",justifyContent:"flex-end",minWidth:0}}>
                <div style={{textAlign:"right",minWidth:0}}>
                  <div style={{fontSize:"18px",fontWeight:"bold",color:isWinnerHome?"#00c864":st==="completed"&&!isWinnerHome?"#666":"#f8fafc",letterSpacing:"0.5px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{match.home}</div>
                  <div style={{fontSize:"12px",color:"#64748b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{TEAMS[match.home]?.name||""}</div>
                </div>
                <TeamLogo team={match.home} size={64}/>
              </div>

              {/* VS Badge */}
              <div style={{margin:"0 16px",flexShrink:0}}>
                <div className="vs-glow" style={{width:"36px",height:"36px",borderRadius:"50%",background:"linear-gradient(135deg, rgba(255,165,0,0.15), rgba(255,215,0,0.1))",border:"1px solid rgba(255,165,0,0.25)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <span style={{fontSize:"11px",fontWeight:900,color:"#FFD700",letterSpacing:"1px"}}>VS</span>
                </div>
              </div>

              {/* Away team */}
              <div style={{flex:1,display:"flex",alignItems:"center",gap:"16px",justifyContent:"flex-start",minWidth:0}}>
                <TeamLogo team={match.away} size={64}/>
                <div style={{textAlign:"left",minWidth:0}}>
                  <div style={{fontSize:"18px",fontWeight:"bold",color:isWinnerAway?"#00c864":st==="completed"&&!isWinnerAway?"#666":"#f8fafc",letterSpacing:"0.5px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{match.away}</div>
                  <div style={{fontSize:"12px",color:"#64748b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{TEAMS[match.away]?.name||""}</div>
                </div>
              </div>
            </div>

            {/* Result line */}
            {res&&(
              <div style={{textAlign:"center",marginTop:"10px",paddingTop:"10px",borderTop:"1px solid rgba(255,255,255,0.06)"}}>
                <span style={{fontSize:"12px",color:"#00c864",fontWeight:"bold"}}>🏆 {res.winningTeam} won{res.runMargin?` by ${res.runMargin} runs`:res.wicketMargin?` by ${res.wicketMargin} wickets`:""}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── INSIGHTS PANEL ───────────────────────────────────────────────────────────
function InsightsPanel({insights,match}) {
  const [open,setOpen]=useState(true);
  const [tab,setTab]=useState("xi");
  if(!insights) return null;
  const ago=insights.generated_at?Math.round((Date.now()-new Date(insights.generated_at))/3600000):null;
  return (
    <div style={{...S.card,marginBottom:"16px",background:"rgba(59,130,246,0.04)",border:"1px solid rgba(59,130,246,0.15)",overflow:"hidden"}}>
      <button onClick={()=>setOpen(o=>!o)} style={{width:"100%",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0",fontFamily:"'Inter',sans-serif"}}>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <span style={{fontSize:"16px"}}>📊</span>
          <span style={{fontSize:"14px",fontWeight:700,color:"#60a5fa"}}>Match Insights</span>
          {ago!==null&&<span style={{fontSize:"10px",color:"#475569",background:"rgba(255,255,255,0.06)",padding:"2px 6px",borderRadius:"4px"}}>AI · {ago<1?"just now":`${ago}h ago`}</span>}
        </div>
        <span style={{color:"#60a5fa",fontSize:"14px",transition:"transform 0.2s",transform:open?"rotate(180deg)":"rotate(0)"}}>{open?"▲":"▼"}</span>
      </button>

      {open&&(
        <div style={{marginTop:"14px"}}>
          {/* Tabs */}
          <div style={{display:"flex",gap:"4px",marginBottom:"14px"}}>
            {[{id:"xi",label:"Probable XI"},{id:"form",label:"Form Guide"},{id:"pitch",label:"Pitch & H2H"}].map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"6px 12px",borderRadius:"6px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:tab===t.id?600:400,fontFamily:"'Inter',sans-serif",background:tab===t.id?"rgba(59,130,246,0.15)":"transparent",color:tab===t.id?"#60a5fa":"#64748b",transition:"all 0.2s"}}>{t.label}</button>
            ))}
          </div>

          {/* Probable XI */}
          {tab==="xi"&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
              {[{team:match.home,xi:insights.home_probable_xi},{team:match.away,xi:insights.away_probable_xi}].map(({team,xi})=>(
                <div key={team}>
                  <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
                    <TeamLogo team={team} size={28}/>
                    <span style={{fontSize:"14px",fontWeight:700,color:"#f8fafc"}}>{team}</span>
                  </div>
                  {(xi||[]).map((p,i)=>(
                    <div key={i} style={{fontSize:"11px",color:"#94a3b8",padding:"3px 0",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>{i+1}. {p}</div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Form Guide */}
          {tab==="form"&&(
            <div>
              {[{title:`${match.home} Batsmen`,text:insights.home_form_batsmen},{title:`${match.away} Batsmen`,text:insights.away_form_batsmen},{title:`${match.home} Bowlers`,text:insights.home_form_bowlers},{title:`${match.away} Bowlers`,text:insights.away_form_bowlers}].map(({title,text})=>text&&(
                <div key={title} style={{marginBottom:"10px"}}>
                  <div style={{fontSize:"11px",fontWeight:700,color:"#fbbf24",marginBottom:"4px",textTransform:"uppercase",letterSpacing:"0.5px"}}>{title}</div>
                  <div style={{fontSize:"12px",color:"#94a3b8",lineHeight:"1.5",whiteSpace:"pre-wrap"}}>{text}</div>
                </div>
              ))}
            </div>
          )}

          {/* Pitch & H2H */}
          {tab==="pitch"&&(
            <div>
              {[{title:"🏟️ Pitch Report",text:insights.pitch_report},{title:"📋 Head to Head",text:insights.head_to_head},{title:"⚔️ Key Matchups",text:insights.key_matchups},{title:"🔮 Prediction",text:insights.prediction_summary}].map(({title,text})=>text&&(
                <div key={title} style={{marginBottom:"10px"}}>
                  <div style={{fontSize:"11px",fontWeight:700,color:"#fbbf24",marginBottom:"4px"}}>{title}</div>
                  <div style={{fontSize:"12px",color:"#94a3b8",lineHeight:"1.5",whiteSpace:"pre-wrap"}}>{text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SELECTION FORM ───────────────────────────────────────────────────────────
const EMPTY_SEL={winningTeam:"",bestBatsman:"",bestBowler:"",powerplayWinner:"",dotBallBowler:"",totalWickets:"",duckBatsman:"",doubleCategory:"",winningHorse:"",losingHorse:""};

function SelectionForm({match,user,onBack,results,userSel,onSave,insights,playerScores}) {
  const [now]=useState(new Date());
  const locked=now>=new Date(match.lock_time);
  const hasResult=!!results[match.id];
  const [sel,setSel]=useState({...EMPTY_SEL,...(userSel[match.id]||{})});
  const [saved,setSaved]=useState(!!userSel[match.id]);
  const [msg,setMsg]=useState("");
  const [saving,setSaving]=useState(false);
  const allPlayers=[...new Set([...(PLAYERS[match.home]||[]),...(PLAYERS[match.away]||[])])].sort();
  const set=(k,v)=>setSel(s=>({...s,[k]:v}));
  const st=getStatus(match,now,results,userSel);

  const handleSave=async()=>{
    if(locked) return;
    setSaving(true);
    await onSave(match.id,sel);
    setSaved(true); setMsg("Selections saved! ✓");
    setSaving(false); setTimeout(()=>setMsg(""),3000);
  };

  const points=hasResult?calcPoints(sel,results[match.id],playerScores[match.id]):null;
  const Field=({label,field,options})=>(
    <div>
      <label style={S.label}>{label}</label>
      <select style={{...S.select,opacity:locked?0.6:1}} disabled={locked} value={sel[field]} onChange={e=>set(field,e.target.value)}>
        <option value="">-- Select --</option>
        {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div style={S.page}>
      <button style={{...S.btn("ghost"),marginBottom:"16px",padding:"8px 16px",fontSize:"13px"}} onClick={onBack}>← Back</button>
      <div style={{display:"flex",flexDirection:"column",gap:"12px",marginBottom:"20px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"16px",flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <TeamLogo team={match.home} size={48}/>
            <span style={S.teamBadge(match.home)}>{match.home}</span>
          </div>
          <span style={{color:"#475569",fontWeight:800,fontSize:"14px"}}>VS</span>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <TeamLogo team={match.away} size={48}/>
            <span style={S.teamBadge(match.away)}>{match.away}</span>
          </div>
          <span style={{marginLeft:"auto", ...S.statusPill(st)}}>{st==="completed"?"✓ Completed":st==="locked"?"🔒 Locked":st==="submitted"?"✓ Submitted":"Open"}</span>
        </div>
        <div style={{fontSize:"14px",color:"#94a3b8",display:"flex",alignItems:"center",gap:"12px"}}>
          <span style={{background:"rgba(255,255,255,0.08)",padding:"6px 12px",borderRadius:"8px",fontWeight:700,color:"#fbbf24"}}>Match {match.id}</span>
          <span>{match.date} · {match.time_label}</span>
        </div>
      </div>

      {locked&&!hasResult&&<div style={{...S.card,background:"rgba(255,100,100,0.05)",borderColor:"rgba(255,100,100,0.15)",marginBottom:"16px",color:"#ff8888",fontSize:"13px"}}>🔒 Match has started. Selections are locked.</div>}

      <InsightsPanel insights={insights} match={match}/>

      {hasResult&&points&&(
        <div style={{...S.card,background:"rgba(0,200,100,0.04)",borderColor:"rgba(0,200,100,0.15)",marginBottom:"16px"}}>
          <div style={{fontSize:"20px",fontWeight:"bold",color:"#00c864",marginBottom:"8px"}}>Your Score: {points.total} pts</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
            {Object.entries(points.breakdown).filter(([k])=>!k.startsWith("_")).map(([k,v])=>(
              <span key={k} style={{fontSize:"12px",background:v>0?"rgba(0,200,100,0.1)":"rgba(255,100,100,0.1)",color:v>0?"#00c864":"#ff6b6b",padding:"3px 8px",borderRadius:"4px",border:`1px solid ${v>0?"rgba(0,200,100,0.2)":"rgba(255,100,100,0.2)"}`}}>{k}: {v}</span>
            ))}
          </div>
        </div>
      )}

      <div style={{...S.card,marginBottom:"16px"}}>
        <div style={S.sectionTitle}>Core Predictions</div>
        <div style={{...S.grid2,marginBottom:"14px"}}>
          <Field label="Winning Team" field="winningTeam" options={[match.home,match.away]}/>
          <Field label="Powerplay Winner" field="powerplayWinner" options={[match.home,match.away]}/>
        </div>
        <div style={S.grid2}>
          <Field label="Best Batsman" field="bestBatsman" options={allPlayers}/>
          <Field label="Best Bowler" field="bestBowler" options={allPlayers}/>
        </div>
      </div>

      <div style={{...S.card,marginBottom:"16px"}}>
        <div style={S.sectionTitle}>Specialist Picks</div>
        <div style={S.grid2}>
          <Field label="Dot-Ball Bowler" field="dotBallBowler" options={allPlayers}/>
          <Field label="Total Wickets Range" field="totalWickets" options={WICKET_RANGES}/>
          <Field label="Batsman with Duck" field="duckBatsman" options={allPlayers}/>
        </div>
      </div>

      <div style={{...S.card,marginBottom:"16px"}}>
        <div style={S.sectionTitle}>Strategy</div>
        <Field label="🔥 Double Points Category (×2 multiplier)" field="doubleCategory" options={DOUBLE_CATEGORIES}/>
        <div style={{fontSize:"11px",color:"#555",marginTop:"4px"}}>Your chosen category's points will be doubled</div>
      </div>

      <div style={{...S.card,marginBottom:"20px"}}>
        <div style={S.sectionTitle}>Bragging Rights 😄</div>
        <div style={S.grid2}>
          <Field label="🏆 Winning Horse (top scorer today?)" field="winningHorse" options={FANTASY_PLAYERS}/>
          <Field label="💀 Losing Horse (bottom scorer today?)" field="losingHorse" options={FANTASY_PLAYERS}/>
        </div>
        <div style={{fontSize:"11px",color:"#555",marginTop:"8px"}}>100 pts each for a correct guess!</div>
      </div>

      {!locked&&(
        <div style={{display:"flex",gap:"12px",alignItems:"center",flexWrap:"wrap"}}>
          <button style={S.btn("primary")} onClick={handleSave} disabled={saving}>
            {saving?"Saving...":(saved?"Update Selections":"Save Selections")}
          </button>
          {msg&&<span style={{color:"#00c864",fontSize:"14px"}}>{msg}</span>}
        </div>
      )}
    </div>
  );
}

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
function LeaderboardContent({matches,results,allSelections,playerScores}) {
  const now = new Date();
  const activeMatches = matches.filter(m => now >= new Date(m.lock_time));
  const scores=FANTASY_PLAYERS.map(name=>{
    const uname=name.toLowerCase().replace(/\s/g,"_");
    const uSel=allSelections[uname]||{};
    let total=0,matchCount=0;
    activeMatches.forEach(m=>{if(uSel[m.id]){total+=calcPoints(uSel[m.id],results[m.id],playerScores[m.id]).total;matchCount++;}});
    return {name,total,matchCount};
  }).sort((a,b)=>b.total-a.total);
  const medals=["🥇","🥈","🥉"];
  const maxPts=scores[0]?.total||1;
  return (
    <div>
      <style>{`
        .lb-row{transition:all 0.2s ease;}
        .lb-row:hover{background:rgba(255,255,255,0.06)!important;}
      `}</style>
      <div style={{color:"#64748b",fontSize:"13px",marginBottom:"20px"}}>{activeMatches.length} matches actively scored</div>

      {/* Top 3 Podium */}
      {scores.length>=3&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",marginBottom:"20px"}}>
          {scores.slice(0,3).map((s,i)=>{
            const colors=[
              {bg:"linear-gradient(135deg,rgba(255,215,0,0.12),rgba(255,140,0,0.06))",border:"rgba(255,215,0,0.25)",text:"#fbbf24"},
              {bg:"linear-gradient(135deg,rgba(192,192,192,0.1),rgba(148,163,184,0.06))",border:"rgba(148,163,184,0.2)",text:"#94a3b8"},
              {bg:"linear-gradient(135deg,rgba(205,127,50,0.1),rgba(180,120,60,0.06))",border:"rgba(205,127,50,0.2)",text:"#d4a574"},
            ][i];
            return (
              <div key={s.name} style={{background:colors.bg,border:`1px solid ${colors.border}`,borderRadius:"16px",padding:"20px 12px",textAlign:"center"}}>
                <div style={{fontSize:"28px",marginBottom:"6px"}}>{medals[i]}</div>
                <div style={{fontSize:"14px",fontWeight:700,color:"#f8fafc",marginBottom:"2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</div>
                <div style={{fontSize:"11px",color:"#64748b",marginBottom:"8px"}}>{s.matchCount} matches</div>
                <div style={{fontSize:"24px",fontWeight:800,color:colors.text}}>{s.total}</div>
                <div style={{fontSize:"10px",color:"#64748b",fontWeight:600,letterSpacing:"0.5px"}}>POINTS</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Remaining players */}
      <div style={{...S.card,padding:"0",overflow:"hidden"}}>
        {scores.slice(scores.length>=3?3:0).map((s,i)=>{
          const rank=scores.length>=3?i+4:i+1;
          const barW=maxPts>0?Math.max((s.total/maxPts)*100,2):0;
          return (
            <div key={s.name} className="lb-row" style={{display:"flex",alignItems:"center",padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.04)",gap:"12px"}}>
              <span style={{fontSize:"13px",fontWeight:700,color:"#64748b",minWidth:"28px",textAlign:"center"}}>#{rank}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}}>
                  <span style={{fontSize:"13px",fontWeight:600,color:"#e2e8f0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</span>
                  <span style={{fontSize:"14px",fontWeight:700,color:"#fbbf24",flexShrink:0,marginLeft:"8px"}}>{s.total}</span>
                </div>
                <div style={{height:"3px",background:"rgba(255,255,255,0.06)",borderRadius:"2px",overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${barW}%`,background:"linear-gradient(90deg,#FF8C00,#fbbf24)",borderRadius:"2px",transition:"width 0.5s ease"}}/>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MY STATS ─────────────────────────────────────────────────────────────────
function MyStatsContent({user,matches,results,userSel,playerScores}) {
  const now = new Date();
  const activeMatches = matches.filter(m => now >= new Date(m.lock_time) && userSel[m.id]);
  const totalPoints = activeMatches.reduce((sum,m)=>sum+calcPoints(userSel[m.id],results[m.id],playerScores[m.id]).total,0);
  const statCards=[
    {icon:"🎯",label:"Total Points",val:totalPoints,color:"#fbbf24"},
    {icon:"🏏",label:"Matches",val:activeMatches.length,color:"#60a5fa"},
    {icon:"📈",label:"Avg/Match",val:activeMatches.length?Math.round(totalPoints/activeMatches.length):0,color:"#4ade80"},
  ];
  return (
    <div>
      <div style={{color:"#64748b",fontSize:"13px",marginBottom:"20px"}}>Viewing stats for: <span style={{color:"#fbbf24",fontWeight:600}}>{user.displayName}</span></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px",marginBottom:"24px"}}>
        {statCards.map(({icon,label,val,color})=>(
          <div key={label} style={{...S.card,textAlign:"center",padding:"16px 8px"}}>
            <div style={{fontSize:"20px",marginBottom:"4px"}}>{icon}</div>
            <div style={{fontSize:"24px",fontWeight:800,color}}>{val}</div>
            <div style={{fontSize:"10px",color:"#64748b",marginTop:"2px",fontWeight:600,letterSpacing:"0.5px",textTransform:"uppercase"}}>{label}</div>
          </div>
        ))}
      </div>
      {activeMatches.length === 0
        ?<div style={{...S.card,textAlign:"center",color:"#475569",padding:"48px"}}>No active matches yet. Make your selections!</div>
        :activeMatches.map(m=>{
          const {breakdown,total}=calcPoints(userSel[m.id],results[m.id],playerScores[m.id]);
          return (
            <div key={m.id} style={{...S.card,marginBottom:"10px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px",flexWrap:"wrap",gap:"8px"}}>
                <div style={{display:"flex",gap:"12px",alignItems:"center",flexWrap:"wrap"}}>
                  <span style={{color:"#64748b",fontSize:"14px",fontWeight:700,width:"32px"}}>M{m.id}</span>
                  <TeamLogo team={m.home} size={36}/>
                  <span style={{fontSize:"15px",fontWeight:700,color:"#f8fafc"}}>{m.home}</span>
                  <span style={{color:"#475569",fontSize:"12px",fontWeight:600}}>vs</span>
                  <TeamLogo team={m.away} size={36}/>
                  <span style={{fontSize:"15px",fontWeight:700,color:"#f8fafc"}}>{m.away}</span>
                </div>
                <div style={{fontSize:"22px",fontWeight:900,color:"#fbbf24",letterSpacing:"-0.5px"}}>{total} pts</div>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:"5px"}}>
                {Object.entries(breakdown).filter(([k])=>!k.startsWith("_")).map(([k,v])=>(
                  <span key={k} style={{fontSize:"11px",fontWeight:500,background:v>0?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.1)",color:v>0?"#4ade80":"#f87171",padding:"3px 8px",borderRadius:"6px",border:`1px solid ${v>0?"rgba(34,197,94,0.15)":"rgba(239,68,68,0.15)"}`}}>{k}: {v}</span>
                ))}
              </div>
            </div>
          );
        })
      }
    </div>
  );
}

// ─── CONSOLIDATED SCORE ───────────────────────────────────────────────────────
function ConsolidatedScoreContent({matches, results, allSelections, playerScores}) {
  const now = new Date();
  const activeMatches = matches.filter(m => now >= new Date(m.lock_time));
  
  const ptsGrid = {};
  FANTASY_PLAYERS.forEach(p => ptsGrid[p] = {});
  activeMatches.forEach(m => {
    FANTASY_PLAYERS.forEach(p => {
      const uname = p.toLowerCase().replace(/\s/g,"_");
      const uSel = allSelections[uname]||{};
      ptsGrid[p][m.id] = calcPoints(uSel[m.id], results[m.id], playerScores[m.id]).total;
    });
  });

  const totalPts = {};
  FANTASY_PLAYERS.forEach(p => {
    totalPts[p] = activeMatches.reduce((sum, m) => sum + (ptsGrid[p][m.id]||0), 0);
  });

  const rankGrid = {};
  const winningsGrid = {};
  const totalWinnings = {};
  FANTASY_PLAYERS.forEach(p => { rankGrid[p] = {}; winningsGrid[p] = {}; totalWinnings[p] = 0; });

  activeMatches.forEach(m => {
    const mScores = FANTASY_PLAYERS.map(p => ({ player: p, pts: ptsGrid[p][m.id] }));
    mScores.sort((a,b) => b.pts - a.pts);

    let currentRank = 1;
    mScores.forEach((s, idx) => {
      if (idx > 0 && s.pts < mScores[idx-1].pts) {
        currentRank = idx + 1; 
      }
      rankGrid[s.player][m.id] = currentRank;
    });

    const firstPlacePts = mScores[0].pts;
    if (firstPlacePts > 0) {
      const firstGroup = mScores.filter(s => s.pts === firstPlacePts);
      let secondGroup = [];
      if (firstGroup.length === 1 && mScores.length > 1) {
        const secondPlacePts = mScores[1].pts;
        if (secondPlacePts > 0) {
          secondGroup = mScores.filter(s => s.pts === secondPlacePts);
        }
      }
      
      if (firstGroup.length === 2) {
        firstGroup.forEach(s => winningsGrid[s.player][m.id] = 18.5);
      } else if (firstGroup.length > 2) {
        const payout = parseFloat((37 / firstGroup.length).toFixed(2));
        firstGroup.forEach(s => winningsGrid[s.player][m.id] = payout);
      } else if (firstGroup.length === 1) {
        winningsGrid[firstGroup[0].player][m.id] = 25;
        if (secondGroup.length > 0) {
          const secondPayout = parseFloat((12 / secondGroup.length).toFixed(2));
          secondGroup.forEach(s => winningsGrid[s.player][m.id] = secondPayout);
        }
      }
    }
    
    FANTASY_PLAYERS.forEach(p => {
      totalWinnings[p] = Number((totalWinnings[p] + (winningsGrid[p][m.id] || 0)).toFixed(2));
    });
  });

  const renderTable = (title, rowFormatter, totals, totalTitle) => (
    <div style={{marginBottom:"40px"}}>
      <h3 style={{color:"#e8e0d0",fontSize:"16px",marginBottom:"12px"}}>{title}</h3>
      <div style={{...S.card,padding:"0",overflowX:"auto"}}>
        <table style={{borderCollapse:"collapse",fontSize:"12px",whiteSpace:"nowrap",minWidth:"100%"}}>
          <thead>
            <tr style={{background:"rgba(255,255,255,0.03)",borderBottom:"1px solid rgba(255,255,255,0.1)"}}>
              <th style={{padding:"10px",color:"#888",fontWeight:600,textAlign:"left",position:"sticky",left:0,background:"#0d1117",zIndex:2}}>Player</th>
              {totalTitle && <th style={{padding:"10px",color:"#fbbf24",fontWeight:700,textAlign:"right",minWidth:"60px",borderRight:"1px solid rgba(255,255,255,0.05)"}}>{totalTitle}</th>}
              {activeMatches.map(m => (
                <th key={m.id} style={{padding:"10px 8px",color:"#64748b",fontWeight:500,minWidth:"45px",textAlign:"center"}}>M{String(m.id).padStart(2,'0')}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FANTASY_PLAYERS.map((p,i) => (
              <tr key={p} style={{borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                <td style={{padding:"8px 10px",fontWeight:600,color:"#e2e8f0",position:"sticky",left:0,background:i%2===0?"#0d1117":"#0f1319",zIndex:1}}>{p}</td>
                {totalTitle && <td style={{padding:"8px 10px",fontWeight:800,color:"#fbbf24",textAlign:"right",borderRight:"1px solid rgba(255,255,255,0.05)"}}>{totalTitle==="Total $"?"$":""}{totals[p]}</td>}
                {activeMatches.map(m => {
                  const val = rowFormatter(p, m.id);
                  const isZero = val === 0 || val === "-" || val === "$0";
                  return (
                    <td key={m.id} style={{padding:"8px",textAlign:"center",color:isZero?"#475569":"#cbd5e1",background:i%2===0?"transparent":"rgba(255,255,255,0.01)"}}>
                      {val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div>
       {renderTable("Match-by-Match Points", (p,mid) => ptsGrid[p][mid] || 0, totalPts, "Total Pts")}
       {renderTable("Match-by-Match Winnings", (p,mid) => winningsGrid[p][mid] ? `$${winningsGrid[p][mid]}` : "-", totalWinnings, "Total $")}
       {renderTable("Match-by-Match Ranks", (p,mid) => rankGrid[p][mid] || "-", null, null)}
    </div>
  );
}

// ─── UNIFIED LEADERBOARD PAGE ─────────────────────────────────────────────────
function LeaderboardPage({user, matches, results, allSelections, userSel, playerScores}) {
  const [tab, setTab] = useState("board");
  return (
    <div style={S.page}>
      <h1 style={S.h1}>Leaderboard & Stats</h1>
      <p style={{color:"#64748b",fontSize:"13px",marginBottom:"20px"}}>Season standings and historical data</p>

      <div style={{display:"flex",gap:"6px",marginBottom:"20px",borderBottom:"1px solid rgba(255,255,255,0.1)",paddingBottom:"10px",flexWrap:"wrap"}}>
        <button style={S.navBtn(tab==="board")} onClick={()=>setTab("board")}>🏆 Overall Leaderboard</button>
        <button style={S.navBtn(tab==="consolidated")} onClick={()=>setTab("consolidated")}>📈 Consolidated Score</button>
        <button style={S.navBtn(tab==="stats")} onClick={()=>setTab("stats")}>📊 My Performance</button>
      </div>

      {tab === "board" && <LeaderboardContent matches={matches} results={results} allSelections={allSelections} playerScores={playerScores} />}
      {tab === "consolidated" && <ConsolidatedScoreContent matches={matches} results={results} allSelections={allSelections} playerScores={playerScores} />}
      {tab === "stats" && <MyStatsContent user={user} matches={matches} results={results} userSel={userSel} playerScores={playerScores} />}
    </div>
  );
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────
function UserManagementTab() {
  const [users,setUsers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [resetInfo,setResetInfo]=useState(null);

  useEffect(()=>{
    supa.query("users",{select:"*",order:"display_name.asc"}).then(data=>{
      setUsers((data||[]).filter(u=>!u.is_admin));
      setLoading(false);
    });
  },[]);

  const genPwd=()=>{const c="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";return Array.from({length:6},()=>c[Math.floor(Math.random()*c.length)]).join("");};

  const resetPassword=async(username)=>{
    const newPwd=genPwd();
    await supa.update("users",{password:newPwd},{username});
    setUsers(u=>u.map(x=>x.username===username?{...x,password:newPwd}:x));
    setResetInfo({username,newPwd});
  };

  if(loading) return <div style={{color:"#555",padding:"20px"}}>Loading players...</div>;
  return (
    <div>
      <div style={{...S.sectionTitle,marginBottom:"14px"}}>All Players & Passwords</div>
      {resetInfo&&(
        <div style={{...S.card,background:"rgba(0,200,100,0.06)",borderColor:"rgba(0,200,100,0.2)",marginBottom:"14px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"8px"}}>
          <span style={{fontSize:"13px",color:"#00c864"}}>✓ Reset for <strong>{resetInfo.username}</strong> → <strong style={{letterSpacing:"2px",color:"#FFD700"}}>{resetInfo.newPwd}</strong></span>
          <button style={{...S.btn("ghost"),padding:"4px 10px",fontSize:"12px"}} onClick={()=>setResetInfo(null)}>✕</button>
        </div>
      )}
      <div style={{...S.card,padding:"0",overflow:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:"13px",minWidth:"400px"}}>
          <thead>
            <tr style={{borderBottom:"1px solid rgba(255,255,255,0.07)",background:"rgba(255,255,255,0.03)"}}>
              {["Player","Username","Password",""].map(h=><th key={h} style={{padding:"10px 14px",textAlign:"left",color:"#888",fontWeight:"normal",fontSize:"11px",letterSpacing:"1px",textTransform:"uppercase"}}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {users.map((u,i)=>(
              <tr key={u.username} style={{borderBottom:"1px solid rgba(255,255,255,0.04)",background:i%2===0?"transparent":"rgba(255,255,255,0.01)"}}>
                <td style={{padding:"10px 14px",color:"#e8e0d0"}}>{u.display_name}</td>
                <td style={{padding:"10px 14px",color:"#888",fontFamily:"monospace"}}>{u.username}</td>
                <td style={{padding:"10px 14px",color:"#FFD700",fontFamily:"monospace",letterSpacing:"1px"}}>{u.password}</td>
                <td style={{padding:"10px 14px"}}>
                  <button style={{...S.btn("ghost"),padding:"5px 10px",fontSize:"12px",border:"1px solid rgba(255,165,0,0.3)",color:"#FFD700"}} onClick={()=>resetPassword(u.username)}>Reset</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}



const IField=({label,value,onChange,type="text",opts})=>{const isNum=type==="number";return(
  <div>
    <label style={S.label}>{label}</label>
    {opts?<select style={S.select} value={value} onChange={e=>onChange(e.target.value)}><option value="">-- Select --</option>{opts.map(o=><option key={o} value={o}>{o}</option>)}</select>:<input style={{...S.input,fontSize:"16px"}} inputMode={isNum?"decimal":"text"} type="text" value={value} onChange={e=>onChange(e.target.value)}/>
  }
  </div>
);};

// ─── PLAYER SELECTIONS TAB ────────────────────────────────────────────────────
const SEL_FIELDS=[
  {key:"winningTeam",label:"Winner",type:"team"},
  {key:"bestBatsman",label:"Best Bat",type:"player"},
  {key:"bestBowler",label:"Best Bowl",type:"player"},
  {key:"powerplayWinner",label:"PP Winner",type:"team"},
  {key:"dotBallBowler",label:"Dot-Ball",type:"player"},
  {key:"totalWickets",label:"Wickets",type:"wickets"},
  {key:"duckBatsman",label:"Duck",type:"player"},
  {key:"doubleCategory",label:"Double",type:"double"},
  {key:"winningHorse",label:"🏆 Horse",type:"fantasy"},
  {key:"losingHorse",label:"💀 Horse",type:"fantasy"},
];

function PlayerSelectionsTab({matches,allSelections,onSaveSelection,readOnly=false}) {
  const [now]=useState(new Date());
  const [selectedMatchId,setSelectedMatchId]=useState("");
  const [editingPlayer,setEditingPlayer]=useState(null);
  const [editForm,setEditForm]=useState({});
  const [saving,setSaving]=useState(false);
  const [savedMsg,setSavedMsg]=useState("");

  const lockedMatches=matches.filter(m=>now>=new Date(m.lock_time));
  const m=lockedMatches.find(x=>String(x.id)===String(selectedMatchId));
  const allPlayers=m?[...new Set([...(PLAYERS[m.home]||[]),...(PLAYERS[m.away]||[])])].sort():[];

  const getOpts=(field)=>{
    if(!m) return [];
    if(field.type==="team") return [m.home,m.away];
    if(field.type==="player") return allPlayers;
    if(field.type==="wickets") return WICKET_RANGES;
    if(field.type==="double") return DOUBLE_CATEGORIES;
    if(field.type==="fantasy") return FANTASY_PLAYERS;
    return [];
  };

  const startEdit=(playerName)=>{
    const uname=playerName.toLowerCase().replace(/\s/g,"_");
    const existing=allSelections[uname]?.[selectedMatchId]||{};
    setEditForm({...EMPTY_SEL,...existing});
    setEditingPlayer(playerName);
  };

  const cancelEdit=()=>{setEditingPlayer(null);setEditForm({});};

  const handleSave=async(playerName)=>{
    const uname=playerName.toLowerCase().replace(/\s/g,"_");
    setSaving(true);
    await onSaveSelection(uname,selectedMatchId,editForm);
    setSaving(false);
    setEditingPlayer(null);
    setEditForm({});
    setSavedMsg(`Saved ${playerName}'s selections`);
    setTimeout(()=>setSavedMsg(""),3000);
  };

  const submitted=m?FANTASY_PLAYERS.filter(name=>allSelections[name.toLowerCase().replace(/\s/g,"_")]?.[selectedMatchId]):[];

  return (
    <div>
      <div style={S.sectionTitle}>{readOnly ? "View All Player Selections" : "View & Edit Player Selections"}</div>
      <div style={{marginBottom:"16px"}}>
        <label style={S.label}>Select Match</label>
        <select style={{...S.select,maxWidth:"400px"}} value={selectedMatchId} onChange={e=>{setSelectedMatchId(e.target.value);setEditingPlayer(null);setSavedMsg("");}}>
          <option value="">-- Select a locked match --</option>
          {lockedMatches.map(m=><option key={m.id} value={m.id}>M{m.id}: {m.home} vs {m.away} — {m.date}</option>)}
        </select>
      </div>

      {savedMsg&&<div style={{color:"#00c864",fontSize:"13px",marginBottom:"12px"}}>✓ {savedMsg}</div>}

      {m&&(
        <>
          <div style={{fontSize:"13px",color:"#4db8ff",marginBottom:"14px"}}>📋 {submitted.length}/{FANTASY_PLAYERS.length} players submitted for M{m.id}: {m.home} vs {m.away}</div>
          <div style={{...S.card,padding:"0",overflow:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px",minWidth:"1100px"}}>
              <thead>
                <tr style={{borderBottom:"1px solid rgba(255,255,255,0.07)",background:"rgba(255,255,255,0.03)"}}>
                  <th style={{padding:"10px 12px",textAlign:"left",color:"#888",fontWeight:"normal",fontSize:"11px",letterSpacing:"1px",textTransform:"uppercase",position:"sticky",left:0,background:"#0d1117",zIndex:2,minWidth:"110px"}}>Player</th>
                  {SEL_FIELDS.map(f=><th key={f.key} style={{padding:"10px 8px",textAlign:"left",color:"#888",fontWeight:"normal",fontSize:"10px",letterSpacing:"0.5px",textTransform:"uppercase",whiteSpace:"nowrap"}}>{f.label}</th>)}
                  {!readOnly && <th style={{padding:"10px 8px",textAlign:"center",color:"#888",fontWeight:"normal",fontSize:"11px",letterSpacing:"1px",textTransform:"uppercase",minWidth:"100px"}}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {FANTASY_PLAYERS.map((name,i)=>{
                  const uname=name.toLowerCase().replace(/\s/g,"_");
                  const sel=allSelections[uname]?.[selectedMatchId];
                  const hasSel=!!sel;
                  const isEditing=editingPlayer===name;
                  return (
                    <tr key={name} style={{borderBottom:"1px solid rgba(255,255,255,0.04)",background:i%2===0?"transparent":"rgba(255,255,255,0.01)",opacity:!hasSel&&!isEditing?0.5:1}}>
                      <td style={{padding:"8px 12px",color:hasSel?"#e8e0d0":"#555",fontWeight:"bold",fontSize:"12px",position:"sticky",left:0,background:i%2===0?"#0d1117":"#0f1319",zIndex:1,whiteSpace:"nowrap"}}>
                        {name}{hasSel&&<span style={{color:"#00c864",marginLeft:"4px",fontSize:"10px"}}>✓</span>}
                      </td>
                      {SEL_FIELDS.map(f=>(
                        <td key={f.key} style={{padding:"6px 8px",whiteSpace:"nowrap"}}>
                          {isEditing
                            ?<select style={{...S.select,padding:"6px 8px",fontSize:"12px",minWidth:"90px"}} value={editForm[f.key]||""} onChange={e=>setEditForm(prev=>({...prev,[f.key]:e.target.value}))}>
                              <option value="">--</option>
                              {getOpts(f).map(o=><option key={o} value={o}>{o}</option>)}
                            </select>
                            :<span style={{color:sel?.[f.key]?"#e8e0d0":"#444",fontSize:"12px"}}>{sel?.[f.key]||"—"}</span>
                          }
                        </td>
                      ))}
                      {!readOnly && <td style={{padding:"6px 8px",textAlign:"center",whiteSpace:"nowrap"}}>
                        {isEditing
                          ?<>
                            <button style={{...S.btn("primary"),padding:"5px 10px",fontSize:"11px",marginRight:"4px"}} onClick={()=>handleSave(name)} disabled={saving}>{saving?"...":"Save"}</button>
                            <button style={{...S.btn("ghost"),padding:"5px 10px",fontSize:"11px",border:"1px solid rgba(255,255,255,0.15)"}} onClick={cancelEdit}>Cancel</button>
                          </>
                          :<button style={{...S.btn("ghost"),padding:"5px 10px",fontSize:"11px",border:"1px solid rgba(255,165,0,0.3)",color:"#FFD700"}} onClick={()=>startEdit(name)}>Edit</button>
                        }
                      </td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!m&&selectedMatchId===""&&<div style={{...S.card,textAlign:"center",color:"#555",padding:"40px"}}>Select a match above to view player selections</div>}
    </div>
  );
}

function AIInsightsTab({matches}) {
  const [loading,setLoading]=useState(false);
  const [response,setResponse]=useState(null);
  const [error,setError]=useState(null);
  const [processed,setProcessed]=useState([]);

  const handleUpdate = async () => {
    setLoading(true);
    setResponse(null);
    setError(null);
    setProcessed([]);
    try {
      const res = await fetch("/api/manual-update-insights", { method: "POST" });
      
      // Better error handling for non-JSON responses (like 404s in dev)
      if (!res.ok) {
        let errDetail = "";
        const rawText = await res.text();
        try {
          const errData = JSON.parse(rawText);
          errDetail = errData.error || errData.message || "";
        } catch(e) {
          errDetail = rawText;
        }
        throw new Error(`Server returned ${res.status}: ${errDetail.substring(0, 50) || "Is dev environment running?"}`);
      }

      const data = await res.json();
      setResponse(data);
      setProcessed(data.results || []);
    } catch (err) {
      console.error(err);
      setError(err.message.includes("Unexpected end of JSON input") 
        ? "Error: Could not reach the AI service. If you are developing locally, please ensure you are running 'netlify dev' instead of 'npm run dev'." 
        : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.card}>
      <h2 style={{...S.sectionTitle,fontSize:"18px",marginBottom:"12px"}}>Manual AI Insights Update</h2>
      <p style={{fontSize:"14px",color:"#94a3b8",marginBottom:"20px",lineHeight:"1.5"}}>
        This will trigger the AI to generate or refresh insights (Probable XI, Pitch Report, Pitch & H2H) 
        for all matches scheduled within the next 24 hours. This may take up to 15-20 seconds.
      </p>
      
      <div style={{display:"flex",alignItems:"center",gap:"16px",flexWrap:"wrap",marginBottom:"20px"}}>
        <button style={S.btn("primary")} onClick={handleUpdate} disabled={loading}>
          {loading ? "🔄 Updating AI Insights..." : "🚀 Trigger Today's Updates"}
        </button>
        {loading && <span style={{fontSize:"13px",color:"#fbbf24",animation:"pulse 1.5s infinite"}}>Waiting for Gemini AI response...</span>}
      </div>

      {error && (
        <div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:"8px",padding:"12px",marginBottom:"20px"}}>
          <div style={{color:"#f87171",fontWeight:700,fontSize:"14px",marginBottom:"4px"}}>❌ Error Updating Insights</div>
          <div style={{color:"#f87171",fontSize:"13px"}}>{error}</div>
        </div>
      )}

      {response && (
        <div style={{background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:"8px",padding:"12px",marginBottom:"20px"}}>
          <div style={{color:"#4ade80",fontWeight:700,fontSize:"14px",marginBottom:"8px"}}>✅ Update Complete</div>
          <div style={{fontSize:"13px",color:"#f8fafc",marginBottom:"12px"}}>
            Processed {response.processed} of {response.totalFound || response.processed} upcoming match(es).
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
            {processed.map((r,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:"8px",background:"rgba(0,0,0,0.15)",padding:"6px 10px",borderRadius:"6px",fontSize:"12px"}}>
                <span style={{color:r.success?"#4ade80":"#f87171"}}>{r.success?"✓":"✕"}</span>
                <span style={{fontWeight:600}}>{r.teams}</span>
                {!r.success && <span style={{color:"#94a3b8",fontSize:"11px"}}>({r.error})</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {!response && !error && !loading && (
        <div style={{color:"#64748b",fontSize:"13px",fontStyle:"italic"}}>
          No manual update history in this session. Click the button above to start.
        </div>
      )}
    </div>
  );
}

// ─── PLAYER SCORES TAB ────────────────────────────────────────────────────────
function PlayerScoresTab({matches, allSelections, playerScores, onSavePlayerScores}) {
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [scores, setScores] = useState({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  const now = new Date();
  const lockedMatches = matches.filter(m => now >= new Date(m.lock_time));
  const m = lockedMatches.find(x => String(x.id) === String(selectedMatchId));

  let targetPlayers = [];
  if (m) {
    const pSet = new Set();
    Object.values(allSelections).forEach(userSels => {
      const matchSel = userSels[m.id];
      if (matchSel) {
        if (matchSel.bestBatsman) pSet.add(matchSel.bestBatsman);
        if (matchSel.bestBowler) pSet.add(matchSel.bestBowler);
        if (matchSel.duckBatsman) pSet.add(matchSel.duckBatsman);
        if (matchSel.dotBallBowler) pSet.add(matchSel.dotBallBowler);

      }
    });
    targetPlayers = Array.from(pSet).filter(Boolean).sort();
  }

  useEffect(() => {
    if (m) {
      const initial = {};
      targetPlayers.forEach(p => {
        const existing = playerScores[m.id]?.[p] || {};
        initial[p] = {
           runs: existing.runs ?? "", fours: existing.fours ?? "", sixes: existing.sixes ?? "", 
           wickets: existing.wickets ?? "", maidens: existing.maidens ?? "", dot_balls: existing.dot_balls ?? ""
        };
      });
      setScores(initial);
    } else {
      setScores({});
    }
  }, [selectedMatchId, m, playerScores]);

  const updateVal = (player, field, val) => {
    setScores(prev => ({
      ...prev,
      [player]: { ...prev[player], [field]: val }
    }));
  };

  const getCalc = (player) => {
    const s = scores[player] || {};
    const runs = parseInt(s.runs) || 0;
    const fours = parseInt(s.fours) || 0;
    const sixes = parseInt(s.sixes) || 0;
    const wickets = parseInt(s.wickets) || 0;
    const maidens = parseInt(s.maidens) || 0;
    const dot_balls = parseInt(s.dot_balls) || 0;

    let runsBonus = 0;
    if (runs >= 100) runsBonus = 25;
    else if (runs >= 50) runsBonus = 15;

    const batsman_score = runs + runsBonus + (fours * 2) + (sixes * 3);
    const bowler_score = (wickets * 25) + (maidens * 25);
    const dot_ball_score = dot_balls * 5;

    return { batsman_score, bowler_score, dot_ball_score };
  };

  const handleSave = async () => {
    if (!m) return;
    setSaving(true);
    const scoresArray = targetPlayers.map(p => {
      const s = scores[p] || {};
      const calc = getCalc(p);
      return {
        player_name: p,
        runs: s.runs !== "" ? parseInt(s.runs) : null,
        fours: s.fours !== "" ? parseInt(s.fours) : null,
        sixes: s.sixes !== "" ? parseInt(s.sixes) : null,
        wickets: s.wickets !== "" ? parseInt(s.wickets) : null,
        maidens: s.maidens !== "" ? parseInt(s.maidens) : null,
        dot_balls: s.dot_balls !== "" ? parseInt(s.dot_balls) : null,
        batsman_score: calc.batsman_score || null,
        bowler_score: calc.bowler_score || null,
        dot_ball_score: calc.dot_ball_score || null
      };
    });
    await onSavePlayerScores(m.id, scoresArray);
    setSaving(false);
    setSavedMsg("Scores saved successfully ✓");
    setTimeout(() => setSavedMsg(""), 3000);
  };

  const InputField = ({player, field}) => (
    <input 
      style={{...S.input, padding:"4px 6px", fontSize:"12px", width:"100%", background:"rgba(0,0,0,0.2)"}} 
      type="number"
      value={scores[player]?.[field] ?? ""}
      onChange={e => updateVal(player, field, e.target.value)}
    />
  );

  return (
    <div>
      <div style={S.sectionTitle}>Add Player Scores</div>
      <div style={{marginBottom:"16px"}}>
        <label style={S.label}>Select Match</label>
        <select style={{...S.select,maxWidth:"400px"}} value={selectedMatchId} onChange={e=>{setSelectedMatchId(e.target.value);setSavedMsg("");}}>
          <option value="">-- Select a locked match --</option>
          {lockedMatches.map(m=><option key={m.id} value={m.id}>M{m.id}: {m.home} vs {m.away} — {m.date}</option>)}
        </select>
      </div>
      {savedMsg && <div style={{color:"#00c864",fontSize:"13px",marginBottom:"12px"}}>✓ {savedMsg}</div>}
      
      {m && targetPlayers.length > 0 && (
        <>
          <div style={{fontSize:"13px",color:"#4db8ff",marginBottom:"14px"}}>📋 {targetPlayers.length} unique players selected by fantasy managers.</div>
          <div style={{...S.card,padding:"0",overflow:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px",minWidth:"900px"}}>
              <thead>
                <tr style={{borderBottom:"1px solid rgba(255,255,255,0.07)",background:"rgba(255,255,255,0.03)"}}>
                  <th style={{padding:"8px 10px",textAlign:"left",color:"#888",fontWeight:"normal",fontSize:"11px",position:"sticky",left:0,background:"#0d1117",zIndex:2}}>Player</th>
                  <th style={{padding:"8px 4px",textAlign:"center",color:"#FFD700",fontWeight:"normal",fontSize:"10px"}}>Runs (&gt;50 +15, &gt;100 +25)</th>
                  <th style={{padding:"8px 4px",textAlign:"center",color:"#FFD700",fontWeight:"normal",fontSize:"10px"}}>Fours (2)</th>
                  <th style={{padding:"8px 4px",textAlign:"center",color:"#FFD700",fontWeight:"normal",fontSize:"10px"}}>Sixes (3)</th>
                  <th style={{padding:"8px 4px",textAlign:"center",color:"#60a5fa",fontWeight:"normal",fontSize:"10px"}}>Wickets (25)</th>
                  <th style={{padding:"8px 4px",textAlign:"center",color:"#60a5fa",fontWeight:"normal",fontSize:"10px"}}>Maidens (25)</th>
                  <th style={{padding:"8px 4px",textAlign:"center",color:"#4ade80",fontWeight:"normal",fontSize:"10px"}}>Dot Balls (5)</th>
                  <th style={{padding:"8px 4px",textAlign:"center",color:"#f8fafc",fontWeight:"bold",fontSize:"11px"}}>Batsman Total</th>
                  <th style={{padding:"8px 4px",textAlign:"center",color:"#f8fafc",fontWeight:"bold",fontSize:"11px"}}>Bowler Total</th>
                  <th style={{padding:"8px 4px",textAlign:"center",color:"#f8fafc",fontWeight:"bold",fontSize:"11px"}}>Dot Ball Total</th>
                </tr>
              </thead>
              <tbody>
                {targetPlayers.map((p,i) => {
                  const calc = getCalc(p);
                  return (
                    <tr key={p} style={{borderBottom:"1px solid rgba(255,255,255,0.04)",background:i%2===0?"transparent":"rgba(255,255,255,0.01)"}}>
                      <td style={{padding:"6px 10px",color:"#e8e0d0",fontWeight:"bold",position:"sticky",left:0,background:i%2===0?"#0d1117":"#0f1319",zIndex:1,whiteSpace:"nowrap"}}>{p}</td>
                      <td style={{padding:"6px 4px"}}><InputField player={p} field="runs"/></td>
                      <td style={{padding:"6px 4px"}}><InputField player={p} field="fours"/></td>
                      <td style={{padding:"6px 4px"}}><InputField player={p} field="sixes"/></td>
                      <td style={{padding:"6px 4px"}}><InputField player={p} field="wickets"/></td>
                      <td style={{padding:"6px 4px"}}><InputField player={p} field="maidens"/></td>
                      <td style={{padding:"6px 4px"}}><InputField player={p} field="dot_balls"/></td>
                      <td style={{padding:"6px 4px",textAlign:"center",color:"#FFD700",fontWeight:"bold"}}>{calc.batsman_score}</td>
                      <td style={{padding:"6px 4px",textAlign:"center",color:"#60a5fa",fontWeight:"bold"}}>{calc.bowler_score}</td>
                      <td style={{padding:"6px 4px",textAlign:"center",color:"#4ade80",fontWeight:"bold"}}>{calc.dot_ball_score}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div style={{marginTop:"16px"}}>
            <button style={{...S.btn("primary"),padding:"10px 20px"}} onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Player Scores"}
            </button>
          </div>
        </>
      )}
      {m && targetPlayers.length === 0 && <div style={{color:"#888",fontSize:"13px"}}>No players were selected by fantasy managers for this match.</div>}
    </div>
  );
}

function AdminPage({matches,results,onSaveResult,allSelections,onSaveSelection,playerScores,onSavePlayerScores}) {
  const [adminTab,setAdminTab]=useState("results");
  const [selectedMatch,setSelectedMatch]=useState(null);
  const [now]=useState(new Date());
  const EMPTY_FORM={winningTeam:"",winByRuns:true,runMargin:"",wicketMargin:"",topScorer:"",topScorerRuns:"",bestBowler:"",bestBowlerPoints:"",powerplayWinner:"",powerplayScore:"",powerplayDiff:"",dotBallLeader:"",dotBalls:"",totalWickets:"",wicketsRange:"",duckBatsmen:[],matchTopPlayer:"",matchBottomPlayer:""};
  const [form,setForm]=useState(EMPTY_FORM);
  const [duckBatamenSelected,setDuckBatmenSelected]=useState("");
  const [saved,setSaved]=useState(false);
  const [saving,setSaving]=useState(false);

  const lockedMatches=matches.filter(m=>now>=new Date(m.lock_time));
  const selectMatch=(m)=>{
    setSelectedMatch(m);
    const ex=results[m.id];
    if(ex){
      const numFields=["runMargin","wicketMargin","topScorerRuns","bestBowlerPoints","powerplayScore","powerplayDiff","dotBalls","totalWickets"];
      const converted={...EMPTY_FORM,...ex,duckBatsmen:ex.duckBatsmen||[]};
      numFields.forEach(f=>{if(converted[f]!=null)converted[f]=String(converted[f]);});
      setForm(converted);
    }else{setForm(EMPTY_FORM);}
    setDuckBatmenSelected("");
    setSaved(false);
  };
  const setF=(k,v)=>setForm(f=>({...f,[k]:v}));

  const handleSave=async()=>{
    if(!selectedMatch) return;
    setSaving(true);
    const res={
      ...form,
      runMargin:parseInt(form.runMargin)||0,wicketMargin:parseInt(form.wicketMargin)||0,
      topScorerRuns:parseInt(form.topScorerRuns)||0,bestBowlerPoints:parseInt(form.bestBowlerPoints)||0,
      powerplayScore:parseInt(form.powerplayScore)||0,powerplayDiff:parseInt(form.powerplayDiff)||0,
      dotBalls:parseInt(form.dotBalls)||0,totalWickets:parseInt(form.totalWickets)||0,
    };
    await onSaveResult(selectedMatch.id,res);
    setSaved(true); setSaving(false); setTimeout(()=>setSaved(false),3000);
  };

  const m=selectedMatch;
  const allPlayers=m?[...new Set([...(PLAYERS[m.home]||[]),...(PLAYERS[m.away]||[])])].sort() :[];
  const submissionCount=selectedMatch?FANTASY_PLAYERS.filter(name=>allSelections[name.toLowerCase().replace(/\s/g,"_")]?.[selectedMatch.id]).length:0;


  return (
    <div style={S.page}>
      <h1 style={S.h1}>Admin Panel</h1>
      <div style={{display:"flex",gap:"8px",marginBottom:"20px",flexWrap:"wrap"}}>
        <button style={S.navBtn(adminTab==="results")} onClick={()=>setAdminTab("results")}>Match Results</button>
        <button style={S.navBtn(adminTab==="scores")} onClick={()=>setAdminTab("scores")}>Player Scores</button>
        <button style={S.navBtn(adminTab==="selections")} onClick={()=>setAdminTab("selections")}>Player Selections</button>
        <button style={S.navBtn(adminTab==="insights")} onClick={()=>setAdminTab("insights")}>AI Insights</button>
        <button style={S.navBtn(adminTab==="users")} onClick={()=>setAdminTab("users")}>Player Passwords</button>
      </div>
      {adminTab==="users"?<UserManagementTab/>:adminTab==="scores"?<PlayerScoresTab matches={matches} allSelections={allSelections} playerScores={playerScores} onSavePlayerScores={onSavePlayerScores}/>:adminTab==="selections"?<PlayerSelectionsTab matches={matches} allSelections={allSelections} onSaveSelection={onSaveSelection}/>:adminTab==="insights"?<AIInsightsTab matches={matches}/>:(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:"16px"}}>
          <div>
            <div style={S.sectionTitle}>Locked / Completed Matches</div>
            {lockedMatches.length===0&&<div style={{color:"#555",fontSize:"13px"}}>No locked matches yet</div>}
            {lockedMatches.map(m=>(
              <div key={m.id} onClick={()=>selectMatch(m)}
                style={{...S.card,marginBottom:"6px",cursor:"pointer",borderColor:selectedMatch?.id===m.id?"#FFD700":"rgba(255,255,255,0.07)",padding:"10px 14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                    <span style={{fontSize:"14px",fontWeight:800,color:"#64748b",width:"32px"}}>M{m.id}</span>
                    <TeamLogo team={m.home} size={32}/>
                    <span style={{fontSize:"15px",fontWeight:700}}>{m.home}</span>
                    <span style={{fontSize:"12px",color:"#475569"}}>vs</span>
                    <TeamLogo team={m.away} size={32}/>
                    <span style={{fontSize:"15px",fontWeight:700}}>{m.away}</span>
                  </div>
                  {results[m.id]&&<span style={{fontSize:"14px",color:"#00c864"}}>✓</span>}
                </div>
                <div style={{fontSize:"12px",color:"#475569",marginTop:"6px",marginLeft:"44px"}}>{m.date}</div>
              </div>
            ))}
          </div>
          <div>
            {!selectedMatch
              ?<div style={{...S.card,textAlign:"center",color:"#555",padding:"40px"}}>Select a match to enter results</div>
              :<div style={S.card}>
                <div style={{fontSize:"18px",fontWeight:"bold",color:"#e8e0d0",marginBottom:"4px"}}>M{m.id}: {m.home} vs {m.away}</div>
                <div style={{fontSize:"12px",color:"#555",marginBottom:"6px"}}>{m.date} · {m.time_label}</div>
                <div style={{fontSize:"12px",color:"#4db8ff",marginBottom:"16px"}}>📋 {submissionCount}/{FANTASY_PLAYERS.length} players submitted</div>

                <div style={S.sectionTitle}>Match Result</div>
                <div style={{...S.grid2,marginBottom:"14px"}}>
                  <IField label="Winning Team" value={form.winningTeam} onChange={v=>setF("winningTeam",v)} opts={[m.home,m.away]}/>
                  <div>
                    <label style={S.label}>Win Type</label>
                    <select style={S.select} value={form.winByRuns?"runs":"wickets"} onChange={e=>setF("winByRuns",e.target.value==="runs")}>
                      <option value="runs">By Runs</option><option value="wickets">By Wickets</option>
                    </select>
                  </div>
                  <IField label="Run Margin" value={form.runMargin} onChange={v=>setF("runMargin",v)} type="number"/>
                  <IField label="Wicket Margin" value={form.wicketMargin} onChange={v=>setF("wicketMargin",v)} type="number"/>
                </div>

                <div style={S.sectionTitle}>Batting</div>
                <div style={{...S.grid2,marginBottom:"14px"}}>
                  <IField label="Top Scorer" value={form.topScorer} onChange={v=>setF("topScorer",v)} opts={allPlayers}/>
                  <IField label="Runs Scored" value={form.topScorerRuns} onChange={v=>setF("topScorerRuns",v)} type="number"/>
                  <div style={{gridColumn:"1/-1"}}>
                    <label style={S.label}>Duck Batsmen</label>
                    <div style={{display:"flex",gap:"8px",marginBottom:"8px"}}>
                      <select style={{...S.select,flex:1}} value={duckBatamenSelected} onChange={e=>setDuckBatmenSelected(e.target.value)}>
                        <option value="">-- Select Player --</option>
                        {allPlayers.filter(p=>!form.duckBatsmen.includes(p)).map(p=><option key={p} value={p}>{p}</option>)}
                      </select>
                      <button style={{...S.btn("primary"),padding:"10px 16px"}} onClick={()=>{if(duckBatamenSelected){setF("duckBatsmen",[...form.duckBatsmen,duckBatamenSelected]);setDuckBatmenSelected("");}}}>+ Add</button>
                    </div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
                      {form.duckBatsmen.map(b=>(
                        <span key={b} style={{background:"rgba(255,165,0,0.2)",border:"1px solid rgba(255,165,0,0.4)",borderRadius:"6px",padding:"6px 12px",fontSize:"13px",display:"flex",alignItems:"center",gap:"8px"}}>
                          {b}
                          <button onClick={()=>setF("duckBatsmen",form.duckBatsmen.filter(x=>x!==b))} style={{background:"transparent",border:"none",cursor:"pointer",color:"#ff6b6b",fontSize:"16px",padding:"0",lineHeight:"1"}}>✕</button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={S.sectionTitle}>Bowling</div>
                <div style={{...S.grid2,marginBottom:"14px"}}>
                  <IField label="Best Bowler" value={form.bestBowler} onChange={v=>setF("bestBowler",v)} opts={allPlayers}/>
                  <IField label="Bowler Points" value={form.bestBowlerPoints} onChange={v=>setF("bestBowlerPoints",v)} type="number"/>
                  <IField label="Dot-Ball Leader" value={form.dotBallLeader} onChange={v=>setF("dotBallLeader",v)} opts={allPlayers}/>
                  <IField label="Dot Balls Bowled" value={form.dotBalls} onChange={v=>setF("dotBalls",v)} type="number"/>
                </div>

                <div style={S.sectionTitle}>Powerplay & Wickets</div>
                <div style={{...S.grid2,marginBottom:"14px"}}>
                  <IField label="Powerplay Winner" value={form.powerplayWinner} onChange={v=>setF("powerplayWinner",v)} opts={[m.home,m.away]}/>
                  <IField label="Powerplay Score" value={form.powerplayScore} onChange={v=>setF("powerplayScore",v)} type="number"/>
                  <IField label="Powerplay Diff" value={form.powerplayDiff} onChange={v=>setF("powerplayDiff",v)} type="number"/>
                  <IField label="Total Wickets Fallen" value={form.totalWickets} onChange={v=>setF("totalWickets",v)} type="number"/>
                  <IField label="Wickets Range" value={form.wicketsRange} onChange={v=>setF("wicketsRange",v)} opts={WICKET_RANGES}/>
                </div>

                <div style={S.sectionTitle}>Horse Results</div>
                <div style={{...S.grid2,marginBottom:"16px"}}>
                  <IField label="🏆 Match Top Scorer (fantasy player)" value={form.matchTopPlayer} onChange={v=>setF("matchTopPlayer",v)} opts={FANTASY_PLAYERS}/>
                  <IField label="💀 Match Bottom Scorer (fantasy player)" value={form.matchBottomPlayer} onChange={v=>setF("matchBottomPlayer",v)} opts={FANTASY_PLAYERS}/>
                </div>

                <div style={{display:"flex",gap:"12px",alignItems:"center",flexWrap:"wrap"}}>
                  <button style={S.btn("primary")} onClick={handleSave} disabled={saving}>
                    {saving?"Saving...":"Save Result & Calculate Points"}
                  </button>
                  {saved&&<span style={{color:"#00c864",fontSize:"13px"}}>✓ Saved! Points calculated.</span>}
                </div>
              </div>
            }
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LIVE SCORE PAGE ──────────────────────────────────────────────────────────
function LiveScorePage({matches, results, allSelections, playerScores, onSavePlayerScores}) {
  const [tab, setTab] = useState("grid");
  return (
    <div style={S.page}>
      <h1 style={S.h1}>Live Match Center</h1>
      <p style={{color:"#64748b",fontSize:"13px",marginBottom:"24px"}}>Track live scores or manually update player stats</p>
      
      <div style={{display:"flex",gap:"6px",marginBottom:"20px",borderBottom:"1px solid rgba(255,255,255,0.1)",paddingBottom:"10px",flexWrap:"wrap"}}>
        <button style={S.navBtn(tab==="grid")} onClick={()=>setTab("grid")}>🔴 Live Leaderboard</button>
        <button style={S.navBtn(tab==="update")} onClick={()=>setTab("update")}>✏️ Update Player Stats</button>
      </div>

      {tab==="grid" && <LiveGrid matches={matches} results={results} allSelections={allSelections} playerScores={playerScores} />}
      {tab==="update" && <PlayerScoresTab matches={matches} allSelections={allSelections} playerScores={playerScores} onSavePlayerScores={onSavePlayerScores} />}
    </div>
  );
}

function LiveGrid({matches, results, allSelections, playerScores}) {
  const [now] = useState(new Date());
  const lockedMatches = matches.filter(m => now >= new Date(m.lock_time));
  const [selectedMatchId, setSelectedMatchId] = useState("");

  const m = lockedMatches.find(x => String(x.id) === String(selectedMatchId));
  
  return (
    <div>
      <div style={{marginBottom:"16px"}}>
        <label style={S.label}>Select Match to Track</label>
        <select style={{...S.select,maxWidth:"400px"}} value={selectedMatchId} onChange={e=>setSelectedMatchId(e.target.value)}>
          <option value="">-- Select a match --</option>
          {lockedMatches.map(m=><option key={m.id} value={m.id}>M{m.id}: {m.home} vs {m.away} — {m.date}</option>)}
        </select>
      </div>

      {!m && selectedMatchId==="" && <div style={{...S.card,textAlign:"center",color:"#555",padding:"40px"}}>Select a match above to view live scores</div>}

      {m && (
        <div style={{...S.card,padding:"0",overflow:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px",minWidth:"900px"}}>
            <thead>
              <tr style={{borderBottom:"1px solid rgba(255,255,255,0.07)",background:"rgba(255,255,255,0.03)"}}>
                <th style={{padding:"8px 10px",textAlign:"left",color:"#888",fontWeight:"normal",fontSize:"11px",position:"sticky",left:0,background:"#0d1117",zIndex:2}}>Fantasy Player</th>
                <th style={{padding:"8px 4px",textAlign:"right",color:"#888",fontWeight:"normal",fontSize:"10px"}}>Winning Team</th>
                <th style={{padding:"8px 4px",textAlign:"right",color:"#888",fontWeight:"normal",fontSize:"10px"}}>Best Bat</th>
                <th style={{padding:"8px 4px",textAlign:"right",color:"#888",fontWeight:"normal",fontSize:"10px"}}>Best Bowl</th>
                <th style={{padding:"8px 4px",textAlign:"right",color:"#888",fontWeight:"normal",fontSize:"10px"}}>PP Winner</th>
                <th style={{padding:"8px 4px",textAlign:"right",color:"#888",fontWeight:"normal",fontSize:"10px"}}>Dot-Ball</th>
                <th style={{padding:"8px 4px",textAlign:"right",color:"#888",fontWeight:"normal",fontSize:"10px"}}>Wickets</th>
                <th style={{padding:"8px 4px",textAlign:"right",color:"#888",fontWeight:"normal",fontSize:"10px"}}>Duck</th>
                <th style={{padding:"8px 4px",textAlign:"right",color:"#888",fontWeight:"normal",fontSize:"10px"}}>Horses</th>
                <th style={{padding:"8px 4px",textAlign:"right",color:"#fbbf24",fontWeight:"bold",fontSize:"12px"}}>Total Pts</th>
              </tr>
            </thead>
            <tbody>
              {FANTASY_PLAYERS.map((name) => {
                const uname = name.toLowerCase().replace(/\s/g,"_");
                const sel = allSelections[uname]?.[m.id];
                if (!sel) return null; // Hide users without selections
                const pts = calcPoints(sel, results[m.id], playerScores[m.id]||{});
                return { name, bd: pts.breakdown, total: pts.total };
              }).filter(Boolean).sort((a,b)=>b.total - a.total).map((row, i) => (
                <tr key={row.name} style={{borderBottom:"1px solid rgba(255,255,255,0.04)",background:i%2===0?"transparent":"rgba(255,255,255,0.01)"}}>
                  <td style={{padding:"6px 10px",color:"#e8e0d0",fontWeight:"bold",position:"sticky",left:0,background:i%2===0?"#0d1117":"#0f1319",zIndex:1,whiteSpace:"nowrap"}}>{row.name}</td>
                  <td style={{padding:"6px 4px",textAlign:"right",color:row.bd.winningTeam>0?"#4ade80":"#64748b"}}>{row.bd.winningTeam||0}</td>
                  <td style={{padding:"6px 4px",textAlign:"right",color:row.bd.bestBatsman>0?"#4ade80":"#64748b"}}>{row.bd.bestBatsman||0}</td>
                  <td style={{padding:"6px 4px",textAlign:"right",color:row.bd.bestBowler>0?"#4ade80":"#64748b"}}>{row.bd.bestBowler||0}</td>
                  <td style={{padding:"6px 4px",textAlign:"right",color:row.bd.powerplayWinner>0?"#4ade80":"#64748b"}}>{row.bd.powerplayWinner||0}</td>
                  <td style={{padding:"6px 4px",textAlign:"right",color:row.bd.dotBallBowler>0?"#4ade80":"#64748b"}}>{row.bd.dotBallBowler||0}</td>
                  <td style={{padding:"6px 4px",textAlign:"right",color:row.bd.totalWickets>0?"#4ade80":"#64748b"}}>{row.bd.totalWickets||0}</td>
                  <td style={{padding:"6px 4px",textAlign:"right",color:row.bd.duckBatsman>0?"#4ade80":"#64748b"}}>{row.bd.duckBatsman||0}</td>
                  <td style={{padding:"6px 4px",textAlign:"right",color:(row.bd.winningHorse||0)+(row.bd.losingHorse||0)>0?"#4ade80":"#64748b"}}>{(row.bd.winningHorse||0)+(row.bd.losingHorse||0)}</td>
                  <td style={{padding:"6px 4px",textAlign:"right",color:"#fbbf24",fontWeight:"bold",fontSize:"14px"}}>{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── APP SHELL ────────────────────────────────────────────────────────────────
export default function App() {
  const [user,setUser]=useState(()=>{try{return JSON.parse(sessionStorage.getItem("ipl_user")||"null");}catch{return null;}});
  const [page,setPage]=useState("matches");
  const [selectedMatch,setSelectedMatch]=useState(null);
  const [menuOpen,setMenuOpen]=useState(false);

  // Data state
  const [matches,setMatches]=useState([]);
  const [results,setResults]=useState({});
  const [allSelections,setAllSelections]=useState({});
  const [insights,setInsights]=useState({});
  const [playerScores,setPlayerScores]=useState({});
  const [loading,setLoading]=useState(true);

  const userSel=user?(allSelections[user.username]||{}):{};

  // Load all data on mount
  useEffect(()=>{
    if(!user){setLoading(false);return;}
    Promise.all([
      supa.query("matches",{select:"*",order:"id.asc"}),
      supa.query("results",{select:"*"}),
      supa.query("selections",{select:"*"}),
      supa.query("match_insights",{select:"*"}).catch(()=>[]),
      supa.query("player_scores",{select:"*"}).catch(()=>[]),
    ]).then(([matchData,resultData,selData,insightsData,playerScoresData])=>{
      setMatches(matchData||[]);
      const resMap={};
      (resultData||[]).forEach(r=>{resMap[r.match_id]={winningTeam:r.winning_team,runMargin:r.run_margin,wicketMargin:r.wicket_margin,topScorer:r.top_scorer,topScorerRuns:r.top_scorer_runs,bestBowler:r.best_bowler,bestBowlerPoints:r.best_bowler_points,powerplayWinner:r.powerplay_winner,powerplayScore:r.powerplay_score,powerplayDiff:r.powerplay_diff,dotBallLeader:r.dot_ball_leader,dotBalls:r.dot_balls,totalWickets:r.total_wickets,wicketsRange:r.wickets_range,duckBatsmen:r.duck_batsmen||[],matchTopPlayer:r.match_top_player,matchBottomPlayer:r.match_bottom_player};});
      setResults(resMap);
      const selMap={};
      (selData||[]).forEach(s=>{
        if(!selMap[s.username]) selMap[s.username]={};
        selMap[s.username][s.match_id]={winningTeam:s.winning_team,bestBatsman:s.best_batsman,bestBowler:s.best_bowler,powerplayWinner:s.powerplay_winner,dotBallBowler:s.dot_ball_bowler,totalWickets:s.total_wickets,duckBatsman:s.duck_batsman,doubleCategory:s.double_category,winningHorse:s.winning_horse,losingHorse:s.losing_horse};
      });
      setAllSelections(selMap);
      const iMap={};
      (Array.isArray(insightsData)?insightsData:[]).forEach(i=>{iMap[i.match_id]=i;});
      setInsights(iMap);
      const scoreMap={};
      (Array.isArray(playerScoresData)?playerScoresData:[]).forEach(s=>{
        if(!scoreMap[s.match_id]) scoreMap[s.match_id]={};
        scoreMap[s.match_id][s.player_name]=s;
      });
      setPlayerScores(scoreMap);
      setLoading(false);
    }).catch(()=>setLoading(false));
  },[user]);

  const login=(u)=>{sessionStorage.setItem("ipl_user",JSON.stringify(u));setUser(u);};
  const logout=()=>{sessionStorage.removeItem("ipl_user");setUser(null);setPage("matches");setSelectedMatch(null);setMenuOpen(false);};

  const onSave=useCallback(async(matchId,sel)=>{
    await supa.upsert("selections",{username:user.username,match_id:matchId,winning_team:sel.winningTeam,best_batsman:sel.bestBatsman,best_bowler:sel.bestBowler,powerplay_winner:sel.powerplayWinner,dot_ball_bowler:sel.dotBallBowler,total_wickets:sel.totalWickets,duck_batsman:sel.duckBatsman,double_category:sel.doubleCategory,winning_horse:sel.winningHorse,losing_horse:sel.losingHorse,saved_at:new Date().toISOString()},"username,match_id");
    setAllSelections(prev=>({...prev,[user.username]:{...(prev[user.username]||{}),[matchId]:sel}}));
  },[user]);

  const onSaveResult=useCallback(async(matchId,res)=>{
    await supa.upsert("results",{match_id:matchId,winning_team:res.winningTeam,win_by_runs:res.winByRuns,run_margin:res.runMargin,wicket_margin:res.wicketMargin,top_scorer:res.topScorer,top_scorer_runs:res.topScorerRuns,best_bowler:res.bestBowler,best_bowler_points:res.bestBowlerPoints,powerplay_winner:res.powerplayWinner,powerplay_score:res.powerplayScore,powerplay_diff:res.powerplayDiff,dot_ball_leader:res.dotBallLeader,dot_balls:res.dotBalls,total_wickets:res.totalWickets,wickets_range:res.wicketsRange,duck_batsmen:res.duckBatsmen,match_top_player:res.matchTopPlayer,match_bottom_player:res.matchBottomPlayer},"match_id");
    setResults(prev=>({...prev,[matchId]:res}));
  },[]);

  const onSaveSelection=useCallback(async(username,matchId,sel)=>{
    await supa.upsert("selections",{username,match_id:matchId,winning_team:sel.winningTeam,best_batsman:sel.bestBatsman,best_bowler:sel.bestBowler,powerplay_winner:sel.powerplayWinner,dot_ball_bowler:sel.dotBallBowler,total_wickets:sel.totalWickets,duck_batsman:sel.duckBatsman,double_category:sel.doubleCategory,winning_horse:sel.winningHorse,losing_horse:sel.losingHorse,saved_at:new Date().toISOString()},"username,match_id");
    setAllSelections(prev=>({...prev,[username]:{...(prev[username]||{}),[matchId]:sel}}));
  },[]);

  const onSavePlayerScores=useCallback(async(matchId, scoresArray)=>{
    await Promise.all(scoresArray.map(s => 
      supa.upsert("player_scores", {
        match_id: matchId,
        player_name: s.player_name,
        runs: s.runs,
        fours: s.fours,
        sixes: s.sixes,
        wickets: s.wickets,
        maidens: s.maidens,
        dot_balls: s.dot_balls,
        batsman_score: s.batsman_score,
        bowler_score: s.bowler_score,
        dot_ball_score: s.dot_ball_score
      }, "match_id,player_name")
    ));
    setPlayerScores(prev=>{
      const mScores = {...(prev[matchId]||{})};
      scoresArray.forEach(s => mScores[s.player_name] = s);
      return {...prev, [matchId]: mScores};
    });
  },[]);

  const navItems=[
    {id:"matches",icon:"🏏",label:"Matches"},
    {id:"selections",icon:"📋",label:"Picks"},
    {id:"live",icon:"🔴",label:"Live"},
    {id:"leaderboard",icon:"🏆",label:"Board"},
    ...(user?.isAdmin?[{id:"admin",icon:"⚙️",label:"Admin"}]:[]),
  ];

  if(!user) return (
    <div style={S.app}><div style={S.noise}/><div style={{...S.content,paddingBottom:0}}><LoginPage onLogin={login}/></div></div>
  );

  if(loading) return (
    <div style={{...S.app,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:"40px",marginBottom:"12px",animation:"pulse 2s ease-in-out infinite"}}>🏏</div>
        <div style={{...S.logo,fontSize:"22px",display:"block",marginBottom:"8px"}}>IPL FANTASY 2026</div>
        <div style={{color:"#475569",fontSize:"13px"}}>Loading match data...</div>
      </div>
    </div>
  );

  return (
    <div style={S.app}>
      <style>{`
        select option{background:#131a2b;color:#e2e8f0;}
        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:3px;}
        ::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.2);}
        *{box-sizing:border-box;}
        input,select{font-size:14px!important;}
        input[type="number"]::-webkit-outer-spin-button,input[type="number"]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
        input[type="number"]{-moz-appearance:textfield;}
        input:focus,select:focus{border-color:rgba(255,140,0,0.35)!important;outline:none;}
        ::selection{background:rgba(255,140,0,0.3);color:#fff;}
        .tab-indicator{position:absolute;top:-2px;left:50%;transform:translateX(-50%);width:20px;height:3px;border-radius:2px;background:linear-gradient(90deg,#FF8C00,#fbbf24);}
      `}</style>
      <div style={S.noise}/>
      <div style={S.content}>
        {/* Header */}
        <header style={S.header}>
          <div style={S.logo}>🏏 IPL FANTASY</div>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <span style={{fontSize:"12px",color:"#64748b",fontWeight:500}}>{user.displayName}</span>
            <button onClick={logout} style={{background:"none",border:"1px solid rgba(239,68,68,0.25)",borderRadius:"6px",padding:"4px 10px",cursor:"pointer",color:"#f87171",fontSize:"11px",fontWeight:600,fontFamily:"'Inter',sans-serif",transition:"all 0.2s"}}>
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        {selectedMatch
          ?<SelectionForm match={selectedMatch} user={user} onBack={()=>setSelectedMatch(null)} results={results} userSel={userSel} onSave={onSave} insights={insights[selectedMatch.id]} playerScores={playerScores}/>
          :page==="matches"?<MatchesPage user={user} onSelectMatch={m=>{setSelectedMatch(m);}} matches={matches} results={results} userSel={userSel}/>
          :page==="leaderboard"?<LeaderboardPage user={user} matches={matches} results={results} allSelections={allSelections} userSel={userSel} playerScores={playerScores}/>
          :page==="selections"?<div style={S.page}><PlayerSelectionsTab matches={matches} allSelections={allSelections} readOnly={true}/></div>
          :page==="live"?<LiveScorePage matches={matches} results={results} allSelections={allSelections} playerScores={playerScores} onSavePlayerScores={onSavePlayerScores}/>
          :page==="admin"&&user.isAdmin?<AdminPage matches={matches} results={results} onSaveResult={onSaveResult} allSelections={allSelections} onSaveSelection={onSaveSelection} playerScores={playerScores} onSavePlayerScores={onSavePlayerScores}/>
          :null
        }
      </div>

      {/* Bottom Tab Bar */}
      <nav style={S.bottomNav}>
        {navItems.map(n=>(
          <button key={n.id} style={S.tabBtn(page===n.id&&!selectedMatch)} onClick={()=>{setPage(n.id);setSelectedMatch(null);}}>
            {page===n.id&&!selectedMatch&&<div className="tab-indicator"/>}
            <span style={{fontSize:"24px",lineHeight:1}}>{n.icon}</span>
            <span style={{fontSize:"12px",fontWeight:page===n.id&&!selectedMatch?700:500,letterSpacing:"0.3px"}}>{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

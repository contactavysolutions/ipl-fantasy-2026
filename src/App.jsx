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
  CSK: { name:"Chennai Super Kings",         color:"#F5A623", accent:"#1A1A2E" },
  KKR: { name:"Kolkata Knight Riders",       color:"#3A225D", accent:"#F5C518" },
  SRH: { name:"Sunrisers Hyderabad",         color:"#FF6B00", accent:"#1A1A2E" },
  DC:  { name:"Delhi Capitals",              color:"#0A2D6E", accent:"#EF1C25" },
  GT:  { name:"Gujarat Titans",              color:"#1C4F8C", accent:"#00D4FF" },
  RR:  { name:"Rajasthan Royals",            color:"#EA1A85", accent:"#254AA5" },
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

function calcPoints(sel, res) {
  if (!sel||!res) return {breakdown:{},total:0};
  const bd = {};
  bd.winningTeam = sel.winningTeam===res.winningTeam ? 50+Math.round((res.runMargin||0)/((res.wicketMargin||1)*5)) : 0;
  bd.bestBatsman = sel.bestBatsman===res.topScorer ? (res.topScorerRuns||0)+50 : 0;
  bd.bestBowler = sel.bestBowler===res.bestBowler ? (res.bestBowlerPoints||0)+50 : 0;
  bd.powerplayWinner = sel.powerplayWinner===res.powerplayWinner ? (res.powerplayScore||0)+(res.powerplayDiff||0) : 0;
  bd.dotBallBowler = sel.dotBallBowler===res.dotBallLeader ? 50+(res.dotBalls||0)*5 : 0;
  bd.totalWickets = sel.totalWickets===res.wicketsRange ? (res.totalWickets||0)*5 : 0;
  bd.duckBatsman = (res.duckBatsmen||[]).includes(sel.duckBatsman) ? 100 : 0;
  bd.winningHorse = sel.winningHorse&&res.matchTopPlayer&&sel.winningHorse===res.matchTopPlayer ? 100 : 0;
  bd.losingHorse = sel.losingHorse&&res.matchBottomPlayer&&sel.losingHorse===res.matchBottomPlayer ? 100 : 0;
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
  app:{minHeight:"100vh",background:"linear-gradient(135deg,#0a0a0f 0%,#0d1117 50%,#0a0f0d 100%)",fontFamily:"'Georgia',serif",color:"#e8e0d0",position:"relative"},
  noise:{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",opacity:0.4},
  content:{position:"relative",zIndex:1},
  header:{borderBottom:"1px solid rgba(255,165,0,0.15)",padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(0,0,0,0.95)",backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:100},
  logo:{fontSize:"17px",fontWeight:"bold",letterSpacing:"2px",background:"linear-gradient(90deg,#FF6B00,#FFD700,#FF6B00)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundSize:"200% auto",animation:"shimmer 3s linear infinite"},
  page:{maxWidth:"960px",margin:"0 auto",padding:"20px 12px"},
  card:{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"12px",padding:"20px",backdropFilter:"blur(4px)"},
  navBtn:(a)=>({padding:"7px 16px",borderRadius:"6px",border:"none",cursor:"pointer",fontSize:"13px",fontFamily:"'Georgia',serif",background:a?"rgba(255,165,0,0.2)":"transparent",color:a?"#FFD700":"#888",borderBottom:a?"2px solid #FFD700":"2px solid transparent",transition:"all 0.2s"}),
  teamBadge:(t)=>({display:"inline-block",padding:"4px 10px",borderRadius:"6px",fontSize:"13px",fontWeight:"bold",letterSpacing:"1px",background:(TEAMS[t]?.color||"#333")+"33",color:TEAMS[t]?.accent||"#fff",border:`1px solid ${(TEAMS[t]?.color||"#333")}55`}),
  statusPill:(st)=>({display:"inline-block",padding:"3px 10px",borderRadius:"20px",fontSize:"11px",background:st==="completed"?"rgba(0,200,100,0.15)":st==="locked"?"rgba(255,100,100,0.15)":st==="submitted"?"rgba(0,150,255,0.15)":"rgba(255,165,0,0.15)",color:st==="completed"?"#00c864":st==="locked"?"#ff6b6b":st==="submitted"?"#4db8ff":"#FFD700",border:`1px solid ${st==="completed"?"#00c86433":st==="locked"?"#ff6b6b33":st==="submitted"?"#4db8ff33":"#FFD70033"}`}),
  h1:{fontSize:"26px",fontWeight:"bold",marginBottom:"8px",color:"#FFD700"},
  label:{display:"block",fontSize:"12px",color:"#888",marginBottom:"6px",letterSpacing:"0.5px",textTransform:"uppercase"},
  select:{width:"100%",padding:"10px 12px",borderRadius:"8px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",color:"#e8e0d0",fontSize:"16px",outline:"none",cursor:"pointer",fontFamily:"'Georgia',serif"},
  input:{width:"100%",padding:"10px 12px",borderRadius:"8px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",color:"#e8e0d0",fontSize:"16px",outline:"none",fontFamily:"'Georgia',serif",boxSizing:"border-box"},
  btn:(v="primary")=>({padding:"11px 24px",borderRadius:"8px",border:"none",cursor:"pointer",fontSize:"14px",fontWeight:"bold",fontFamily:"'Georgia',serif",background:v==="primary"?"linear-gradient(135deg,#FF6B00,#FFD700)":v==="danger"?"rgba(255,80,80,0.2)":"rgba(255,255,255,0.08)",color:v==="primary"?"#000":v==="danger"?"#ff6b6b":"#e8e0d0",transition:"all 0.2s"}),
  grid2:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"16px"},
  sectionTitle:{fontSize:"11px",letterSpacing:"2px",textTransform:"uppercase",color:"#FF6B00",marginBottom:"12px",fontWeight:"bold"},
  logoutBtn:{background:"rgba(255,80,80,0.15)",border:"1px solid rgba(255,100,100,0.5)",color:"#ff6b6b",borderRadius:"6px",padding:"7px 14px",cursor:"pointer",fontSize:"13px",fontWeight:"bold",fontFamily:"'Georgia',serif"},
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
      <div style={{width:"100%",maxWidth:"380px"}}>
        <div style={{textAlign:"center",marginBottom:"40px"}}>
          <div style={{...S.logo,fontSize:"32px",display:"block",marginBottom:"8px"}}>🏏 IPL FANTASY</div>
          <div style={{color:"#666",fontSize:"14px"}}>2026 Season — Friends League</div>
        </div>
        <div style={{...S.card,padding:"32px"}}>
          <div style={{marginBottom:"20px"}}>
            <label style={S.label}>Username</label>
            <input style={S.input} placeholder="e.g. sandeep" value={username} onChange={e=>setUsername(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
            <div style={{fontSize:"11px",color:"#555",marginTop:"4px"}}>Lowercase, spaces as underscore e.g. santhosh_male</div>
          </div>
          <div style={{marginBottom:"24px"}}>
            <label style={S.label}>Password</label>
            <input style={S.input} type="password" placeholder="Your password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
          </div>
          {error&&<div style={{color:"#ff6b6b",fontSize:"13px",marginBottom:"16px"}}>{error}</div>}
          <button style={{...S.btn("primary"),width:"100%"}} onClick={handleLogin} disabled={loading}>
            {loading?"Signing in...":"Sign In"}
          </button>
        </div>
        <div style={{textAlign:"center",marginTop:"16px",fontSize:"12px",color:"#444"}}>
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
  return (
    <div style={S.page}>
      <style>{`.mcard:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.3);transition:all 0.2s}`}</style>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"12px",marginBottom:"20px"}}>
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
        return (
          <div key={match.id} className="mcard" style={{...S.card,marginBottom:"8px",cursor:"pointer",background:st==="completed"?"rgba(0,180,80,0.04)":st==="locked"?"rgba(255,100,100,0.03)":"rgba(255,255,255,0.03)",borderColor:st==="completed"?"rgba(0,180,80,0.15)":st==="locked"?"rgba(255,100,100,0.1)":"rgba(255,255,255,0.07)"}} onClick={()=>onSelectMatch(match)}>
            <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}>
                <span style={{fontSize:"11px",color:"#555"}}>M{match.id}</span>
                <span style={S.teamBadge(match.home)}>{match.home}</span>
                <span style={{color:"#555",fontSize:"12px"}}>vs</span>
                <span style={S.teamBadge(match.away)}>{match.away}</span>
                <span style={S.statusPill(st)}>{st==="submitted"?"✓ Submitted":st==="completed"?"✓ Done":st==="locked"?"🔒 Locked":"Open"}</span>
              </div>
              <div style={{display:"flex",gap:"10px",flexWrap:"wrap"}}>
                <span style={{fontSize:"12px",color:"#555"}}>{match.date} · {match.time_label}</span>
                {res&&<span style={{fontSize:"12px",color:"#00c864"}}>→ {res.winningTeam} won{res.runMargin?` by ${res.runMargin} runs`:res.wicketMargin?` by ${res.wicketMargin} wkts`:""}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── SELECTION FORM ───────────────────────────────────────────────────────────
const EMPTY_SEL={winningTeam:"",bestBatsman:"",bestBowler:"",powerplayWinner:"",dotBallBowler:"",totalWickets:"",duckBatsman:"",doubleCategory:"",winningHorse:"",losingHorse:""};

function SelectionForm({match,user,onBack,results,userSel,onSave}) {
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

  const points=hasResult?calcPoints(sel,results[match.id]):null;
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
      <div style={{display:"flex",flexDirection:"column",gap:"6px",marginBottom:"18px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}>
          <span style={S.teamBadge(match.home)}>{match.home}</span>
          <span style={{color:"#555"}}>vs</span>
          <span style={S.teamBadge(match.away)}>{match.away}</span>
          <span style={S.statusPill(st)}>{st==="completed"?"✓ Completed":st==="locked"?"🔒 Locked":st==="submitted"?"✓ Submitted":"Open"}</span>
        </div>
        <div style={{fontSize:"12px",color:"#555"}}>Match {match.id} · {match.date} · {match.time_label}</div>
      </div>

      {locked&&!hasResult&&<div style={{...S.card,background:"rgba(255,100,100,0.05)",borderColor:"rgba(255,100,100,0.15)",marginBottom:"16px",color:"#ff8888",fontSize:"13px"}}>🔒 Match has started. Selections are locked.</div>}

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
function LeaderboardPage({matches,results,allSelections}) {
  const completed=matches.filter(m=>results[m.id]);
  const scores=FANTASY_PLAYERS.map(name=>{
    const uname=name.toLowerCase().replace(/\s/g,"_");
    const uSel=allSelections[uname]||{};
    let total=0,matchCount=0;
    completed.forEach(m=>{if(uSel[m.id]){total+=calcPoints(uSel[m.id],results[m.id]).total;matchCount++;}});
    return {name,total,matchCount};
  }).filter(s=>s.matchCount>0).sort((a,b)=>b.total-a.total);
  const medals=["🥇","🥈","🥉"];
  return (
    <div style={S.page}>
      <h1 style={S.h1}>Season Leaderboard</h1>
      <p style={{color:"#666",fontSize:"13px",marginBottom:"20px"}}>{completed.length} matches completed · Cumulative points</p>
      {scores.length===0
        ?<div style={{...S.card,textAlign:"center",color:"#555",padding:"48px"}}>No completed matches yet 🏏</div>
        :scores.map((s,i)=>(
          <div key={s.name} style={{...S.card,marginBottom:"8px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:"12px",flex:1,minWidth:0}}>
              <span style={{fontSize:i<3?"22px":"16px",minWidth:"32px",textAlign:"center",flexShrink:0}}>{medals[i]||`#${i+1}`}</span>
              <div style={{minWidth:0}}>
                <div style={{fontWeight:"bold",color:i===0?"#FFD700":"#e8e0d0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</div>
                <div style={{fontSize:"12px",color:"#555"}}>{s.matchCount} matches</div>
              </div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontSize:"20px",fontWeight:"bold",color:i===0?"#FFD700":"#e8e0d0"}}>{s.total}</div>
              <div style={{fontSize:"11px",color:"#555"}}>pts</div>
            </div>
          </div>
        ))
      }
    </div>
  );
}

// ─── MY STATS ─────────────────────────────────────────────────────────────────
function MyStatsPage({user,matches,results,userSel}) {
  const completed=matches.filter(m=>results[m.id]&&userSel[m.id]);
  const totalPoints=completed.reduce((sum,m)=>sum+calcPoints(userSel[m.id],results[m.id]).total,0);
  return (
    <div style={S.page}>
      <h1 style={S.h1}>My Stats</h1>
      <p style={{color:"#666",fontSize:"13px",marginBottom:"16px"}}>{user.displayName}</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(90px,1fr))",gap:"12px",marginBottom:"24px"}}>
        {[{label:"Total Points",val:totalPoints},{label:"Matches",val:completed.length},{label:"Avg/Match",val:completed.length?Math.round(totalPoints/completed.length):0}].map(({label,val})=>(
          <div key={label} style={{...S.card,textAlign:"center"}}>
            <div style={{fontSize:"26px",fontWeight:"bold",color:"#FFD700"}}>{val}</div>
            <div style={{fontSize:"11px",color:"#666",marginTop:"4px"}}>{label}</div>
          </div>
        ))}
      </div>
      {completed.length===0
        ?<div style={{...S.card,textAlign:"center",color:"#555",padding:"48px"}}>No completed matches yet. Make your selections!</div>
        :completed.map(m=>{
          const {breakdown,total}=calcPoints(userSel[m.id],results[m.id]);
          return (
            <div key={m.id} style={{...S.card,marginBottom:"10px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px",flexWrap:"wrap",gap:"8px"}}>
                <div style={{display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap"}}>
                  <span style={{color:"#555",fontSize:"12px"}}>M{m.id}</span>
                  <span style={S.teamBadge(m.home)}>{m.home}</span>
                  <span style={{color:"#555"}}>vs</span>
                  <span style={S.teamBadge(m.away)}>{m.away}</span>
                </div>
                <div style={{fontSize:"20px",fontWeight:"bold",color:"#FFD700"}}>{total} pts</div>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:"5px"}}>
                {Object.entries(breakdown).filter(([k])=>!k.startsWith("_")).map(([k,v])=>(
                  <span key={k} style={{fontSize:"11px",background:v>0?"rgba(0,200,100,0.08)":"rgba(255,100,100,0.08)",color:v>0?"#00c864":"#ff6b6b",padding:"3px 7px",borderRadius:"4px",border:`1px solid ${v>0?"rgba(0,200,100,0.15)":"rgba(255,100,100,0.15)"}`}}>{k}: {v}</span>
                ))}
              </div>
            </div>
          );
        })
      }
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

function AdminPage({matches,results,onSaveResult,allSelections}) {
  const [adminTab,setAdminTab]=useState("results");
  const [selectedMatch,setSelectedMatch]=useState(null);
  const [now]=useState(new Date());
  const EMPTY_FORM={winningTeam:"",winByRuns:true,runMargin:0,wicketMargin:0,topScorer:"",topScorerRuns:0,bestBowler:"",bestBowlerPoints:0,powerplayWinner:"",powerplayScore:0,powerplayDiff:0,dotBallLeader:"",dotBalls:0,totalWickets:0,wicketsRange:"",duckBatsmen:"",matchTopPlayer:"",matchBottomPlayer:""};
  const [form,setForm]=useState(EMPTY_FORM);
  const [saved,setSaved]=useState(false);
  const [saving,setSaving]=useState(false);

  const lockedMatches=matches.filter(m=>now>=new Date(m.lock_time));
  const selectMatch=(m)=>{
    setSelectedMatch(m);
    const ex=results[m.id];
    setForm(ex?{...EMPTY_FORM,...ex,duckBatsmen:(ex.duckBatsmen||[]).join(", ")}:EMPTY_FORM);
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
      duckBatsmen:form.duckBatsmen.split(",").map(s=>s.trim()).filter(Boolean),
    };
    await onSaveResult(selectedMatch.id,res);
    setSaved(true); setSaving(false); setTimeout(()=>setSaved(false),3000);
  };

  const m=selectedMatch;
  const allPlayers=m?[...new Set([...(PLAYERS[m.home]||[]),...(PLAYERS[m.away]||[])])].sort() :[];
  const submissionCount=selectedMatch?FANTASY_PLAYERS.filter(name=>allSelections[name.toLowerCase().replace(/\s/g,"_")]?.[selectedMatch.id]).length:0;

  const IField=({label,k,type="text",opts})=>(
    <div>
      <label style={S.label}>{label}</label>
      {opts
        ?<select style={S.select} value={form[k]} onChange={e=>setF(k,e.target.value)}><option value="">-- Select --</option>{opts.map(o=><option key={o} value={o}>{o}</option>)}</select>
        :<input style={S.input} type={type} value={form[k]} onChange={e=>setF(k,type==="number"?parseFloat(e.target.value):e.target.value)}/>
      }
    </div>
  );

  return (
    <div style={S.page}>
      <h1 style={S.h1}>Admin Panel</h1>
      <div style={{display:"flex",gap:"8px",marginBottom:"20px",flexWrap:"wrap"}}>
        <button style={S.navBtn(adminTab==="results")} onClick={()=>setAdminTab("results")}>Match Results</button>
        <button style={S.navBtn(adminTab==="users")} onClick={()=>setAdminTab("users")}>Player Passwords</button>
      </div>
      {adminTab==="users"?<UserManagementTab/>:(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:"16px"}}>
          <div>
            <div style={S.sectionTitle}>Locked / Completed Matches</div>
            {lockedMatches.length===0&&<div style={{color:"#555",fontSize:"13px"}}>No locked matches yet</div>}
            {lockedMatches.map(m=>(
              <div key={m.id} onClick={()=>selectMatch(m)}
                style={{...S.card,marginBottom:"6px",cursor:"pointer",borderColor:selectedMatch?.id===m.id?"#FFD700":"rgba(255,255,255,0.07)",padding:"10px 14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:"13px"}}>M{m.id}: {m.home} vs {m.away}</span>
                  {results[m.id]&&<span style={{fontSize:"11px",color:"#00c864"}}>✓</span>}
                </div>
                <div style={{fontSize:"11px",color:"#555",marginTop:"2px"}}>{m.date}</div>
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
                  <IField label="Winning Team" k="winningTeam" opts={[m.home,m.away]}/>
                  <div>
                    <label style={S.label}>Win Type</label>
                    <select style={S.select} value={form.winByRuns?"runs":"wickets"} onChange={e=>setF("winByRuns",e.target.value==="runs")}>
                      <option value="runs">By Runs</option><option value="wickets">By Wickets</option>
                    </select>
                  </div>
                  <IField label="Run Margin" k="runMargin" type="number"/>
                  <IField label="Wicket Margin" k="wicketMargin" type="number"/>
                </div>

                <div style={S.sectionTitle}>Batting</div>
                <div style={{...S.grid2,marginBottom:"14px"}}>
                  <IField label="Top Scorer" k="topScorer" opts={allPlayers}/>
                  <IField label="Runs Scored" k="topScorerRuns" type="number"/>
                  <div style={{gridColumn:"1/-1"}}>
                    <label style={S.label}>Duck Batsmen (comma separated)</label>
                    <input style={S.input} value={form.duckBatsmen} onChange={e=>setF("duckBatsmen",e.target.value)} placeholder="e.g. Virat Kohli, Rohit Sharma"/>
                  </div>
                </div>

                <div style={S.sectionTitle}>Bowling</div>
                <div style={{...S.grid2,marginBottom:"14px"}}>
                  <IField label="Best Bowler" k="bestBowler" opts={allPlayers}/>
                  <IField label="Bowler Points" k="bestBowlerPoints" type="number"/>
                  <IField label="Dot-Ball Leader" k="dotBallLeader" opts={allPlayers}/>
                  <IField label="Dot Balls Bowled" k="dotBalls" type="number"/>
                </div>

                <div style={S.sectionTitle}>Powerplay & Wickets</div>
                <div style={{...S.grid2,marginBottom:"14px"}}>
                  <IField label="Powerplay Winner" k="powerplayWinner" opts={[m.home,m.away]}/>
                  <IField label="Powerplay Score" k="powerplayScore" type="number"/>
                  <IField label="Powerplay Diff" k="powerplayDiff" type="number"/>
                  <IField label="Total Wickets Fallen" k="totalWickets" type="number"/>
                  <IField label="Wickets Range" k="wicketsRange" opts={WICKET_RANGES}/>
                </div>

                <div style={S.sectionTitle}>Horse Results</div>
                <div style={{...S.grid2,marginBottom:"16px"}}>
                  <IField label="🏆 Match Top Scorer (fantasy player)" k="matchTopPlayer" opts={FANTASY_PLAYERS}/>
                  <IField label="💀 Match Bottom Scorer (fantasy player)" k="matchBottomPlayer" opts={FANTASY_PLAYERS}/>
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
  const [loading,setLoading]=useState(true);

  const userSel=user?(allSelections[user.username]||{}):{};

  // Load all data on mount
  useEffect(()=>{
    if(!user){setLoading(false);return;}
    Promise.all([
      supa.query("matches",{select:"*",order:"id.asc"}),
      supa.query("results",{select:"*"}),
      supa.query("selections",{select:"*"}),
    ]).then(([matchData,resultData,selData])=>{
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

  const navItems=[
    {id:"matches",label:"🏏 Matches"},
    {id:"leaderboard",label:"🏆 Leaderboard"},
    {id:"stats",label:"📊 My Stats"},
    ...(user?.isAdmin?[{id:"admin",label:"⚙️ Admin"}]:[]),
  ];

  if(!user) return (
    <div style={S.app}><div style={S.noise}/><div style={S.content}><LoginPage onLogin={login}/></div></div>
  );

  if(loading) return (
    <div style={{...S.app,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}>
        <div style={{...S.logo,fontSize:"28px",display:"block",marginBottom:"16px"}}>🏏 IPL FANTASY 2026</div>
        <div style={{color:"#666",fontSize:"14px"}}>Loading match data...</div>
      </div>
    </div>
  );

  return (
    <div style={S.app}>
      <style>{`@keyframes shimmer{0%{background-position:0% center}100%{background-position:200% center}}select option{background:#1a1a2e;color:#e8e0d0;}::-webkit-scrollbar{width:6px;}::-webkit-scrollbar-track{background:#0a0a0f;}::-webkit-scrollbar-thumb{background:#333;border-radius:3px;}*{box-sizing:border-box;}input,select{font-size:16px!important;}`}</style>
      <div style={S.noise}/>
      <div style={S.content}>
        <header style={S.header}>
          <div style={{...S.logo,fontSize:"17px"}}>🏏 IPL FANTASY 2026</div>
          <button onClick={()=>setMenuOpen(o=>!o)} style={{background:"transparent",border:"1px solid rgba(255,165,0,0.3)",borderRadius:"6px",padding:"6px 12px",cursor:"pointer",color:"#FFD700",fontSize:"18px",lineHeight:1}}>
            {menuOpen?"✕":"☰"}
          </button>
        </header>

        {menuOpen&&(
          <div style={{position:"fixed",top:"49px",left:0,right:0,bottom:0,background:"rgba(0,0,0,0.97)",zIndex:99,display:"flex",flexDirection:"column",padding:"16px",overflowY:"auto"}}>
            <div style={{marginBottom:"8px",padding:"12px 16px",borderRadius:"8px",background:"rgba(255,165,0,0.08)",border:"1px solid rgba(255,165,0,0.15)"}}>
              <div style={{fontSize:"12px",color:"#888"}}>Logged in as</div>
              <div style={{fontSize:"16px",color:"#FFD700",fontWeight:"bold"}}>{user.displayName}</div>
            </div>
            {navItems.map(n=>(
              <button key={n.id} style={{...S.navBtn(page===n.id&&!selectedMatch),textAlign:"left",padding:"14px 16px",fontSize:"15px",borderRadius:"8px",marginBottom:"4px",borderBottom:"none",borderLeft:page===n.id&&!selectedMatch?"3px solid #FFD700":"3px solid transparent"}}
                onClick={()=>{setPage(n.id);setSelectedMatch(null);setMenuOpen(false);}}>
                {n.label}
              </button>
            ))}
            <div style={{marginTop:"auto",paddingTop:"16px"}}>
              <button style={{...S.logoutBtn,width:"100%",padding:"13px",fontSize:"14px",textAlign:"center"}} onClick={logout}>Sign Out</button>
            </div>
          </div>
        )}

        {selectedMatch
          ?<SelectionForm match={selectedMatch} user={user} onBack={()=>setSelectedMatch(null)} results={results} userSel={userSel} onSave={onSave}/>
          :page==="matches"?<MatchesPage user={user} onSelectMatch={m=>{setSelectedMatch(m);}} matches={matches} results={results} userSel={userSel}/>
          :page==="leaderboard"?<LeaderboardPage matches={matches} results={results} allSelections={allSelections}/>
          :page==="stats"?<MyStatsPage user={user} matches={matches} results={results} userSel={userSel}/>
          :page==="admin"&&user.isAdmin?<AdminPage matches={matches} results={results} onSaveResult={onSaveResult} allSelections={allSelections}/>
          :null
        }
      </div>
    </div>
  );
}

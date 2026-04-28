import { useState, useEffect, useCallback, Fragment } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

import { createClient } from '@supabase/supabase-js';

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
const SUPABASE_URL = "https://olewyqrxgwjjjspeonon.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXd5cXJ4Z3dqampzcGVvbm9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MzM3NjMsImV4cCI6MjA5MDMwOTc2M30.mbY5GR8eZu7BH1UD0Yq2B_l5dr4bPB-RkYXa-vgRwYI";
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── SUPABASE CLIENT (Legacy Wrapper) ─────────────────────────────────────────
const supa = {
  async query(table, opts = {}) {
    let q = supabase.from(table).select(opts.select || '*');
    if (opts.eq) {
      Object.entries(opts.eq).forEach(([k,v]) => { q = q.eq(k, v); });
    }
    if (opts.order) {
      const [col, dir] = opts.order.split('.');
      q = q.order(col, { ascending: dir === 'asc' });
    }
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  },
  async upsert(table, data, onConflict) {
    const { data: res, error } = await supabase.from(table).upsert(data, { onConflict }).select();
    if (error) throw error;
    return res || [];
  },
  async update(table, data, eq) {
    let q = supabase.from(table).update(data);
    if (eq) {
      Object.entries(eq).forEach(([k,v]) => { q = q.eq(k, v); });
    }
    const { data: res, error } = await q.select();
    if (error) throw error;
    return res || [];
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
  DC:  ["Axar Patel","KL Rahul","Prithvi Shaw","David Miller","Tristan Stubbs","Abhishek Porel","Karun Nair","Sameer Rizvi","Ashutosh Sharma","Mitchell Starc","T. Natarajan","Mukesh Kumar","Dushmantha Chameera","Lungi Ngidi","Kyle Jamieson","Nitish Rana","Kuldeep Yadav","Ajay Mandal","Tripurana Vijay","Madhav Tiwari","Pathum Nissanka","Sahil Parakh","Vipraj Nigam","Ben Duckett","Auqib Nabi"],
  GT:  ["Shubman Gill","Jos Buttler","Sai Sudharsan","Shahrukh Khan","Anuj Rawat","Kumar Kushagra","Nishant Sindhu","Rahul Tewatia","Washington Sundar","Rashid Khan","Jason Holder","Kagiso Rabada","Mohammed Siraj","Prasidh Krishna","Ishant Sharma","Sai Kishore","Jayant Yadav","Manav Suthar","Arshad Khan","Gurnoor Singh Brar","Kulwant Khejroliya","Glenn Phillips","Tom Banton","Luke Wood","Ashok Sharma"],
  KKR: ["Ajinkya Rahane","Cameron Green","Rinku Singh","Sunil Narine","Varun Chakravarthy","Navdeep Saini","Saurabh Dubey","Blessing Muzarabani","Angkrish Raghuvanshi","Vaibhav Arora","Matheesha Pathirana","Umran Malik","Manish Pandey","Rovman Powell","Finn Allen","Rachin Ravindra","Daksh Kamra","Tim Seifert","Kartik Tyagi","Prashant Solanki","Anukul Roy","Rahul Tripathi","Ramandeep Singh","Sarthak Ranjan","Tejasvi Singh"],
  LSG: ["Rishabh Pant","Nicholas Pooran","Ayush Badoni","Mohammed Shami","Avesh Khan","Mohsin Khan","Arshin Kulkarni","Shahbaz Ahmed","Aiden Markram","Abdul Samad","Wanindu Hasaranga","Himmat Singh","Akshat Raghuwanshi","Mitchell Marsh","Arjun Tendulkar","Matthew Breetzke","Josh Inglis","Mukul Choudhary","Akash Maharaj Singh","Anrich Nortje","Prince Yadav","Digvesh Singh Rathi","Mayank Yadav","Naman Tiwari","Manimaran Siddharth"],
  MI:  ["Hardik Pandya","Rohit Sharma","Suryakumar Yadav","Tilak Varma","Quinton de Kock","Ryan Rickelton","Naman Dhir","Danish Malewar","Sherfane Rutherford","Will Jacks","Mitchell Santner","Shardul Thakur","Raj Bawa","Corbin Bosch","Jasprit Bumrah","Trent Boult","Deepak Chahar","Mayank Markande","Atharva Ankolekar","AM Ghazanfar","Mayank Rawat","Mohammad Izhar","Raghu Sharma","Robin Minz","Ashwani Kumar"],
  PBKS:["Marcus Stoinis","Shreyas Iyer","Prabhsimran Singh","Arshdeep Singh","Harpreet Brar","Shashank Singh","Yuzvendra Chahal","Marco Jansen","Priyansh Arya","Pyla Avinash","Nehal Wadhera","Harnoor Singh","Mitchell Owen","Musheer Khan","Suryansh Shedge","Cooper Connolly","Azmatullah Omarzai","Praveen Dubey","Vishnu Vinod","Lockie Ferguson","Xavier Bartlett","Ben Dwarshuis","Vishal Nishad","Vijaykumar Vyshak","Yash Thakur"],
  RCB: ["Rajat Patidar","Virat Kohli","Devdutt Padikkal","Tim David","Phil Salt","Jitesh Sharma","Jordan Cox","Jacob Bethell","Venkatesh Iyer","Krunal Pandya","Romario Shepherd","Swapnil Singh","Bhuvneshwar Kumar","Rasikh Salam","Suyash Sharma","Vicky Ostwal","Jacob Duffy","Nuwan Thushara","Abhinandan Singh","Mangesh Yadav","Kanishk Chouhan","Vihaan Malhotra","Satvik Deswal","Josh Hazlewood","Yash Dayal"],
  RR:  ["Riyan Parag","Yashasvi Jaiswal","Dhruv Jurel","Shimron Hetmyer","Shubham Dubey","Ravindra Jadeja","Dasun Shanaka","Kuldeep Sen","Nandre Burger","Donovan Ferreira","Aman Rao Perala","Vaibhav Suryavanshi","Ravi Singh","Lhuan-dre Pretorius","Jofra Archer","Tushar Deshpande","Kwena Maphaka","Sandeep Sharma","Vignesh Puthur","Brijesh Sharma","Sushant Mishra","Yash Raj Punja","Adam Milne","Ravi Bishnoi","Yudhvir Singh Charak"],
  SRH: ["Liam Livingstone","Harshal Patel","Pat Cummins","Ishan Kishan","Travis Head","Heinrich Klaasen","Abhishek Sharma","Nitish Kumar Reddy","Jaydev Unadkat","David Payne","Aniket Verma","Smaran Ravichandran","Kamindu Mendis","Harsh Dubey","Shivang Kumar","Salil Arora","Brydon Carse","Eshan Malinga","Zeeshan Ansari","Sakib Hussain","Onkar Tarmale","Amit Kumar","Praful Hinge","Shivam Mavi","Krains Fuletra"],
};

const WICKET_RANGES = ["<5","5-8","9-11","12-13","14-15","16-17","18-20"];
const DOUBLE_CATEGORIES = ["Winning Team","Best Batsman","Best Bowler","Powerplay Winner","Dot-Ball Bowler","Total Wickets"];

// ─── MATCH DEFAULT SELECTION HELPERS ─────────────────────────────────────────

// For LIVE/ADMIN screens: show the currently ongoing or most recently locked match today.
// Priority: 1) Ongoing today (locked within last 5h)  2) First locked today  3) Most recent locked overall
function getDefaultLiveMatchId(matches, now) {
  const todayStr = now.toISOString().slice(0, 10);
  // Matches locked today
  const lockedToday = matches.filter(m => isMatchLocked(m, now) && m.date === todayStr);
  if (lockedToday.length > 0) {
    // Prefer match that locked most recently (ongoing) — sorted by lock_time desc
    const sorted = [...lockedToday].sort((a, b) => new Date(b.lock_time) - new Date(a.lock_time));
    return String(sorted[0].id);
  }
  // Fallback: most recently locked match overall
  const allLocked = matches.filter(m => isMatchLocked(m, now));
  return allLocked.length > 0 ? String(allLocked[allLocked.length - 1].id) : "";
}

// For PICKS screen: show the soonest open (not yet locked) match today,
// or the soonest open match overall if nothing is open today.
function getDefaultPicksMatchId(matches, now) {
  const todayStr = now.toISOString().slice(0, 10);
  // Open matches today, sorted by lock_time ascending (soonest first)
  const openToday = matches
    .filter(m => !isMatchLocked(m, now) && m.date === todayStr)
    .sort((a, b) => new Date(a.lock_time) - new Date(b.lock_time));
  if (openToday.length > 0) return String(openToday[0].id);
  // Fallback: soonest open match overall
  const openAll = matches
    .filter(m => !isMatchLocked(m, now))
    .sort((a, b) => new Date(a.lock_time) - new Date(b.lock_time));
  return openAll.length > 0 ? String(openAll[0].id) : "";
}

// All 2026 roster names in a flat Set for instant validation
const ALL_ROSTER_NAMES = new Set(Object.values(PLAYERS).flat());

// Returns a sarcastic streak badge based on last N winning-team picks
function getStreakBadge(results, userSelections, matches, now) {
  const locked = matches.filter(m => isMatchLocked(m, now) && results[m.id]);
  const recent = locked.slice(-5);
  if (recent.length === 0) return { emoji: "🧊", label: "Warming Up" };
  const streakArr = recent.map(m => {
    const sel = userSelections[m.id];
    return sel && results[m.id] && sel.winningTeam === results[m.id].winningTeam;
  });
  // Check consecutive streaks from the end
  let hotStreak = 0, coldStreak = 0;
  for (let i = streakArr.length - 1; i >= 0; i--) {
    if (streakArr[i]) { hotStreak++; if (coldStreak > 0) break; }
    else break;
  }
  for (let i = streakArr.length - 1; i >= 0; i--) {
    if (!streakArr[i]) { coldStreak++; if (hotStreak > 0) break; }
    else break;
  }
  const correct = streakArr.filter(Boolean).length;
  if (recent.length >= 5 && correct === 5) return { emoji: "🎯", label: "Sniper" };
  if (recent.length >= 5 && correct === 0) return { emoji: "💀", label: "Throwing" };
  if (hotStreak >= 3) return { emoji: "🔥", label: "On Fire!" };
  if (coldStreak >= 3) return { emoji: "❄️", label: "Ice Cold" };
  // Alternating
  let alternating = true;
  for (let i = 1; i < streakArr.length; i++) { if (streakArr[i] === streakArr[i-1]) { alternating = false; break; } }
  if (recent.length >= 3 && alternating) return { emoji: "🎲", label: "Coin Flip" };
  if (recent.length <= 1) return { emoji: "🧊", label: "Warming Up" };
  return null;
}
const FANTASY_PLAYERS = ["Ani","Haren","Ganga","Jitendar","Mahesh","Nag","Naren","Navdeep","Omkar","Peddi","Praveen","Raghav","Ranga","Rohit","Sandeep","Santhosh","Soma","Sridhar K","Krishna","Naresh","Srikanth B","Prashanth","Sreeram","Santhosh Male","Ranjith"].sort();

// ─── TOLLYWOOD GAMIFICATION ENGINE ────────────────────────────────────────────
const TROPHIES = [
  { id:"baahubali", label:"Baahubali", desc:"Overall Rank #1. Nene Raju, Nene Mantri.", emoji:"👑", color:"#FFD700" },
  { id:"thaggedhele", label:"Thaggedhe Le!", desc:"4+ Match Win Streak. Unstoppable Pushpa.", emoji:"🪓", color:"#ef4444" },
  { id:"ironleg", label:"Iron Leg", desc:"4+ Match Loss Streak. Daridram thandavam aaduthundi!", emoji:"🦶", color:"#9ca3af" },
  { id:"akkadaspace", label:"Akkada Space Ledu", desc:"Picked a unique Horse that scored big.", emoji:"🧠", color:"#8b5cf6" },
  { id:"mindblock", label:"Mind Block", desc:"Highest single match score ever recorded.", emoji:"🤯", color:"#ec4899" },
  { id:"confusion", label:"Confusion Master", desc:"Coin flip win/loss streak. Naku em kanipistaledu.", emoji:"🎭", color:"#f97316" },
  { id:"bokkaboshnam", label:"Bokka Boshnam", desc:"Picked a duck batsman! Enno anukuntam...", emoji:"🦆", color:"#64748b" },
  { id:"relangimavayya", label:"Slow Poison", desc:"Zero risk picks. Emito, antha hayiga undi.", emoji:"🐢", color:"#10b981" },
  { id:"lastbench", label:"Last Bench", desc:"Dead last in Leaderboard. Naku eem telidu mastaru.", emoji:"🛡️", color:"#374151" },
  { id:"dookudu", label:"Dookudu", desc:"Moved up 3+ ranks at once. Evadu kodithe dimma...", emoji:"🤫", color:"#3b82f6" },
  { id:"flutebabu", label:"Sixer King", desc:"Picked a batsman hitting >8 sixes.", emoji:"🏏", color:"#f43f5e" },
  { id:"gabbar", label:"Wicket Veta", desc:"Picked a 4-wicket haul bowler. Naa kodaka...", emoji:"🎳", color:"#0ea5e9" }
];

function calcUserTrophies(username, matches, results, allSelections, playerScores, ranksMap={}) {
  const t = [];
  const add = (id, detail) => { if (!t.some(x => x.id === id)) t.push({ id, detail }); };

  // Board positions
  const myRank = ranksMap[username]?.rank;
  if (myRank === 1) add("baahubali", "Currently Top of the Leaderboard!");
  if (myRank && myRank === FANTASY_PLAYERS.length) add("lastbench", "Currently Dead Last... yikes.");

  let hot=0, cold=0, alt=0, lastRes=null;
  let highestMatchScore = 0;

  const sortedM = matches.filter(m=>results[m.id]).sort((a,b)=>new Date(a.date)-new Date(b.date));
  
  for (let i=0; i<sortedM.length; i++) {
    const m = sortedM[i];
    const r = results[m.id];
    const sel = allSelections[username]?.[m.id];
    if (!sel) continue;
    
    // Streaks
    const won = sel.winningTeam === r.winningTeam;
    if (won) { hot++; cold=0; } else { cold++; hot=0; }
    if (hot >= 4) add("thaggedhele", `Hit 4+ Win Streak by Match ${m.id}`);
    if (cold >= 4) add("ironleg", `Lost 4 picks in a row by Match ${m.id}`);
    
    if (lastRes !== null && won !== lastRes) alt++; else alt=0;
    if (alt >= 3) add("confusion", `Win/Loss Seesaw across 3 matches (M${m.id})`);
    lastRes = won;

    // Highest Single Match Score globally checking (simplified check against 300)
    const p = calcPoints(sel, r, playerScores[m.id]);
    if (p.total >= 280) add("mindblock", `Scored ${p.total} Pts in Match ${m.id}`); // Using 280 threshold as mind block

    // Bokka Boshnam (Duck)
    if (r.duckBatsmen?.includes(sel.duckBatsman)) add("bokkaboshnam", `Match ${m.id}: ${sel.duckBatsman} (Duck!)`);
    
    // Flute Babu / Gabbar
    const bBat = playerScores[m.id]?.[sel.bestBatsman];
    if (bBat && bBat.sixes > 8) add("flutebabu", `Match ${m.id}: ${sel.bestBatsman} (${bBat.sixes} Sixes!)`);
    
    const bBowl = playerScores[m.id]?.[sel.bestBowler];
    if (bBowl && bBowl.wickets >= 4) add("gabbar", `Match ${m.id}: ${sel.bestBowler} (${bBowl.wickets} Wickets!)`);

    // Akkada Space Ledu (Unique Horse)
    if (sel.winningHorse && (r.matchTopPlayers||[]).includes(sel.winningHorse)) {
      let pickCount = 0;
      Object.values(allSelections).forEach(userMap => {
        if (userMap[m.id]?.winningHorse === sel.winningHorse) pickCount++;
      });
      if (pickCount === 1) add("akkadaspace", `Match ${m.id}: ${sel.winningHorse}`);
    }
  }

  // Dookudu check: If rank change > 3 (Placeholder check mapping)
  if (ranksMap[username]?.change > 2) add("dookudu", `Jumped ${ranksMap[username].change} ranks at once`);
  if (t.length <= 1) add("relangimavayya", "Too Safe: Minimum risk taken."); // Defaults

  return t;
}

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

  bd.winningTeam = sel.winningTeam===r.winningTeam ? 50 + (r.runMargin ? Math.round(r.runMargin) : (r.wicketMargin||0)*5) : 0;
  bd.bestBatsman = getB(sel.bestBatsman) + ((r.topScorers||[]).includes(sel.bestBatsman) ? 50 : 0);
  bd.bestBowler = getBW(sel.bestBowler) + ((r.bestBowlers||[]).includes(sel.bestBowler) ? 50 : 0);
  bd.powerplayWinner = sel.powerplayWinner===r.powerplayWinner ? (r.powerplayScore||0)+(r.powerplayDiff||0) : 0;
  bd.dotBallBowler = getDB(sel.dotBallBowler) + ((r.dotBallLeaders||[]).includes(sel.dotBallBowler) ? 50 : 0);
  bd.totalWickets = sel.totalWickets===r.wicketsRange ? 100 : 0;
  bd.duckBatsman = (r.duckBatsmen||[]).includes(sel.duckBatsman) ? 100 : 0;
  bd.winningHorse = sel.winningHorse&&(r.matchTopPlayers||[]).length>0&&(r.matchTopPlayers||[]).includes(sel.winningHorse) ? 100 : 0;
  bd.losingHorse = sel.losingHorse&&(r.matchBottomPlayers||[]).length>0&&(r.matchBottomPlayers||[]).includes(sel.losingHorse) ? 100 : 0;
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
  btn:(v="primary")=>({padding:"11px 24px",borderRadius:"10px",cursor:"pointer",fontSize:"14px",fontWeight:700,fontFamily:"'Inter',sans-serif",background:v==="primary"?"linear-gradient(135deg,#FF8C00,#FFD700)":v==="danger"?"rgba(239,68,68,0.15)":"rgba(255,255,255,0.06)",color:v==="primary"?"#000":v==="danger"?"#f87171":"#e2e8f0",transition:"all 0.2s ease",border:v==="ghost"?"1px solid rgba(255,255,255,0.1)":"none"}),
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
      const email = `${username.toLowerCase().trim()}@iplfantasy.app`;
      const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
      if (authErr) { 
        setError(authErr.message === "Invalid login credentials" ? "Incorrect password or user not found" : authErr.message); 
        setLoading(false); 
        return; 
      }
      const meta = data.user.user_metadata || {};
      onLogin({
        username: meta.username || username.toLowerCase().trim(),
        displayName: meta.display_name || username,
        isAdmin: meta.is_admin || false
      });
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
function isMatchLocked(match, now) {
  if (match.is_locked === true) return true;
  if (match.is_locked === false) return false;
  return now >= new Date(match.lock_time);
}

function getStatus(match, now, results, userSel) {
  if (results[match.id]) return "completed";
  if (isMatchLocked(match, now)) return "locked";
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

// ─── COUNTDOWN HELPER ────────────────────────────────────────────────────────
function useNowTick(intervalMs=1000) {
  const [now,setNow]=useState(new Date());
  useEffect(()=>{
    const t=setInterval(()=>setNow(new Date()),intervalMs);
    return ()=>clearInterval(t);
  },[intervalMs]);
  return now;
}

function Countdown({lockTime}) {
  const now=useNowTick(1000);
  const diff=new Date(lockTime)-now;
  if(diff<=0) return <span style={{color:"#f87171",fontSize:"11px",fontWeight:700}}>🔒 Locked</span>;
  const h=Math.floor(diff/3600000);
  const m=Math.floor((diff%3600000)/60000);
  const s=Math.floor((diff%60000)/1000);
  const urgent=diff<15*60*1000;
  return (
    <span style={{fontSize:"11px",fontWeight:700,color:urgent?"#f87171":"#fbbf24",background:urgent?"rgba(239,68,68,0.1)":"rgba(251,191,36,0.1)",padding:"3px 8px",borderRadius:"6px",border:`1px solid ${urgent?"rgba(239,68,68,0.25)":"rgba(251,191,36,0.2)"}`}}>
      {urgent?"⚠️ ":"⏱ "}{h>0?`${h}h `:""}{ `${m}m ${String(s).padStart(2,"0")}s`}
    </span>
  );
}

// ─── MATCHES LIST ─────────────────────────────────────────────────────────────
function MatchesPage({user,onSelectMatch,matches,results,userSel}) {
  const now=useNowTick(30000); // refresh every 30s for status re-classification
  const [filter,setFilter]=useState("open");
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
          {["open","locked","completed","all"].map(f=>(
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
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px",flexWrap:"wrap",gap:"6px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                <span style={{fontSize:"11px",color:"#555",fontWeight:"bold",letterSpacing:"1px"}}>M{match.id}</span>
                <span style={{fontSize:"12px",color:"#555"}}>{match.date} · {match.time_label}</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                {(st==="open"||st==="submitted") && match.lock_time && <Countdown lockTime={match.lock_time}/>}
                <span style={S.statusPill(st)}>{st==="submitted"?"✓ Submitted":st==="completed"?"✓ Done":st==="locked"?"🔒 Locked":"🟢 Open"}</span>
              </div>
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
                  {(xi||[]).map((p,i)=>{
                    const isValid = ALL_ROSTER_NAMES.has(p);
                    return (
                      <div key={i} style={{fontSize:"11px",color:isValid?"#94a3b8":"#f87171",padding:"3px 0",borderBottom:"1px solid rgba(255,255,255,0.03)",display:"flex",alignItems:"center",gap:"4px"}}>
                        {i+1}. {p}
                        {!isValid && <span title="This player may not be on the 2026 roster" style={{fontSize:"9px",background:"rgba(239,68,68,0.15)",color:"#f87171",padding:"1px 4px",borderRadius:"3px",fontWeight:600}}>⚠️ Unverified</span>}
                      </div>
                    );
                  })}
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
  const locked=isMatchLocked(match, now);
  const hasResult=!!results[match.id];
  const [sel,setSel]=useState({...EMPTY_SEL,...(userSel[match.id]||{})});
  const [saved,setSaved]=useState(!!userSel[match.id]);
  const [msg,setMsg]=useState("");
  const [saving,setSaving]=useState(false);
  const allPlayers=[...new Set([...(PLAYERS[match.home]||[]),...(PLAYERS[match.away]||[])])].sort();
  const set=(k,v)=>setSel(s=>({...s,[k]:v}));
  const st=getStatus(match,now,results,userSel);

  const handleSave=async()=>{
    // Always re-check lock status at save time — not the stale render-time value.
    // This catches the case where the page was open before lock but the match has since started.
    // Respects admin is_locked=false override via isMatchLocked().
    if(isMatchLocked(match, new Date())) {
      setMsg("⛔ Match is locked — selections cannot be saved after match start time.");
      setTimeout(()=>setMsg(""),5000);
      return;
    }
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
        <>
          {/* Picks summary review */}
          {Object.values(sel).some(v=>v) && (
            <div style={{...S.card,marginBottom:"16px",background:"rgba(255,140,0,0.04)",border:"1px solid rgba(255,140,0,0.15)"}}>
              <div style={{fontSize:"11px",color:"#FF8C00",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"10px"}}>📋 Your Picks Summary</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:"8px"}}>
                {[
                  {label:"Winning Team",val:sel.winningTeam},
                  {label:"Powerplay Winner",val:sel.powerplayWinner},
                  {label:"Best Batsman",val:sel.bestBatsman},
                  {label:"Best Bowler",val:sel.bestBowler},
                  {label:"Dot-Ball Bowler",val:sel.dotBallBowler},
                  {label:"Total Wickets",val:sel.totalWickets},
                  {label:"Duck Batsman",val:sel.duckBatsman},
                  {label:"Double Category",val:sel.doubleCategory},
                  {label:"🏆 Winning Horse",val:sel.winningHorse},
                  {label:"💀 Losing Horse",val:sel.losingHorse},
                ].map(({label,val})=>(
                  <div key={label} style={{background:val?"rgba(255,255,255,0.04)":"rgba(239,68,68,0.06)",border:`1px solid ${val?"rgba(255,255,255,0.08)":"rgba(239,68,68,0.15)"}`,borderRadius:"8px",padding:"8px 10px"}}>
                    <div style={{fontSize:"9px",color:"#64748b",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"4px"}}>{label}</div>
                    <div style={{fontSize:"12px",fontWeight:600,color:val?"#e2e8f0":"#475569"}}>{val||"— Not picked"}</div>
                  </div>
                ))}
              </div>
              {Object.values(sel).filter(v=>v).length < 10 && (
                <div style={{fontSize:"11px",color:"#fbbf24",marginTop:"10px"}}>⚠️ {10-Object.values(sel).filter(v=>v).length} pick(s) still empty</div>
              )}
            </div>
          )}
          <div style={{display:"flex",gap:"12px",alignItems:"center",flexWrap:"wrap"}}>
            <button style={S.btn("primary")} onClick={handleSave} disabled={saving}>
              {saving?"Saving...":(saved?"Update Selections":"Save Selections")}
            </button>
            {msg&&<span style={{color:msg.startsWith("⛔")?"#f87171":"#00c864",fontSize:"14px"}}>{msg}</span>}
          </div>
        </>
      )}
    </div>
  );
}

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
function LeaderboardContent({matches,results,allSelections,playerScores}) {
  const now = new Date();
  const activeMatches = matches.filter(m => isMatchLocked(m, now));
  const scores=FANTASY_PLAYERS.map(name=>{
    const uname=name.toLowerCase().replace(/\s/g,"_");
    const uSel=allSelections[uname]||{};
    let inAppTotal=0,matchCount=0;
    activeMatches.forEach(m=>{if(uSel[m.id]){inAppTotal+=calcPoints(uSel[m.id],results[m.id],playerScores[m.id]).total;matchCount++;}});
    const total = (PRE_APP_SCORES[name]||0) + inAppTotal;
    const badge = getStreakBadge(results, uSel, matches, now);
    return {name,total,matchCount,badge};
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
                {s.badge && <div style={{fontSize:"10px",marginBottom:"4px"}}><span style={{background:"rgba(255,255,255,0.08)",padding:"2px 6px",borderRadius:"8px",fontSize:"10px"}}>{s.badge.emoji} {s.badge.label}</span></div>}
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
                  <span style={{fontSize:"13px",fontWeight:600,color:"#e2e8f0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:"6px"}}>{s.name}{s.badge && <span style={{fontSize:"10px",background:"rgba(255,255,255,0.06)",padding:"1px 5px",borderRadius:"6px",flexShrink:0}}>{s.badge.emoji} {s.badge.label}</span>}</span>
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
function MyStatsContent({user,matches,results,userSel,playerScores,allSelections}) {
  const now = new Date();
  const activeMatches = matches.filter(m => isMatchLocked(m, now) && userSel[m.id]);
  const inAppTotal = activeMatches.reduce((sum,m)=>sum+calcPoints(userSel[m.id],results[m.id],playerScores[m.id]).total,0);
  const preAppScore = PRE_APP_SCORES[user.displayName] || 0;
  const totalPoints = preAppScore + inAppTotal;
  const statCards=[
    {icon:"🎯",label:"Total Points",val:totalPoints,color:"#fbbf24"},
    {icon:"🏏",label:"Matches",val:activeMatches.length,color:"#60a5fa"},
    {icon:"📈",label:"Avg/Match",val:activeMatches.length?Math.round(inAppTotal/activeMatches.length):0,color:"#4ade80"},
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
      {/* Pre-app score card */}
      {preAppScore > 0 && (
        <div style={{...S.card,marginBottom:"12px",background:"rgba(167,139,250,0.06)",border:"1px solid rgba(167,139,250,0.2)",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"8px"}}>
          <div>
            <div style={{fontSize:"12px",fontWeight:700,color:"#a78bfa",marginBottom:"2px"}}>🗂️ M1–M16 Pre-App Total</div>
            <div style={{fontSize:"11px",color:"#64748b"}}>Scores tracked before the app launched (Matches 1–16)</div>
          </div>
          <div style={{fontSize:"26px",fontWeight:900,color:"#a78bfa"}}>{preAppScore.toLocaleString()} pts</div>
        </div>
      )}
      {/* Category accuracy breakdown */}
      {activeMatches.length > 0 && (() => {
        const cats = [
          {label:"Winning Team",    key:"winningTeam",    resKey:(r)=>r?.winningTeam},
          {label:"Best Batsman",    key:"bestBatsman",    resKey:(r)=>(r?.topScorers||[])[0]},
          {label:"Best Bowler",     key:"bestBowler",     resKey:(r)=>(r?.bestBowlers||[])[0]},
          {label:"PP Winner",       key:"powerplayWinner",resKey:(r)=>r?.powerplayWinner},
          {label:"Dot-Ball Bowler", key:"dotBallBowler",  resKey:(r)=>(r?.dotBallLeaders||[])[0]},
          {label:"Total Wickets",   key:"totalWickets",   resKey:(r)=>r?.wicketsRange},
          {label:"Duck Batsman",    key:"duckBatsman",    resKey:(r)=>(r?.duckBatsmen||[])[0]},
          {label:"Winning Horse",   key:"winningHorse",   resKey:(r)=>(r?.matchTopPlayers||[]).join(", ")},
          {label:"Losing Horse",    key:"losingHorse",    resKey:(r)=>(r?.matchBottomPlayers||[]).join(", ")},
        ];
        // Only count matches that have results
        const scoredMatches = activeMatches.filter(m=>results[m.id]);
        if(scoredMatches.length===0) return null;
        return (
          <div style={{...S.card,marginBottom:"20px"}}>
            <div style={S.sectionTitle}>🎯 Category Accuracy</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:"8px"}}>
              {cats.map(({label,key,resKey})=>{
                let correct=0,total=0;
                scoredMatches.forEach(m=>{
                  const res=results[m.id];
                  const pick=userSel[m.id]?.[key];
                  if(!pick) return;
                  total++;
                  const answer=resKey(res);
                  const hit=Array.isArray(answer)?answer.includes(pick):pick===answer;
                  if(hit) correct++;
                });
                const pct=total>0?Math.round((correct/total)*100):null;
                const color=pct===null?"#475569":pct>=60?"#4ade80":pct>=35?"#fbbf24":"#f87171";
                return (
                  <div key={key} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"10px",padding:"10px 12px"}}>
                    <div style={{fontSize:"10px",color:"#64748b",marginBottom:"6px",textTransform:"uppercase",letterSpacing:"0.5px"}}>{label}</div>
                    <div style={{fontSize:"22px",fontWeight:800,color}}>{pct!==null?`${pct}%`:"—"}</div>
                    <div style={{fontSize:"10px",color:"#475569",marginTop:"2px"}}>{correct}/{total} correct</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {activeMatches.length === 0
        ?<div style={{...S.card,textAlign:"center",color:"#475569",padding:"48px"}}>No in-app matches yet. Make your selections!</div>
        :activeMatches.map(m=>{
          const {breakdown,total}=calcPoints(userSel[m.id],results[m.id],playerScores[m.id]);
          let myRank = null;
          if (allSelections) {
            const scoresForMatch = FANTASY_PLAYERS.map(p => {
              const uSel = allSelections[p.toLowerCase().replace(/\s/g,"_")] || {};
              return { name: p, score: calcPoints(uSel[m.id], results[m.id], playerScores[m.id]).total };
            }).sort((a,b)=>b.score-a.score);
            const myRankIndex = scoresForMatch.findIndex(x => x.name === user.displayName);
            if (myRankIndex !== -1) myRank = myRankIndex + 1;
          }
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
                <div style={{display:"flex",alignItems:"center",gap:"16px"}}>
                  {myRank && <div style={{background:"rgba(255,255,255,0.05)",padding:"4px 8px",borderRadius:"6px",fontSize:"12px",color:"#cbd5e1",fontWeight:700}}>🏅 Rank #{myRank}</div>}
                  <div style={{fontSize:"22px",fontWeight:900,color:"#fbbf24",letterSpacing:"-0.5px"}}>{total} pts</div>
                </div>
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
// Pre-app scores: totals for M1–M16 before the app was launched
const PRE_APP_SCORES = {
  "Krishna":       4806,
  "Naresh":        4584,
  "Navdeep":       4327,
  "Mahesh":        4063,
  "Srikanth B":    4052,
  "Prashanth":     4013,
  "Sandeep":       3974,
  "Ganga":         3935,
  "Ani":           3909,
  "Peddi":         3668,
  "Ranga":         3651,
  "Ranjith":       3631,
  "Praveen":       3629,
  "Naren":         3552,
  "Omkar":         3494,
  "Soma":          3483,
  "Haren":         3452,
  "Raghav":        3440,
  "Rohit":         3280,
  "Sreeram":       3234,
  "Santhosh Male": 3164,
  "Sridhar K":     3054,
  "Santhosh":      2934,
  "Nag":           2931,
  "Jitendar":      2900,
};

// Pre-app winnings: totals for M1–M16 before the app was launched
const PRE_APP_WINNINGS = {
  "Krishna":       61,
  "Mahesh":        50,
  "Naren":         50,
  "Naresh":        49,
  "Soma":          37,
  "Prashanth":     37,
  "Ranjith":       37,
  "Haren":         25,
  "Navdeep":       25,
  "Raghav":        25,
  "Santhosh":      25,
  "Ganga":         24,
  "Ani":           12,
  "Nag":           12,
  "Omkar":         12,
  "Jitendar":      0,
  "Peddi":         0,
  "Praveen":       0,
  "Ranga":         0,
  "Rohit":         0,
  "Sandeep":       0,
  "Sridhar K":     0,
  "Srikanth B":    0,
  "Sreeram":       0,
  "Santhosh Male": 0,
};

function ConsolidatedScoreContent({matches, results, allSelections, playerScores}) {
  const now = new Date();
  // Only show M17+ — M01-M16 are pre-app and already rolled into the M16* column
  const activeMatches = matches.filter(m => isMatchLocked(m, now) && m.id > 16);

  // Sort state: { col: "player"|"total"|matchId, dir: "asc"|"desc" }
  const [sort, setSort] = useState({ col: "total", dir: "desc" });

  const toggleSort = (col) => {
    setSort(prev => prev.col === col ? { col, dir: prev.dir === "desc" ? "asc" : "desc" } : { col, dir: col === "player" ? "asc" : "desc" });
  };

  const sortIcon = (col) => sort.col === col ? (sort.dir === "desc" ? " ▼" : " ▲") : " ↕";

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
    const preApp = PRE_APP_SCORES[p] || 0;
    const inApp = activeMatches.reduce((sum, m) => sum + (ptsGrid[p][m.id]||0), 0);
    totalPts[p] = preApp + inApp;
  });

  const rankGrid = {};
  const winningsGrid = {};
  const totalWinnings = {};
  FANTASY_PLAYERS.forEach(p => { rankGrid[p] = {}; winningsGrid[p] = {}; totalWinnings[p] = PRE_APP_WINNINGS[p] || 0; });

  activeMatches.forEach(m => {
    const mScores = FANTASY_PLAYERS.map(p => ({ player: p, pts: ptsGrid[p][m.id] }));
    mScores.sort((a,b) => b.pts - a.pts);

    let currentRank = 1;
    mScores.forEach((s, idx) => {
      if (idx > 0 && s.pts < mScores[idx-1].pts) { currentRank = idx + 1; }
      rankGrid[s.player][m.id] = currentRank;
    });

    const firstPlacePts = mScores[0].pts;
    if (firstPlacePts > 0) {
      const firstGroup = mScores.filter(s => s.pts === firstPlacePts);
      let secondGroup = [];
      if (firstGroup.length === 1 && mScores.length > 1) {
        const secondPlacePts = mScores[1].pts;
        if (secondPlacePts > 0) secondGroup = mScores.filter(s => s.pts === secondPlacePts);
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

  // Sorted player list used by all three tables
  const sortedPlayers = [...FANTASY_PLAYERS].sort((a, b) => {
    let va, vb;
    if (sort.col === "player")       { va = a.toLowerCase(); vb = b.toLowerCase(); }
    else if (sort.col === "total")   { va = totalPts[a]; vb = totalPts[b]; }
    else if (sort.col === "totalW")  { va = totalWinnings[a]; vb = totalWinnings[b]; }
    else { va = ptsGrid[a][sort.col]||0; vb = ptsGrid[b][sort.col]||0; }
    if (va < vb) return sort.dir === "asc" ? -1 : 1;
    if (va > vb) return sort.dir === "asc" ? 1 : -1;
    return 0;
  });

  const thStyle = (col) => ({
    padding:"10px 8px", fontWeight:600, textAlign:"right", cursor:"pointer",
    color: sort.col === col ? "#fbbf24" : "#64748b",
    whiteSpace:"nowrap", minWidth:"45px", userSelect:"none",
    background: sort.col === col ? "rgba(251,191,36,0.05)" : "transparent",
  });
  const thStyleL = (col) => ({
    padding:"10px", fontWeight:600, textAlign:"left", cursor:"pointer",
    color: sort.col === col ? "#fbbf24" : "#888",
    position:"sticky", left:0, background:"#0d1117", zIndex:2, userSelect:"none",
  });
  const thStyleTotal = (col, label) => ({
    padding:"10px", fontWeight:700, textAlign:"right", cursor:"pointer",
    color: sort.col === col ? "#facc15" : "#fbbf24",
    minWidth:"60px", borderRight:"1px solid rgba(255,255,255,0.05)",
    userSelect:"none", whiteSpace:"nowrap",
    background: sort.col === col ? "rgba(251,191,36,0.08)" : "transparent",
  });

  const renderTable = (title, rowFormatter, totals, totalCol, totalLabel, preAppValue) => (
    <div style={{marginBottom:"40px"}}>
      <h3 style={{color:"#e8e0d0",fontSize:"16px",marginBottom:"12px"}}>{title}</h3>
      <div style={{...S.card,padding:"0",overflowX:"auto"}}>
        <table style={{borderCollapse:"collapse",fontSize:"12px",whiteSpace:"nowrap",minWidth:"100%"}}>
          <thead>
            <tr style={{background:"rgba(255,255,255,0.03)",borderBottom:"1px solid rgba(255,255,255,0.1)"}}>
              <th style={thStyleL("player")} onClick={()=>toggleSort("player")}>Player{sortIcon("player")}</th>
              {totalLabel && <th style={thStyleTotal(totalCol)} onClick={()=>toggleSort(totalCol)}>{totalLabel}{sortIcon(totalCol)}</th>}
              <th style={{...thStyle("preapp"),color:"#a78bfa",fontWeight:700,minWidth:"55px"}} title="Pre-app total: Matches 1–16">M16*</th>
              {activeMatches.map(m => (
                <th key={m.id} style={thStyle(m.id)} onClick={()=>toggleSort(m.id)}>
                  M{String(m.id).padStart(2,'0')}{sortIcon(m.id)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((p,i) => (
              <tr key={p} style={{borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                <td style={{padding:"8px 10px",fontWeight:600,color:"#e2e8f0",position:"sticky",left:0,background:i%2===0?"#0d1117":"#0f1319",zIndex:1}}>{p}</td>
                {totalLabel && (
                  <td style={{padding:"8px 10px",fontWeight:800,color:"#fbbf24",textAlign:"right",borderRight:"1px solid rgba(255,255,255,0.05)"}}>
                    {totalLabel==="Total $" ? "$" : ""}{totals[p]}
                  </td>
                )}
                <td style={{padding:"8px",textAlign:"center",color:"#a78bfa",fontWeight:600,background:i%2===0?"rgba(167,139,250,0.04)":"rgba(167,139,250,0.06)"}}>
                  {preAppValue ? preAppValue(p) : "-"}
                </td>
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
      {totalLabel === "Total Pts" && <p style={{fontSize:"11px",color:"#475569",marginTop:"6px"}}>* M16 shows the cumulative score from Matches 1–16, tracked before the app launched.</p>}
    </div>
  );

  return (
    <div>
      {renderTable("Match-by-Match Points",   (p,mid) => ptsGrid[p][mid] || 0,                              totalPts,      "total",  "Total Pts", (p) => PRE_APP_SCORES[p] || 0)}
      {renderTable("Match-by-Match Winnings", (p,mid) => winningsGrid[p][mid] ? `$${winningsGrid[p][mid]}` : "-", totalWinnings, "totalW", "Total $",  (p) => PRE_APP_WINNINGS[p] > 0 ? `$${PRE_APP_WINNINGS[p]}` : "-")}
      {renderTable("Match-by-Match Ranks",    (p,mid) => rankGrid[p][mid] || "-",                            null,          null,     null,       null)}
    </div>
  );
}

// ─── HEAD-TO-HEAD COMPONENT ───────────────────────────────────────────────────
function HeadToHeadContent({matches, results, allSelections, playerScores}) {
  const [p1, setP1] = useState(FANTASY_PLAYERS[0]);
  const [p2, setP2] = useState(FANTASY_PLAYERS[1]);

  const now = new Date();
  const activeMatches = matches.filter(m => isMatchLocked(m, now) && m.id > 16);

  // Calculate scores
  const score1 = PRE_APP_SCORES[p1] || 0;
  const score2 = PRE_APP_SCORES[p2] || 0;
  
  let inApp1 = 0, inApp2 = 0;
  activeMatches.forEach(m => {
    const s1 = allSelections[p1.toLowerCase().replace(/\s/g,"_")]?.[m.id];
    const s2 = allSelections[p2.toLowerCase().replace(/\s/g,"_")]?.[m.id];
    if(s1) inApp1 += calcPoints(s1, results[m.id], playerScores[m.id]).total;
    if(s2) inApp2 += calcPoints(s2, results[m.id], playerScores[m.id]).total;
  });

  const total1 = score1 + inApp1;
  const total2 = score2 + inApp2;

  const getAccuracy = (pName, key, resKey) => {
    let corr=0, tot=0;
    activeMatches.forEach(m => {
       const res = results[m.id];
       if(!res) return;
       const pick = allSelections[pName.toLowerCase().replace(/\s/g,"_")]?.[m.id]?.[key];
       if(!pick) return;
       tot++;
       const answer = resKey(res);
       const hit = Array.isArray(answer) ? answer.includes(pick) : pick === answer;
       if(hit) corr++;
    });
    return tot > 0 ? Math.round((corr/tot)*100) : 0;
  };

  const cats = [
    {label:"Winning Team", key:"winningTeam", resKey:(r)=>r?.winningTeam},
    {label:"Best Batsman", key:"bestBatsman", resKey:(r)=>(r?.topScorers||[])[0]},
    {label:"Best Bowler", key:"bestBowler", resKey:(r)=>(r?.bestBowlers||[])[0]},
    {label:"PP Winner", key:"powerplayWinner", resKey:(r)=>r?.powerplayWinner},
    {label:"Wickets Range", key:"totalWickets", resKey:(r)=>r?.wicketsRange},
  ];

  return (
    <div>
      <div style={{display:"flex",gap:"20px",marginBottom:"30px",alignItems:"center",justifyContent:"center",flexWrap:"wrap"}}>
        <select value={p1} onChange={e=>setP1(e.target.value)} style={{...S.input,width:"160px",textAlign:"center",fontWeight:700,color:"#fff"}}>
          {FANTASY_PLAYERS.map(p=><option key={p} value={p}>{p}</option>)}
        </select>
        <span style={{fontSize:"24px",fontWeight:900,color:"#fbbf24",textShadow:"0 0 10px rgba(251,191,36,0.3)"}}>VS</span>
        <select value={p2} onChange={e=>setP2(e.target.value)} style={{...S.input,width:"160px",textAlign:"center",fontWeight:700,color:"#fff"}}>
          {FANTASY_PLAYERS.map(p=><option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 20px 1fr",gap:"16px",alignItems:"center",marginBottom:"30px",textAlign:"center"}}>
        <div style={{...S.card, borderColor: total1 >= total2 ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.05)", background: total1 >= total2 ? "rgba(74,222,128,0.05)" : S.card.background}}>
          <div style={{fontSize:"36px",fontWeight:900,color:total1 >= total2 ? "#4ade80" : "#f8fafc"}}>{total1.toLocaleString()}</div>
          <div style={{fontSize:"11px",color:"#64748b",textTransform:"uppercase",letterSpacing:"1px",marginTop:"4px"}}>Total Points</div>
        </div>
        <div></div>
        <div style={{...S.card, borderColor: total2 >= total1 ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.05)", background: total2 >= total1 ? "rgba(74,222,128,0.05)" : S.card.background}}>
          <div style={{fontSize:"36px",fontWeight:900,color:total2 >= total1 ? "#4ade80" : "#f8fafc"}}>{total2.toLocaleString()}</div>
          <div style={{fontSize:"11px",color:"#64748b",textTransform:"uppercase",letterSpacing:"1px",marginTop:"4px"}}>Total Points</div>
        </div>
      </div>

      <div style={S.card}>
        <div style={{fontSize:"14px",fontWeight:800,marginBottom:"20px",color:"#f8fafc",textAlign:"center",textTransform:"uppercase",letterSpacing:"1px"}}>🎯 Category Accuracy Breakdown</div>
        {cats.map(c => {
          const a1 = getAccuracy(p1, c.key, c.resKey);
          const a2 = getAccuracy(p2, c.key, c.resKey);
          return (
            <div key={c.key} style={{display:"grid",gridTemplateColumns:"1fr 140px 1fr",gap:"10px",textAlign:"center",padding:"12px 0",borderBottom:"1px solid rgba(255,255,255,0.05)",alignItems:"center"}}>
              <div style={{color: a1 >= a2 && a1 > 0 ? "#4ade80" : "#94a3b8", fontWeight:a1>=a2 && a1 > 0 ? 800 : 500, fontSize:"16px"}}>{a1}%</div>
              <div style={{fontSize:"11px",textTransform:"uppercase",letterSpacing:"0.5px",color:"#64748b",fontWeight:700}}>{c.label}</div>
              <div style={{color: a2 >= a1 && a2 > 0 ? "#4ade80" : "#94a3b8", fontWeight:a2>=a1 && a2 > 0 ? 800 : 500, fontSize:"16px"}}>{a2}%</div>
            </div>
          )
        })}
      </div>
    </div>
  );
}

// ─── TROPHY CABINET COMPONENT ──────────────────────────────────────────────────
function TrophyCabinetContent({matches, results, allSelections, playerScores}) {
  // Compute ranks to inject into calculator
  const pScores = {};
  FANTASY_PLAYERS.forEach(p => pScores[p] = PRE_APP_SCORES[p] || 0);
  matches.forEach(m => {
    if (!results[m.id]) return;
    FANTASY_PLAYERS.forEach(p => {
      const s = allSelections[p.toLowerCase().replace(/\s/g,"_")]?.[m.id];
      if (s) pScores[p] += calcPoints(s, results[m.id], playerScores[m.id]).total;
    });
  });
  const rankGrid = FANTASY_PLAYERS.map(p => ({ p, s: pScores[p] })).sort((a,b)=>b.s-a.s);
  const ranksMap = {};
  rankGrid.forEach((obj, idx) => {
    const uname = obj.p.toLowerCase().replace(/\s/g,"_");
    ranksMap[uname] = { rank: idx + 1, change: 0 }; // Placeholder rank change
  });

  const renderTrophyCard = (badgeDef, earnedObj) => {
    const isEarned = !!earnedObj;
    return (
    <div key={badgeDef.id} className="trophy-card" style={{
      ...S.card, 
      padding:"16px",
      display:"flex", 
      flexDirection:"column", 
      alignItems:"center", 
      textAlign:"center",
      background: isEarned ? `linear-gradient(135deg, ${badgeDef.color}20, transparent)` : "rgba(255,255,255,0.02)",
      borderColor: isEarned ? badgeDef.color : "rgba(255,255,255,0.05)",
      opacity: isEarned ? 1 : 0.4,
      filter: isEarned ? "none" : "grayscale(100%)",
      transform: isEarned ? "scale(1.02)" : "scale(1)",
      transition: "all 0.3s ease",
      position:"relative",
      cursor: isEarned && earnedObj.detail ? "help" : "default"
    }}>
      <div style={{fontSize:"40px", marginBottom:"12px", filter: isEarned ? `drop-shadow(0 0 10px ${badgeDef.color})` : "none"}}>{badgeDef.emoji}</div>
      <div style={{fontWeight:800, fontSize:"14px", color: isEarned ? badgeDef.color : "#64748b", marginBottom:"6px"}}>{badgeDef.label}</div>
      <div style={{fontSize:"11px", color:"#94a3b8", lineHeight:"1.4"}}>{badgeDef.desc}</div>
      {!isEarned && <div style={{fontSize:"9px", fontWeight:"bold", color:"#ef4444", marginTop:"10px", textTransform:"uppercase", letterSpacing:"1px"}}>🔒 Locked</div>}
      
      {isEarned && earnedObj.detail && (
        <div className="trophy-tooltip" style={{
          position: "absolute",
          bottom: "105%",
          left: "50%",
          transform: "translateX(-50%) translateY(10px)",
          background: "rgba(0,0,0,0.95)",
          color: "#fff",
          padding: "8px 12px",
          borderRadius: "8px",
          fontSize: "11px",
          fontWeight: "600",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          opacity: 0,
          visibility: "hidden",
          transition: "opacity 0.2s ease, transform 0.2s ease",
          border: `1px solid ${badgeDef.color}50`,
          boxShadow: `0 4px 15px rgba(0,0,0,0.5)`,
          zIndex: 10
        }}>
          📌 {earnedObj.detail}
        </div>
      )}
    </div>
  )};

  return (
    <div style={{display:"grid", gap:"30px"}}>
      <style>{`
        .trophy-card:hover .trophy-tooltip {
          opacity: 1 !important;
          visibility: visible !important;
          transform: translateX(-50%) translateY(0) !important;
        }
      `}</style>
      {rankGrid.map(({p: player}) => {
        const username = player.toLowerCase().replace(/\s/g,"_");
        const earnedObjs = calcUserTrophies(username, matches, results, allSelections, playerScores, ranksMap);
        const earnedIds = earnedObjs.map(t => t.id);
        
        const hasAxe = earnedIds.includes("thaggedhele");
        const hasFoot = earnedIds.includes("ironleg");
        
        return (
          <div key={player} style={{...S.card, padding:"24px", position:"relative", overflow:"hidden"}}>
            <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"20px", borderBottom:"1px solid rgba(255,255,255,0.1)", paddingBottom:"12px", position:"relative", zIndex:2}}>
              <div style={{display:"flex", alignItems:"center", gap:"12px"}}>
                <div style={{width:"40px", height:"40px", borderRadius:"50%", background:"linear-gradient(135deg, #FF8C00, #FFD700)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"bold", fontSize:"18px", color:"#000"}}>{player[0]}</div>
                <div>
                  <h2 style={{fontSize:"18px", fontWeight:800, margin:0}}>{player}</h2>
                  <div style={{fontSize:"12px", color:"#fbbf24", fontWeight:600}}>{earnedIds.length} Trophies Unlocked</div>
                </div>
              </div>
              <div style={{fontSize:"24px"}}>{earnedIds.length >= 6 ? "🏆🔥" : earnedIds.length > 3 ? "🏆" : "🥉"}</div>
            </div>

            <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))", gap:"16px", position:"relative", zIndex:2}}>
              {TROPHIES.map(bad => renderTrophyCard(bad, earnedObjs.find(e => e.id === bad.id)))}
            </div>

            {hasAxe && <img src="/pushpa_axe_badge_1776915965067.png" alt="Pushpa Gamification Axe Trophy Render" style={{position:"absolute", top:"-5%", right:"-5%", width:"350px", opacity:0.15, transform:"rotate(10deg)", pointerEvents:"none", mixBlendMode:"screen", zIndex:1}}/>}
            {hasFoot && <img src="/iron_leg_badge_1776915985396.png" alt="Brahmi Iron Leg Graphic Render" style={{position:"absolute", top:"-10%", right:"-5%", width:"350px", opacity:0.15, transform:"rotate(-10deg)", pointerEvents:"none", mixBlendMode:"screen", zIndex:1}}/>}
          </div>
        );
      })}
    </div>
  );
}

// ─── RIVALRY ARENA PAGE ───────────────────────────────────────────────────────
const WAGER_TIERS = [25, 50, 75];
const CHALLENGE_TYPES = [
  {id:"savaal", label:"⚔️ Classic Savaal", desc:"1v1 direct challenge"},
  {id:"bounty", label:"👑 Baahubali Bounty", desc:"Challenge Rank #1"},
  {id:"arena", label:"🎲 Open Arena", desc:"Challenge anyone (max 6 accept)"},
];
const TOLLYWOOD_WIN_LINES = [
  "Thaggedhe Le! {w} stole {pts} pts from {l}! 🪓",
  "Evadu kodithe dimma tiragali. {w} took {pts} from {l}! 🤫",
  "Naa kodaka! {w} destroyed {l} for {pts} pts! 🎳",
  "One man army. {w} leeched {pts} from {l}! 👑",
];
const TOLLYWOOD_LOSE_LINES = [
  "Iron Leg activated! {l} lost {pts} pts to {w}. 🦶",
  "Daridram thandavam aaduthundi. {l} pays {pts} to {w}. 💀",
  "Bokka Boshnam! {l} surrendered {pts} pts to {w}. 🦆",
];
const getFlairWin = (w,l,pts) => TOLLYWOOD_WIN_LINES[Math.abs((w+l).length)%TOLLYWOOD_WIN_LINES.length].replace(/{w}/g,w).replace(/{l}/g,l).replace(/{pts}/g,pts);
const getFlairLose = (w,l,pts) => TOLLYWOOD_LOSE_LINES[Math.abs((w+l).length)%TOLLYWOOD_LOSE_LINES.length].replace(/{w}/g,w).replace(/{l}/g,l).replace(/{pts}/g,pts);

function RivalryArenaPage({user, matches, results, allSelections, playerScores, challenges, onCreateChallenge, onRespondChallenge, onResolveChallenge}) {
  const [tab, setTab] = useState("issue");
  const [opponent, setOpponent] = useState("");
  const [matchId, setMatchId] = useState("");
  const [wager, setWager] = useState(50);
  const [chalType, setChalType] = useState("savaal");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const now = new Date();

  // Upcoming open matches for challenge creation
  const openMatches = matches.filter(m => !isMatchLocked(m, now));

  // Current user's total points for the minimum-threshold check
  const myUsername = user?.username;
  let myTotalPts = PRE_APP_SCORES[FANTASY_PLAYERS.find(p=>p.toLowerCase().replace(/\s/g,"_")===myUsername)] || 0;
  matches.forEach(m => {
    if (!results[m.id]) return;
    const s = allSelections[myUsername]?.[m.id];
    if (s) myTotalPts += calcPoints(s, results[m.id], playerScores[m.id]).total;
  });

  // Bug fix: compute Rank #1 for Baahubali Bounty challenges
  const rank1 = FANTASY_PLAYERS.map(p => {
    const uname = p.toLowerCase().replace(/\s/g, "_");
    const uSel = allSelections[uname] || {};
    let total = PRE_APP_SCORES[p] || 0;
    matches.forEach(m => {
      if (!results[m.id]) return;
      const s = uSel[m.id];
      if (s) total += calcPoints(s, results[m.id], playerScores[m.id]).total;
    });
    return { uname, name: p, total };
  }).sort((a, b) => b.total - a.total)[0];
  const rank1Username = rank1?.uname;

  // Count active challenges by this user per match to enforce cap
  const myActiveCountForMatch = (mid) => challenges.filter(c => c.challenger === myUsername && String(c.match_id) === String(mid) && (c.status === "pending" || c.status === "accepted")).length;

  // Incoming challenges for current user
  const incoming = challenges.filter(c => c.opponent === myUsername && c.status === "pending");

  // Arena challenges user can accept
  const openArena = challenges.filter(c => c.type === "arena" && c.status === "pending" && c.challenger !== myUsername);

  // All challenges sorted by recency
  const allChallenges = [...challenges].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

  const handleIssue = async () => {
    if (!matchId) { setMsg("⚠️ Pick a match first!"); return; }
    if (chalType === "savaal" && !opponent) { setMsg("⚠️ Pick your rival!"); return; }
    if (chalType === "savaal" && opponent === myUsername) { setMsg("⚠️ You can't challenge yourself, Brahmi! 🦶"); return; }
    // Bug fix: validate bounty target exists and is not the current user
    if (chalType === "bounty") {
      if (!rank1Username) { setMsg("⚠️ Could not determine Rank #1!"); return; }
      if (rank1Username === myUsername) { setMsg("⚠️ You ARE Rank #1! Issue a Savaal instead. 👑"); return; }
    }
    if (myTotalPts < 100) { setMsg("⚠️ You need at least 100 total pts to issue a Savaal!"); return; }
    if (myActiveCountForMatch(matchId) >= 2) { setMsg("⚠️ Max 2 challenges per match! Calm down, Pushpa."); return; }

    setSaving(true); setMsg("");
    try {
      await onCreateChallenge({
        match_id: parseInt(matchId),
        challenger: myUsername,
        // Bug fix: bounty uses rank1Username as the opponent target
        opponent: chalType === "arena" ? null : (chalType === "bounty" ? rank1Username : opponent),
        type: chalType,
        wager: wager,
        status: chalType === "arena" ? "pending" : "pending"
      });
      setMsg("✅ Challenge issued! Waiting for response...");
      setOpponent(""); setMatchId("");
    } catch (err) {
      setMsg("❌ Failed: " + err.message);
    }
    setSaving(false);
    setTimeout(() => setMsg(""), 4000);
  };

  const handleRespond = async (chalId, accept, isArena=false) => {
    setSaving(true);
    try {
      // Bug fix: pass myUsername as opponent when accepting an arena challenge
      await onRespondChallenge(chalId, accept ? "accepted" : "declined", isArena && accept ? myUsername : null);
      setMsg(accept ? "✅ Challenge accepted! Game on!" : "🐔 Challenge declined!");
    } catch (err) {
      setMsg("❌ Failed: " + err.message);
    }
    setSaving(false);
    setTimeout(() => setMsg(""), 4000);
  };

  // Bug fix: compute fantasy scores for both players and resolve the challenge
  const handleSettle = async (c) => {
    setSaving(true);
    try {
      const res = results[c.match_id];
      const pScores = playerScores[c.match_id] || {};
      const chalSel = allSelections[c.challenger]?.[c.match_id];
      const oppSel = c.opponent ? allSelections[c.opponent]?.[c.match_id] : null;
      const challengerScore = chalSel ? calcPoints(chalSel, res, pScores).total : 0;
      const opponentScore = oppSel ? calcPoints(oppSel, res, pScores).total : 0;
      const winner = challengerScore > opponentScore ? c.challenger
        : opponentScore > challengerScore ? c.opponent
        : null; // tie — no winner, wager returned
      await onResolveChallenge(c.id, winner, challengerScore, opponentScore);
      setMsg(winner ? `⚔️ Battle settled! ${getDisplayName(winner)} wins!` : "🤝 It's a tie — wager returned!");
    } catch (e) {
      setMsg("❌ Failed to settle: " + e.message);
    }
    setSaving(false);
    setTimeout(() => setMsg(""), 5000);
  };

  const getMatchLabel = (mid) => {
    const m = matches.find(x => String(x.id) === String(mid));
    return m ? `M${m.id}: ${m.home} vs ${m.away}` : `Match ${mid}`;
  };

  const getDisplayName = (uname) => {
    const p = FANTASY_PLAYERS.find(fp => fp.toLowerCase().replace(/\s/g,"_") === uname);
    return p || uname;
  };

  const renderBattleCard = (c) => {
    const isResolved = c.status === "resolved";
    const isDeclined = c.status === "declined";
    const isPending = c.status === "pending";
    const isAccepted = c.status === "accepted";
    const isExpired = c.status === "expired";

    const borderColor = isResolved ? (c.winner === myUsername ? "#4ade80" : "#ef4444")
      : isDeclined ? "#f97316"
      : isPending ? "#fbbf24"
      : isAccepted ? "#3b82f6"
      : "#374151";

    const bgGlow = isResolved ? (c.winner === myUsername ? "rgba(74,222,128,0.06)" : "rgba(239,68,68,0.06)")
      : "rgba(255,255,255,0.02)";

    return (
      <div key={c.id} style={{...S.card, borderColor, background: bgGlow, marginBottom:"16px", position:"relative", overflow:"hidden"}}>
        {/* Type banner */}
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px"}}>
          <span style={{fontSize:"11px", fontWeight:800, letterSpacing:"1.5px", textTransform:"uppercase", color: borderColor}}>
            {c.type === "savaal" ? "⚔️ SAVAAL" : c.type === "bounty" ? "👑 BOUNTY" : "🎲 ARENA"} — {getMatchLabel(c.match_id)}
          </span>
          <span style={{fontSize:"10px", padding:"3px 8px", borderRadius:"12px", fontWeight:700,
            background: isResolved ? "rgba(74,222,128,0.12)" : isDeclined ? "rgba(249,115,22,0.12)" : isPending ? "rgba(251,191,36,0.12)" : isAccepted ? "rgba(59,130,246,0.12)" : "rgba(55,65,81,0.2)",
            color: isResolved ? "#4ade80" : isDeclined ? "#f97316" : isPending ? "#fbbf24" : isAccepted ? "#60a5fa" : "#6b7280"
          }}>
            {isResolved ? "RESOLVED" : isDeclined ? "DECLINED" : isPending ? "PENDING" : isAccepted ? "ACCEPTED" : "EXPIRED"}
          </span>
        </div>

        {/* Players */}
        <div style={{display:"flex", alignItems:"center", justifyContent:"center", gap:"20px", marginBottom:"16px"}}>
          <div style={{textAlign:"center"}}>
            <div style={{width:"44px", height:"44px", borderRadius:"50%", background:"linear-gradient(135deg, #ef4444, #f97316)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"bold", fontSize:"18px", color:"#fff", margin:"0 auto 6px"}}>{getDisplayName(c.challenger)[0]}</div>
            <div style={{fontSize:"13px", fontWeight:700}}>{getDisplayName(c.challenger)}</div>
            {isResolved && <div style={{fontSize:"16px", fontWeight:800, color: c.winner === c.challenger ? "#4ade80" : "#f87171", marginTop:"4px"}}>{c.challenger_score} pts</div>}
          </div>
          <div style={{fontSize:"28px", fontWeight:900, color:"#fbbf24", textShadow:"0 0 15px rgba(251,191,36,0.4)"}}>🆚</div>
          <div style={{textAlign:"center"}}>
            <div style={{width:"44px", height:"44px", borderRadius:"50%", background:"linear-gradient(135deg, #3b82f6, #8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"bold", fontSize:"18px", color:"#fff", margin:"0 auto 6px"}}>{c.opponent ? getDisplayName(c.opponent)[0] : "?"}</div>
            <div style={{fontSize:"13px", fontWeight:700}}>{c.opponent ? getDisplayName(c.opponent) : "Open Challenge"}</div>
            {isResolved && c.opponent && <div style={{fontSize:"16px", fontWeight:800, color: c.winner === c.opponent ? "#4ade80" : "#f87171", marginTop:"4px"}}>{c.opponent_score} pts</div>}
          </div>
        </div>

        {/* Wager */}
        <div style={{textAlign:"center", marginBottom:"12px"}}>
          <span style={{fontSize:"22px", fontWeight:900, color:"#FFD700", textShadow:"0 0 10px rgba(255,215,0,0.3)"}}>💰 {c.wager} PTS</span>
        </div>

        {/* Flair text for resolved */}
        {isResolved && c.winner && (
          <div style={{textAlign:"center", padding:"12px", borderRadius:"12px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", fontSize:"13px", fontWeight:600, fontStyle:"italic", color: c.winner === myUsername ? "#4ade80" : "#f87171"}}>
            {c.winner === c.challenger
              ? getFlairWin(getDisplayName(c.challenger), getDisplayName(c.opponent), c.wager)
              : getFlairLose(getDisplayName(c.challenger), getDisplayName(c.opponent), c.wager)}
          </div>
        )}

        {/* Declined chickened out */}
        {isDeclined && (
          <div style={{textAlign:"center", padding:"10px", borderRadius:"12px", background:"rgba(249,115,22,0.06)", fontSize:"13px", fontWeight:600, color:"#f97316"}}>
            🐔 {getDisplayName(c.opponent)} chickened out of {getDisplayName(c.challenger)}'s challenge!
          </div>
        )}

        {/* Accept/Decline buttons for incoming */}
        {isPending && c.opponent === myUsername && (
          <div style={{display:"flex", gap:"12px", justifyContent:"center", marginTop:"8px"}}>
            <button disabled={saving} onClick={() => handleRespond(c.id, true)} style={{...S.btn("primary"), padding:"10px 28px", fontSize:"15px"}}>Accept ⚔️</button>
            <button disabled={saving} onClick={() => handleRespond(c.id, false)} style={{...S.btn("danger"), padding:"10px 28px", fontSize:"15px", border:"1px solid rgba(239,68,68,0.3)"}}>Decline 🐔</button>
          </div>
        )}

        {/* Arena accept button */}
        {isPending && c.type === "arena" && c.challenger !== myUsername && !c.opponent && (
          <div style={{textAlign:"center", marginTop:"8px"}}>
            {/* Bug fix: pass isArena=true so opponent field is set on accept */}
            <button disabled={saving} onClick={() => handleRespond(c.id, true, true)} style={{...S.btn("primary"), padding:"10px 28px", fontSize:"15px"}}>Accept Challenge ⚔️</button>
          </div>
        )}

        {/* Bug fix: Settle Battle button for accepted challenges once match result is in */}
        {isAccepted && (c.challenger === myUsername || c.opponent === myUsername) && results[c.match_id] && (
          <div style={{textAlign:"center", marginTop:"8px"}}>
            <button disabled={saving} onClick={() => handleSettle(c)} style={{...S.btn("primary"), padding:"10px 28px", fontSize:"15px", background:"linear-gradient(135deg, #4ade80, #22c55e)", color:"#000"}}>⚔️ Settle Battle</button>
            <div style={{fontSize:"11px", color:"#64748b", marginTop:"6px"}}>Match result is in — settle to record final scores</div>
          </div>
        )}

        {isExpired && (
          <div style={{textAlign:"center", fontSize:"12px", color:"#6b7280", marginTop:"6px"}}>⏰ Challenge expired. Opponent did not respond in time.</div>
        )}
      </div>
    );
  };

  return (
    <div style={S.page}>
      <h1 style={S.h1}>⚔️ Rivalry Arena</h1>
      <p style={{color:"#64748b", fontSize:"13px", marginBottom:"20px"}}>Place real leaderboard points on the line. Winner takes all.</p>

      {msg && <div style={{...S.card, background:"rgba(255,140,0,0.06)", borderColor:"rgba(255,140,0,0.2)", marginBottom:"16px", fontSize:"14px", fontWeight:600, color:"#fbbf24", textAlign:"center"}}>{msg}</div>}

      {/* Tab nav */}
      <div style={{display:"flex", gap:"6px", marginBottom:"20px", borderBottom:"1px solid rgba(255,255,255,0.1)", paddingBottom:"10px", flexWrap:"wrap"}}>
        <button style={S.navBtn(tab==="howto")} onClick={() => setTab("howto")}>❓ How To</button>
        <button style={S.navBtn(tab==="issue")} onClick={() => setTab("issue")}>🪓 Issue Savaal</button>
        <button style={S.navBtn(tab==="incoming")} onClick={() => setTab("incoming")}>📥 Incoming {incoming.length > 0 ? `(${incoming.length})` : ""}</button>
        <button style={S.navBtn(tab==="feed")} onClick={() => setTab("feed")}>🔥 Battle Feed</button>
      </div>

      {/* === ISSUE SAVAAL TAB === */}
      {tab === "issue" && (
        <div style={{...S.card, padding:"24px"}}>
          <div style={S.sectionTitle}>Create a Challenge</div>

          {/* Challenge type */}
          <div style={{marginBottom:"16px"}}>
            <label style={S.label}>Challenge Type</label>
            <div style={{display:"flex", gap:"8px", flexWrap:"wrap"}}>
              {CHALLENGE_TYPES.map(ct => (
                <button key={ct.id} onClick={() => setChalType(ct.id)} style={{
                  padding:"10px 16px", borderRadius:"10px", cursor:"pointer", fontSize:"13px", fontWeight:chalType===ct.id ? 700 : 400,
                  background: chalType===ct.id ? "rgba(255,140,0,0.15)" : "rgba(255,255,255,0.04)",
                  color: chalType===ct.id ? "#FFD700" : "#94a3b8",
                  border: chalType===ct.id ? "1px solid rgba(255,140,0,0.3)" : "1px solid rgba(255,255,255,0.08)",
                  transition:"all 0.2s", fontFamily:"'Inter',sans-serif"
                }}>
                  {ct.label}
                  <div style={{fontSize:"10px", marginTop:"2px", color:"#64748b"}}>{ct.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={S.grid2}>
            {/* Opponent (only for savaal) */}
            {chalType === "savaal" && (
              <div>
                <label style={S.label}>Your Rival</label>
                <select style={S.select} value={opponent} onChange={e => setOpponent(e.target.value)}>
                  <option value="">-- Pick your enemy --</option>
                  {FANTASY_PLAYERS.filter(p => p.toLowerCase().replace(/\s/g,"_") !== myUsername).map(p => (
                    <option key={p} value={p.toLowerCase().replace(/\s/g,"_")}>{p}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Match */}
            <div>
              <label style={S.label}>Match</label>
              <select style={S.select} value={matchId} onChange={e => setMatchId(e.target.value)}>
                <option value="">-- Pick a match --</option>
                {openMatches.map(m => (
                  <option key={m.id} value={m.id}>M{m.id}: {m.home} vs {m.away} ({m.date})</option>
                ))}
              </select>
            </div>

            {/* Wager */}
            <div>
              <label style={S.label}>Wager (Points)</label>
              <div style={{display:"flex", gap:"8px"}}>
                {WAGER_TIERS.map(w => (
                  <button key={w} onClick={() => setWager(w)} style={{
                    flex:1, padding:"12px", borderRadius:"10px", cursor:"pointer", fontSize:"16px", fontWeight:800,
                    background: wager===w ? "linear-gradient(135deg,#FF8C00,#FFD700)" : "rgba(255,255,255,0.04)",
                    color: wager===w ? "#000" : "#94a3b8",
                    border: wager===w ? "none" : "1px solid rgba(255,255,255,0.08)",
                    transition:"all 0.2s", fontFamily:"'Inter',sans-serif"
                  }}>
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Issue button */}
          <div style={{marginTop:"24px", textAlign:"center"}}>
            <button disabled={saving} onClick={handleIssue} style={{
              ...S.btn("primary"),
              padding:"14px 48px",
              fontSize:"16px",
              fontWeight:800,
              letterSpacing:"1px",
              boxShadow:"0 4px 20px rgba(255,140,0,0.3)",
              opacity: saving ? 0.6 : 1
            }}>
              {saving ? "Issuing..." : "CHALLENGE! 🪓"}
            </button>
            {myTotalPts < 100 && <div style={{fontSize:"11px", color:"#ef4444", marginTop:"8px"}}>⚠️ You need at least 100 total pts to issue challenges.</div>}
          </div>
        </div>
      )}

      {/* === INCOMING TAB === */}
      {tab === "incoming" && (
        <div>
          {incoming.length === 0 && (
            <div style={{...S.card, textAlign:"center", color:"#64748b", padding:"40px"}}>
              <div style={{fontSize:"48px", marginBottom:"12px"}}>😴</div>
              <div>No incoming challenges right now. Bored? Go issue one!</div>
            </div>
          )}
          {incoming.map(c => renderBattleCard(c))}

          {/* Open Arena challenges user can accept */}
          {openArena.length > 0 && (
            <>
              <div style={{...S.sectionTitle, marginTop:"24px", marginBottom:"12px"}}>🎲 Open Arena Challenges</div>
              {openArena.map(c => renderBattleCard(c))}
            </>
          )}
        </div>
      )}

      {/* === BATTLE FEED TAB === */}
      {tab === "feed" && (
        <div>
          {allChallenges.length === 0 && (
            <div style={{...S.card, textAlign:"center", color:"#64748b", padding:"40px"}}>
              <div style={{fontSize:"48px", marginBottom:"12px"}}>🏟️</div>
              <div>No battles yet. Be the first to issue a Savaal!</div>
            </div>
          )}
          {allChallenges.map(c => renderBattleCard(c))}
        </div>
      )}

      {/* === HOW TO TAB === */}
      {tab === "howto" && (
        <div style={{display:"grid", gap:"16px"}}>
          {/* Intro */}
          <div style={{...S.card, padding:"24px", textAlign:"center", background:"linear-gradient(135deg, rgba(255,140,0,0.08), rgba(255,215,0,0.04))", borderColor:"rgba(255,140,0,0.2)"}}>
            <div style={{fontSize:"48px", marginBottom:"12px"}}>⚔️</div>
            <h2 style={{fontSize:"20px", fontWeight:800, margin:"0 0 8px", color:"#FFD700"}}>Welcome to the Rivalry Arena</h2>
            <p style={{color:"#94a3b8", fontSize:"14px", lineHeight:"1.6", margin:0}}>Think you're better than your friend? Prove it.<br/>Put your <strong style={{color:"#fbbf24"}}>real leaderboard points</strong> on the line. Winner takes all.</p>
          </div>

          {/* Step by step */}
          <div style={{...S.card, padding:"24px"}}>
            <div style={S.sectionTitle}>How It Works — 5 Simple Steps</div>
            {[
              {step:"1", icon:"📱", title:"Open Rivals", desc:"Tap the ⚔️ Rivals tab at the bottom of the app."},
              {step:"2", icon:"🎯", title:"Pick Your Challenge", desc:"Choose from Classic Savaal (1v1), Baahubali Bounty (challenge Rank #1), or Open Arena (challenge anyone)."},
              {step:"3", icon:"👤", title:"Choose Your Rival & Match", desc:"Select who you want to challenge and which upcoming match you want to bet on."},
              {step:"4", icon:"💰", title:"Set Your Wager", desc:"Pick how many points to risk: 25, 50, or 75 pts. Then hit CHALLENGE! 🪓"},
              {step:"5", icon:"🏆", title:"Wait for Results", desc:"After the match, whoever scores more fantasy points on that match STEALS the wagered points from the loser."},
            ].map(s => (
              <div key={s.step} style={{display:"flex", gap:"14px", alignItems:"flex-start", padding:"14px 0", borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                <div style={{minWidth:"40px", height:"40px", borderRadius:"50%", background:"linear-gradient(135deg,#FF8C00,#FFD700)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:"16px", color:"#000"}}>{s.step}</div>
                <div>
                  <div style={{fontWeight:700, fontSize:"14px", marginBottom:"4px"}}>{s.icon} {s.title}</div>
                  <div style={{fontSize:"13px", color:"#94a3b8", lineHeight:"1.5"}}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Challenge types */}
          <div style={{...S.card, padding:"24px"}}>
            <div style={S.sectionTitle}>3 Ways to Challenge</div>
            <div style={{display:"grid", gap:"12px"}}>
              {[
                {icon:"⚔️", title:"Classic Savaal", desc:"Direct 1v1. Pick a specific person. Both of you score on the same match. Higher scorer takes the wager.", color:"#ef4444"},
                {icon:"👑", title:"Baahubali Bounty", desc:"Challenge whoever is Rank #1 on the leaderboard. If you beat the king, you earn the bounty. High risk, high reward.", color:"#FFD700"},
                {icon:"🎲", title:"Open Arena", desc:"Post a challenge to the entire league. Up to 6 players can accept. You take on all of them individually — beat them and take their points!", color:"#8b5cf6"},
              ].map(ct => (
                <div key={ct.title} style={{...S.card, padding:"16px", display:"flex", gap:"14px", alignItems:"flex-start", borderColor:ct.color+"40", background:ct.color+"08"}}>
                  <div style={{fontSize:"28px", lineHeight:1}}>{ct.icon}</div>
                  <div>
                    <div style={{fontWeight:700, fontSize:"14px", color:ct.color, marginBottom:"4px"}}>{ct.title}</div>
                    <div style={{fontSize:"13px", color:"#94a3b8", lineHeight:"1.5"}}>{ct.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rules */}
          <div style={{...S.card, padding:"24px"}}>
            <div style={S.sectionTitle}>Rules & Safety Nets</div>
            <div style={{display:"grid", gap:"10px"}}>
              {[
                {icon:"💰", rule:"Wager Amounts", detail:"Choose from 25, 50, or 75 points per challenge."},
                {icon:"🔒", rule:"Max 2 Per Match", detail:"You can issue a maximum of 2 challenges per match to keep things balanced."},
                {icon:"📊", rule:"100 Pt Minimum", detail:"You need at least 100 total leaderboard points to issue a challenge."},
                {icon:"⏰", rule:"Deadline", detail:"Challenges expire automatically if not accepted before the match starts."},
                {icon:"🤝", rule:"Ties", detail:"If both players score the exact same, all wagered points are returned. No blood."},
                {icon:"🐔", rule:"Declined?", detail:"The entire league sees when someone chickens out of a challenge!"},
              ].map(r => (
                <div key={r.rule} style={{display:"flex", gap:"12px", alignItems:"center", padding:"10px 12px", borderRadius:"10px", background:"rgba(255,255,255,0.03)"}}>
                  <span style={{fontSize:"20px"}}>{r.icon}</span>
                  <div>
                    <span style={{fontWeight:700, fontSize:"13px", color:"#e2e8f0"}}>{r.rule}: </span>
                    <span style={{fontSize:"13px", color:"#94a3b8"}}>{r.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Example walkthrough */}
          <div style={{...S.card, padding:"24px", background:"rgba(74,222,128,0.04)", borderColor:"rgba(74,222,128,0.15)"}}>
            <div style={S.sectionTitle}>📖 Example Walkthrough</div>
            <div style={{fontSize:"14px", lineHeight:"1.8", color:"#cbd5e1"}}>
              <div style={{marginBottom:"12px"}}><strong style={{color:"#fbbf24"}}>1.</strong> Srikanth opens the Rivals tab and picks <strong>⚔️ Classic Savaal</strong></div>
              <div style={{marginBottom:"12px"}}><strong style={{color:"#fbbf24"}}>2.</strong> He selects <strong>Praveen</strong> as his rival, picks <strong>M35 (MI vs CSK)</strong>, and wagers <strong>50 pts</strong></div>
              <div style={{marginBottom:"12px"}}><strong style={{color:"#fbbf24"}}>3.</strong> He hits <strong>CHALLENGE! 🪓</strong> — Praveen sees it in his Incoming tab</div>
              <div style={{marginBottom:"12px"}}><strong style={{color:"#fbbf24"}}>4.</strong> Praveen clicks <strong>Accept ⚔️</strong> — it's game on!</div>
              <div style={{marginBottom:"12px"}}><strong style={{color:"#fbbf24"}}>5.</strong> Match ends. Srikanth scores <strong style={{color:"#4ade80"}}>180 pts</strong>, Praveen scores <strong style={{color:"#f87171"}}>120 pts</strong></div>
              <div style={{padding:"14px", borderRadius:"12px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", textAlign:"center", fontStyle:"italic", fontWeight:600, color:"#4ade80", marginTop:"8px"}}>🪓 "Thaggedhe Le! Srikanth stole 50 pts from Praveen!"<br/><span style={{fontSize:"12px", color:"#94a3b8", fontStyle:"normal"}}>Srikanth: +50 on leaderboard | Praveen: -50 on leaderboard</span></div>
            </div>
          </div>

          {/* CTA */}
          <div style={{textAlign:"center", padding:"20px 0"}}>
            <button onClick={() => setTab("issue")} style={{...S.btn("primary"), padding:"14px 48px", fontSize:"16px", fontWeight:800, letterSpacing:"1px", boxShadow:"0 4px 20px rgba(255,140,0,0.3)"}}>Issue Your First Savaal! 🪓</button>
          </div>
        </div>
      )}
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
        <button style={S.navBtn(tab==="cabinet")} onClick={()=>setTab("cabinet")}>🪓 Trophy Cabinet</button>
        <button style={S.navBtn(tab==="stats")} onClick={()=>setTab("stats")}>📊 My Performance</button>
        <button style={S.navBtn(tab==="h2h")} onClick={()=>setTab("h2h")}>⚔️ Head-to-Head</button>
      </div>

      {tab === "board" && <LeaderboardContent matches={matches} results={results} allSelections={allSelections} playerScores={playerScores} />}
      {tab === "consolidated" && <ConsolidatedScoreContent matches={matches} results={results} allSelections={allSelections} playerScores={playerScores} />}
      {tab === "cabinet" && <TrophyCabinetContent matches={matches} results={results} allSelections={allSelections} playerScores={playerScores} />}
      {tab === "stats" && <MyStatsContent user={user} matches={matches} results={results} userSel={userSel} playerScores={playerScores} allSelections={allSelections} />}
      {tab === "h2h" && <HeadToHeadContent matches={matches} results={results} allSelections={allSelections} playerScores={playerScores} />}
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
    const { error } = await supabase.rpc("admin_reset_password", { target_username: username, new_password: newPwd });
    if (error) {
      alert("Failed to reset password: " + error.message);
      return;
    }
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
              {["Player","Username","Action"].map(h=><th key={h} style={{padding:"10px 14px",textAlign:"left",color:"#888",fontWeight:"normal",fontSize:"11px",letterSpacing:"1px",textTransform:"uppercase"}}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {users.map((u,i)=>(
              <tr key={u.username} style={{borderBottom:"1px solid rgba(255,255,255,0.04)",background:i%2===0?"transparent":"rgba(255,255,255,0.01)"}}>
                <td style={{padding:"10px 14px",color:"#e8e0d0"}}>{u.display_name}</td>
                <td style={{padding:"10px 14px",color:"#888",fontFamily:"monospace"}}>{u.username}</td>
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

function PlayerSelectionsTab({matches,allSelections,onSaveSelection,readOnly=false,isAdmin=false}) {
  const now=useNowTick(30000);
  const [selectedMatchId,setSelectedMatchId]=useState(()=>{
    const n=new Date();
    // Always use live logic — the dropdown only shows locked matches,
    // so getDefaultPicksMatchId (returns open/upcoming match) would never match an option.
    return getDefaultLiveMatchId(matches, n);
  });
  const [editingPlayer,setEditingPlayer]=useState(null);
  const [editForm,setEditForm]=useState({});
  const [saving,setSaving]=useState(false);
  const [savedMsg,setSavedMsg]=useState("");

  const lockedMatches=matches.filter(m=>{
    if(isMatchLocked(m, now)) return true;
    // Also show matches within the next 48 hours for admin preview
    const hoursUntilLock = (new Date(m.lock_time) - now) / (1000*60*60);
    return hoursUntilLock > 0 && hoursUntilLock <= 48;
  });
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
          {lockedMatches.slice().reverse().map(m=><option key={m.id} value={m.id}>M{m.id}: {m.home} vs {m.away} — {m.date}</option>)}
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
                  <th style={{padding:"10px 8px",textAlign:"left",color:"#888",fontWeight:"normal",fontSize:"10px",letterSpacing:"0.5px",textTransform:"uppercase",whiteSpace:"nowrap"}}>Last Updated</th>
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
                      <td style={{padding:"6px 8px",whiteSpace:"nowrap",fontSize:"11px",color:"#64748b"}}>
                        {hasSel && sel.updatedAt ? (()=>{
                          const ts = new Date(sel.updatedAt);
                          const lock = m?.lock_time ? new Date(m.lock_time) : null;
                          const afterLock = lock && ts > lock;
                          const fmt = ts.toLocaleString("en-US",{timeZone:"America/New_York",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",hour12:true}) + " ET";
                          return (
                            <span style={{display:"flex",flexDirection:"column",gap:"2px"}}>
                              <span style={{color:afterLock?"#f87171":"#94a3b8"}}>{fmt}</span>
                              {afterLock && <span style={{color:"#ef4444",fontSize:"9px",fontWeight:700,letterSpacing:"0.5px",textTransform:"uppercase"}}>⚠ After Lock!</span>}
                            </span>
                          );
                        })() : <span style={{color:"#374151"}}>—</span>}
                      </td>
                      {SEL_FIELDS.map(f=>{
                        const matchLocked = isMatchLocked(m, now);
                        const hideCell = !isAdmin && !matchLocked && f.key !== "winningTeam";
                        return (
                        <td key={f.key} style={{padding:"6px 8px",whiteSpace:"nowrap"}}>
                          {isEditing
                            ?<select style={{...S.select,padding:"6px 8px",fontSize:"12px",minWidth:"90px"}} value={editForm[f.key]||""} onChange={e=>setEditForm(prev=>({...prev,[f.key]:e.target.value}))}>
                              <option value="">--</option>
                              {getOpts(f).map(o=><option key={o} value={o}>{o}</option>)}
                            </select>
                            :hideCell
                              ?<span style={{color:"#444",fontSize:"11px"}}>🔒</span>
                              :<span style={{color:sel?.[f.key]?"#e8e0d0":"#444",fontSize:"12px"}}>{sel?.[f.key]||"—"}</span>
                          }
                        </td>
                        );
                      })}
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
  const [selectedMatchId, setSelectedMatchId] = useState(()=>{
    const now2=new Date();
    return getDefaultLiveMatchId(matches, now2);
  });
  const [scores, setScores] = useState({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  const now = new Date();
  const lockedMatches = matches.filter(m => isMatchLocked(m, now));
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

    let wicketsBonus = 0;
    if (wickets >= 4) wicketsBonus = 25;
    else if (wickets >= 3) wicketsBonus = 15;

    const batsman_score = runs + runsBonus + (fours * 2) + (sixes * 3);
    const bowler_score = (wickets * 25) + (maidens * 25) + wicketsBonus;
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
    try {
      await onSavePlayerScores(m.id, scoresArray);
      setSaving(false);
      setSavedMsg("Scores saved successfully ✓");
      setTimeout(() => setSavedMsg(""), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to save scores: " + err.message);
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={S.sectionTitle}>Add Player Scores</div>
      <div style={{marginBottom:"16px"}}>
        <label style={S.label}>Select Match</label>
        <select style={{...S.select,maxWidth:"400px"}} value={selectedMatchId} onChange={e=>{setSelectedMatchId(e.target.value);setSavedMsg("");}}>
          <option value="">-- Select a locked match --</option>
          {lockedMatches.slice().reverse().map(m=><option key={m.id} value={m.id}>M{m.id}: {m.home} vs {m.away} — {m.date}</option>)}
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
                  <th style={{padding:"8px 4px",textAlign:"center",color:"#60a5fa",fontWeight:"normal",fontSize:"10px"}}>Wickets (25, 2-3W +15, 4W+ +25)</th>
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
                      {["runs","fours","sixes","wickets","maidens","dot_balls"].map(field=>(
                        <td key={field} style={{padding:"6px 4px"}}>
                          <input
                            style={{...S.input, padding:"4px 6px", fontSize:"12px", width:"100%", background:"rgba(0,0,0,0.2)"}}
                            type="number"
                            value={scores[p]?.[field] ?? ""}
                            onChange={e => updateVal(p, field, e.target.value)}
                          />
                        </td>
                      ))}
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


function AdminLocksTab({matches}) {
  const [now] = useState(new Date());
  
  const toggleLock = async (matchId, val) => {
    await fetch(`${SUPABASE_URL}/rest/v1/matches?id=eq.${matchId}`, {
      method: "PATCH",
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" },
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

function AdminPage({matches,results,onSaveResult,allSelections,onSaveSelection,playerScores,onSavePlayerScores}) {
  const [adminTab,setAdminTab]=useState("results");
  const [selectedMatch,setSelectedMatch]=useState(null);
  const [now]=useState(new Date());
  const EMPTY_FORM={winningTeam:"",winByRuns:true,runMargin:"",wicketMargin:"",topScorers:[],topScorerRuns:"",bestBowlers:[],bestBowlerPoints:"",powerplayWinner:"",powerplayScore:"",powerplayDiff:"",dotBallLeaders:[],dotBalls:"",totalWickets:"",wicketsRange:"",duckBatsmen:[],matchTopPlayers:[],matchBottomPlayers:[]};
  const [form,setForm]=useState(EMPTY_FORM);
  const [duckBatamenSelected,setDuckBatmenSelected]=useState("");
  const [topScorerSelected,setTopScorerSelected]=useState("");
  const [bestBowlerSelected,setBestBowlerSelected]=useState("");
  const [dotBallLeaderSelected,setDotBallLeaderSelected]=useState("");
  const [winningHorseSelected,setWinningHorseSelected]=useState("");
  const [losingHorseSelected,setLosingHorseSelected]=useState("");
  const [saved,setSaved]=useState(false);
  const [saving,setSaving]=useState(false);
  const [autofillLoading,setAutofillLoading]=useState(false);
  const [autofillError,setAutofillError]=useState(null);

  const lockedMatches=matches.filter(m=>isMatchLocked(m, now));
  const selectMatch=(m)=>{
    setSelectedMatch(m);
    const ex=results[m.id];
    if(ex){
      const numFields=["runMargin","wicketMargin","topScorerRuns","bestBowlerPoints","powerplayScore","powerplayDiff","dotBalls","totalWickets"];
      const converted={...EMPTY_FORM,...ex,duckBatsmen:ex.duckBatsmen||[],topScorers:ex.topScorers||[],bestBowlers:ex.bestBowlers||[],dotBallLeaders:ex.dotBallLeaders||[],matchTopPlayers:ex.matchTopPlayers||[],matchBottomPlayers:ex.matchBottomPlayers||[]};
      numFields.forEach(f=>{if(converted[f]!=null)converted[f]=String(converted[f]);});
      setForm(converted);
    }else{setForm(EMPTY_FORM);}
    setDuckBatmenSelected("");
    setTopScorerSelected("");
    setBestBowlerSelected("");
    setDotBallLeaderSelected("");
    setWinningHorseSelected("");
    setLosingHorseSelected("");
    setSaved(false);
    setAutofillError(null);
  };
  const setF=(k,v)=>setForm(f=>({...f,[k]:v}));

  const handleAutofill=async()=>{
    if(!selectedMatch) return;
    setAutofillLoading(true); setAutofillError(null);
    try {
      const res = await fetch("/api/autofill-results", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: selectedMatch.id, home: selectedMatch.home, away: selectedMatch.away, date: selectedMatch.date, allPlayers })
      });
      const txt = await res.text();
      let json; try { json = JSON.parse(txt); } catch(e) { throw new Error(txt || res.statusText); }
      if (!res.ok) throw new Error(json.error || "Failed finding result data");
      
      const d = json.data;
      setForm(prev => ({
        ...prev,
        winningTeam: d.winningTeam || prev.winningTeam,
        winByRuns: d.winByRuns !== undefined ? d.winByRuns : prev.winByRuns,
        runMargin: d.runMargin ? String(d.runMargin) : prev.runMargin,
        wicketMargin: d.wicketMargin ? String(d.wicketMargin) : prev.wicketMargin,
        topScorers: d.topScorers?.length ? d.topScorers : prev.topScorers,
        topScorerRuns: d.topScorerRuns ? String(d.topScorerRuns) : prev.topScorerRuns,
        bestBowlers: d.bestBowlers?.length ? d.bestBowlers : prev.bestBowlers,
        totalWickets: d.totalWickets ? String(d.totalWickets) : prev.totalWickets,
        wicketsRange: d.wicketsRange || prev.wicketsRange,
        powerplayWinner: d.powerplayWinner || prev.powerplayWinner,
        powerplayScore: d.powerplayScore ? String(d.powerplayScore) : prev.powerplayScore,
        powerplayDiff: d.powerplayDiff ? String(d.powerplayDiff) : prev.powerplayDiff,
        dotBallLeaders: d.dotBallLeaders?.length ? d.dotBallLeaders : prev.dotBallLeaders,
        dotBalls: d.dotBalls ? String(d.dotBalls) : prev.dotBalls,
        duckBatsmen: d.duckBatsmen?.length ? d.duckBatsmen : prev.duckBatsmen,
      }));
    } catch(e) {
      setAutofillError(e.message);
    } finally {
      setAutofillLoading(false);
    }
  };

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
        <button style={S.navBtn(adminTab==="locks")} onClick={()=>setAdminTab("locks")}>Lock Overrides</button>
      </div>
      {adminTab==="users"?<UserManagementTab/>:adminTab==="scores"?<PlayerScoresTab matches={matches} allSelections={allSelections} playerScores={playerScores} onSavePlayerScores={onSavePlayerScores}/>:adminTab==="selections"?<PlayerSelectionsTab matches={matches} allSelections={allSelections} onSaveSelection={onSaveSelection}/>:adminTab==="insights"?<AIInsightsTab matches={matches}/>:adminTab==="locks"?<AdminLocksTab matches={matches} />:(
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
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px",flexWrap:"wrap",gap:"12px"}}>
                  <div style={{fontSize:"12px",color:"#4db8ff"}}>📋 {submissionCount}/{FANTASY_PLAYERS.length} players submitted</div>
                  <button style={{...S.btn("primary"),padding:"6px 14px",fontSize:"12px",background:"linear-gradient(135deg, rgba(168,85,247,0.8), rgba(217,70,239,0.8))"}} onClick={handleAutofill} disabled={autofillLoading}>
                    {autofillLoading ? "🔄 AI Scraping & Parsing..." : "🪄 Quick Auto-Fill Form"}
                  </button>
                </div>
                {autofillError && (
                  <div style={{fontSize:"12px",color:"#f87171",marginBottom:"12px",padding:"8px",background:"rgba(239,68,68,0.1)",borderRadius:"6px"}}>
                    ⚠ <strong>AI Error:</strong> {autofillError}
                  </div>
                )}

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
                  <div style={{gridColumn:"1/-1", display:"flex", gap:"16px", flexWrap:"wrap"}}>
                    <div style={{flex:1, minWidth:"200px"}}>
                      <label style={S.label}>Top Scorers</label>
                      <div style={{display:"flex",gap:"8px",marginBottom:"8px"}}>
                        <select style={{...S.select,flex:1}} value={topScorerSelected} onChange={e=>setTopScorerSelected(e.target.value)}>
                          <option value="">-- Select Player --</option>
                          {allPlayers.filter(p=>!form.topScorers.includes(p)).map(p=><option key={p} value={p}>{p}</option>)}
                        </select>
                        <button style={{...S.btn("primary"),padding:"10px 16px"}} onClick={()=>{if(topScorerSelected){setF("topScorers",[...form.topScorers,topScorerSelected]);setTopScorerSelected("");}}}>+ Add</button>
                      </div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
                        {form.topScorers.map(b=>(
                          <span key={b} style={{background:"rgba(255,165,0,0.2)",border:"1px solid rgba(255,165,0,0.4)",borderRadius:"6px",padding:"6px 12px",fontSize:"13px",display:"flex",alignItems:"center",gap:"8px"}}>
                            {b}
                            <button onClick={()=>setF("topScorers",form.topScorers.filter(x=>x!==b))} style={{background:"transparent",border:"none",cursor:"pointer",color:"#ff6b6b",fontSize:"16px",padding:"0",lineHeight:"1"}}>✕</button>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{flex:1, minWidth:"200px"}}>
                      <IField label="Runs Scored" value={form.topScorerRuns} onChange={v=>setF("topScorerRuns",v)} type="number"/>
                    </div>
                  </div>
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
                  <div style={{gridColumn:"1/-1", display:"flex", gap:"16px", flexWrap:"wrap"}}>
                    <div style={{flex:1, minWidth:"200px"}}>
                      <label style={S.label}>Best Bowlers</label>
                      <div style={{display:"flex",gap:"8px",marginBottom:"8px"}}>
                        <select style={{...S.select,flex:1}} value={bestBowlerSelected} onChange={e=>setBestBowlerSelected(e.target.value)}>
                          <option value="">-- Select Player --</option>
                          {allPlayers.filter(p=>!form.bestBowlers.includes(p)).map(p=><option key={p} value={p}>{p}</option>)}
                        </select>
                        <button style={{...S.btn("primary"),padding:"10px 16px"}} onClick={()=>{if(bestBowlerSelected){setF("bestBowlers",[...form.bestBowlers,bestBowlerSelected]);setBestBowlerSelected("");}}}>+ Add</button>
                      </div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
                        {form.bestBowlers.map(b=>(
                          <span key={b} style={{background:"rgba(255,165,0,0.2)",border:"1px solid rgba(255,165,0,0.4)",borderRadius:"6px",padding:"6px 12px",fontSize:"13px",display:"flex",alignItems:"center",gap:"8px"}}>
                            {b}
                            <button onClick={()=>setF("bestBowlers",form.bestBowlers.filter(x=>x!==b))} style={{background:"transparent",border:"none",cursor:"pointer",color:"#ff6b6b",fontSize:"16px",padding:"0",lineHeight:"1"}}>✕</button>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{flex:1, minWidth:"200px"}}>
                      <label style={S.label}>Dot-Ball Leaders</label>
                      <div style={{display:"flex",gap:"8px",marginBottom:"8px"}}>
                        <select style={{...S.select,flex:1}} value={dotBallLeaderSelected} onChange={e=>setDotBallLeaderSelected(e.target.value)}>
                          <option value="">-- Select Player --</option>
                          {allPlayers.filter(p=>!form.dotBallLeaders.includes(p)).map(p=><option key={p} value={p}>{p}</option>)}
                        </select>
                        <button style={{...S.btn("primary"),padding:"10px 16px"}} onClick={()=>{if(dotBallLeaderSelected){setF("dotBallLeaders",[...form.dotBallLeaders,dotBallLeaderSelected]);setDotBallLeaderSelected("");}}}>+ Add</button>
                      </div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
                        {form.dotBallLeaders.map(b=>(
                          <span key={b} style={{background:"rgba(255,165,0,0.2)",border:"1px solid rgba(255,165,0,0.4)",borderRadius:"6px",padding:"6px 12px",fontSize:"13px",display:"flex",alignItems:"center",gap:"8px"}}>
                            {b}
                            <button onClick={()=>setF("dotBallLeaders",form.dotBallLeaders.filter(x=>x!==b))} style={{background:"transparent",border:"none",cursor:"pointer",color:"#ff6b6b",fontSize:"16px",padding:"0",lineHeight:"1"}}>✕</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
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
                  <div style={{gridColumn:"1/-1",display:"flex",gap:"16px",flexWrap:"wrap"}}>
                    <div style={{flex:1,minWidth:"200px"}}>
                      <label style={S.label}>🏆 Winning Horses (Match Top Scorers)</label>
                      <div style={{display:"flex",gap:"8px",marginBottom:"8px"}}>
                        <select style={{...S.select,flex:1}} value={winningHorseSelected} onChange={e=>setWinningHorseSelected(e.target.value)}>
                          <option value="">-- Select Player --</option>
                          {FANTASY_PLAYERS.filter(p=>!(form.matchTopPlayers||[]).includes(p)).map(p=><option key={p} value={p}>{p}</option>)}
                        </select>
                        <button style={{...S.btn("primary"),padding:"10px 16px"}} onClick={()=>{if(winningHorseSelected){setF("matchTopPlayers",[...(form.matchTopPlayers||[]),winningHorseSelected]);setWinningHorseSelected("");}}}>+ Add</button>
                      </div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
                        {(form.matchTopPlayers||[]).map(b=>(
                          <span key={b} style={{background:"rgba(255,215,0,0.2)",border:"1px solid rgba(255,215,0,0.4)",borderRadius:"6px",padding:"6px 12px",fontSize:"13px",display:"flex",alignItems:"center",gap:"8px"}}>
                            {b}
                            <button onClick={()=>setF("matchTopPlayers",(form.matchTopPlayers||[]).filter(x=>x!==b))} style={{background:"transparent",border:"none",cursor:"pointer",color:"#ff6b6b",fontSize:"16px",padding:"0",lineHeight:"1"}}>✕</button>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{flex:1,minWidth:"200px"}}>
                      <label style={S.label}>💀 Losing Horses (Match Bottom Scorers)</label>
                      <div style={{display:"flex",gap:"8px",marginBottom:"8px"}}>
                        <select style={{...S.select,flex:1}} value={losingHorseSelected} onChange={e=>setLosingHorseSelected(e.target.value)}>
                          <option value="">-- Select Player --</option>
                          {FANTASY_PLAYERS.filter(p=>!(form.matchBottomPlayers||[]).includes(p)).map(p=><option key={p} value={p}>{p}</option>)}
                        </select>
                        <button style={{...S.btn("primary"),padding:"10px 16px"}} onClick={()=>{if(losingHorseSelected){setF("matchBottomPlayers",[...(form.matchBottomPlayers||[]),losingHorseSelected]);setLosingHorseSelected("");}}}>+ Add</button>
                      </div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
                        {(form.matchBottomPlayers||[]).map(b=>(
                          <span key={b} style={{background:"rgba(239,68,68,0.2)",border:"1px solid rgba(239,68,68,0.4)",borderRadius:"6px",padding:"6px 12px",fontSize:"13px",display:"flex",alignItems:"center",gap:"8px"}}>
                            {b}
                            <button onClick={()=>setF("matchBottomPlayers",(form.matchBottomPlayers||[]).filter(x=>x!==b))} style={{background:"transparent",border:"none",cursor:"pointer",color:"#ff6b6b",fontSize:"16px",padding:"0",lineHeight:"1"}}>✕</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
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
function LiveScorePage({matches, results, allSelections, playerScores, onSavePlayerScores, user}) {
  const [tab, setTab] = useState("grid");
  return (
    <div style={S.page}>
      <h1 style={S.h1}>Live Match Center</h1>
      <p style={{color:"#64748b",fontSize:"13px",marginBottom:"24px"}}>Track live scores or manually update player stats</p>
      
      <div style={{display:"flex",gap:"6px",marginBottom:"20px",borderBottom:"1px solid rgba(255,255,255,0.1)",paddingBottom:"10px",flexWrap:"wrap"}}>
        <button style={S.navBtn(tab==="grid")} onClick={()=>setTab("grid")}>🔴 Live Leaderboard</button>
        <button style={S.navBtn(tab==="dist")} onClick={()=>setTab("dist")}>📊 Pick Distributions</button>
        <button style={S.navBtn(tab==="update")} onClick={()=>setTab("update")}>✏️ Update Player Stats</button>
      </div>

      {tab==="grid" && <LiveGrid matches={matches} results={results} allSelections={allSelections} playerScores={playerScores} user={user} />}
      {tab==="dist" && <LiveDistributions matches={matches} allSelections={allSelections} />}
      {tab==="update" && <PlayerScoresTab matches={matches} allSelections={allSelections} playerScores={playerScores} onSavePlayerScores={onSavePlayerScores} />}
    </div>
  );
}

function LiveDistributions({matches, allSelections}) {
  const [now] = useState(new Date());
  const lockedMatches = matches.filter(m => isMatchLocked(m, now));
  const [selectedMatchId, setSelectedMatchId] = useState("");

  const m = lockedMatches.find(x => String(x.id) === String(selectedMatchId));
  if (!m && lockedMatches.length > 0 && selectedMatchId === "") {
    setSelectedMatchId(lockedMatches[lockedMatches.length - 1].id);
  }

  const data = { winningTeam: {}, bestBatsman: {}, bestBowler: {}, doubleCategory: {}, winningHorse: {}, losingHorse: {} };

  if (m) {
    FANTASY_PLAYERS.forEach(name => {
      const uname = name.toLowerCase().replace(/\s/g,"_");
      const sel = allSelections[uname]?.[m.id];
      if (sel) {
        if (sel.winningTeam) data.winningTeam[sel.winningTeam] = (data.winningTeam[sel.winningTeam]||0) + 1;
        if (sel.bestBatsman) data.bestBatsman[sel.bestBatsman] = (data.bestBatsman[sel.bestBatsman]||0) + 1;
        if (sel.bestBowler) data.bestBowler[sel.bestBowler] = (data.bestBowler[sel.bestBowler]||0) + 1;
        if (sel.doubleCategory) data.doubleCategory[sel.doubleCategory] = (data.doubleCategory[sel.doubleCategory]||0) + 1;
        if (sel.winningHorse) data.winningHorse[sel.winningHorse] = (data.winningHorse[sel.winningHorse]||0) + 1;
        if (sel.losingHorse) data.losingHorse[sel.losingHorse] = (data.losingHorse[sel.losingHorse]||0) + 1;
      }
    });
  }

  const formatData = (obj) => Object.entries(obj).map(([name, value]) => ({name, value})).sort((a,b)=>b.value-a.value);
  const colors = ["#4ade80", "#60a5fa", "#f472b6", "#fbbf24", "#c084fc", "#f87171", "#2dd4bf", "#fcd34d"];
  
  const getFill = (name, i) => TEAMS[name] ? TEAMS[name].color : colors[i % colors.length];

  return (
    <div>
      <div style={{marginBottom:"16px"}}>
        <label style={S.label}>Select Match to Analyze</label>
        <select style={{...S.select,maxWidth:"400px"}} value={selectedMatchId} onChange={e=>setSelectedMatchId(e.target.value)}>
          <option value="">-- Select a match --</option>
          {lockedMatches.slice().reverse().map(m=><option key={m.id} value={m.id}>M{m.id}: {m.home} vs {m.away} — {m.date}</option>)}
        </select>
      </div>

      {!m ? (
        <div style={{...S.card,textAlign:"center",color:"#555",padding:"40px"}}>Select a match above to view distributions</div>
      ) : (
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))", gap:"20px"}}>
          {Object.entries({
            "Winning Team": formatData(data.winningTeam),
            "Best Batsman": formatData(data.bestBatsman),
            "Best Bowler": formatData(data.bestBowler),
            "Double Category": formatData(data.doubleCategory),
            "🏆 Winning Horse": formatData(data.winningHorse),
            "💀 Losing Horse": formatData(data.losingHorse)
          }).map(([title, chartData]) => (
            <div key={title} style={{...S.card, padding:"20px", display:"flex", flexDirection:"column", alignItems:"center"}}>
              <h3 style={{fontSize:"14px", color:"#e8e0d0", marginBottom:"16px", fontWeight:"600", borderBottom:"1px solid rgba(255,255,255,0.1)", paddingBottom:"8px", width:"100%", textAlign:"center"}}>{title}</h3>
              {chartData.length === 0 ? (
                <div style={{color:"#555", fontSize:"12px", padding:"40px 0"}}>No data yet</div>
              ) : (
                <>
                  <div style={{width:"100%", height:"240px"}}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getFill(entry.name, index)} stroke="rgba(0,0,0,0.5)" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{background:"#1a1f2e", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"8px", color:"#fff"}} itemStyle={{color:"#fff"}} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{display:"flex", flexWrap:"wrap", gap:"10px", justifyContent:"center", marginTop:"10px"}}>
                    {chartData.map((d, i) => (
                      <div key={d.name} style={{display:"flex", alignItems:"center", gap:"6px", fontSize:"11px", color:"#94a3b8"}}>
                        <div style={{width:"10px", height:"10px", borderRadius:"50%", background:getFill(d.name, i)}}></div>
                        <span>{d.name} ({d.value})</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LiveGrid({matches, results, allSelections, playerScores, user}) {
  const isAdmin = user?.isAdmin;
  const [expandedRow, setExpandedRow] = useState(null);
  const [now] = useState(new Date());
  const lockedMatches = matches.filter(m => isMatchLocked(m, now));
  const [selectedMatchId, setSelectedMatchId] = useState(()=>{
    return getDefaultLiveMatchId(matches, now);
  });

  const m = lockedMatches.find(x => String(x.id) === String(selectedMatchId));
  
  return (
    <div>
      <div style={{marginBottom:"16px"}}>
        <label style={S.label}>Select Match to Track</label>
        <select style={{...S.select,maxWidth:"400px"}} value={selectedMatchId} onChange={e=>setSelectedMatchId(e.target.value)}>
          <option value="">-- Select a match --</option>
          {lockedMatches.slice().reverse().map(m=><option key={m.id} value={m.id}>M{m.id}: {m.home} vs {m.away} — {m.date}</option>)}
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
                if (!sel) return null;
                const pts = calcPoints(sel, results[m.id], playerScores[m.id]||{});
                return { name, uname, sel, bd: pts.breakdown, total: pts.total };
              }).filter(Boolean).sort((a,b)=>b.total - a.total).map((row, i) => {
                const res = results[m.id];
                const isExpanded = isAdmin && expandedRow === row.name;

                // Helper: renders score number + optional pick value below it
                const Cell = ({ score, pick, resKey, style={} }) => {
                  const hasResult = res && resKey !== null && resKey !== undefined;
                  const correct = hasResult && pick && (pick === resKey || (Array.isArray(resKey) ? resKey.includes(pick) : false));
                  const incorrect = hasResult && pick && !correct;
                  return (
                    <td style={{padding:"6px 4px",textAlign:"right",verticalAlign:"top",...style}}>
                      <div style={{color:score>0?"#4ade80":"#64748b",fontWeight:score>0?600:400}}>{score||0}</div>
                      {isExpanded && pick && (
                        <div style={{fontSize:"10px",color:correct?"#4ade80":incorrect?"#f87171":"#94a3b8",marginTop:"2px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:"80px",marginLeft:"auto"}}>
                          {correct?"✓ ":incorrect?"✗ ":""}{pick}
                        </div>
                      )}
                    </td>
                  );
                };

                return (
                  <tr key={row.name} style={{borderBottom:"1px solid rgba(255,255,255,0.04)",background:i%2===0?"transparent":"rgba(255,255,255,0.01)",cursor:isAdmin?"pointer":"default"}} onClick={()=>isAdmin&&setExpandedRow(isExpanded?null:row.name)}>
                    <td style={{padding:"6px 10px",color:"#e8e0d0",fontWeight:"bold",position:"sticky",left:0,background:i%2===0?"#0d1117":"#0f1319",zIndex:1,whiteSpace:"nowrap",verticalAlign:"top"}}>
                      {isAdmin && <span style={{fontSize:"10px",marginRight:"5px",color:"#475569"}}>{isExpanded?"▼":"▶"}</span>}
                      {row.name}
                    </td>
                    <Cell score={row.bd.winningTeam}     pick={row.sel.winningTeam}    resKey={res?.winningTeam} />
                    <Cell score={row.bd.bestBatsman}     pick={row.sel.bestBatsman}    resKey={res?.topScorers?.[0]} />
                    <Cell score={row.bd.bestBowler}      pick={row.sel.bestBowler}     resKey={res?.bestBowlers?.[0]} />
                    <Cell score={row.bd.powerplayWinner} pick={row.sel.powerplayWinner} resKey={res?.powerplayWinner} />
                    <Cell score={row.bd.dotBallBowler}   pick={row.sel.dotBallBowler}  resKey={res?.dotBallLeaders?.[0]} />
                    <Cell score={row.bd.totalWickets}    pick={row.sel.totalWickets}   resKey={res?.wicketsRange} />
                    <Cell score={row.bd.duckBatsman}     pick={row.sel.duckBatsman}    resKey={null} />
                    <td style={{padding:"6px 4px",textAlign:"right",verticalAlign:"top",color:(row.bd.winningHorse||0)+(row.bd.losingHorse||0)>0?"#4ade80":"#64748b"}}>
                      <div>{(row.bd.winningHorse||0)+(row.bd.losingHorse||0)}</div>
                      {isExpanded && (
                        <div style={{fontSize:"10px",marginTop:"2px",textAlign:"right"}}>
                          {row.sel.winningHorse && <div style={{color:(res?.matchTopPlayers||[]).length>0?(res.matchTopPlayers.includes(row.sel.winningHorse)?"#4ade80":"#f87171"):"#94a3b8"}}>🏆 {row.sel.winningHorse}</div>}
                          {row.sel.losingHorse  && <div style={{color:(res?.matchBottomPlayers||[]).length>0?(res.matchBottomPlayers.includes(row.sel.losingHorse)?"#4ade80":"#f87171"):"#94a3b8"}}>💀 {row.sel.losingHorse}</div>}
                        </div>
                      )}
                    </td>
                    <td style={{padding:"6px 4px",textAlign:"right",color:"#fbbf24",fontWeight:"bold",fontSize:"14px",verticalAlign:"top"}}>{row.total}</td>
                  </tr>
                );
              })}

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
  const [challenges,setChallenges]=useState([]);
  const [loading,setLoading]=useState(true);

  const userSel=user?(allSelections[user.username]||{}):{};

  const loadData = useCallback(() => {
    if(!user) return Promise.resolve();
    return Promise.all([
      supa.query("matches",{select:"*",order:"id.asc"}),
      supa.query("results",{select:"*"}),
      supa.query("selections",{select:"*"}),
      supa.query("match_insights",{select:"*"}).catch(()=>[]),
      supa.query("player_scores",{select:"*"}).catch(()=>[]),
      supa.query("challenges",{select:"*"}).catch(()=>[]),
    ]).then(([matchData,resultData,selData,insightsData,playerScoresData,challengesData])=>{
      setMatches(matchData||[]);
      setChallenges(challengesData||[]);
      const resMap={};
      const parseMulti = (val) => val ? String(val).split(',').map(s=>s.trim()) : [];
      (resultData||[]).forEach(r=>{resMap[r.match_id]={winningTeam:r.winning_team,runMargin:r.run_margin,wicketMargin:r.wicket_margin,topScorers:parseMulti(r.top_scorer),topScorerRuns:r.top_scorer_runs,bestBowlers:parseMulti(r.best_bowler),bestBowlerPoints:r.best_bowler_points,powerplayWinner:r.powerplay_winner,powerplayScore:r.powerplay_score,powerplayDiff:r.powerplay_diff,dotBallLeaders:parseMulti(r.dot_ball_leader),dotBalls:r.dot_balls,totalWickets:r.total_wickets,wicketsRange:r.wickets_range,duckBatsmen:r.duck_batsmen||[],matchTopPlayers:parseMulti(r.match_top_player),matchBottomPlayers:parseMulti(r.match_bottom_player)};});
      setResults(resMap);
      const selMap={};
      (selData||[]).forEach(s=>{
        if(!selMap[s.username]) selMap[s.username]={};
        selMap[s.username][s.match_id]={winningTeam:s.winning_team,bestBatsman:s.best_batsman,bestBowler:s.best_bowler,powerplayWinner:s.powerplay_winner,dotBallBowler:s.dot_ball_bowler,totalWickets:s.total_wickets,duckBatsman:s.duck_batsman,doubleCategory:s.double_category,winningHorse:s.winning_horse,losingHorse:s.losing_horse,updatedAt:s.saved_at||null};
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
    }).catch(console.error);
  },[user]);

  const [pushStatus, setPushStatus] = useState("unknown");
  useEffect(() => {
    if ("Notification" in window) {
      setPushStatus(Notification.permission);
    } else {
      setPushStatus("unsupported");
    }
  }, []);

  const enablePushNotifications = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert("Push notifications are not supported in this browser.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setPushStatus(permission);
      if (permission !== 'granted') return;

      const registration = await navigator.serviceWorker.register('/service-worker.js');
      await navigator.serviceWorker.ready;

      // Convert VAPID key to Uint8Array for browser compatibility
      const base64String = "BB9RL0jOEAwqA9FiXUTJMU3ar0ea47C49S0yidy9JU0wxz9YlJlRf2X_qRw2EK0jeP9NmEz66AvyOftc-q0mdiQ";
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: outputArray
      });

      const subData = JSON.parse(JSON.stringify(subscription));
      
      await supa.upsert("push_subscriptions", {
        username: user.username,
        endpoint: subData.endpoint,
        keys_p256dh: subData.keys.p256dh,
        keys_auth: subData.keys.auth
      }, "username");

      alert("Push Notifications securely enabled! You will now receive match reminders.");
    } catch (err) {
      console.error("Push Error", err);
      alert(`Failed to enable push notifications: ${err.message || "Unknown error"}`);
    }
  }, [user]);

  // Load all data on mount
  useEffect(()=>{
    if(!user){setLoading(false);return;}
    setLoading(true);
    loadData().finally(() => setLoading(false));
  },[user, loadData]);

  // Silent refresh on tab navigation
  useEffect(()=>{
    if(user && page) loadData();
  },[page, user, loadData]);

  // Silent refresh on window focus
  useEffect(()=>{
    if(!user) return;
    const onFocus = () => loadData();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  },[user, loadData]);

  const login=(u)=>{sessionStorage.setItem("ipl_user",JSON.stringify(u));setUser(u);};
  const logout=()=>{sessionStorage.removeItem("ipl_user");setUser(null);setPage("matches");setSelectedMatch(null);setMenuOpen(false);};

  const onSave=useCallback(async(matchId,sel)=>{
    await supa.upsert("selections",{username:user.username,match_id:matchId,winning_team:sel.winningTeam,best_batsman:sel.bestBatsman,best_bowler:sel.bestBowler,powerplay_winner:sel.powerplayWinner,dot_ball_bowler:sel.dotBallBowler,total_wickets:sel.totalWickets,duck_batsman:sel.duckBatsman,double_category:sel.doubleCategory,winning_horse:sel.winningHorse,losing_horse:sel.losingHorse,saved_at:new Date().toISOString()},"username,match_id");
    setAllSelections(prev=>({...prev,[user.username]:{...(prev[user.username]||{}),[matchId]:sel}}));
  },[user]);

  const onSaveResult=useCallback(async(matchId,res)=>{
    await supa.upsert("results",{match_id:matchId,winning_team:res.winningTeam,win_by_runs:res.winByRuns,run_margin:res.runMargin,wicket_margin:res.wicketMargin,top_scorer:(res.topScorers||[]).join(','),top_scorer_runs:res.topScorerRuns,best_bowler:(res.bestBowlers||[]).join(','),best_bowler_points:res.bestBowlerPoints,powerplay_winner:res.powerplayWinner,powerplay_score:res.powerplayScore,powerplay_diff:res.powerplayDiff,dot_ball_leader:(res.dotBallLeaders||[]).join(','),dot_balls:res.dotBalls,total_wickets:res.totalWickets,wickets_range:res.wicketsRange,duck_batsmen:res.duckBatsmen,match_top_player:(res.matchTopPlayers||[]).join(","),match_bottom_player:(res.matchBottomPlayers||[]).join(",")},"match_id");
    setResults(prev=>({...prev,[matchId]:res}));
  },[]);

  const onSaveSelection=useCallback(async(username,matchId,sel)=>{
    await supa.upsert("selections",{username,match_id:matchId,winning_team:sel.winningTeam,best_batsman:sel.bestBatsman,best_bowler:sel.bestBowler,powerplay_winner:sel.powerplayWinner,dot_ball_bowler:sel.dotBallBowler,total_wickets:sel.totalWickets,duck_batsman:sel.duckBatsman,double_category:sel.doubleCategory,winning_horse:sel.winningHorse,losing_horse:sel.losingHorse,saved_at:new Date().toISOString()},"username,match_id");
    setAllSelections(prev=>({...prev,[username]:{...(prev[username]||{}),[matchId]:sel}}));
  },[]);

  // ─── RIVALRY ARENA CALLBACKS ──────────────────────────────────────────────────
  const onCreateChallenge=useCallback(async(chal)=>{
    // Bug fix: use insert (not upsert on id) so Supabase generates a new PK
    const { data: result, error } = await supabase.from("challenges").insert(chal).select();
    if (error) throw error;
    setChallenges(prev=>[...prev,...(result||[])]);
  },[]);

  const onRespondChallenge=useCallback(async(chalId, newStatus, opponentUsername=null)=>{
    // Bug fix: also update opponent field when accepting an arena challenge
    const updateData = {status:newStatus};
    if (opponentUsername) updateData.opponent = opponentUsername;
    const { data: res, error } = await supabase.from("challenges").update(updateData).eq("id",chalId).select();
    if (error) throw error;
    setChallenges(prev=>prev.map(c=>c.id===chalId?{...c,status:newStatus,...(opponentUsername?{opponent:opponentUsername}:{})}:c));
  },[]);

  const onResolveChallenge=useCallback(async(chalId, winner, challengerScore, opponentScore)=>{
    const { data: res, error } = await supabase.from("challenges").update({status:"resolved",winner,challenger_score:challengerScore,opponent_score:opponentScore}).eq("id",chalId).select();
    if (error) throw error;
    setChallenges(prev=>prev.map(c=>c.id===chalId?{...c,status:"resolved",winner,challenger_score:challengerScore,opponent_score:opponentScore}:c));
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
    {id:"rivals",icon:"⚔️",label:"Rivals"},
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
            {/* Alerts bell — missing picks indicator */}
            {(()=>{
              const nowH=new Date();
              const missing=matches.filter(m=>{
                if(isMatchLocked(m,nowH)) return false; // already locked, too late
                const msSoon=new Date(m.lock_time)-nowH;
                if(msSoon>48*3600000) return false; // more than 48h away, no urgency yet
                const uname=user.username;
                return !allSelections[uname]?.[m.id]; // no pick yet
              });
              if(missing.length===0) return null;
              return (
                <div style={{position:"relative"}}>
                  <button
                    onClick={()=>setPage("matches")}
                    style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.35)",borderRadius:"6px",padding:"4px 10px",cursor:"pointer",fontSize:"11px",fontWeight:700,color:"#f87171",display:"flex",alignItems:"center",gap:"5px",transition:"all 0.2s"}}
                    title={`Missing picks for: ${missing.map(m=>`M${m.id} (${m.home} vs ${m.away})`).join(", ")}`}
                  >
                    🔔 <span style={{background:"#ef4444",color:"#fff",borderRadius:"50%",width:"16px",height:"16px",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:"9px",fontWeight:800}}>{missing.length}</span> Pick{missing.length>1?"s":""} Due
                  </button>
                </div>
              );
            })()}
            {pushStatus !== "granted" && pushStatus !== "unsupported" && (
              <button onClick={enablePushNotifications} style={{background:"rgba(255,140,0,0.1)",border:"1px solid rgba(255,140,0,0.4)",borderRadius:"6px",padding:"4px 8px",cursor:"pointer",color:"#fbbf24",fontSize:"11px",fontWeight:600,transition:"all 0.2s"}}>
                🔔 Alerts
              </button>
            )}
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
          :page==="selections"?<div style={S.page}><PlayerSelectionsTab matches={matches} allSelections={allSelections} readOnly={true} isAdmin={user.isAdmin}/></div>
          :page==="live"?<LiveScorePage matches={matches} results={results} allSelections={allSelections} playerScores={playerScores} onSavePlayerScores={onSavePlayerScores} user={user}/>
          :page==="rivals"?<RivalryArenaPage user={user} matches={matches} results={results} allSelections={allSelections} playerScores={playerScores} challenges={challenges} onCreateChallenge={onCreateChallenge} onRespondChallenge={onRespondChallenge} onResolveChallenge={onResolveChallenge}/>
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

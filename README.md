# IPL Fantasy 2026 - Fantasy Cricket League Application

## Project Overview

**IPL Fantasy 2026** is a modern web-based fantasy cricket league platform built with **React 18 + Vite**. Players participate in an IPL (Indian Premier League) fantasy league by predicting match outcomes, selecting top performers, and earning points based on actual match results. Admin users manage match results, and the system calculates leaderboards in real-time.

---

## 🏗 Architecture

### Technology Stack
- **Frontend Framework**: React 18.2.0 with Hooks (useState, useEffect, useCallback)
- **Build Tool**: Vite 5.0.0 (rapid HMR development, optimized production builds)
- **Backend**: Supabase REST API (PostgreSQL database)
- **Styling**: Inline CSS-in-JS with centralized style object (S)
- **Deployment**: Netlify (SPA routing via netlify.toml)
- **State Management**: React local state (hooks only, no Redux/Context)

### Codebase Structure
```
src/
├── App.jsx          # Single-file monolithic component (~750 lines)
│   ├── Supabase config & REST client
│   ├── Static data (teams, players, wicket ranges, fantasy league users)
│   ├── Scoring engine (points calculation logic)
│   ├── Inline CSS styles object (S)
│   ├── Components:
│   │   ├── LoginPage
│   │   ├── MatchesPage
│   │   ├── SelectionForm
│   │   ├── LeaderboardPage
│   │   ├── MyStatsPage
│   │   ├── AdminPage
│   │   └── UserManagementTab
│   └── Main App router
└── main.jsx         # React root render

```

---

## 📋 Core Functionality

### 1. **User Authentication**
**File**: `src/App.jsx` lines 119-175

Users log in with plain-text username/password (stored in Supabase `users` table):
- Username uniqueness validated
- Password stored in plaintext (⚠️ **SECURITY WARNING**: Not recommended for production)
- Session persists in localStorage (`lpUser` key)
- Automatic logout if user not found in database

**Login State**:
```javascript
const [user, setUser] = useState(null);
const [lpPass, setLpPass] = useState("");
```

**UI Components**:
- Username input field
- Password input field
- Login button with error messages

---

### 2. **Match Registration & Selection**
**File**: `src/App.jsx` lines 177-330

#### MatchesPage Component
Displays all IPL matches with their status:
- **Locked Matches**: Past or current matches (cannot submit selections)
- **Open Matches**: Future matches (can submit selections)
- Shows match date, time, teams (home vs away), and submission status

**Selection State per Match**:
```javascript
const selectedMatch = {
  winningTeam: "",          // Team that will win (dropdown)
  bestBatsman: "",          // Top scorer name (dropdown)
  bestBowler: "",           // Best bowler name (dropdown)
  duckBatsman: "",          // Player who will score duck (dropdown)
  powerplayWinner: "",      // Team winning powerplay (dropdown)
  dotBallLeader: "",        // Bowler with most dot balls (dropdown)
  totalWickets: "",         // Wicket range: <5, 5-8, 9-11, 12-14, 15-17, 18-20
  doubleCategory: "",       // Category to double points on (optional)
  winningHorse: "",         // Best performing player (optional)
  losingHorse: ""           // Worst performing player (optional)
}
```

#### SelectionForm Component
- Dynamic form fields based on selected match
- Dropdowns populated with:
  - **Teams**: CSK, MI, RCB, KKR, SRH, DC, GT, RR, PBKS, LSG
  - **Players**: Team rosters (alphabetically sorted)
  - **Wicket Ranges**: <5, 5-8, 9-11, 12-14, 15-17, 18-20
  - **Double Categories**: Winning Team, Best Batsman, Best Bowler, Powerplay Winner, Dot-Ball Bowler, Total Wickets

**Data Flow**:
1. User selects match from MatchesPage
2. SelectionForm loads with pre-filled data (if previously submitted)
3. Form validation before submission
4. Upsert to `match_selections` table (username_match_id unique key)

---

### 3. **Admin Panel - Match Results Entry**
**File**: `src/App.jsx` lines 479-620

#### Admin Form Fields (Match Results)
Admins enter actual match outcomes after the game concludes:

```javascript
const adminFormFields = {
  winningTeam: "",          // Team that won
  winByRuns: true,          // Win type: true=by runs, false=by wickets
  runMargin: "",            // Runs by which team won (number input)
  wicketMargin: "",         // Wickets by which team won (number input)
  topScorer: "",            // Best batsman name (dropdown)
  topScorerRuns: "",        // Runs scored by top batsman (number input)
  bestBowler: "",           // Best bowler name (dropdown)
  bestBowlerPoints: "",     // Bowling performance score (number input)
  powerplayWinner: "",      // Team winning powerplay (dropdown)
  powerplayScore: "",       // Powerplay runs (number input)
  powerplayDiff: "",        // Powerplay run difference (number input)
  dotBallLeader: "",        // Bowler with most dot balls (dropdown)
  dotBalls: "",             // Total dot balls bowled (number input)
  totalWickets: "",         // Total wickets fallen (number input)
  wicketsRange: "",         // Wicket range bracket (dropdown)
  duckBatsmen: [],          // Array of player names who scored ducks (multi-select)
  matchTopPlayer: "",       // Best performer (optional, dropdown)
  matchBottomPlayer: ""     // Worst performer (optional, dropdown)
}
```

#### Number Input Features
- **Input Type**: `type="text"` with `inputMode="decimal"` for accessibility
- **Direct Typing**: Users can type numbers directly (no spinner buttons)
- **Validation**: Converted to integers via `parseInt()` before submission
- **State Management**: Each number field updates independently (no shared state)

#### Duck Batsmen Multi-Select
- **UI**: Dropdown selector + "Add" button + Removable badges
- **State**: Array of selected player names
- **Flow**:
  1. Select player from dropdown
  2. Click "Add" button to add to list
  3. Click badge "✕" to remove from list
  4. Saved as array in database

#### Tabs in Admin Panel
1. **Match Results Tab**: Enter match outcomes for locked/completed matches
2. **Player Passwords Tab**: Manage user credentials (UserManagementTab)

---

### 4. **Scoring Engine**
**File**: `src/App.jsx` lines 82-116

The `calcPoints()` function calculates fantasy points for each user's selection against actual match results.

#### Point Breakdown:
| Category | Base Points | Additional Rules |
|----------|------------|------------------|
| **Winning Team** | 50 | + Run Margin / (Wicket Margin × 5) |
| **Best Batsman** | 50 | + Runs scored by player |
| **Best Bowler** | 50 | + Bowling performance score |
| **Powerplay Winner** | Varies | + Powerplay score + Run difference |
| **Dot-Ball Leader** | 50 | + (Dot balls × 5) |
| **Total Wickets** | (Wickets × 5) | Must match wicket range bracket |
| **Duck Batsman** | 100 | If selected player scored duck |
| **Winning Horse** | 100 | If player matches matchTopPlayer |
| **Losing Horse** | 100 | If player matches matchBottomPlayer |

#### Double Points Feature
- User can select one category to **double points** on
- Example: If "Best Batsman" is doubled and points = 60, final = 120
- Stored in `_doubled` field for tracking

**Return Format**:
```javascript
{
  breakdown: {
    winningTeam: 55,
    bestBatsman: 85,
    bestBowler: 60,
    powerplayWinner: 25,
    dotBallBowler: 55,
    totalWickets: 0,
    duckBatsman: 0,
    winningHorse: 0,
    losingHorse: 100,
    _doubled: "Powerplay Winner"
  },
  total: 425
}
```

---

### 5. **Leaderboard**
**File**: `src/App.jsx` lines 332-367

**Real-Time Leaderboard Page**:
- **Display**: All fantasy league players ranked by total points
- **Data Source**: 
  - Fetches all match selections for all users
  - Calculates points using `calcPoints()` for each selection
  - Sums points across all matches
- **Ranking**:
  1. Total points (descending)
  2. Number of submissions (descending)
  3. Active participation tracking

**Leaderboard Data Structure**:
```javascript
const leaderboard = [
  { name: "Ani", totalPoints: 2450, submissions: 15, matches: 15 },
  { name: "Haren", totalPoints: 2380, submissions: 14, matches: 15 },
  // ... sorted by totalPoints DESC
]
```

---

### 6. **My Stats / Performance Page**
**File**: `src/App.jsx` lines 369-477

**User Statistics Dashboard**:
- Shows individual user performance across all matches
- Displays:
  - Total points earned
  - Match-by-match breakdown with points awarded
  - Selections made for each match
- **Data Filtering**: Only shows data for logged-in user

**Stats Calculation**:
```
For each match user participated in:
  - Fetch user's selection
  - Fetch match result
  - Calculate points using calcPoints()
  - Display match details + points breakdown
```

---

### 7. **Statistics & Analytics**
**File**: `src/App.jsx` lines 369-477

The app displays various statistics for analyzing performance:
- Individual match scores
- Category-wise point distribution
- Win/loss patterns
- Submission timing

---

### 8. **User Management (Admin Feature)**
**File**: `src/App.jsx` lines 430-477

**UserManagementTab Component**:
- Admin-only feature to manage fantasy league player credentials
- View all users in the system
- Manage/reset passwords
- Add/remove players from league

---

## 🗄️ Database Schema (Supabase)

### Table: `users`
```sql
Column           | Type      | Notes
─────────────────┼───────────┼──────────────────────────────
username         | TEXT      | Primary key, unique
password         | TEXT      | Plaintext (⚠️ security issue)
email            | TEXT      | Optional
role             | TEXT      | 'admin' or 'player' (if applicable)
created_at       | TIMESTAMP | Auto-generated
```

### Table: `matches`
```sql
Column           | Type      | Notes
─────────────────┼───────────┼──────────────────────────────
id               | INT       | Primary key
home             | TEXT      | Home team code (CSK, MI, etc)
away             | TEXT      | Away team code
date             | DATE      | Match date
time_label       | TEXT      | Match time
lock_time        | TIMESTAMP | When submissions locked
```

### Table: `match_selections`
```sql
Column           | Type      | Notes
─────────────────┼───────────┼──────────────────────────────
username         | TEXT      | Player username (FK to users)
match_id         | INT       | Match ID (FK to matches)
winningTeam      | TEXT      | Predicted winner
bestBatsman      | TEXT      | Predicted top scorer
bestBowler       | TEXT      | Predicted best bowler
duckBatsman      | TEXT      | Predicted duck scorer
powerplayWinner  | TEXT      | Predicted powerplay winner
dotBallLeader    | TEXT      | Predicted dot ball bowler
totalWickets     | TEXT      | Predicted wicket range
doubleCategory   | TEXT      | Category to double points
winningHorse     | TEXT      | Best performer (optional)
losingHorse      | TEXT      | Worst performer (optional)
submitted_at     | TIMESTAMP | Submission time
updated_at       | TIMESTAMP | Last update time
```

### Table: `match_results`
```sql
Column           | Type      | Notes
─────────────────┼───────────┼──────────────────────────────
match_id         | INT       | Match ID (PK, FK to matches)
winningTeam      | TEXT      | Actual winner
winByRuns        | BOOLEAN   | true=by runs, false=by wickets
runMargin        | INT       | Runs margin of victory
wicketMargin     | INT       | Wicket margin of victory
topScorer        | TEXT      | Actual top scorer
topScorerRuns    | INT       | Actual runs by top scorer
bestBowler       | TEXT      | Actual best bowler
bestBowlerPoints | INT       | Bowling performance score
powerplayWinner  | TEXT      | Actual powerplay winner
powerplayScore   | INT       | Actual powerplay runs
powerplayDiff    | INT       | Powerplay run difference
dotBallLeader    | TEXT      | Actual dot ball bowler
dotBalls         | INT       | Total dot balls in match
totalWickets     | INT       | Total wickets in match
wicketsRange     | TEXT      | Wicket range bracket
duckBatsmen      | JSON[]    | Array of players who scored ducks
matchTopPlayer   | TEXT      | Match best performer
matchBottomPlayer| TEXT      | Match worst performer
updated_at       | TIMESTAMP | Last update time
```

---

## 🔄 Data Flow Diagram

```
User Login
    ↓
Fetch Matches → Display Open Matches
    ↓
Select Match & Fill Form
    ↓
Upsert to match_selections table
    ↓
Match Concludes (lock_time passes)
    ↓
Admin Enters Match Results
    ↓
Upsert to match_results table
    ↓
System calculates points using calcPoints()
    ↓
Update Leaderboard & User Stats
```

---

## 🎯 Key Features

### ✅ Completed Features
- ✅ User authentication (username/password)
- ✅ Match selection with multi-field predictions
- ✅ Admin panel for result entry
- ✅ Real-time point calculations
- ✅ Live leaderboard updates
- ✅ User statistics dashboard
- ✅ Duck batsmen multi-select UI
- ✅ Direct number input (no spinner buttons)
- ✅ Dropdown sorting (all dropdowns alphabetically ordered)
- ✅ SPA routing without page reloads
- ✅ Responsive design across devices

### 🔐 Security Notes
⚠️ **Current Security Issues**:
1. **Plaintext Passwords**: Passwords stored in plaintext in database
   - Should be hashed with bcrypt/argon2
   - JWT tokens recommended for session management

2. **Supabase Key Exposure**: API key visible in frontend code
   - Should use environment variables
   - RLS (Row Level Security) policies should be configured

3. **No Input Validation**: Frontend only validation
   - Backend validation needed
   - SQL injection protection required

**Production Recommendations**:
- Implement proper authentication (OAuth, JWT)
- Hash passwords server-side
- Enable Supabase RLS policies
- Use environment variables for secrets
- Add HTTPS-only cookies
- Implement CORS policies

---

## 🚀 Running the Application

### Development
```bash
npm install        # Install dependencies
npm run dev        # Start dev server (http://localhost:5173 or next available port)
```

### Production Build
```bash
npm run build      # Creates optimized dist/ folder
npm run preview    # Preview production build locally
```

### Deployment
- **Netlify**: Connected via `netlify.toml`
  - SPA routing configured (404.html → index.html)
  - Automatic deploys on Git push
  - Environment variables configured in Netlify dashboard

---

## 🧮 Scoring Example

**Scenario**: Match CSK vs MI on March 30, 2026

**User's Prediction (Selection)**:
```javascript
{
  winningTeam: "CSK",
  bestBatsman: "Ruturaj Gaikwad",
  bestBowler: "Jasprit Bumrah",
  duckBatsman: "Tilak Varma",
  powerplayWinner: "CSK",
  dotBallLeader: "Jasprit Bumrah",
  totalWickets: "12-14",
  doubleCategory: "Winning Team",
  winningHorse: "MS Dhoni",
  losingHorse: null
}
```

**Actual Match Result**:
```javascript
{
  winningTeam: "CSK",
  runMargin: 35,
  wicketMargin: 0,
  topScorer: "Ruturaj Gaikwad",
  topScorerRuns: 78,
  bestBowler: "Jasprit Bumrah",
  bestBowlerPoints: 45,
  powerplayWinner: "CSK",
  powerplayScore: 52,
  powerplayDiff: 12,
  dotBallLeader: "Jasprit Bumrah",
  dotBalls: 18,
  totalWickets: 8,
  wicketsRange: "5-8",
  duckBatsmen: ["Tilak Varma", "Suryakumar Yadav"],
  matchTopPlayer: "MS Dhoni"
}
```

**Points Calculation**:
```
✓ Winning Team: 50 + (35 / (0 * 5)) = 50 (no wicket margin, so no bonus)
              → Doubled: 50 × 2 = 100

✓ Best Batsman: 50 + 78 = 128

✓ Best Bowler: 50 + 45 = 95

✓ Powerplay Winner: 52 + 12 = 64

✓ Dot-Ball Bowler: 50 + (18 × 5) = 140

✓ Total Wickets: 8 matches "5-8" range = 8 × 5 = 40

✓ Duck Batsman: "Tilak Varma" is in duckBatsmen array = 100

✗ Winning Horse: "MS Dhoni" matches matchTopPlayer = 100

✗ Losing Horse: Not selected = 0

─────────────────────────────────────
Total Points = 100 + 128 + 95 + 64 + 140 + 40 + 100 + 100 = 767
```

---

## 📊 Static Data Reference

### Teams (10 IPL Teams)
```javascript
RCB, MI, CSK, KKR, SRH, DC, GT, RR, PBKS, LSG
```

### Players Per Team
- **CSK**: 24 players (Ruturaj Gaikwad, MS Dhoni, etc.)
- **MI**: 24 players (Hardik Pandya, Rohit Sharma, etc.)
- **RCB**: 25 players (Virat Kohli, Rajat Patidar, etc.)
- ... and so on for all 10 teams

### Fantasy League Players (25 participants)
```
Ani, Haren, Ganga, Jitendar, Mahesh, Nag, Naren, Navdeep, Omkar, Peddi, 
Praveen, Raghav, Ranga, Rohit, Sandeep, Santhosh, Soma, Sridhar K, Krishna, 
Venky, Naresh, Srikanth B, Prashanth, Sreeram, Santhosh Male
```

### Wicket Ranges
```
<5, 5-8, 9-11, 12-14, 15-17, 18-20
```

---

## 🎨 UI/UX Design

### Theme
- **Color Scheme**: Dark mode with gold accents
- **Primary Colors**: 
  - Background: #0a0a0f (Dark)
  - Text: #e8e0d0 (Cream/Gold)
  - Accents: #FFD700 (Gold)
- **Typography**: Georgia serif font for elegance
- **Layout**: Responsive grid-based layout

### Components
- **Cards**: Elevated white-on-dark design
- **Buttons**: Gold-accented, styled with hover effects
- **Inputs**: Styled consistently across all forms
- **Dropdowns**: Sorted alphabetically for easy selection
- **Navigation**: Tab-based interface (sticky navigation)

---

## 🔧 Component API Reference

### IField Component
**Purpose**: Reusable input field for admin form

```javascript
<IField 
  label="Run Margin"              // Label text
  value={form.runMargin}          // Current value (string)
  onChange={v => setF("runMargin", v)}  // Update handler
  type="number"                   // Input type
  opts={null}                     // Optional: Array of dropdown options
/>
```

### SelectionForm Component
**Purpose**: Form for users to make match predictions

```javascript
<SelectionForm
  match={selectedMatch}           // Match object
  userSelection={userSel}         // User's previous selection
  onSubmit={handleSubmit}         // Submit callback
/>
```

---

## 📝 Notes for AI Tools & Developers

### Important Implementation Details
1. **No Redux/Context**: All state managed via React hooks at component level
2. **Single File**: Entire app in one `App.jsx` (~750 lines) - consider splitting for maintainability
3. **Direct Supabase REST API**: No SDK, custom fetch wrapper used
4. **Inline Styles**: All CSS inline, consider migrating to CSS modules
5. **Data Normalization**: Fantasy league users hardcoded in array, consider database storage

### Common Tasks & Where to Find Code
- **Add new team**: Update `TEAMS` object (line ~40)
- **Add player to team**: Update `PLAYERS` object (line ~50)
- **Change scoring rules**: Modify `calcPoints()` function (line ~80)
- **Add new admin field**: Add to `EMPTY_FORM` in AdminPage (line ~540)
- **Add new user page**: Create new component function, add to router (line ~700+)

### Testing Recommendations
1. **Manual Testing**: Test each match from selection → result entry → leaderboard
2. **Edge Cases**: 
   - Submit selection, then lock time passes
   - Admin enters result while user viewing stats
   - Same player selected across multiple categories
   - Duck runs (0 wickets, 0 runs in an inning)
3. **Performance**: Load test with 100+ matches and 100+ users

---

## 📌 Version History
- **v1.0.0** (March 30, 2026): Initial release with all core features

---

## 🤝 Support

For questions or issues, refer to:
- **Supabase Docs**: https://supabase.com/docs
- **React Docs**: https://react.dev
- **Vite Docs**: https://vitejs.dev

---

**Last Updated**: March 30, 2026  
**Status**: ✅ Production Ready

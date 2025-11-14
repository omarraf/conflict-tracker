# Conflict Tracker - Revised Architecture (Static/Serverless)

## 🎯 **Project Goals (Updated)**

- **Informational site** for displaying global conflicts
- **No 24/7 server costs** (static/serverless only)
- **All conflicts shown equally** (no featured hierarchy)
- **Focus on recent years** (last 2-3 years, not 1989)
- **Periodic updates** (daily or every 6 hours)
- **Free hosting** (Vercel + Neon + GitHub Actions)

---

## 🏗️ **Recommended Architecture**

### **Stack:**
- **Frontend:** React + Vite → Vercel (static hosting)
- **Backend:** Vercel Serverless Functions → `/api/conflicts`
- **Database:** Neon PostgreSQL (serverless, free tier)
- **Data Ingestion:** GitHub Actions (cron job, free tier)
- **Map:** Mapbox GL JS (client-side only)

### **Data Flow:**

```
┌─────────────────────────────────────────────────┐
│        GitHub Actions Workflow                  │
│        Trigger: Cron schedule (daily @ 2 AM)    │
├─────────────────────────────────────────────────┤
│  1. Checkout repository                         │
│  2. Install dependencies                        │
│  3. Run data ingestion script:                  │
│     - Fetch from GDELT API (last 7 days)        │
│     - Fetch from RSS feeds (recent articles)    │
│     - Optional: ACLED API (last 30 days)        │
│  4. Process & filter conflicts:                 │
│     - Deduplicate by location                   │
│     - Filter by date (last 2-3 years only)      │
│     - Filter by severity (min 5 casualties)     │
│     - Extract location, casualties, media       │
│  5. Connect to Neon PostgreSQL                  │
│  6. Upsert conflicts to database:               │
│     - INSERT new conflicts                      │
│     - UPDATE existing (casualties, media)       │
│     - Skip if no meaningful changes             │
│  7. Log results (added/updated/errors)          │
└────────────┬────────────────────────────────────┘
             │
             ↓ (stores data)
┌─────────────────────────────────────────────────┐
│           Neon PostgreSQL (Serverless)          │
├─────────────────────────────────────────────────┤
│  Table: conflicts                               │
│  - id, name, startDate, casualties              │
│  - countries[], region, severity                │
│  - lat, lng, description                        │
│  - mediaLinks[], status                         │
│  - createdAt, updatedAt                         │
│                                                  │
│  Free Tier: 0.5 GB storage, 1 GB egress/month  │
│  Scales to zero when idle                       │
└────────────┬────────────────────────────────────┘
             │
             ↓ (queries on request)
┌─────────────────────────────────────────────────┐
│        Vercel Serverless Function               │
│        Endpoint: /api/conflicts                 │
├─────────────────────────────────────────────────┤
│  1. Receive GET request from frontend           │
│  2. Connect to Neon PostgreSQL                  │
│  3. Query: SELECT * FROM conflicts              │
│     WHERE startDate > NOW() - INTERVAL '3 years'│
│     ORDER BY updatedAt DESC                     │
│  4. Return JSON response                        │
│  5. Execution time: ~200-500ms                  │
│  6. Auto-scales, only charged per request       │
│                                                  │
│  Free Tier: 100 GB-hours/month                  │
└────────────┬────────────────────────────────────┘
             │
             ↓ (fetches on page load)
┌─────────────────────────────────────────────────┐
│          React Frontend (Static)                │
│          Hosted on Vercel CDN                   │
├─────────────────────────────────────────────────┤
│  1. User visits site                            │
│  2. Vercel serves static HTML/JS/CSS from CDN   │
│  3. React app loads in browser                  │
│  4. useEffect: fetch('/api/conflicts')          │
│  5. Display conflicts on map + sidebar          │
│  6. All filtering happens client-side           │
│  7. No WebSocket, no real-time updates          │
│                                                  │
│  Free Tier: 100 GB bandwidth/month              │
└─────────────────────────────────────────────────┘
```

---

## 📊 **Cost Breakdown (All Free Tiers)**

| Service | Usage | Free Tier Limit | Estimated Cost |
|---------|-------|-----------------|----------------|
| **GitHub Actions** | 1 run/day × 5 min | 2,000 min/month | **$0** |
| **Neon PostgreSQL** | ~50 MB storage | 0.5 GB storage | **$0** |
| **Vercel Hosting** | Static site + API | 100 GB bandwidth | **$0** |
| **Vercel Functions** | ~100 invocations/day | 100 GB-hours | **$0** |
| **Mapbox** | Map rendering | 50K loads/month | **$0** |
| **Total** | | | **$0/month** |

---

## 🔄 **Update Frequency & Latency**

### **How Often Data Updates:**
- **GitHub Actions cron:** Daily at 2 AM UTC (configurable)
- **Alternative:** Every 6 hours (4x daily)
- **Alternative:** Every hour (not recommended, uses more Actions minutes)

### **User Experience:**
- **First load:** User fetches conflicts from Vercel API → data is max 24 hours old
- **Subsequent visits:** Browser may cache for 5-10 minutes (configurable)
- **No real-time updates:** Users must refresh page to see new data
- **Acceptable for informational site:** Most conflicts don't change hour-to-hour

---

## 🗂️ **Data Scope & Filtering**

### **Time Range:**
- **Focus:** Last 2-3 years of conflicts (not 1989-2025)
- **Rationale:**
  - GDELT/RSS only provide recent data
  - Historical curation is time-consuming
  - Focus on active/recent conflicts

### **Conflict Inclusion Criteria:**
- ✅ Started within last 3 years
- ✅ Casualties >= 5 (filter noise)
- ✅ Multiple source confirmation (3+ articles)
- ✅ Valid geolocation (lat/lng)
- ✅ Conflict-related keywords (not protests, elections)

### **What Gets Filtered Out:**
- ❌ Minor incidents (<5 casualties)
- ❌ Non-violent protests
- ❌ Political events (elections, scandals)
- ❌ Conflicts older than 3 years (unless ongoing)
- ❌ Duplicate events from different sources

### **Dual-Tier Conflict System:**
- **Curated Conflicts:** 15 manually added major ongoing conflicts (Gaza, Ukraine, Sudan, etc.)
  - Always shown on map with proper historical dates
  - Receive auto-updates via smart matching algorithm
  - Updated recentArticles from auto-ingestion
- **Auto-Ingested Conflicts:** Auto-discovered conflicts from news sources
  - If matched to curated conflict: articles appended to curated conflict's "Recent Developments"
  - If no match found: stored as auto-ingested (NOT shown on map)
  - Managed via Drizzle Studio for review/deletion

---

## 📁 **Project Structure (Updated)**

```
conflict-tracker/
├── .github/
│   └── workflows/
│       └── ingest-conflicts.yml     # ← NEW: GitHub Actions cron job
│
├── client/                          # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── MapboxGlobe.tsx      # Keep
│   │   │   ├── ConflictSidebar.tsx  # Keep
│   │   │   ├── FilterPanel.tsx      # Keep (simplify)
│   │   │   ├── Timeline.tsx         # ← DELETE
│   │   │   ├── AdminPanel.tsx       # ← DELETE (no admin needed)
│   │   │   ├── ComparisonView.tsx   # Keep
│   │   │   └── ExportPanel.tsx      # Keep
│   │   ├── hooks/
│   │   │   ├── useConflictUpdates.ts # ← DELETE (no WebSocket)
│   │   │   └── useURLState.ts        # Keep (for filters)
│   │   ├── App.tsx                   # Simplify
│   │   └── ...
│   └── api/                         # ← NEW: Vercel API routes
│       └── conflicts.ts             # Serverless function
│
├── server/                          # ← REPURPOSE: Ingestion scripts only
│   ├── services/
│   │   ├── ingestion.ts             # Keep (used by GitHub Actions)
│   │   ├── gdelt.ts                 # Keep
│   │   ├── rss.ts                   # Keep
│   │   ├── acled.ts                 # Keep
│   │   └── scheduler.ts             # ← DELETE (use GitHub Actions)
│   ├── index.ts                     # ← DELETE (no Express server)
│   ├── routes.ts                    # ← DELETE
│   └── db.ts                        # Keep (for Actions + Vercel)
│
├── scripts/
│   └── ingest.ts                    # ← NEW: Standalone ingestion script
│
├── shared/
│   └── schema.ts                    # Keep (database schema)
│
├── vercel.json                      # ← NEW: Vercel configuration
└── package.json                     # Update dependencies
```

---

## 🚀 **Implementation Steps**

### **Phase 1: Remove Unnecessary Features (1-2 hours)**

1. **Delete Timeline Component:**
   - Remove `Timeline.tsx`
   - Remove timeline state from `App.tsx`
   - Remove GSAP dependency
   - Remove timeline URL params

2. **Delete Real-Time Features:**
   - Remove `useConflictUpdates` hook
   - Remove WebSocket client code
   - Remove AdminPanel component
   - Remove server WebSocket setup

3. **Delete Express Server:**
   - Remove `server/index.ts`
   - Remove `server/routes.ts`
   - Remove `server/services/scheduler.ts`
   - Keep only ingestion services

4. **Clean up Dependencies:**
   - Remove `ws` (WebSocket)
   - Remove `express`
   - Remove `gsap` (if only used for timeline)

---

### **Phase 2: Create GitHub Actions Workflow (1 hour)**

**File:** `.github/workflows/ingest-conflicts.yml`

```yaml
name: Ingest Conflict Data

on:
  schedule:
    # Run daily at 2:00 AM UTC
    - cron: '0 2 * * *'

  # Allow manual triggering
  workflow_dispatch:

jobs:
  ingest:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Run data ingestion
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          ACLED_API_KEY: ${{ secrets.ACLED_API_KEY }}
          ACLED_EMAIL: ${{ secrets.ACLED_EMAIL }}
        run: npm run ingest

      - name: Log results
        run: echo "Ingestion completed successfully"
```

**Add npm script to `package.json`:**
```json
"scripts": {
  "ingest": "tsx scripts/ingest.ts"
}
```

---

### **Phase 3: Create Standalone Ingestion Script (2 hours)**

**File:** `scripts/ingest.ts`

```typescript
import { DataIngestionService } from '../server/services/ingestion';
import { db } from '../server/db';

async function main() {
  console.log('Starting conflict data ingestion...');
  console.log(`Time: ${new Date().toISOString()}`);

  // Create ingestion service (no WebSocket needed)
  const ingestionService = new DataIngestionService(null);

  // Fetch last 7 days of data
  const results = await ingestionService.ingestRecentData(7);

  console.log('Ingestion completed:');
  console.log(`  - Added: ${results.added}`);
  console.log(`  - Updated: ${results.updated}`);
  console.log(`  - Errors: ${results.errors}`);

  process.exit(0);
}

main().catch(error => {
  console.error('Ingestion failed:', error);
  process.exit(1);
});
```

**Update `DataIngestionService` constructor:**
```typescript
constructor(wss: WebSocketServer | null) {
  this.wss = wss; // Allow null for GitHub Actions
}

// Update broadcast method to check for null
private broadcast(message: any) {
  if (!this.wss) return; // Skip if no WebSocket

  this.wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}
```

---

### **Phase 4: Create Vercel API Route (30 minutes)**

**File:** `client/api/conflicts.ts`

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);

    // Fetch conflicts from last 3 years
    const conflicts = await sql`
      SELECT * FROM conflicts
      WHERE start_date > NOW() - INTERVAL '3 years'
      ORDER BY updated_at DESC
    `;

    // Cache for 10 minutes
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');

    return res.status(200).json(conflicts);
  } catch (error) {
    console.error('Database query failed:', error);
    return res.status(500).json({ error: 'Failed to fetch conflicts' });
  }
}
```

---

### **Phase 5: Update Frontend (1-2 hours)**

**Update `App.tsx`:**

```typescript
// Remove WebSocket hook
// const { isConnected, lastUpdate } = useConflictUpdates(handleConflictUpdate);

// Remove timeline state
// const [timelineRange, setTimelineRange] = useState<[number, number]>([1989, 2025]);

// Simplify data fetching
useEffect(() => {
  fetch('/api/conflicts')
    .then(res => res.json())
    .then(data => setConflicts(data))
    .catch(err => {
      console.error('Failed to fetch conflicts:', err);
      // No fallback to static data
    });
}, []);

// Remove Timeline component
// <Timeline onTimeRangeChange={...} />

// Remove AdminPanel component
// <AdminPanel isConnected={...} lastUpdate={...} />
```

**Simplify `FilterPanel.tsx`:**
- Remove "Last Year", "Last 5 Years" presets (show all recent conflicts)
- Or keep simple date presets: "Last Week", "Last Month", "Last 3 Months"
- Remove timeline-related UI

---

### **Phase 6: Configure Vercel (15 minutes)**

**File:** `vercel.json`

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist/public",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "functions": {
    "client/api/conflicts.ts": {
      "memory": 1024,
      "maxDuration": 10
    }
  },
  "env": {
    "DATABASE_URL": "@database_url",
    "MAPBOX_ACCESS_TOKEN": "@mapbox_token"
  }
}
```

**Add environment variables in Vercel dashboard:**
1. Go to Project Settings → Environment Variables
2. Add `DATABASE_URL` (Neon connection string)
3. Add `MAPBOX_ACCESS_TOKEN`

---

### **Phase 7: Configure GitHub Secrets (5 minutes)**

Go to GitHub repo → Settings → Secrets → Actions

Add secrets:
- `DATABASE_URL` (Neon PostgreSQL connection string)
- `ACLED_API_KEY` (optional)
- `ACLED_EMAIL` (optional)

---

## ✅ **Deployment Checklist**

- [ ] Timeline component removed
- [ ] WebSocket code removed
- [ ] Express server removed
- [ ] GitHub Actions workflow created
- [ ] Ingestion script tested locally
- [ ] Vercel API route created
- [ ] Frontend updated to use `/api/conflicts`
- [ ] `vercel.json` configured
- [ ] Environment variables added to Vercel
- [ ] GitHub secrets configured
- [ ] Test deployment to Vercel
- [ ] Trigger manual GitHub Actions workflow
- [ ] Verify conflicts appear on site
- [ ] Test filters and map functionality

---

## 📊 **Expected Results**

### **After Implementation:**

1. **Zero server costs** (all free tiers)
2. **Simple maintenance** (just one GitHub Actions workflow)
3. **Fast frontend** (static site on Vercel CDN)
4. **Recent conflict data** (updated daily)
5. **All conflicts shown equally** (no hierarchy)
6. **User can filter by:**
   - Region (Africa, Middle East, etc.)
   - Severity (low, medium, high, critical)
   - Date range (last week, month, 3 months)
   - Search query

### **What You Give Up:**

- ❌ Real-time updates (conflicts update daily, not live)
- ❌ Historical data (only last 2-3 years)
- ❌ Manual curation (all auto-ingested)

### **What You Gain:**

- ✅ Zero hosting costs
- ✅ Simple architecture
- ✅ No server maintenance
- ✅ Fast performance (CDN)
- ✅ Git history of data changes

---

## 🎯 **Next Steps**

1. **Review this architecture** - Does this fit your vision?
2. **Choose update frequency** - Daily? Every 6 hours? Hourly?
3. **Decide on data filtering** - Min casualties? Specific keywords?
4. **Start implementation** - I can begin with Phase 1 (remove timeline)

Let me know if you approve this approach and I'll start implementing!

# Conflict Tracker - Final Architecture

## 🎯 Core Architecture Principle

**Only manually curated conflicts appear on the map. Auto-ingested news updates enhance curated conflicts via the "Recent Developments" section.**

---

## 📊 Two-Tier Conflict System

### 1. Curated Conflicts (Manual)
- **What:** 15 major ongoing conflicts manually added to database
- **Examples:** Gaza-Israel War, Ukraine-Russia War, Sudan Civil War, etc.
- **Characteristics:**
  - Proper historical start dates (e.g., Gaza: Oct 7, 2023)
  - Comprehensive descriptions and educational resources
  - Always visible on the map
  - Marked with `isAutoIngested: false`
  - Receive automatic article updates via smart matching

### 2. Auto-Ingested Conflicts (Automatic)
- **What:** Conflicts discovered from news sources (GDELT, RSS feeds)
- **Characteristics:**
  - Marked with `isAutoIngested: true`
  - **NEVER shown on the map** (filtered out in App.tsx)
  - Two possible outcomes:
    1. **Matched to curated conflict** → Articles appended to curated conflict's `recentArticles`
    2. **No match found** → Stored as auto-ingested for manual review via Drizzle Studio

---

## 🔄 Data Flow

```
┌─────────────────────────────────────────────────┐
│        GitHub Actions Workflow                  │
│        Trigger: Daily @ 2 AM UTC                │
└────────────┬────────────────────────────────────┘
             │
             ↓ Fetches from GDELT, RSS
┌─────────────────────────────────────────────────┐
│        Data Ingestion Service                   │
│        (server/services/ingestion.ts)           │
├─────────────────────────────────────────────────┤
│  For each auto-ingested conflict:               │
│  1. Run smart matching algorithm                │
│  2. Check geographic distance (<200km)          │
│  3. Check country overlap                       │
│  4. Check name similarity                       │
│                                                  │
│  IF MATCH FOUND:                                │
│    → Extract article from auto-ingested         │
│    → Append to curated conflict's               │
│      recentArticles array                       │
│    → Update recentDataUpdated timestamp         │
│    → Skip duplicate articles                    │
│    → Filter to last 7 days only                 │
│                                                  │
│  IF NO MATCH:                                   │
│    → Create new conflict with                   │
│      isAutoIngested: true                       │
│    → Will NOT appear on map                     │
│    → Awaits manual review in Drizzle Studio    │
└────────────┬────────────────────────────────────┘
             │
             ↓ Stores in database
┌─────────────────────────────────────────────────┐
│           Neon PostgreSQL                       │
├─────────────────────────────────────────────────┤
│  conflicts table:                               │
│  - All curated conflicts (isAutoIngested=false) │
│  - Auto-ingested conflicts (isAutoIngested=true)│
│                                                  │
│  Curated conflicts have:                        │
│  - recentArticles: [...article objects]         │
│  - recentDataUpdated: timestamp                 │
└────────────┬────────────────────────────────────┘
             │
             ↓ Queries via API
┌─────────────────────────────────────────────────┐
│        Vercel Serverless API                    │
│        GET /api/conflicts                       │
├─────────────────────────────────────────────────┤
│  Returns ALL conflicts (curated + auto-ingested)│
│  Frontend filters in App.tsx                    │
└────────────┬────────────────────────────────────┘
             │
             ↓ Frontend filters
┌─────────────────────────────────────────────────┐
│          React Frontend                         │
│          (client/src/App.tsx)                   │
├─────────────────────────────────────────────────┤
│  Line 64:                                       │
│  filtered = filtered.filter(c =>                │
│    !c.isAutoIngested                            │
│  )                                              │
│                                                  │
│  → ONLY curated conflicts appear on map         │
│  → Auto-ingested conflicts hidden               │
└────────────┬────────────────────────────────────┘
             │
             ↓ User clicks conflict
┌─────────────────────────────────────────────────┐
│        ConflictSidebar.tsx                      │
│        Shows conflict details                   │
├─────────────────────────────────────────────────┤
│  Displays "Recent Developments" section:        │
│  - Shows recentArticles array                   │
│  - Up to 5 most recent articles                 │
│  - From last 7 days only                        │
│  - Updated timestamp shown                      │
│                                                  │
│  This is where auto-ingested data appears!      │
└─────────────────────────────────────────────────┘
```

---

## 🧠 Smart Matching Algorithm

**File:** `server/services/matching.ts`

### How It Works:

```typescript
function findMatchingCuratedConflict(
  autoConflict: { name, latitude, longitude, countries },
  curatedConflicts: Conflict[]
): Conflict | null
```

### Scoring System:

1. **Geographic Distance** (Haversine formula)
   - < 50km: +3 points
   - < 100km: +2 points
   - < 200km: +1 point
   - > 200km: Skip (no match)

2. **Country Overlap**
   - At least one common country: +3 points

3. **Name Similarity**
   - Word overlap > 30%: +2 points
   - Word overlap > 50%: +1 bonus point

4. **Match Threshold**
   - Minimum score: 4 points
   - Only matches to active conflicts (status != 'resolved')
   - Only matches to curated conflicts (isAutoIngested = false)

### Example Match:

```
Auto-ingested: "Gaza violence escalates"
  Location: 31.5°N, 34.4°E
  Countries: ["Israel"]

Curated: "Gaza-Israel War"
  Location: 31.5°N, 34.5°E
  Countries: ["Israel", "Palestine"]

Score:
  Distance: 10km → +3 points
  Country: Israel in both → +3 points
  Name: "Gaza" in both → +2 points
  Total: 8 points → MATCH! ✓
```

---

## 🛠️ Admin Workflow (Drizzle Studio)

### Reviewing Auto-Ingested Conflicts:

1. **Run Drizzle Studio:**
   ```bash
   npm run db:studio
   ```

2. **View conflicts table:**
   - Filter by `isAutoIngested = true`
   - Review auto-discovered conflicts

3. **Three Actions:**
   - **Promote:** Change `isAutoIngested` to `false` → Shows on map
   - **Match Manually:** Copy articles to existing curated conflict's `recentArticles`
   - **Delete:** Remove if not relevant

### Why Drizzle Studio?
- No authentication complexity
- Direct database access
- Simple UI for editing JSON fields (recentArticles)
- Fast for manual curation

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `client/src/App.tsx:64` | **Filters auto-ingested from map** |
| `server/services/ingestion.ts:247-298` | **Smart matching logic** |
| `server/services/matching.ts` | **Geographic & name matching** |
| `client/src/components/ConflictSidebar.tsx:130-198` | **Recent Developments UI** |
| `data/curated-conflicts.json` | **15 manually curated conflicts** |
| `scripts/seed-curated-conflicts.ts` | **Seed script for curated data** |
| `.github/workflows/ingest-conflicts.yml` | **Daily auto-ingestion cron** |

---

## 🎯 User Experience

### What Users See:
1. **Map:** Only 15 major curated conflicts with markers
2. **Click Conflict:** Sidebar opens with:
   - Overview (manual description)
   - Recent Developments (auto-updated articles)
   - Media & Coverage (manual links)
   - Educational Resources (manual links)

### What Users Don't See:
- Auto-ingested conflicts that didn't match
- The matching algorithm working behind the scenes
- Daily ingestion process

### Data Freshness:
- **Curated data:** Updated manually via Drizzle Studio
- **Recent articles:** Updated daily at 2 AM UTC via GitHub Actions
- **Article retention:** Last 7 days only

---

## 🔐 Safety & Risk Mitigation

### Why This Architecture is Safe:

1. **Auto-ingested conflicts hidden from map** → No misleading/low-quality data shown
2. **Smart matching validates before appending** → Geographic + country + name checks
3. **7-day article retention** → Old articles automatically filtered out
4. **Manual curation via Drizzle Studio** → Admin can review/delete bad matches
5. **Duplicate prevention** → Articles checked before appending

### Previous Risk (Avoided):
- Showing all auto-ingested conflicts on map → "too much risk"
- Low-quality/misleading severity levels → "these 'low' things can be highly misleading"

---

## 💰 Cost: $0/month

All services on free tiers:
- **Vercel:** Static hosting + serverless functions
- **Neon:** PostgreSQL database
- **GitHub Actions:** Daily cron job
- **Mapbox:** Map rendering

---

## 🚀 Quick Start

### Setup:
```bash
# Install dependencies
npm install

# Seed curated conflicts
npm run seed

# Push schema to database
npm run db:push

# Run Drizzle Studio (admin)
npm run db:studio
```

### Development:
```bash
# Frontend + backend
npm run dev

# Manual data ingestion
npm run ingest
```

### Deployment:
- Push to GitHub → Vercel auto-deploys
- GitHub Actions runs daily at 2 AM UTC

---

## ✅ Implementation Complete

This architecture successfully balances:
- **Data quality** (curated conflicts only on map)
- **Freshness** (auto-updated recent articles)
- **Safety** (smart matching prevents bad data)
- **Cost** (entirely free hosting)
- **Simplicity** (Drizzle Studio for admin)

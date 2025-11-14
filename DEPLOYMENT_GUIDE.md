# Conflict Tracker - Deployment Guide

## 🚀 Serverless Deployment (Zero Cost)

This guide will help you deploy the Conflict Tracker using free hosting services.

---

## 📋 Prerequisites

1. **Neon PostgreSQL Database** (Free tier - 0.5 GB)
   - Sign up at https://neon.tech
   - Create a new project
   - Copy the connection string (starts with `postgresql://`)

2. **GitHub Account** (for Actions and repository)

3. **Vercel Account** (Free tier - 100 GB bandwidth)
   - Sign up at https://vercel.com

4. **Mapbox Account** (Free tier - 50K map loads/month)
   - Sign up at https://mapbox.com
   - Get your access token from the dashboard

5. **ACLED API Key** (Optional - for better conflict data)
   - Sign up at https://acleddata.com/data-export-tool/
   - Free tier: 2,500 requests/day

---

## 🗄️ Step 1: Set Up Database

### 1.1 Create Neon PostgreSQL Database

1. Go to https://console.neon.tech
2. Create a new project: "conflict-tracker"
3. Copy your connection string
4. Save it somewhere safe (you'll need it for multiple steps)

### 1.2 Initialize Database Schema

```bash
# Set your database URL
export DATABASE_URL="postgresql://your-connection-string"

# Run migration to create tables
npm run db:push
```

You should see output confirming the `conflicts` and `users` tables were created.

### 1.3 Seed Curated Conflicts

Populate your database with major ongoing conflicts (Gaza, Ukraine, Sudan, etc.):

```bash
# Seed the database with 15 curated major conflicts
npm run seed
```

Expected output:
```
🌍 Seeding Database with Curated Conflicts
📂 Loaded 15 curated conflicts from file

   ✨ Added: Gaza-Israel War
   ✨ Added: Sudan Civil War
   ✨ Added: Ukraine-Russia War
   ...

✅ Seeding Completed
   ✨ Conflicts Added:   15
   🔄 Conflicts Updated: 0
   ❌ Errors:            0
```

**What this does:**
- Adds 15 major ongoing conflicts with proper historical start dates
- These conflicts won't be overwritten by auto-ingestion
- You can manually update them anytime by re-running `npm run seed`

**To add more conflicts:** See `/data/HOW_TO_ADD_CONFLICTS.md` for detailed instructions.

---

## 🔐 Step 2: Configure GitHub Secrets

Your GitHub Actions workflow needs access to the database to ingest data.

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets:

| Secret Name | Value | Required |
|------------|-------|----------|
| `DATABASE_URL` | Your Neon PostgreSQL connection string | ✅ Yes |
| `ACLED_API_KEY` | Your ACLED API key | ❌ Optional |
| `ACLED_EMAIL` | Your ACLED account email | ❌ Optional |

**Example:**
- **Name:** `DATABASE_URL`
- **Value:** `postgresql://user:pass@host.neon.tech/dbname?sslmode=require`

---

## ☁️ Step 3: Deploy to Vercel

### 3.1 Connect Repository to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Vercel will auto-detect Vite framework ✅

### 3.2 Configure Environment Variables

In the Vercel project settings, add these environment variables:

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | Your Neon PostgreSQL connection string | ✅ Yes |
| `MAPBOX_ACCESS_TOKEN` | Your Mapbox token | ✅ Yes |
| `ACLED_API_KEY` | Your ACLED API key | ❌ Optional |
| `ACLED_EMAIL` | Your ACLED account email | ❌ Optional |

**How to add:**
1. Project Settings → Environment Variables
2. Add each variable
3. Select all environments (Production, Preview, Development)

### 3.3 Deploy

1. Click **Deploy**
2. Wait ~2-3 minutes for build to complete
3. Your site will be live at `https://your-project.vercel.app`

---

## 🤖 Step 4: Enable GitHub Actions

### 4.1 Verify Workflow File

The workflow is already created at `.github/workflows/ingest-conflicts.yml`

It will run:
- **Daily at 2:00 AM UTC** (automatically)
- **Manually** when you trigger it

### 4.2 Manual Test Run

1. Go to your GitHub repository
2. Navigate to **Actions** tab
3. Click **Ingest Conflict Data** workflow
4. Click **Run workflow** → **Run workflow**
5. Watch the logs to ensure it completes successfully

Expected output:
```
✅ Conflict data ingestion completed successfully
   ✨ Conflicts Added:   12
   🔄 Conflicts Updated: 5
   ❌ Errors:            0
   📊 Data Sources:      GDELT, RSS
```

---

## ✅ Step 5: Verify Deployment

### 5.1 Check Website

1. Visit your Vercel URL
2. You should see the 3D globe
3. Conflicts should appear on the map

### 5.2 Check API Endpoint

Visit: `https://your-project.vercel.app/api/conflicts`

You should see JSON output:
```json
[
  {
    "id": "...",
    "name": "...",
    "casualties": 123,
    ...
  }
]
```

### 5.3 Check Database

```bash
# Connect to Neon database
npm run db:studio

# Or query directly
psql $DATABASE_URL -c "SELECT COUNT(*) FROM conflicts;"
```

---

## 🔄 How Updates Work

### Automatic Updates

1. **GitHub Actions runs daily at 2 AM UTC**
2. Fetches data from GDELT, RSS, and ACLED
3. Updates Neon PostgreSQL database
4. **No redeployment needed!**

### User Experience

1. User visits your site
2. Vercel serves static React frontend
3. Frontend calls `/api/conflicts`
4. Vercel serverless function queries Neon DB
5. Returns latest conflicts (cached for 10 minutes)

### Manual Data Refresh

To manually trigger data ingestion:

**Option A: GitHub Actions**
1. Go to Actions tab
2. Run "Ingest Conflict Data" workflow

**Option B: Local Script**
```bash
export DATABASE_URL="your-connection-string"
npm run ingest
```

---

## 📊 Expected Costs

| Service | Free Tier Limit | Expected Usage | Cost |
|---------|----------------|----------------|------|
| **Neon PostgreSQL** | 0.5 GB storage | ~50 MB | $0 |
| **Vercel Hosting** | 100 GB bandwidth | ~5-10 GB/month | $0 |
| **Vercel Functions** | 100 GB-hours | ~2 GB-hours | $0 |
| **GitHub Actions** | 2,000 minutes | ~50 minutes/month | $0 |
| **Mapbox** | 50K map loads | ~5-10K loads | $0 |
| **Total** | | | **$0/month** |

---

## 🛠️ Troubleshooting

### Problem: No conflicts showing on map

**Solution:**
1. Check if data ingestion ran: GitHub Actions → Check latest workflow run
2. Check database: `psql $DATABASE_URL -c "SELECT COUNT(*) FROM conflicts;"`
3. Check API: Visit `/api/conflicts` - should return JSON array
4. Check browser console for errors

### Problem: GitHub Actions failing

**Solution:**
1. Check if `DATABASE_URL` secret is set correctly
2. Verify connection string has `?sslmode=require` at the end
3. Check workflow logs for specific error message

### Problem: Vercel build failing

**Solution:**
1. Check if all environment variables are set
2. Verify `package.json` has all dependencies
3. Check Vercel build logs for errors

### Problem: API returning 500 error

**Solution:**
1. Check Vercel function logs (Vercel dashboard → Functions)
2. Verify `DATABASE_URL` environment variable is set in Vercel
3. Test database connection: `psql $DATABASE_URL -c "SELECT 1;"`

---

## 🔧 Advanced Configuration

### Change Update Frequency

Edit `.github/workflows/ingest-conflicts.yml`:

```yaml
on:
  schedule:
    # Every 6 hours
    - cron: '0 */6 * * *'

    # Every hour
    - cron: '0 * * * *'

    # Daily at 2 AM UTC (default)
    - cron: '0 2 * * *'
```

### Change Data Time Range

Edit `scripts/ingest.ts`:

```typescript
// Fetch last 30 days instead of 7
const results = await ingestionService.ingestRecentData(30);
```

### Adjust API Cache Duration

Edit `api/conflicts.ts`:

```typescript
// Cache for 5 minutes instead of 10
res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=900');
```

---

## 📚 Next Steps

1. ✅ Deploy site
2. ✅ Verify data ingestion works
3. ✅ Test on mobile devices
4. 🔜 Add custom domain (Vercel supports this for free)
5. 🔜 Set up analytics (optional - Vercel Analytics or Plausible)
6. 🔜 Monitor uptime (optional - UptimeRobot free tier)

---

## 📞 Support

- **GitHub Issues:** Report bugs or request features
- **Vercel Docs:** https://vercel.com/docs
- **Neon Docs:** https://neon.tech/docs
- **Mapbox Docs:** https://docs.mapbox.com

---

**Deployment Date:** 2025-11-14
**Status:** Production Ready ✅
**Estimated Setup Time:** 30 minutes

# Conflict Tracker - Setup Guide

Complete guide to get the conflict tracker up and running with real-time data updates.

## Prerequisites

- Node.js 18+ installed
- A PostgreSQL database (free options: Neon, Supabase, Railway)
- API keys for data sources (ACLED, Mapbox)

## Step 1: Clone and Install

```bash
git clone <your-repo>
cd conflict-tracker
npm install
```

## Step 2: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Fill in your credentials in `.env`:

### Required for Basic Operation:

```env
# Mapbox for globe visualization
MAPBOX_ACCESS_TOKEN=pk.your_mapbox_token_here
```

### Required for Real-Time Data Updates:

```env
# PostgreSQL Database (get free from neon.tech)
DATABASE_URL=postgresql://user:password@host:5432/database

# ACLED API (register at developer.acleddata.com)
ACLED_API_KEY=your_acled_api_key_here
ACLED_EMAIL=your_email@example.com
```

### Optional for AI Features:

```env
# OpenAI or Anthropic for AI summaries (future feature)
OPENAI_API_KEY=sk-your_key_here
# OR
ANTHROPIC_API_KEY=sk-ant-your_key_here
```

## Step 3: Set Up Database

### Get a Free PostgreSQL Database

**Option A: Neon (Recommended)**
1. Visit https://neon.tech
2. Sign up and create a new project
3. Copy the connection string

**Option B: Supabase**
1. Visit https://supabase.com
2. Create a new project
3. Get connection string from Settings > Database

### Push Schema and Migrate Data

```bash
# Push database schema
npm run db:push

# Import existing conflicts from JSON
npm run db:migrate
```

## Step 4: Get API Keys

### Mapbox (Required)
1. Visit https://account.mapbox.com/access-tokens/
2. Create a new token with default public scopes
3. Add to `.env` as `MAPBOX_ACCESS_TOKEN`

### ACLED (Required for auto-updates)
1. Visit https://developer.acleddata.com/
2. Register for a free account
3. Verify your email
4. Get your API key and add to `.env`

## Step 5: Run the Application

### Development Mode
```bash
npm run dev
```

Open http://localhost:5000 in your browser.

### Production Build
```bash
npm run build
npm start
```

## Features

### ✅ Implemented

- **3D Globe Visualization**: Interactive Mapbox globe with satellite imagery
- **Filtering System**: Filter by region, severity, timeline, and search
- **Real-time Updates**: WebSocket connection for live conflict updates
- **Comparison View**: Compare up to 4 conflicts side-by-side
- **Data Export**: Export filtered data
- **PostgreSQL Database**: Persistent storage with Drizzle ORM
- **ACLED Integration**: Automatic daily data updates from ACLED API
- **Scheduled Jobs**:
  - Daily full ingestion (last 7 days)
  - Hourly checks for critical updates
- **Admin Panel**: Manual data refresh and system status

### 🔧 How It Works

1. **Automatic Updates**:
   - Server runs scheduled jobs to fetch new conflict data from ACLED
   - Data is processed, deduplicated, and saved to PostgreSQL
   - Updates are broadcast to all connected clients via WebSocket

2. **Manual Updates**:
   - Click the settings icon (bottom right)
   - Click "Fetch Latest Conflicts" to manually trigger data ingestion
   - New conflicts appear in real-time on the globe

3. **Data Flow**:
   ```
   ACLED API → Ingestion Service → PostgreSQL → WebSocket → Client
   ```

## Troubleshooting

### "Using file-based conflict storage" Warning

**Issue**: Database not configured, app falls back to static JSON data.

**Fix**:
1. Ensure `DATABASE_URL` is set in `.env`
2. Run `npm run db:push` to create tables
3. Restart the server

### No Conflicts Appearing

**Check**:
1. Database has data: Run `npm run db:studio` to open Drizzle Studio
2. ACLED credentials are valid in `.env`
3. Run manual ingestion from Admin Panel
4. Check server logs for errors

### ACLED API Errors

**Common Issues**:
- API key not activated (check email for verification)
- Rate limits exceeded (free tier: 2,500 requests/day)
- Invalid email/key combination

**Fix**:
1. Verify credentials at https://developer.acleddata.com/
2. Check server logs for specific error messages
3. Wait if rate limited (resets daily)

### WebSocket Not Connecting

**Check**:
1. WebSocket port is accessible (should be same as HTTP server)
2. No proxy/firewall blocking WebSocket connections
3. Admin panel shows "Connected" status

## Database Management

### View Data
```bash
npm run db:studio
```
Opens Drizzle Studio at http://localhost:4983

### Reset Database
```bash
# Be careful - this deletes all data!
npm run db:push
npm run db:migrate
```

### Backup Data
Use your database provider's backup tools (Neon has automatic backups)

## Development Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Run production server
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Import JSON data to database
- `npm run db:studio` - Open database GUI

## Next Steps

Now that you have the basic system running:

1. **Monitor Data**: Check Admin Panel regularly to see new conflicts appearing
2. **Adjust Filters**: Test different filter combinations to explore data
3. **Review Conflicts**: Click on markers to see detailed information
4. **Export Data**: Use the Export button to download filtered data
5. **Share Views**: URL updates with filter state for easy sharing

## Advanced Configuration

### Adjust Update Frequency

Edit `server/services/scheduler.ts`:
- Daily ingestion: Change `24 * 60 * 60 * 1000` (24 hours)
- Hourly checks: Change `60 * 60 * 1000` (1 hour)

### Add More Data Sources

Create new services in `server/services/` following the pattern in `acled.ts`

### Customize Conflict Severity

Edit `server/services/acled.ts` → `calculateSeverity()` method

## Support

- GitHub Issues: [Your repo URL]
- ACLED Docs: https://apidocs.acleddata.com/
- Drizzle Docs: https://orm.drizzle.team/

## License

MIT

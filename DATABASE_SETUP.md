# Database Setup Guide

This project uses PostgreSQL with Drizzle ORM for data persistence.

## Quick Setup (Recommended: Neon)

### 1. Create a Free PostgreSQL Database

**Option A: Neon (Recommended)**
1. Visit [neon.tech](https://neon.tech)
2. Sign up for a free account
3. Create a new project
4. Copy the connection string (starts with `postgresql://`)

**Option B: Railway**
1. Visit [railway.app](https://railway.app)
2. Create a new PostgreSQL database
3. Copy the connection string

**Option C: Supabase**
1. Visit [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > Database and copy the connection string

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your database URL to `.env`:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/database
   ```

### 3. Push Schema to Database

```bash
npm run db:push
```

This will create all necessary tables in your database.

### 4. Migrate Existing Data

```bash
npm run db:migrate
```

This will import all conflicts from `client/src/data/conflicts.json` into your database.

### 5. Start the Application

```bash
npm run dev
```

## Database Scripts

- `npm run db:push` - Push schema changes to database (development)
- `npm run db:generate` - Generate migration files (production)
- `npm run db:migrate` - Import data from JSON to database
- `npm run db:studio` - Open Drizzle Studio (database GUI)

## Troubleshooting

### "DATABASE_URL not found" Error

If you see this error, the application will fall back to file-based storage. To fix:
1. Ensure `.env` file exists in project root
2. Verify `DATABASE_URL` is set correctly
3. Restart the server

### Connection Issues

- Ensure your database is accessible from your current network
- Check that the connection string includes all required parameters
- Verify SSL mode if required (add `?sslmode=require` to connection string)

### Migration Fails

If data migration fails:
1. Check that the schema was pushed successfully (`npm run db:push`)
2. Verify the JSON file exists at `client/src/data/conflicts.json`
3. Check database logs for specific error messages

## Database Schema

### Conflicts Table

```sql
CREATE TABLE conflicts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  start_date TIMESTAMP NOT NULL,
  casualties INTEGER NOT NULL DEFAULT 0,
  countries JSONB NOT NULL,
  region TEXT NOT NULL,
  severity TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  description TEXT NOT NULL,
  media_links JSONB NOT NULL,
  educational_resources JSONB NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## Next Steps

After database setup:
1. Set up API keys for data sources (ACLED, OpenAI)
2. Run the data ingestion service
3. Configure scheduled jobs for automatic updates

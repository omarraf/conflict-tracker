import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { getDb } from './db';

async function createTables() {
  console.log('Creating database tables...');

  const db = getDb();

  try {
    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      )
    `);
    console.log('✓ Created users table');

    // Create conflicts table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS conflicts (
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
      )
    `);
    console.log('✓ Created conflicts table');

    console.log('\n✅ All tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

createTables();

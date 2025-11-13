import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon to use ws for WebSocket connections
neonConfig.webSocketConstructor = ws;

let db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!db) {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      console.warn("DATABASE_URL not found, database operations will fail");
      throw new Error("DATABASE_URL environment variable is required");
    }

    const pool = new Pool({ connectionString: databaseUrl });
    db = drizzle(pool, { schema });
  }

  return db;
}

export type DB = ReturnType<typeof getDb>;

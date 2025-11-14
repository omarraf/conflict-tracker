import { users, conflicts, type User, type InsertUser, type Conflict, type InsertConflict } from "@shared/schema";
import { getDb } from "./db";
import { eq } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Conflict methods
  getConflicts(): Promise<Conflict[]>;
  getConflict(id: string): Promise<Conflict | undefined>;
  createConflict(conflict: InsertConflict): Promise<Conflict>;
  updateConflict(id: string, conflict: Partial<InsertConflict>): Promise<Conflict | undefined>;
  deleteConflict(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Conflict methods - fallback to file-based storage for development
  async getConflicts(): Promise<Conflict[]> {
    console.warn("Using file-based conflict storage. Set DATABASE_URL to use PostgreSQL.");
    // Return empty array - frontend will fallback to its own data
    return [];
  }

  async getConflict(id: string): Promise<Conflict | undefined> {
    console.warn("Using file-based conflict storage. Set DATABASE_URL to use PostgreSQL.");
    return undefined;
  }

  async createConflict(conflict: InsertConflict): Promise<Conflict> {
    throw new Error("Database not configured. Set DATABASE_URL environment variable.");
  }

  async updateConflict(id: string, conflict: Partial<InsertConflict>): Promise<Conflict | undefined> {
    throw new Error("Database not configured. Set DATABASE_URL environment variable.");
  }

  async deleteConflict(id: string): Promise<boolean> {
    throw new Error("Database not configured. Set DATABASE_URL environment variable.");
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  private db: ReturnType<typeof getDb>;

  constructor() {
    this.db = getDb();
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getConflicts(): Promise<Conflict[]> {
    return await this.db.select().from(conflicts);
  }

  async getConflict(id: string): Promise<Conflict | undefined> {
    const result = await this.db.select().from(conflicts).where(eq(conflicts.id, id));
    return result[0];
  }

  async createConflict(conflict: InsertConflict): Promise<Conflict> {
    const result = await this.db.insert(conflicts).values(conflict).returning();
    return result[0];
  }

  async updateConflict(id: string, conflictUpdate: Partial<InsertConflict>): Promise<Conflict | undefined> {
    const result = await this.db
      .update(conflicts)
      .set({ ...conflictUpdate, updatedAt: new Date() })
      .where(eq(conflicts.id, id))
      .returning();
    return result[0];
  }

  async deleteConflict(id: string): Promise<boolean> {
    const result = await this.db.delete(conflicts).where(eq(conflicts.id, id)).returning();
    return result.length > 0;
  }
}

// Use database storage if DATABASE_URL is available, otherwise fallback to memory
export const storage = process.env.DATABASE_URL
  ? new DatabaseStorage()
  : new MemStorage();

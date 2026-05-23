import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb, date } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Conflicts table matching the Conflict type
export const conflicts = pgTable("conflicts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  startDate: timestamp("start_date").notNull(),
  casualties: integer("casualties").notNull().default(0),
  countries: jsonb("countries").notNull().$type<string[]>(),
  region: text("region").notNull(),
  severity: text("severity").notNull().$type<'low' | 'medium' | 'high' | 'critical'>(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  description: text("description").notNull(),
  mediaLinks: jsonb("media_links").notNull().$type<{
    type: 'image' | 'video' | 'article';
    url: string;
    title: string;
  }[]>(),
  educationalResources: jsonb("educational_resources").notNull().$type<{
    title: string;
    url: string;
  }[]>(),
  status: text("status").notNull().$type<'active' | 'resolved' | 'ongoing'>(),

  // Recent auto-updated data from news sources
  recentArticles: jsonb("recent_articles").$type<{
    url: string;
    title: string;
    source: string;
    publishedAt: string;
  }[]>().default([]),
  recentSummary: text("recent_summary"),
  recentDataUpdated: timestamp("recent_data_updated"),

  // Flag to distinguish curated vs auto-ingested conflicts
  isAutoIngested: boolean("is_auto_ingested").notNull().default(false),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertConflictSchema = createInsertSchema(conflicts, {
  startDate: z.string().or(z.date()),
  countries: z.array(z.string()),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  mediaLinks: z.array(z.object({
    type: z.enum(['image', 'video', 'article']),
    url: z.string(),
    title: z.string(),
  })),
  educationalResources: z.array(z.object({
    title: z.string(),
    url: z.string(),
  })),
  status: z.enum(['active', 'resolved', 'ongoing']),
  recentArticles: z.array(z.object({
    url: z.string(),
    title: z.string(),
    source: z.string(),
    publishedAt: z.string(),
  })).optional(),
  recentSummary: z.string().optional(),
  recentDataUpdated: z.string().or(z.date()).optional(),
  isAutoIngested: z.boolean().optional(),
});

export const selectConflictSchema = createSelectSchema(conflicts);

export type InsertConflict = z.infer<typeof insertConflictSchema>;
export type Conflict = typeof conflicts.$inferSelect;

// ── Raw ingestion tables (written by Kafka consumer, read by dbt) ────────────

export const rawGdeltEvents = pgTable("raw_gdelt_events", {
  id: serial("id").primaryKey(),
  ingestedAt: timestamp("ingested_at").notNull().defaultNow(),
  countryCode: text("country_code").notNull(),
  country: text("country").notNull(),
  region: text("region").notNull(),
  severity: text("severity").notNull().$type<'low' | 'medium' | 'high' | 'critical'>(),
  avgTone: real("avg_tone").notNull(),
  articleCount: integer("article_count").notNull(),
  rawPayload: jsonb("raw_payload").notNull(),
});

export const rawAcledEvents = pgTable("raw_acled_events", {
  id: serial("id").primaryKey(),
  ingestedAt: timestamp("ingested_at").notNull().defaultNow(),
  eventDate: text("event_date").notNull(),
  country: text("country").notNull(),
  location: text("location").notNull().default(''),
  eventType: text("event_type").notNull().default(''),
  fatalities: integer("fatalities").notNull().default(0),
  rawPayload: jsonb("raw_payload").notNull(),
});

export const rawRssArticles = pgTable("raw_rss_articles", {
  id: serial("id").primaryKey(),
  ingestedAt: timestamp("ingested_at").notNull().defaultNow(),
  publishedAt: text("published_at").notNull().default(''),
  title: text("title").notNull(),
  url: text("url").notNull().unique(),
  sourceFeed: text("source_feed").notNull().default(''),
  rawPayload: jsonb("raw_payload").notNull(),
});

export type InsertRawGdeltEvent = typeof rawGdeltEvents.$inferInsert;
export type InsertRawAcledEvent = typeof rawAcledEvents.$inferInsert;
export type InsertRawRssArticle = typeof rawRssArticles.$inferInsert;

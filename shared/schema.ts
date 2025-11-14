import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
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
});

export const selectConflictSchema = createSelectSchema(conflicts);

export type InsertConflict = z.infer<typeof insertConflictSchema>;
export type Conflict = typeof conflicts.$inferSelect;

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  title: text("title"),
  projects: jsonb("projects").$type<string[]>().default([]),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiry: timestamp("token_expiry"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cities = pgTable("cities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cityId: text("city_id").notNull().unique(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  locode: text("locode"),
  projectId: text("project_id").notNull(),
  currentBoundary: jsonb("current_boundary").$type<any>(),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const boundaries = pgTable("boundaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  osmId: text("osm_id").notNull(),
  osmType: text("osm_type").notNull(), // 'way' or 'relation'
  cityId: text("city_id").notNull(),
  name: text("name").notNull(),
  adminLevel: text("admin_level"),
  boundaryType: text("boundary_type"), // 'administrative', 'political', etc.
  area: text("area"), // in km²
  geometry: jsonb("geometry").$type<any>().notNull(),
  tags: jsonb("tags").$type<Record<string, any>>().default({}),
  score: text("score"), // boundary matching score
  isSelected: boolean("is_selected").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  token: text("token").notNull(),
  codeVerifier: text("code_verifier"),
  state: text("state"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCitySchema = createInsertSchema(cities).omit({
  id: true,
  createdAt: true,
});

export const insertBoundarySchema = createInsertSchema(boundaries).omit({
  id: true,
  createdAt: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type City = typeof cities.$inferSelect;
export type InsertCity = z.infer<typeof insertCitySchema>;

export type Boundary = typeof boundaries.$inferSelect;
export type InsertBoundary = z.infer<typeof insertBoundarySchema>;

export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;

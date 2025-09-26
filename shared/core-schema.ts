import { sql } from 'drizzle-orm';
import { pgTable, text, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Generic core entities that are reusable across all modules
export const users = pgTable('users', {
  id: varchar('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  title: text('title'),
  projects: jsonb('projects').$type<string[]>().default([]),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  tokenExpiry: timestamp('token_expiry'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const cities = pgTable('cities', {
  id: varchar('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  cityId: text('city_id').notNull().unique(),
  name: text('name').notNull(),
  country: text('country').notNull(),
  locode: text('locode'),
  projectId: text('project_id').notNull(),
  currentBoundary: jsonb('current_boundary').$type<any>(),
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
  createdAt: timestamp('created_at').defaultNow(),
});

export const sessions = pgTable('sessions', {
  id: varchar('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: text('user_id').notNull(),
  token: text('token').notNull(),
  codeVerifier: text('code_verifier'),
  state: text('state'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
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

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type City = typeof cities.$inferSelect;
export type InsertCity = z.infer<typeof insertCitySchema>;

export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Core database schemas for CityCatalyst OAuth integration template.
 * 
 * This file defines the essential database entities needed for a complete
 * CityCatalyst OAuth 2.0 PKCE integration including user management,
 * city data storage, and session handling.
 * 
 * @fileoverview Database schemas for CityCatalyst API integration
 * @version 1.0.0
 */

/**
 * Users table schema for CityCatalyst OAuth integration.
 * 
 * Stores user information obtained through CityCatalyst's OAuth flow,
 * including authentication tokens and associated project access.
 * 
 * @example
 * ```typescript
 * const user = await storage.createUser({
 *   email: "user@citycatalyst.org",
 *   name: "Jane Doe",
 *   title: "Climate Manager",
 *   projects: ["project-1", "project-2"],
 *   accessToken: "cc_access_token",
 *   refreshToken: "cc_refresh_token",
 *   tokenExpiry: new Date(Date.now() + 3600000)
 * });
 * ```
 */
export const users = pgTable("users", {
  /** Unique user identifier (auto-generated UUID) */
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  /** User's email address from CityCatalyst profile (unique) */
  email: text("email").notNull().unique(),
  
  /** User's full name from CityCatalyst profile */
  name: text("name").notNull(),
  
  /** User's job title/role from CityCatalyst profile (optional) */
  title: text("title"),
  
  /** Array of CityCatalyst project IDs the user has access to */
  projects: jsonb("projects").$type<string[]>().default([]),
  
  /** OAuth 2.0 access token for CityCatalyst API calls */
  accessToken: text("access_token"),
  
  /** OAuth 2.0 refresh token for token renewal */
  refreshToken: text("refresh_token"),
  
  /** Timestamp when the access token expires */
  tokenExpiry: timestamp("token_expiry"),
  
  /** When this user record was created */
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * Cities table schema for CityCatalyst city data.
 * 
 * Stores city information retrieved from CityCatalyst API, including
 * project associations and boundary data for visualization and analysis.
 * 
 * @example
 * ```typescript
 * const city = await storage.createCity({
 *   cityId: "city-buenos-aires",
 *   name: "Buenos Aires",
 *   country: "Argentina", 
 *   locode: "AR BAI",
 *   projectId: "project-south-america",
 *   currentBoundary: { type: "Polygon", coordinates: [...] },
 *   metadata: { population: 3000000, area: 203.5 }
 * });
 * ```
 */
export const cities = pgTable("cities", {
  /** Unique city identifier (auto-generated UUID) */
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  /** CityCatalyst city identifier (unique across system) */
  cityId: text("city_id").notNull().unique(),
  
  /** Official city name */
  name: text("name").notNull(),
  
  /** Country where the city is located */
  country: text("country").notNull(),
  
  /** UN/LOCODE identifier for the city (format: "CC CCC") */
  locode: text("locode"),
  
  /** CityCatalyst project ID this city belongs to */
  projectId: text("project_id").notNull(),
  
  /** Current boundary data as GeoJSON for map visualization */
  currentBoundary: jsonb("current_boundary").$type<any>(),
  
  /** Additional city metadata (population, area, region, etc.) */
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  
  /** When this city record was created */
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * Sessions table schema for OAuth session management.
 * 
 * Manages OAuth 2.0 PKCE flow sessions including state validation,
 * code verifiers, and user authentication state.
 * 
 * @example
 * ```typescript
 * const session = await storage.createSession({
 *   userId: "user-123",
 *   token: "session_token_xyz",
 *   codeVerifier: "pkce_code_verifier",
 *   state: "oauth_state_value",
 *   expiresAt: new Date(Date.now() + 600000) // 10 minutes
 * });
 * ```
 */
export const sessions = pgTable("sessions", {
  /** Unique session identifier (auto-generated UUID) */
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  /** User ID this session belongs to */
  userId: text("user_id").notNull(),
  
  /** Session token for authentication */
  token: text("token").notNull(),
  
  /** PKCE code verifier for OAuth flow security */
  codeVerifier: text("code_verifier"),
  
  /** OAuth state parameter for CSRF protection */
  state: text("state"),
  
  /** When this session expires */
  expiresAt: timestamp("expires_at").notNull(),
  
  /** When this session was created */
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================================
// INSERT SCHEMAS & VALIDATION
// ============================================================================

/**
 * Zod schema for validating user creation data.
 * 
 * Automatically excludes auto-generated fields (id, createdAt) and
 * provides type-safe validation for all user input.
 * 
 * @example
 * ```typescript
 * const userData = insertUserSchema.parse({
 *   email: "user@example.com",
 *   name: "John Doe",
 *   projects: ["proj-1"]
 * });
 * ```
 */
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

/**
 * Zod schema for validating city creation data.
 * 
 * Automatically excludes auto-generated fields and provides
 * validation for CityCatalyst city data structures.
 * 
 * @example
 * ```typescript
 * const cityData = insertCitySchema.parse({
 *   cityId: "buenos-aires",
 *   name: "Buenos Aires",
 *   country: "Argentina",
 *   projectId: "project-1"
 * });
 * ```
 */
export const insertCitySchema = createInsertSchema(cities).omit({
  id: true,
  createdAt: true,
});

/**
 * Zod schema for validating session creation data.
 * 
 * Ensures proper OAuth session data validation including
 * required fields and expiration handling.
 * 
 * @example
 * ```typescript
 * const sessionData = insertSessionSchema.parse({
 *   userId: "user-123",
 *   token: "session-token",
 *   expiresAt: new Date(Date.now() + 600000)
 * });
 * ```
 */
export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
});

// ============================================================================
// TYPESCRIPT TYPES
// ============================================================================

/**
 * Complete user record type inferred from database schema.
 * 
 * Represents a fully populated user with all database fields
 * including auto-generated ones (id, createdAt).
 * 
 * @example
 * ```typescript
 * const user: User = {
 *   id: "uuid-123",
 *   email: "user@example.com",
 *   name: "John Doe",
 *   title: "Manager",
 *   projects: ["proj-1"],
 *   accessToken: "token",
 *   refreshToken: "refresh",
 *   tokenExpiry: new Date(),
 *   createdAt: new Date()
 * };
 * ```
 */
export type User = typeof users.$inferSelect;

/**
 * User input type for creating new users.
 * 
 * Contains only the fields that can be provided when creating
 * a user (excludes auto-generated fields).
 * 
 * @example
 * ```typescript
 * const newUser: InsertUser = {
 *   email: "user@example.com",
 *   name: "John Doe",
 *   projects: ["project-1"]
 * };
 * ```
 */
export type InsertUser = z.infer<typeof insertUserSchema>;

/**
 * Complete city record type inferred from database schema.
 * 
 * Represents a fully populated city with all database fields
 * including boundary data and metadata.
 * 
 * @example
 * ```typescript
 * const city: City = {
 *   id: "uuid-456",
 *   cityId: "buenos-aires", 
 *   name: "Buenos Aires",
 *   country: "Argentina",
 *   locode: "AR BAI",
 *   projectId: "project-1",
 *   currentBoundary: { type: "Polygon", coordinates: [...] },
 *   metadata: { population: 3000000 },
 *   createdAt: new Date()
 * };
 * ```
 */
export type City = typeof cities.$inferSelect;

/**
 * City input type for creating new cities.
 * 
 * Contains only the fields that can be provided when creating
 * a city record from CityCatalyst API data.
 * 
 * @example
 * ```typescript
 * const newCity: InsertCity = {
 *   cityId: "city-id",
 *   name: "Sample City",
 *   country: "Country Name",
 *   projectId: "project-1"
 * };
 * ```
 */
export type InsertCity = z.infer<typeof insertCitySchema>;

/**
 * Complete session record type inferred from database schema.
 * 
 * Represents a fully populated OAuth session with all
 * authentication and state management fields.
 * 
 * @example
 * ```typescript
 * const session: Session = {
 *   id: "uuid-789",
 *   userId: "user-123",
 *   token: "session-token",
 *   codeVerifier: "pkce-verifier",
 *   state: "oauth-state",
 *   expiresAt: new Date(),
 *   createdAt: new Date()
 * };
 * ```
 */
export type Session = typeof sessions.$inferSelect;

/**
 * Session input type for creating new sessions.
 * 
 * Contains the fields needed to create a new OAuth session
 * during the authentication flow.
 * 
 * @example
 * ```typescript
 * const newSession: InsertSession = {
 *   userId: "user-123",
 *   token: "session-token",
 *   expiresAt: new Date(Date.now() + 600000)
 * };
 * ```
 */
export type InsertSession = z.infer<typeof insertSessionSchema>;
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Boundary-specific entities for the boundary editing module
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

// Insert schema
export const insertBoundarySchema = createInsertSchema(boundaries).omit({
  id: true,
  createdAt: true,
});

// Types
export type Boundary = typeof boundaries.$inferSelect;
export type InsertBoundary = z.infer<typeof insertBoundarySchema>;
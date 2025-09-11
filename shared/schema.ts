/**
 * Main schema file that re-exports core schemas for the CityCatalyst OAuth integration template.
 * 
 * This template demonstrates how to integrate with CityCatalyst's OAuth 2.0 PKCE flow
 * and API endpoints for retrieving city data, inventories, and boundaries.
 * 
 * @example
 * ```typescript
 * import { User, City, InsertUser, insertUserSchema } from "@shared/schema";
 * 
 * // Use the schemas for type-safe database operations
 * const newUser: InsertUser = {
 *   email: "user@example.com",
 *   name: "John Doe",
 *   projects: ["project-1", "project-2"]
 * };
 * ```
 */

export * from "./core-schema";

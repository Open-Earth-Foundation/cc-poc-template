// Main schema file that re-exports core schemas for backward compatibility
// This ensures existing code continues to work while we transition to modular schemas

export * from "./core-schema";

// Note: Boundary-specific schemas are now in ./boundary-schema.ts
// Import them directly when needed: import { Boundary, insertBoundarySchema } from "@shared/boundary-schema";

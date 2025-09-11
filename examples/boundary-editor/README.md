# Boundary Editor Module (Example)

This directory contains the complete Boundary Editor module that was moved from the main application to serve as a reference implementation.

## Overview

The Boundary Editor is a comprehensive module that provides:
- Interactive OpenStreetMap boundary selection
- City boundary visualization and editing
- Integration with OSM Overpass API for boundary data
- GeoJSON export functionality

## Structure

```
boundary-editor/
├── client/
│   └── boundary/           # Moved from client/src/modules/boundary/
│       ├── components/     # React components for boundary editing
│       ├── hooks/          # Custom hooks for boundary operations
│       ├── pages/          # Boundary editor page component
│       ├── services/       # OSM API integration services
│       └── types/          # TypeScript type definitions
└── server/
    └── boundary/           # Moved from server/modules/boundary/
        ├── services/       # Server-side OSM services
        └── routes.ts       # API routes for boundary operations
```

## Key Features

### Client Components
- **BoundaryEditor**: Main page component for boundary editing interface
- **EnhancedBoundaryCard**: Card component displaying boundary information
- **BoundaryModal**: Modal for detailed boundary view and selection
- **BoundaryMap**: Interactive map component using Leaflet
- **MiniMap**: Compact map preview component

### Server Integration
- **OSM Overpass API**: Integration for fetching boundary data
- **GeoJSON Processing**: Server-side geometry processing
- **Boundary Selection**: API endpoints for boundary management

### Hooks & Services
- **useBoundarySearch**: Hook for searching OSM boundaries
- **useBoundarySelection**: Hook for boundary selection operations
- **osmService**: Client-side service for OSM API calls

## Usage in Main Application

The boundary module was integrated through the modular routing system:

1. **Module Registry**: Defined in `client/src/core/routing/module-registry.ts`
2. **Dynamic Routes**: Loaded via `DynamicModuleRoutes` component
3. **Server Routes**: Registered via `registerBoundaryRoutes()` function

## Re-enabling the Module

To re-enable this module in the main application:

### Client Side
1. Move `client/boundary/` back to `client/src/modules/boundary/`
2. Add boundary module back to `module-registry.ts`:
   ```typescript
   import BoundaryEditor from "@/modules/boundary/pages/boundary-editor";
   
   export const moduleRegistry: ModuleRegistry = {
     boundary: {
       id: "boundary",
       name: "Boundary Editor",
       description: "Interactive OpenStreetMap boundary selection and editing",
       routes: [
         {
           path: "/boundary-editor/:cityId",
           component: BoundaryEditor,
         },
       ],
       enabled: true,
     },
     // ... other modules
   };
   ```

### Server Side
1. Move `server/boundary/` back to `server/modules/boundary/`
2. Add import and registration in `server/routes.ts`:
   ```typescript
   import { registerBoundaryRoutes } from "./modules/boundary/routes";
   
   export async function registerRoutes(app: Express): Promise<Server> {
     // ... existing routes
     
     // Register module routes
     registerBoundaryRoutes(app);
     
     // ... rest of function
   }
   ```

## Dependencies

### Client Dependencies
- `@tanstack/react-query` - Data fetching and caching
- `leaflet` - Map visualization
- `wouter` - Routing
- `lucide-react` - Icons

### Server Dependencies
- `express` - Web framework
- `node-fetch` - HTTP client for OSM API calls

### API Endpoints Used
- **Overpass API**: For OSM boundary data queries
- **CityCatalyst API**: For city information integration

## Configuration

### Environment Variables
```env
# OSM Overpass API URL (optional, has default)
OVERPASS_API_URL=https://overpass-api.de/api/interpreter
```

## Notes

- This module demonstrates advanced integration patterns with external APIs
- Includes comprehensive error handling and loading states
- Uses modular architecture for easy integration/removal
- Provides good reference for building similar geographic data modules

To understand the full implementation details, examine the source code in the respective directories.
# Overview

The Enhanced Boundary Editor is a standalone React + Express web application that allows users to view, explore, and select city boundaries from OpenStreetMap (OSM) data. The application integrates with CityCatalyst's OAuth 2.0 authentication system and provides an interactive mapping interface for boundary visualization and selection.

The system enables urban planners, GIS professionals, and researchers to discover alternative city boundaries beyond official administrative boundaries, visualize them on interactive maps, and export selected boundaries for further use in urban planning and analysis workflows.

# Development Contract

## ⚠️ Required for ALL New Features
Every new feature must include:
1. **Internationalization**: Add keys to both `en.json` and `pt.json`, use `useTranslation()` hook
2. **Analytics**: Track with PostHog using "Feature — Action — Result" naming convention

📚 **Documentation**: [docs/i18n.md](./docs/i18n.md) | [docs/analytics.md](./docs/analytics.md)  
📋 **Full Guidelines**: [CONTRIBUTING.md](./CONTRIBUTING.md)

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React 18+ with TypeScript**: Modern component-based frontend using functional components and hooks
- **Vite Build System**: Fast development server and optimized production builds
- **Wouter Routing**: Lightweight client-side routing for single-page application navigation
- **Tailwind CSS + shadcn/ui**: Utility-first CSS framework with pre-built accessible components
- **React Query/TanStack Query**: Declarative data fetching, caching, and synchronization
- **Leaflet Maps**: Interactive mapping library for boundary visualization and selection

## Backend Architecture
- **Express.js with TypeScript**: RESTful API server with type safety
- **Session-based Authentication**: OAuth 2.0 PKCE flow with CityCatalyst integration
- **In-Memory Storage**: Development-ready storage layer with interface for database migration
- **Middleware Chain**: Request logging, error handling, and security headers

## Data Storage Design
- **PostgreSQL Schema**: Drizzle ORM with strongly-typed database operations
- **Entities**: Users, Cities, Boundaries, and Sessions with proper relationships
- **Storage Interface**: Abstract storage layer allowing seamless transition between in-memory and database implementations

## Authentication & Authorization
- **OAuth 2.0 PKCE Flow**: Secure authentication with CityCatalyst using Proof Key for Code Exchange
- **Session Management**: Server-side session storage with secure token handling
- **Project-based Access Control**: User access to cities based on project membership

## API Design Patterns
- **RESTful Endpoints**: Standard HTTP methods for resource operations
- **Error Handling**: Centralized error middleware with proper status codes
- **Request Validation**: Type-safe request/response validation using Zod schemas
- **Rate Limiting**: Protection against abuse (configured for production deployment)

## Mapping & GIS Integration
- **Overpass API Integration**: Query OpenStreetMap data for administrative boundaries
- **GeoJSON Processing**: Standard geospatial data format for boundary representation
- **Boundary Scoring**: Algorithm to rank boundary alternatives based on relevance
- **Interactive Visualization**: Real-time map updates with boundary overlays and selection

## Frontend State Management
- **React Query Cache**: Server state management with automatic background updates
- **Local Component State**: UI state managed with React hooks
- **Form Handling**: React Hook Form with validation for user inputs
- **Toast Notifications**: User feedback for actions and errors

## Build & Development Setup
- **Hot Module Replacement**: Fast development iteration with Vite
- **TypeScript Compilation**: Compile-time type checking across frontend and backend
- **Path Aliases**: Clean import statements using configured path mapping
- **Environment Configuration**: Separate development and production configurations

# External Dependencies

## Authentication Service
- **CityCatalyst OAuth**: OAuth 2.0 provider for user authentication and project access
- **JWT Token Handling**: Access and refresh token management for API calls

## Geospatial Data Sources
- **Overpass API**: OpenStreetMap data query service for boundary discovery
- **OpenStreetMap**: Base map tiles and administrative boundary data
- **Nominatim API**: Geocoding service for location search (optional enhancement)

## Database
- **PostgreSQL**: Production database with spatial extensions support
- **Neon Database**: Cloud PostgreSQL service (based on connection string pattern)

## Build & Deployment
- **Replit Platform**: Development and hosting environment with integrated tooling
- **Node.js Runtime**: Server execution environment with ES modules support

## UI Component Libraries
- **Radix UI**: Accessible, unstyled component primitives
- **Lucide Icons**: Modern icon library for UI elements
- **Leaflet**: Open-source mapping library for interactive maps

## Development Tools
- **Drizzle Kit**: Database migration and introspection tools
- **TypeScript**: Static type checking for both frontend and backend
- **ESBuild**: Fast JavaScript/TypeScript bundler for production builds

# API Documentation

## CityCatalyst API Integration
Comprehensive API documentation is maintained in the service files for easy developer reference:

### Core Service Documentation
- **Primary API Reference**: `server/services/cityService.ts` 
  - Complete endpoint documentation with usage examples
  - Request/response type definitions
  - Error handling patterns
  - Authentication requirements

### Available API Endpoints

**Inventory Management:**
- `getInventoriesByCity()` - List all inventories for multiple cities
- `getInventoryDetails(inventoryId)` - Get basic inventory metadata
- `getInventoryDownload(inventoryId)` - Get comprehensive emissions data with GPC sector breakdown
- `getInventory(locode, year)` - Legacy endpoint for LOCODE-based access

**City Information:**
- `getCityDetail(cityId)` - Get detailed city information using UUID
- `getCityBoundary(locode)` - Retrieve city boundary as GeoJSON

**Climate Risk Assessment:**
- `getCCRADashboard(cityId, inventoryId)` - Get climate change risk assessment data
  - Returns topRisks array with hazard, exposure, and vulnerability scores
  - Supports infrastructure and public health impact categories
  - Provides normalized risk scores for comparative analysis

### Frontend Integration Patterns
- **React Query Hooks**: Located in `client/src/modules/city-information/hooks/`
- **Type Definitions**: Located in `client/src/modules/city-information/types/city-info.ts`
- **Service Functions**: Located in `client/src/modules/city-information/services/`

### Development Guidelines
- All API functions include comprehensive JSDoc documentation
- TypeScript interfaces ensure type safety across frontend/backend
- Error handling follows consistent patterns with proper HTTP status codes
- Authentication is handled automatically via OAuth 2.0 PKCE flow

**For Future Remixes:**
- Check `server/services/cityService.ts` for complete API documentation
- Review existing hooks in `client/src/modules/city-information/hooks/` for integration patterns
- Use type definitions in `city-info.ts` for frontend development
- Follow authentication patterns established in existing routes
# CityCatalyst OAuth Integration Template

A clean, well-documented React + Express application template demonstrating complete OAuth 2.0 PKCE integration with CityCatalyst API. This template provides a reference implementation for authentication, city data visualization, and API integration patterns.

The template enables developers to quickly build applications that integrate with CityCatalyst's platform, access city inventory data, and implement secure OAuth authentication flows.

# User Preferences

Preferred communication style: Simple, everyday language.

# Template Purpose & Usage

## What This Template Provides

- **Complete OAuth 2.0 PKCE Implementation**: Production-ready authentication flow with CityCatalyst
- **City Data Visualization**: Interface for browsing and selecting cities from user's projects
- **API Integration Patterns**: Documented examples of CityCatalyst API usage
- **Type-Safe Architecture**: Full TypeScript implementation with comprehensive schemas
- **Development-Ready Setup**: Hot reloading, error handling, and development tools

## Getting Started

1. **Clone or Fork**: Use this template as starting point for your CityCatalyst integration
2. **Configure OAuth**: Set up CityCatalyst OAuth application and update environment variables
3. **Customize Features**: Build upon the city selection and user management foundation
4. **Deploy**: Use Replit's built-in deployment or export to your preferred hosting

## Template Structure

```
├── client/                 # React frontend application
│   ├── src/core/          # Core UI components and pages
│   └── src/modules/       # Feature-specific modules
├── server/                # Express backend API
│   ├── services/          # OAuth and API integration services
│   └── routes.ts          # API endpoints
├── shared/                # Shared types and schemas
└── .env.example           # Environment configuration template
```

# System Architecture

## Frontend Architecture
- **React 18+ with TypeScript**: Modern component-based frontend using functional components and hooks
- **Vite Build System**: Fast development server and optimized production builds
- **Wouter Routing**: Lightweight client-side routing for single-page application navigation
- **Tailwind CSS + shadcn/ui**: Utility-first CSS framework with pre-built accessible components
- **React Query/TanStack Query**: Declarative data fetching, caching, and synchronization

## Backend Architecture
- **Express.js with TypeScript**: RESTful API server with type safety
- **Session-based Authentication**: OAuth 2.0 PKCE flow with CityCatalyst integration
- **In-Memory Storage**: Development-ready storage layer with interface for database migration
- **Middleware Chain**: Request logging, error handling, and security headers

## Data Storage Design
- **PostgreSQL Schema**: Drizzle ORM with strongly-typed database operations
- **Core Entities**: Users, Cities, and Sessions with proper relationships
- **Storage Interface**: Abstract storage layer allowing seamless transition between in-memory and database implementations

## Authentication & Authorization
- **OAuth 2.0 PKCE Flow**: Secure authentication with CityCatalyst using Proof Key for Code Exchange
- **Session Management**: Server-side session storage with secure token handling
- **Project-based Access Control**: User access to cities based on project membership

## API Design Patterns
- **RESTful Endpoints**: Standard HTTP methods for resource operations
- **Error Handling**: Centralized error middleware with proper status codes
- **Request Validation**: Type-safe request/response validation using Zod schemas
- **CityCatalyst Integration**: Documented API wrappers and response handling

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

# Quick Start Guide

## 1. Environment Setup

Copy the environment template and configure your settings:
```bash
cp .env.example .env
```

Edit `.env` with your CityCatalyst OAuth credentials:
- Get `OAUTH_CLIENT_ID` from CityCatalyst OAuth applications
- Set `OAUTH_REDIRECT_URI` to match your OAuth app configuration
- Configure `AUTH_BASE_URL` for your target environment

## 2. OAuth Application Setup

1. Go to CityCatalyst OAuth applications: https://citycatalyst.openearth.dev/app/oauth/applications/
2. Create a new OAuth application
3. Set redirect URI to: `http://localhost:5000/api/auth/oauth/callback` (for development)
4. Copy the Client ID to your `.env` file
5. Ensure your application has "read" and "write" scopes

## 3. Start Development

```bash
npm install
npm run dev
```

Navigate to http://localhost:5000 and test the OAuth flow.

## 4. Verify Integration

- Click "Login with CityCatalyst" to test OAuth flow
- View your user profile and accessible projects
- Browse cities available in your projects
- Check network requests to see API integration patterns

# External Dependencies

## Authentication Service
- **CityCatalyst OAuth**: OAuth 2.0 provider for user authentication and project access
- **JWT Token Handling**: Access and refresh token management for API calls

## Database (Optional)
- **PostgreSQL**: Production database with full schema support
- **In-Memory Storage**: Default development storage (no setup required)

## Build & Deployment
- **Replit Platform**: Development and hosting environment with integrated tooling
- **Node.js Runtime**: Server execution environment with ES modules support

## UI Component Libraries
- **Radix UI**: Accessible, unstyled component primitives
- **Lucide Icons**: Modern icon library for UI elements
- **Tailwind CSS**: Utility-first CSS framework

## Development Tools
- **Drizzle Kit**: Database migration and introspection tools
- **TypeScript**: Static type checking for both frontend and backend
- **ESBuild**: Fast JavaScript/TypeScript bundler for production builds

# Customization Guide

## Adding New Features

1. **New API Endpoints**: Add routes in `server/routes.ts` following existing patterns
2. **Frontend Pages**: Create components in `client/src/core/pages/` or `client/src/modules/`
3. **Database Schema**: Update `shared/core-schema.ts` and run migrations
4. **API Services**: Extend `server/services/` with new CityCatalyst API integrations

## Extending City Data

- Implement inventory data visualization
- Add city comparison features
- Create data export functionality
- Build reporting dashboards

## Security Considerations

- Keep OAuth credentials secure (never commit `.env`)
- Use HTTPS in production (secure cookies)
- Implement rate limiting for API endpoints
- Validate all user inputs with Zod schemas

## Production Deployment

1. Set production environment variables
2. Configure production database (optional)
3. Update OAuth redirect URI for production domain
4. Enable security headers and HTTPS
5. Use Replit's deployment feature or export to hosting platform

# Recent Changes

- **2024-12-XX**: Transformed from boundary editor to clean OAuth template
- **2024-12-XX**: Removed boundary/mapping functionality to simplify architecture
- **2024-12-XX**: Added comprehensive documentation and JSDoc comments
- **2024-12-XX**: Created detailed setup guide and environment template

# Support & Documentation

- **CityCatalyst API**: https://docs.citycatalyst.org/developers/
- **OAuth 2.0 PKCE**: https://oauth.net/2/pkce/
- **React Query**: https://tanstack.com/query/latest
- **Drizzle ORM**: https://orm.drizzle.team/

For template-specific questions, refer to the inline documentation and JSDoc comments throughout the codebase.
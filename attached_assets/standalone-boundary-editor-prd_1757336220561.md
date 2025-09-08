
# Enhanced Boundary Editor - Standalone Application PRD

## Executive Summary

The Enhanced Boundary Editor is a standalone React + Express web application that allows users to view, explore, and select city boundaries from OpenStreetMap (OSM). The application provides an intuitive interface for users to compare multiple boundary options for a city and download selected boundaries as GeoJSON files.

## Project Overview

### Core Functionality
- User authentication via OAuth
- City selection and boundary visualization
- Alternative boundary discovery from OSM
- Interactive map display with boundary overlays
- Boundary selection and download capabilities
- Responsive design matching existing CityCatalyst styles

### Target Users
- Urban planners
- GIS professionals
- Researchers working with city data
- Government officials managing city boundaries

## Technical Architecture

### Frontend Stack
- **React 18+** with TypeScript
- **React Router v6** for routing
- **Leaflet** with React-Leaflet for mapping
- **Axios** for HTTP requests
- **Styled Components** or **CSS Modules** for styling
- **React Hook Form** for form handling
- **React Query/SWR** for data fetching and caching

### Backend Stack
- **Express.js** with TypeScript
- **Node.js 18+**
- **Passport.js** for OAuth authentication
- **Axios** for external API calls
- **Express Rate Limiting** for API protection
- **CORS** for cross-origin requests
- **Helmet** for security headers

### External Services
- **Overpass API** for OSM boundary data
- **OAuth Provider** for user authentication
- **Nominatim API** for geocoding (optional)

## Detailed Requirements

### 1. Authentication System

#### OAuth Integration
- Support for OAuth 2.0 flow
- Dummy OAuth endpoints for simulation
- JWT token management
- Automatic token refresh
- Secure session handling

#### User Management
- User profile information storage
- City access permissions
- Session persistence
- Logout functionality

### 2. City Management

#### City Data Structure
```typescript
interface City {
  cityId: string;
  name: string;
  country: string;
  locode?: string;
  currentBoundary?: GeoJSON.Geometry;
  project?: {
    id: string;
    name: string;
  };
}
```

#### City Selection Interface
- City list with search functionality
- Project-based city grouping
- Access control validation
- City metadata display

### 3. Boundary Discovery & Selection

#### OSM Boundary Fetching
- Overpass API integration
- Multiple boundary alternatives per city
- Boundary ranking and scoring
- Geometry validation and processing

#### Boundary Comparison
- Side-by-side boundary visualization
- Mini-map grid layout (2x3 or 3x2)
- Boundary metadata display
- Area calculations
- Administrative level information

### 4. Mapping Component

#### Map Features
- Interactive Leaflet maps
- Boundary overlay rendering
- Zoom to fit functionality
- Map controls and navigation
- Responsive map sizing

#### Visual Design
- Consistent styling with CityCatalyst
- Color-coded boundaries
- Clear selection indicators
- Loading states
- Error handling

### 5. Data Export

#### Export Formats
- GeoJSON file download
- Metadata inclusion
- Filename standardization
- Browser download handling

## File Structure

```
standalone-boundary-editor/
├── client/                          # React frontend
│   ├── public/
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── manifest.json
│   ├── src/
│   │   ├── components/              # Reusable components
│   │   │   ├── common/
│   │   │   │   ├── Button/
│   │   │   │   ├── Input/
│   │   │   │   ├── Modal/
│   │   │   │   ├── Spinner/
│   │   │   │   └── Toast/
│   │   │   ├── layout/
│   │   │   │   ├── Header/
│   │   │   │   ├── Sidebar/
│   │   │   │   └── Footer/
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm/
│   │   │   │   ├── LogoutButton/
│   │   │   │   └── AuthGuard/
│   │   │   ├── city/
│   │   │   │   ├── CitySelector/
│   │   │   │   ├── CityList/
│   │   │   │   └── CityCard/
│   │   │   ├── boundary/
│   │   │   │   ├── BoundaryViewer/
│   │   │   │   ├── BoundaryGrid/
│   │   │   │   ├── BoundaryCard/
│   │   │   │   └── BoundaryMap/
│   │   │   └── map/
│   │   │       ├── LeafletMap/
│   │   │       ├── MapControls/
│   │   │       └── BoundaryOverlay/
│   │   ├── pages/                   # Page components
│   │   │   ├── Home/
│   │   │   ├── Login/
│   │   │   ├── Dashboard/
│   │   │   ├── CitySelection/
│   │   │   └── BoundaryEditor/
│   │   ├── hooks/                   # Custom hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useCities.ts
│   │   │   ├── useBoundaries.ts
│   │   │   └── useMap.ts
│   │   ├── services/                # API services
│   │   │   ├── api.ts
│   │   │   ├── authService.ts
│   │   │   ├── cityService.ts
│   │   │   ├── boundaryService.ts
│   │   │   └── osmService.ts
│   │   ├── types/                   # TypeScript definitions
│   │   │   ├── auth.ts
│   │   │   ├── city.ts
│   │   │   ├── boundary.ts
│   │   │   └── api.ts
│   │   ├── utils/                   # Utility functions
│   │   │   ├── geojson.ts
│   │   │   ├── download.ts
│   │   │   ├── formatting.ts
│   │   │   └── validation.ts
│   │   ├── styles/                  # Global styles
│   │   │   ├── globals.css
│   │   │   ├── variables.css
│   │   │   └── components.css
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   └── setupTests.ts
│   ├── package.json
│   └── tsconfig.json
├── server/                          # Express backend
│   ├── src/
│   │   ├── controllers/             # Route handlers
│   │   │   ├── authController.ts
│   │   │   ├── cityController.ts
│   │   │   ├── boundaryController.ts
│   │   │   └── userController.ts
│   │   ├── middleware/              # Express middleware
│   │   │   ├── auth.ts
│   │   │   ├── rateLimiter.ts
│   │   │   ├── validation.ts
│   │   │   └── errorHandler.ts
│   │   ├── routes/                  # API routes
│   │   │   ├── auth.ts
│   │   │   ├── cities.ts
│   │   │   ├── boundaries.ts
│   │   │   └── users.ts
│   │   ├── services/                # Business logic
│   │   │   ├── authService.ts
│   │   │   ├── cityService.ts
│   │   │   ├── boundaryService.ts
│   │   │   └── osmService.ts
│   │   ├── utils/                   # Utility functions
│   │   │   ├── overpass.ts
│   │   │   ├── geojson.ts
│   │   │   ├── oauth.ts
│   │   │   └── logger.ts
│   │   ├── types/                   # TypeScript definitions
│   │   │   ├── express.d.ts
│   │   │   ├── auth.ts
│   │   │   ├── city.ts
│   │   │   └── boundary.ts
│   │   ├── config/                  # Configuration
│   │   │   ├── database.ts
│   │   │   ├── oauth.ts
│   │   │   └── app.ts
│   │   ├── data/                    # Mock data
│   │   │   ├── users.json
│   │   │   ├── cities.json
│   │   │   └── projects.json
│   │   ├── app.ts
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
├── shared/                          # Shared types and utilities
│   ├── types/
│   │   ├── common.ts
│   │   ├── api.ts
│   │   └── geojson.ts
│   └── utils/
│       ├── validation.ts
│       └── constants.ts
├── package.json
├── README.md
└── .env.example
```

## API Specification

### Authentication Endpoints

#### POST /api/auth/oauth/initiate
Initiates OAuth flow
```typescript
Response: {
  authUrl: string;
  state: string;
}
```

#### POST /api/auth/oauth/callback
Handles OAuth callback
```typescript
Request: {
  code: string;
  state: string;
}
Response: {
  token: string;
  user: User;
}
```

#### POST /api/auth/refresh
Refreshes access token
```typescript
Response: {
  token: string;
}
```

#### POST /api/auth/logout
Logs out user
```typescript
Response: {
  success: boolean;
}
```

### User Endpoints

#### GET /api/user/profile
Gets user profile
```typescript
Response: {
  id: string;
  name: string;
  email: string;
  projects: Project[];
}
```

### City Endpoints

#### GET /api/cities
Gets user accessible cities
```typescript
Response: {
  cities: City[];
}
```

#### GET /api/cities/:cityId
Gets specific city details
```typescript
Response: {
  city: City;
  currentBoundary?: GeoJSON.Geometry;
}
```

### Boundary Endpoints

#### GET /api/boundaries/search
Searches for OSM boundaries
```typescript
Query: {
  city: string;
  country: string;
  limit?: number;
}
Response: {
  boundaries: OSMBoundary[];
}
```

#### POST /api/boundaries/select
Selects a boundary for a city
```typescript
Request: {
  cityId: string;
  osmId: string;
  boundaryType: 'way' | 'relation';
}
Response: {
  geometry: GeoJSON.Geometry;
  metadata: BoundaryMetadata;
}
```

#### GET /api/boundaries/download/:osmId
Downloads boundary as GeoJSON
```typescript
Response: GeoJSON.FeatureCollection
```

## OSM Integration Details

### Overpass API Queries

#### Boundary Search Query
```overpass
[out:json][timeout:60];
area["ISO3166-1:alpha2"="AR"]->.country;
rel(area.country)
  ["boundary"~"^(administrative|political)$"]
  ["name"="Buenos Aires"];
out ids tags bb;
>;
out geom;
```

#### Geometry Fetch Query
```overpass
[out:json][timeout:30];
(
  relation(12345);
  way(r);
  node(w);
);
out geom;
```

### OSM Data Processing

#### Boundary Scoring Algorithm
```typescript
function scoreBoundary(boundary: OSMBoundary): number {
  let score = 0;
  
  // Administrative boundary preference
  if (boundary.tags.boundary === 'administrative') score += 10;
  
  // Admin level preference (6-10 are city-level)
  const adminLevel = parseInt(boundary.tags.admin_level || '0');
  if (adminLevel >= 6 && adminLevel <= 10) score += 5;
  
  // Area-based scoring (avoid too small/large boundaries)
  const area = calculateArea(boundary.geometry);
  if (area > 1 && area < 5000) score += 3; // km²
  
  // Name similarity
  if (boundary.tags.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
    score += 8;
  }
  
  return score;
}
```

#### GeoJSON Conversion
```typescript
function convertOSMToGeoJSON(osmData: OSMResponse): GeoJSON.FeatureCollection {
  const ways = createWaysMap(osmData.elements);
  const features: GeoJSON.Feature[] = [];
  
  osmData.elements
    .filter(element => element.type === 'relation')
    .forEach(relation => {
      const geometry = buildPolygonFromRelation(relation, ways);
      if (geometry) {
        features.push({
          type: 'Feature',
          id: `relation/${relation.id}`,
          properties: {
            osm_id: relation.id,
            ...relation.tags
          },
          geometry
        });
      }
    });
    
  return {
    type: 'FeatureCollection',
    features
  };
}
```

## UI/UX Requirements

### Design System

#### Color Palette (CityCatalyst-inspired)
```css
:root {
  --primary-blue: #0097FB;
  --primary-blue-dark: #0074BC;
  --secondary-gray: #6B7280;
  --background-gray: #F9FAFB;
  --border-gray: #E5E7EB;
  --success-green: #10B981;
  --warning-yellow: #F59E0B;
  --error-red: #EF4444;
  --text-dark: #1F2937;
  --text-light: #6B7280;
}
```

#### Typography
```css
.heading-1 { font-size: 2rem; font-weight: 700; }
.heading-2 { font-size: 1.5rem; font-weight: 600; }
.heading-3 { font-size: 1.25rem; font-weight: 600; }
.body { font-size: 1rem; font-weight: 400; }
.small { font-size: 0.875rem; font-weight: 400; }
```

### Component Specifications

#### BoundaryGrid Component
- 2x3 or 3x2 responsive grid layout
- Each cell contains a mini-map (200x150px minimum)
- Boundary overlay with distinct colors
- Metadata panel below each map
- "Select" button for each boundary
- Loading states for each cell
- Error handling for failed loads

#### BoundaryCard Component
- Boundary name and administrative level
- OSM ID display
- Area calculation (sq km)
- "Select" or "Selected" button state
- Hover effects and visual feedback
- Consistent with CityCatalyst card design

#### Interactive Map Component
- Full-screen map view
- Zoom controls
- Layer toggles
- Boundary highlighting
- Click handlers for selection
- Responsive design
- Loading overlays

### Responsive Design

#### Breakpoints
- Mobile: 320px - 768px
- Tablet: 768px - 1024px  
- Desktop: 1024px+

#### Mobile Optimizations
- Single column boundary grid
- Collapsible sidebar
- Touch-friendly controls
- Swipe gestures for map navigation

## Mock Data Structure

### Users Data (server/src/data/users.json)
```json
{
  "users": [
    {
      "id": "user-1",
      "email": "admin@citycatalyst.org",
      "name": "Admin User",
      "title": "System Administrator",
      "projects": ["project-1", "project-2"]
    },
    {
      "id": "user-2", 
      "email": "planner@buenos-aires.gov",
      "name": "Maria Rodriguez",
      "title": "Urban Planner",
      "projects": ["project-1"]
    }
  ]
}
```

### Cities Data (server/src/data/cities.json)
```json
{
  "cities": [
    {
      "cityId": "city-1",
      "name": "Buenos Aires",
      "country": "Argentina",
      "locode": "ARBA1",
      "projectId": "project-1",
      "currentBoundary": {
        "type": "Polygon",
        "coordinates": [[[-58.5, -34.5], [-58.3, -34.5], [-58.3, -34.7], [-58.5, -34.7], [-58.5, -34.5]]]
      }
    }
  ]
}
```

### Projects Data (server/src/data/projects.json)
```json
{
  "projects": [
    {
      "id": "project-1",
      "name": "South America Cities",
      "cities": ["city-1", "city-2"]
    }
  ]
}
```

## Security Considerations

### Authentication Security
- JWT token expiration (15 minutes access, 7 days refresh)
- Secure HTTP-only cookies for refresh tokens
- CSRF protection
- OAuth state parameter validation

### API Security
- Rate limiting (100 requests/minute per IP)
- Input validation and sanitization
- SQL injection prevention (though no DB in this case)
- XSS protection headers
- CORS configuration

### Data Privacy
- No sensitive data logging
- User consent for data processing
- Secure token storage
- Session timeout handling

## Performance Optimization

### Frontend Optimization
- Code splitting by route
- Lazy loading of map components
- Image optimization and compression
- Bundle size monitoring
- React.memo for expensive components

### Backend Optimization
- Response caching for OSM queries
- Request debouncing
- Connection pooling
- Compression middleware
- ETags for static resources

### OSM API Optimization
- Query result caching (1 hour TTL)
- Request rate limiting to respect OSM usage policies
- Fallback handling for API failures
- Batch processing for multiple boundaries

## Testing Strategy

### Frontend Testing
- Unit tests with Jest and React Testing Library
- Integration tests for API calls
- E2E tests with Playwright
- Visual regression tests
- Accessibility testing

### Backend Testing
- Unit tests for controllers and services
- Integration tests for API endpoints
- Mock testing for external APIs
- Load testing for concurrent users
- Security testing

## Deployment on Replit

### Project Structure
```
enhanced-boundary-editor/
├── client/          # React app (port 3000)
├── server/          # Express API (port 5000)
├── package.json     # Root package.json with scripts
└── .replit          # Replit configuration
```

### Root Package.json Scripts
```json
{
  "scripts": {
    "dev": "concurrently \"npm run server:dev\" \"npm run client:dev\"",
    "server:dev": "cd server && npm run dev",
    "client:dev": "cd client && npm run start",
    "build": "cd client && npm run build && cd ../server && npm run build",
    "start": "cd server && npm run start"
  }
}
```

### Environment Variables (.env)
```
# OAuth Configuration
OAUTH_CLIENT_ID=dummy_client_id
OAUTH_CLIENT_SECRET=dummy_client_secret
OAUTH_REDIRECT_URI=https://your-repl.replit.app/api/auth/oauth/callback

# JWT Configuration  
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# API Configuration
PORT=5000
CLIENT_URL=https://your-repl.replit.app
NODE_ENV=development

# OSM Configuration
OVERPASS_API_URL=https://overpass-api.de/api/interpreter
OSM_REQUEST_TIMEOUT=30000
```

### Replit Configuration (.replit)
```toml
run = "npm run dev"

[deployment]
run = "npm start"
deploymentTarget = "cloudrun"

[[ports]]
localPort = 3000
externalPort = 80

[[ports]]  
localPort = 5000
externalPort = 8080
```

## Development Timeline

### Phase 1: Core Infrastructure (Week 1-2)
- Project setup and structure
- Authentication system
- Basic routing
- Mock data services

### Phase 2: City Management (Week 3)
- City selection interface
- User access control
- Project-based filtering

### Phase 3: OSM Integration (Week 4-5)
- Overpass API integration
- Boundary search functionality
- Data processing and scoring
- Error handling and fallbacks

### Phase 4: Mapping Interface (Week 6-7)
- Leaflet map integration
- Boundary visualization
- Interactive selection
- Responsive design

### Phase 5: Export & Polish (Week 8)
- GeoJSON download functionality
- UI/UX refinements
- Performance optimization
- Testing and bug fixes

## Success Metrics

### Technical Metrics
- API response time < 2 seconds
- Map load time < 3 seconds
- Bundle size < 1MB
- 95%+ uptime
- Zero security vulnerabilities

### User Experience Metrics
- Task completion rate > 90%
- User satisfaction score > 4.5/5
- Mobile usability score > 85%
- Accessibility compliance (WCAG 2.1 AA)

## Future Enhancements

### Phase 2 Features
- Boundary editing capabilities
- Custom boundary upload
- Batch operations
- Advanced filtering options
- Integration with external GIS systems

### Technical Improvements
- Real-time collaboration
- Offline mode support
- Advanced caching strategies
- WebGL-based mapping
- Vector tile support

## Appendix

### Key Dependencies

#### Frontend Dependencies
```json
{
  "react": "^18.2.0",
  "react-router-dom": "^6.8.0",
  "leaflet": "^1.9.0",
  "react-leaflet": "^4.2.0",
  "axios": "^1.3.0",
  "react-query": "^3.39.0",
  "react-hook-form": "^7.43.0",
  "styled-components": "^5.3.0",
  "@types/leaflet": "^1.9.0"
}
```

#### Backend Dependencies
```json
{
  "express": "^4.18.0",
  "passport": "^0.6.0",
  "passport-oauth2": "^1.7.0",
  "jsonwebtoken": "^9.0.0",
  "express-rate-limit": "^6.7.0",
  "helmet": "^6.1.0",
  "cors": "^2.8.0",
  "axios": "^1.3.0"
}
```

This comprehensive PRD provides all the technical details, file structures, API specifications, and implementation guidance needed to build the Enhanced Boundary Editor as a standalone application on Replit.

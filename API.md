# CityCatalyst Template API Documentation

This document provides comprehensive documentation for all API endpoints, schemas, and usage examples in this **CityCatalyst integration template**.

## About This Template

This is a **proof-of-concept template** designed for **remixing and adaptation** to specific climate action use cases. The template demonstrates comprehensive CityCatalyst API integration including:

- 🔐 **OAuth 2.0 PKCE Authentication**
- 🏙️ **City & Emissions Inventory Data**
- ⚠️ **Climate Change Risk Assessment (CCRA)**
- 🎯 **Health Impact Assessment Policy (HIAP)**

**For Remix Developers**: Use this documentation as your foundation, then adapt the APIs to your specific use case requirements.

💡 **When in doubt**: Check the official [CityCatalyst Documentation](https://citycatalyst.openearth.dev/docs/) for the latest API specifications and best practices.

## Table of Contents
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Data Schemas](#data-schemas)
- [Usage Examples](#usage-examples)
- [Error Handling](#error-handling)

## Authentication

### OAuth Flow Endpoints

#### `GET /api/auth/oauth/initiate`
Initiates OAuth flow with CityCatalyst.

**Response:**
```json
{
  "authUrl": "https://citycatalyst.openearth.dev/oauth/authorize?response_type=code&client_id=...",
  "state": "abc123..."
}
```

**Usage Example:**
```javascript
const response = await fetch('/api/auth/oauth/initiate');
const { authUrl } = await response.json();
window.location.href = authUrl; // Redirect to OAuth provider
```

#### `GET /api/auth/oauth/callback`
Handles OAuth callback from CityCatalyst (automatic redirect endpoint).

**Query Parameters:**
- `code` - Authorization code
- `state` - OAuth state parameter
- `error` (optional) - OAuth error code
- `error_description` (optional) - Error description

**Success:** Redirects to `/cities`  
**Error:** Redirects to `/login?error=...`

### User Profile

#### `GET /api/user/profile`
Get authenticated user profile.

**Headers Required:**
- `Authorization: Bearer {sessionToken}` or session cookie

**Response:**
```json
{
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "projects": ["project-1", "project-2"]
  }
}
```

**Note:** Access tokens are stored server-side for security and not returned to the client.
```

**Error Response (401):**
```json
{
  "message": "Not authenticated"
}
```

## API Endpoints

### Cities

#### `GET /api/cities`
Get user's accessible cities from CityCatalyst.

**Headers Required:**
- Authentication (session or Bearer token)

**Response:**
```json
{
  "data": [
    {
      "locode": "US_NYC",
      "name": "New York City",
      "years": [2019, 2020, 2021],
      "inventories": [
        {
          "year": 2021,
          "inventoryId": "550e8400-e29b-41d4-a716-446655440000",
          "lastUpdate": "2024-11-24T10:44:26.778Z"
        }
      ]
    }
  ]
}
```

#### `GET /api/cities/:cityId`
Get specific city details (internal storage).

**Parameters:**
- `cityId` - Internal city identifier

**Response:**
```json
{
  "city": {
    "cityId": "city-123",
    "locode": "US_NYC", 
    "name": "New York City",
    "createdAt": "2024-01-15T09:30:00Z"
  }
}
```

### CityCatalyst API Proxy

#### `GET /api/citycatalyst/city/:cityId`
Get detailed city information from CityCatalyst API.

**Parameters:**
- `cityId` - UUID v4 format city identifier (e.g., `550e8400-e29b-41d4-a716-446655440000`)

**Note:** Only UUID v4 format is accepted. Other UUID versions will return 400 error.

**Response:**
```json
{
  "data": {
    "locode": "US_NYC",
    "name": "New York City", 
    "country": "United States",
    "inventories": [
      {
        "year": 2021,
        "id": "inventory-uuid-here"
      }
    ],
    "metadata": {
      "population": 8419000,
      "area": "778.2 km²"
    }
  }
}
```

**Error Response (400):**
```json
{
  "message": "Invalid cityId format. Expected UUID."
}
```

#### `GET /api/citycatalyst/city/:locode/inventory/:year`
Get emissions inventory data for specific city and year.

**Parameters:**
- `locode` - UN/LOCODE format (e.g., `US_NYC`)
- `year` - Inventory year (e.g., `2021`)

**Response:**
```json
{
  "data": {
    "inventoryId": "550e8400-e29b-41d4-a716-446655440000",
    "year": 2021,
    "totalEmissions": 52.4,
    "sectors": [
      {
        "name": "Transportation",
        "emissions": 15.2,
        "subcategories": [...]
      }
    ],
    "lastUpdate": "2024-11-24T10:44:26.778Z"
  }
}
```

#### `GET /api/citycatalyst/city/:locode/boundary`
Get city boundary as GeoJSON.

**Parameters:**
- `locode` - UN/LOCODE format (e.g., `US_NYC`)

**Response:**
```json
{
  "data": {
    "type": "Feature",
    "properties": {
      "name": "New York City",
      "locode": "US_NYC"
    },
    "geometry": {
      "type": "Polygon",
      "coordinates": [[
        [-74.0059, 40.7128],
        [-74.0000, 40.7500],
        ...
      ]]
    }
  }
}
```

#### `GET /api/citycatalyst/inventories`
Get all inventories accessible to the user.

**Response:**
```json
{
  "data": [
    {
      "locode": "US_NYC",
      "name": "New York City", 
      "years": [2019, 2020, 2021],
      "inventories": [
        {
          "year": 2021,
          "inventoryId": "550e8400-e29b-41d4-a716-446655440000",
          "lastUpdate": "2024-11-24T10:44:26.778Z"
        }
      ]
    }
  ]
}
```

#### `GET /api/citycatalyst/inventory/:inventoryId`
Get detailed inventory information by ID.

**Parameters:**
- `inventoryId` - UUID format inventory identifier

**Response:**
```json
{
  "data": {
    "inventoryId": "550e8400-e29b-41d4-a716-446655440000",
    "inventoryName": "NYC 2021 GPC Inventory",
    "year": 2021,
    "totalEmissions": 52.4,
    "cityId": "city-uuid-here",
    "totalCountryEmissions": 5000.0,
    "isPublic": true,
    "publishedAt": "2024-01-15T00:00:00Z",
    "city": {
      "name": "New York City",
      "locode": "US_NYC",
      "region": "New York"
    }
  }
}
```

## Data Schemas

### City Schema

```typescript
interface City {
  locode: string;           // UN/LOCODE format (e.g., "US_NYC")
  name: string;             // City name
  years: number[];          // Available inventory years
  inventories: Inventory[]; // Available inventories
}

interface Inventory {
  year: number;
  inventoryId?: string;     // UUID format
  lastUpdate?: string;      // ISO 8601 date string
}
```

### CityCatalyst API Types

```typescript
interface CityCatalystCityDetail {
  locode: string;
  name: string;
  country?: string;
  inventories?: CityCatalystInventory[];
  metadata?: Record<string, any>;
}

interface CityCatalystInventory {
  year: number;
  id?: string;
}

interface CityCatalystInventoryData {
  inventoryId: string;
  inventoryName: string; 
  year: number;
  totalEmissions: number | null;
  cityId: string;
  totalCountryEmissions: number | null;
  isPublic: boolean;
  publishedAt: string | null;
  city: {
    name: string;
    locode: string;
    region?: string;
  };
}
```

### User Schema

```typescript
interface User {
  id: string;
  email: string;
  name?: string;
  accessToken: string;      // CityCatalyst API access token
  refreshToken?: string;    // CityCatalyst API refresh token  
  projects?: string[];      // Associated project IDs
  createdAt: Date;
  updatedAt: Date;
}
```

## Usage Examples

### Frontend Data Fetching

#### Get User's Cities
```javascript
import { useQuery } from '@tanstack/react-query';

function useCities() {
  return useQuery({
    queryKey: ['/api/cities']
  });
}
```

#### Get City Details
```javascript
function useCityDetail(cityId) {
  return useQuery({
    queryKey: ['/api/citycatalyst/city', cityId],
    enabled: !!cityId && isValidUUID(cityId)
  });
}

function isValidUUID(id) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}
```

#### Get Inventory Data
```javascript
function useInventory(locode, year) {
  return useQuery({
    queryKey: ['/api/citycatalyst/city', locode, 'inventory', year],
    enabled: !!(locode && year)
  });
}
```

### Backend Service Usage

#### Using CityCatalyst Services
```typescript
import { getCityDetail, getInventory, getUserAccessibleCities } from './services/cityService';

// Get city details (UUID required)
const cityDetail = await getCityDetail('550e8400-e29b-41d4-a716-446655440000', accessToken);

// Get inventory for specific year (LOCODE format)
const inventory = await getInventory('US_NYC', 2021, accessToken);

// Get user's cities
const cities = await getUserAccessibleCities(userId, accessToken);
```

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "message": "Invalid cityId format. Expected UUID."
}
```

#### 401 Unauthorized  
```json
{
  "message": "Not authenticated"
}
```

#### 403 Forbidden
```json
{
  "message": "Access denied"
}
```

#### 404 Not Found
```json
{
  "message": "City not found" 
}
```

#### 500 Internal Server Error
```json
{
  "message": "Failed to fetch city detail"
}
```

### Frontend Error Handling

```javascript
function ErrorBoundary({ error, reset }) {
  if (error?.message?.includes('Invalid cityId format')) {
    return (
      <div className="error-message">
        <h3>Invalid City ID</h3>
        <p>Please provide a valid UUID format city identifier.</p>
        <button onClick={reset}>Try Again</button>
      </div>
    );
  }

  if (error?.message?.includes('Not authenticated')) {
    return (
      <div className="error-message">
        <h3>Authentication Required</h3>
        <p>Please log in to access this data.</p>
        <button onClick={() => window.location.href = '/login'}>
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="error-message">
      <h3>Something went wrong</h3>
      <p>{error?.message || 'An unexpected error occurred'}</p>
      <button onClick={reset}>Try Again</button>
    </div>
  );
}
```

## Rate Limiting & Best Practices

### Request Guidelines
- CityCatalyst API requests are proxied through this backend to handle authentication
- Use appropriate caching strategies (React Query, SWR) to minimize API calls
- Implement proper loading states and error boundaries
- Validate data formats (UUID for cityId, LOCODE for inventory calls) before requests

### Performance Tips
```javascript
// Cache city lists longer since they change infrequently
const cities = useQuery({
  queryKey: ['/api/cities'],
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in v5)
});

// Prefetch related data
const queryClient = useQueryClient();
queryClient.prefetchQuery({
  queryKey: ['/api/citycatalyst/city', cityId]
  // Uses default fetcher - no queryFn needed
});
```

This template provides a robust foundation for CityCatalyst integration with proper error handling, type safety, and production-ready patterns.
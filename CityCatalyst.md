# CityCatalyst API Integration Documentation

This document describes the complete CityCatalyst API integration, including both the server API routes exposed to the client and the underlying CityCatalyst API endpoints.

## Overview

The application provides a comprehensive integration with CityCatalyst APIs for:
- User authentication and city access management
- City information and boundary data
- Emissions inventory data and management
- Real-time data synchronization

All API calls require OAuth authentication and use Bearer tokens for authorization.

## Architecture

```
Client Application
       ↓
Server API Routes (Proxy + Auth)
       ↓  
CityCatalyst API Endpoints
```

## Server API Routes (Client Interface)

All server routes require authentication via the `requireAuth` middleware and use the user's access token.

### Core City Data

#### GET /api/cities
**Purpose**: Get all cities accessible to the authenticated user  
**Authentication**: Required  
**Parameters**: None  
**Data Source**: In-memory storage (pre-populated during OAuth flow)

⚠️ **Important**: This endpoint returns cities from in-memory storage, not live CityCatalyst API calls. Data is populated during OAuth authentication when user's cities are fetched and stored. May return empty array if storage is not seeded.

**Response**:
```json
{
  "cities": [
    {
      "id": "storage-uuid",
      "cityId": "AR_BUE", 
      "name": "Buenos Aires",
      "country": "Argentina",
      "locode": "AR BUE",
      "projectId": "citycatalyst-AR_BUE",
      "currentBoundary": null,
      "metadata": {
        "region": "Buenos Aires",
        "area": 203.0
      }
    }
  ]
}
```
*Note: Metadata fields may vary based on what was available during OAuth city import.*

#### GET /api/cities/:cityId
**Purpose**: Get specific city details with access control  
**Authentication**: Required  
**Parameters**: 
- `cityId` (path): City identifier or LOCODE
**Data Source**: In-memory storage (same as /api/cities)

**Access Control**: Verifies user has access via their `projects` array

**Response**:
```json
{
  "city": {
    "id": "storage-uuid",
    "cityId": "AR_BUE", 
    "name": "Buenos Aires",
    "country": "Argentina", 
    "locode": "AR BUE",
    "projectId": "citycatalyst-AR_BUE",
    "currentBoundary": null,
    "metadata": {
      "region": "Buenos Aires",
      "area": 203.0
    }
  }
}
```
*Note: Returns data from storage, not live API call. Fields depend on OAuth import data.*

**Error Responses**:
- `404`: City not found
- `403`: Access denied (user doesn't have access to city)
- `500`: Server error

### CityCatalyst API Proxy Routes

All proxy routes return data wrapped under a `data` key and forward the user's access token to CityCatalyst.

#### GET /api/citycatalyst/city/:locode
**Purpose**: Get detailed city information including inventories list  
**Authentication**: Required  
**Parameters**: 
- `locode` (path): UN/LOCODE (e.g., "AR BUE", "BR SAO")

**LOCODE Normalization**: Spaces are automatically converted to underscores server-side

**Response**:
```json
{
  "data": {
    "locode": "AR BUE",
    "name": "Buenos Aires", 
    "country": "Argentina",
    "inventories": [
      {
        "year": 2022,
        "id": "inventory-id-string"
      }
    ]
    "(additional fields may vary based on CityCatalyst API)": "..."
  }
}
```
*Note: Response structure depends on CityCatalyst API. Only locode, name are guaranteed. Inventories array structure may vary.*

#### GET /api/citycatalyst/city/:locode/inventory/:year
**Purpose**: Get inventory data for a specific city and year  
**Authentication**: Required  
**Parameters**:
- `locode` (path): UN/LOCODE
- `year` (path): Inventory year (e.g., 2022)

**Response**: 
```json
{
  "data": {
    "(varies - depends on CityCatalyst API response)": "..."
  }
}
```
*Note: This endpoint returns whatever data CityCatalyst provides for the city/year combination. The server treats this as opaque data (`any` type) and forwards it directly. Response structure depends on CityCatalyst API implementation.*

#### GET /api/citycatalyst/city/:locode/boundary
**Purpose**: Get city boundary as GeoJSON  
**Authentication**: Required  
**Parameters**:
- `locode` (path): UN/LOCODE

**Response**:
```json
{
  "data": {
    "type": "Feature",
    "properties": {
      "name": "Buenos Aires",
      "locode": "AR BUE"
    },
    "geometry": {
      "type": "Polygon",
      "coordinates": [[
        [-58.5314, -34.7052],
        [-58.3314, -34.7052],
        [-58.3314, -34.5052],
        [-58.5314, -34.5052],
        [-58.5314, -34.7052]
      ]]
    }
  }
}
```

#### GET /api/citycatalyst/inventories
**Purpose**: Get overview of all inventories by city for the user  
**Authentication**: Required  
**Parameters**: None

**Response**:
```json
{
  "data": [
    {
      "locode": "AR BUE",
      "name": "Buenos Aires", 
      "years": [2022, 2021, 2020],
      "inventories": [
        {
          "year": 2022,
          "id": "inventory-id-string"
        }
      ]
    }
  ]
}
```
*Note: Aggregated data from `/api/v0/user/cities/` and city detail calls. Structure reflects actual server processing logic.*

#### GET /api/citycatalyst/inventory/:inventoryId
**Purpose**: Get detailed inventory information  
**Authentication**: Required  
**Parameters**:
- `inventoryId` (path): Inventory UUID or "default" for user's default inventory

**Special Values**: 
- `"default"`: Maps to `/api/v0/inventory/default` endpoint

**Response**:
```json
{
  "data": {
    "inventoryId": "inventory-uuid-2022",
    "inventoryName": "Buenos Aires 2022 GPC",
    "year": 2022,
    "totalEmissions": 25834627.5,
    "cityId": "AR_BUE",
    "totalCountryEmissions": 366000000.0,
    "isPublic": true,
    "publishedAt": "2023-07-01T00:00:00Z",
    "inventoryType": "GPC",
    "globalWarmingPotentialType": "AR5",
    "lastUpdated": "2023-06-15T10:30:00Z",
    "created": "2023-01-01T00:00:00Z",
    "city": {
      "cityId": "AR_BUE",
      "locode": "AR BUE",
      "name": "Buenos Aires",
      "shape": { "type": "Polygon", "coordinates": [...] },
      "country": "Argentina",
      "region": "Buenos Aires",
      "countryLocode": "AR",
      "regionLocode": "AR-C",
      "area": "203.0",
      "projectId": "project-uuid",
      "created": "2023-01-01T00:00:00Z",
      "last_updated": "2023-06-15T10:30:00Z",
      "project": {
        "projectId": "project-uuid",
        "name": "Buenos Aires Climate Action",
        "organizationId": "org-uuid"
      }
    }
  }
}
```

### Enriched Data Routes

#### GET /api/city-information/:cityId
**Purpose**: Get enriched city information with inventory summaries  
**Authentication**: Required  
**Parameters**:
- `cityId` (path): City ID, LOCODE, or normalized city name

**Matching Logic**: Matches by LOCODE, LOCODE with spaces converted to underscores, or normalized city name

**Response**:
```json
{
  "data": {
    "locode": "AR BUE",
    "name": "Buenos Aires",
    "country": "Argentina",
    "locodePrefix": "AR",
    "totalInventories": 3,
    "availableYears": [2022, 2021, 2020],
    "latestUpdate": 1686829800000,
    "years": [
      {
        "year": 2022,
        "inventoryId": "inventory-uuid-2022",
        "lastUpdate": "2023-06-15T10:30:00Z"
      }
    ],
    "inventories": [...]
  }
}
```

## Underlying CityCatalyst API Endpoints

These are the actual CityCatalyst API endpoints called by the server. All require Bearer authentication.

### Authentication & User Data

#### GET /api/v0/users/me
**Purpose**: Get authenticated user's profile  
**Used in**: OAuth flow, user profile retrieval  
**Headers**: `Authorization: Bearer {access_token}`

**Response**:
```json
{
  "data": {
    "userId": "user-id-string",
    "email": "user@example.com",
    "name": "User Name",
    "(additional fields may vary)": "..."
  }
}
```
*Note: Response structure may vary. The server maps this to standard user fields during OAuth processing.*

#### GET /api/v0/user/cities/
**Purpose**: Get cities accessible to the authenticated user  
**Used in**: OAuth flow, inventories overview  
**Headers**: `Authorization: Bearer {access_token}`

**Response**:
```json
{
  "data": {
    "cities": [
      {
        "city": {
          "cityId": "AR_BUE",
          "locode": "AR BUE", 
          "name": "Buenos Aires",
          "country": "Argentina",
          "region": "Buenos Aires",
          "area": "203.0"
        },
        "years": [2022, 2021, 2020]
      }
    ]
  }
}
```

### City Data Endpoints

#### GET /api/v0/cities/{cityId}
**Purpose**: Get city details by city ID  
**Parameters**: 
- `cityId` (path): City identifier
**Headers**: `Authorization: Bearer {access_token}`
**Notes**: Server tries both with and without trailing slash

#### GET /api/v0/city/{locode}
**Purpose**: Get city details by LOCODE  
**Parameters**:
- `locode` (path): UN/LOCODE (spaces converted to underscores)
**Headers**: `Authorization: Bearer {access_token}`

#### GET /api/v0/city/{locode}/boundary
**Purpose**: Get city boundary as GeoJSON  
**Parameters**:
- `locode` (path): UN/LOCODE (normalized)
**Headers**: `Authorization: Bearer {access_token}`

**Response**: GeoJSON Feature object

#### GET /api/v0/city/{locode}/inventory/{year}?format=json
**Purpose**: Get inventory data for specific city and year  
**Parameters**:
- `locode` (path): UN/LOCODE (normalized)
- `year` (path): Inventory year
- `format=json` (query): Response format
**Headers**: `Authorization: Bearer {access_token}`

### Inventory Endpoints

#### GET /api/v0/inventory/{inventoryId}
**Purpose**: Get detailed inventory information  
**Parameters**:
- `inventoryId` (path): Inventory UUID
**Headers**: `Authorization: Bearer {access_token}`

#### GET /api/v0/inventory/default
**Purpose**: Get user's default inventory  
**Headers**: `Authorization: Bearer {access_token}`

## Usage Patterns & Best Practices

### Authentication Flow
1. Complete OAuth flow to obtain access token
2. Access token is stored securely server-side  
3. All API calls include `Authorization: Bearer {access_token}`
4. Tokens are refreshed automatically (session management)

### LOCODE Handling
- Client can send LOCODEs with spaces: "AR BUE" 
- Server automatically normalizes to underscores: "AR_BUE"
- Both formats are accepted and handled consistently

### Error Handling
All endpoints follow consistent error response patterns:

**Client API Routes**:
- `401`: Not authenticated (missing/invalid session)
- `403`: Access denied (user lacks permission)
- `404`: Resource not found  
- `500`: Server error (includes CityCatalyst API errors)

**CityCatalyst API Errors** (forwarded through proxy):
- Network errors are wrapped as 500 responses
- API errors include original status and truncated error message (300 chars max)
- CityCatalyst errors are forwarded with status codes
- Content-type validation ensures JSON responses only
- Debug logging available (see security notes below)

### Response Formats
- **Client API routes**: Native JSON structure
- **Proxy routes**: Wrapped under `{ "data": ... }` key
- **CityCatalyst APIs**: May wrap under `"data"` key or return direct objects

## Data Flow Examples

### Fetching City Inventory Data
```javascript
// 1. Get user's cities
const cities = await fetch('/api/cities');

// 2. Get detailed city info  
const cityDetail = await fetch(`/api/citycatalyst/city/${locode}`);

// 3. Get specific year inventory
const inventory = await fetch(`/api/citycatalyst/city/${locode}/inventory/2022`);

// 4. Get detailed inventory info
const inventoryDetails = await fetch(`/api/citycatalyst/inventory/${inventoryId}`);
```

### Component Integration
```typescript
// Using React Query hooks
const { data: cities } = useCities();
const { data: cityDetail } = useCityDetail(locode);  
const { data: inventory } = useInventory(locode, year);
const { data: inventoryDetails } = useInventoryDetails(inventoryId);
```

## Security & Performance Notes

### ⚠️ Critical Security Warnings

**Sensitive Debug Logging (PRODUCTION RISK)**:
The current implementation logs sensitive data in multiple locations:
- **OAuth callback**: Full headers, query parameters, authorization codes, tokens
- **CityCatalyst API calls**: Access tokens, request/response payloads, user data
- **Token exchange**: Code verifiers, client secrets, token responses

**Required Production Changes**:
```typescript
// Gate all debug logging
const isDebugMode = process.env.NODE_ENV === 'development' && process.env.OAUTH_DEBUG === 'true';
if (isDebugMode) {
  console.log('Debug info here');
}
```

**Session Security**:
- **Cookie dependency**: Authentication relies on `session_id` HTTP-only cookies
- **HTTPS requirement**: Secure flag set only when `NODE_ENV === 'production'`
- **SameSite not configured**: Consider setting `SameSite=lax` for CSRF protection
- **Domain restrictions**: No domain restrictions on cookies (may affect multi-domain deployments)

**Access Token Security**:
- Tokens stored server-side with 24-hour session expiry
- No token refresh mechanism implemented  
- Tokens logged extensively in development mode

### Performance Considerations
- API responses are cached client-side using React Query
- Stale times: 5-30 minutes depending on data type
- Server-side caching not implemented (consider for production)
- Rate limiting not implemented on server routes

### Access Control
- **Project-based access**: Users can only access cities in their `projects` array (populated during OAuth)
- **Session validation**: All protected routes use `requireAuth` middleware with session cookie validation
- **24-hour session expiry**: Sessions expire after 24 hours, requiring re-authentication
- **No granular permissions**: Simple binary access (user has city or doesn't)
- **Storage-based verification**: Access checks use in-memory storage data, not live API calls

## Behavioral Nuances

### API Operation Scope
- **GET operations only**: All proxy routes handle only GET requests. No POST/PATCH/DELETE operations are implemented.
- **Content-type validation**: Server validates that CityCatalyst returns `application/json` content-type, skips non-JSON responses.
- **Error text truncation**: CityCatalyst error messages are truncated to 300 characters in server responses.

### LOCODE Handling
- **Automatic normalization**: Spaces in LOCODEs are converted to underscores server-side ("AR BUE" → "AR_BUE")
- **Endpoint variants**: Server tries both `/api/v0/cities/{cityId}` and `/api/v0/cities/{cityId}/` for city fetching
- **Case sensitivity**: LOCODEs are treated case-sensitively

### Special Values
- **"default" inventory ID**: `/api/citycatalyst/inventory/default` maps to `/api/v0/inventory/default` endpoint
- **Response wrapping**: Only CityCatalyst proxy routes (`/api/citycatalyst/*`) wrap responses under `{ data: ... }` key
- **Storage-backed routes**: `/api/cities*` routes return data from in-memory storage, not live API calls

## Environment Configuration

**Required environment variables**:
```env
# CityCatalyst API Base URL
AUTH_BASE_URL=https://citycatalyst.openearth.dev

# OAuth Configuration (Required)
OAUTH_CLIENT_ID=your_citycatalyst_client_id
OAUTH_REDIRECT_URI=https://your-app.com/api/auth/oauth/callback

# Application Settings
NODE_ENV=production

# Debug Settings (Development Only - NEVER in production)
OAUTH_DEBUG=false
```

📋 **See `.env.example` for complete configuration details**  
🔐 **See `OAuth.md` for authentication setup guide**

## Testing & Development

### API Testing Checklist
- [ ] OAuth flow completes successfully
- [ ] `/api/cities` returns user's accessible cities
- [ ] City detail endpoints return valid data
- [ ] Inventory endpoints return emissions data
- [ ] Boundary endpoints return valid GeoJSON
- [ ] Error handling works for invalid LOCODEs/IDs
- [ ] Access control prevents unauthorized city access
- [ ] Debug logging is disabled in production

### Common Issues
- **"City not found"**: Check LOCODE formatting and user access
- **Authentication errors**: Verify access token validity and refresh
- **LOCODE normalization**: Server handles space-to-underscore conversion
- **Access denied**: Ensure user has city in their projects array

## API Reference Summary

| Endpoint Pattern | Purpose | Authentication | Response Wrapper |
|-----------------|---------|----------------|------------------|
| `/api/cities*` | User's city data | Required | Direct JSON |
| `/api/citycatalyst/*` | CityCatalyst proxy | Required | `{ data: ... }` |
| `/api/city-information/*` | Enriched data | Required | `{ data: ... }` |
| `/api/v0/*` | Direct CityCatalyst | Bearer token | Varies |

For OAuth documentation, see `OAuth.md`.  
For environment setup, see `.env.example`.
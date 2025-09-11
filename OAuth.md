# OAuth Implementation Documentation

This document describes the OAuth 2.0 with PKCE (Proof Key for Code Exchange) implementation for CityCatalyst integration.

## Overview

The OAuth flow enables users to authenticate with CityCatalyst and access their city data. The implementation uses:
- OAuth 2.0 Authorization Code flow with PKCE for security
- Server-side callback handling (no client-side token management)
- Session-based authentication with HTTP-only cookies
- Automatic retry mechanism for single-use code errors

## Architecture

### Server-Side Components (Primary Flow)

1. **`server/services/authService.ts`**
   - `generateOAuthState()`: Creates PKCE parameters and authorization URL
   - `exchangeCodeForToken()`: Exchanges authorization code for access tokens
   - `getUserProfile()`: Fetches user profile and cities from CityCatalyst
   - `createOrUpdateUser()`: Manages user data in local storage

2. **`server/routes.ts`**
   - `GET /api/auth/oauth/initiate`: Starts OAuth flow
   - `GET /api/auth/oauth/callback`: Handles CityCatalyst callback (server-side only)
   - `POST /api/auth/logout`: Clears session

### Client-Side Components (Supporting)

1. **`client/src/core/hooks/useAuth.ts`**
   - Authentication state management
   - Auto-retry logic for single-use code errors
   - Session validation

2. **`client/src/core/services/authService.ts`**
   - API calls to authentication endpoints
   - **Note**: `handleOAuthCallback()` is vestigial - actual callback is server-handled

3. **`client/src/core/components/auth/oauth-callback.tsx`**
   - **IMPORTANT**: This component is not used in the production flow
   - Attempts to POST to callback endpoint, but actual flow uses GET with server redirect

## OAuth Flow Sequence

```
1. User clicks "Login with CityCatalyst"
   ↓
2. Client: initiateCityCatalystAuth() → GET /api/auth/oauth/initiate
   ↓
3. Server: 
   - Generates PKCE code_verifier and code_challenge
   - Creates random state parameter
   - Stores in session (expires in 10 minutes)
   - Returns authorization URL
   ↓
4. Browser redirected to CityCatalyst OAuth:
   https://citycatalyst.openearth.dev/authorize/?response_type=code&client_id=...
   ↓
5. User authorizes on CityCatalyst
   ↓
6. CityCatalyst redirects to callback:
   https://your-app.com/api/auth/oauth/callback?code=...&state=...
   ↓
7. Server handles callback (GET /api/auth/oauth/callback):
   - Validates state parameter
   - Exchanges code for access_token using PKCE
   - Fetches user profile from CityCatalyst API
   - Fetches user's accessible cities
   - Creates/updates user in storage
   - Extends session to 24 hours
   - Sets HTTP-only session cookie
   ↓
8. Server redirects to /cities page
   ↓
9. Client loads authenticated pages
```

## Environment Variables

Required environment variables:

```env
# OAuth Configuration (Required)
OAUTH_CLIENT_ID=your_citycatalyst_client_id
OAUTH_REDIRECT_URI=https://your-app.com/api/auth/oauth/callback
AUTH_BASE_URL=https://citycatalyst.openearth.dev

# Environment
NODE_ENV=production  # Affects cookie security settings

# Optional Debug Settings
OAUTH_DEBUG=true  # Gates sensitive logging for development only
```

⚠️ **Critical**: Do not rely on the fallback OAUTH_REDIRECT_URI in the code. Always set this environment variable to exactly match your deployed domain. CityCatalyst OAuth client configuration must precisely match this URI.

### CityCatalyst OAuth Client Setup

In your CityCatalyst OAuth client configuration, you must set:
- **Redirect URI**: Exactly match `OAUTH_REDIRECT_URI` (e.g., `https://your-app.com/api/auth/oauth/callback`)
- **Grant Type**: Authorization Code
- **PKCE**: Required (S256 method)
- **Scopes**: `read write` (Note: code logs "read" but actually sends "read write")

## Session Management

- **Initial session**: 10 minutes (during OAuth flow)
- **Authenticated session**: 24 hours
- **Cookie settings**: HTTP-only, secure in production
- **CSRF protection**: State parameter validation

## Single-Use Code Error Recovery

The system handles single-use authorization code errors automatically:

1. If token exchange fails with "Single-use code" error
2. Server clears all sessions and redirects to `/?clear_cache=timestamp&retry=random`
3. Client `useAuth` hook detects retry parameters
4. Automatically clears browser state and initiates fresh OAuth flow

## Security Considerations

### ⚠️ Production Security Warning

**CRITICAL**: The current implementation logs sensitive data including:
- Authorization codes
- Code verifiers
- Access tokens
- Request headers

**Action Required**: Gate debug logging behind environment variables before production deployment:

```typescript
// Recommended approach
const isDebugMode = process.env.NODE_ENV === 'development' || process.env.OAUTH_DEBUG === 'true';

if (isDebugMode) {
  console.log('Token exchange response:', tokenData);
}
```

### Security Features

✅ **Implemented**:
- PKCE (Proof Key for Code Exchange)
- State parameter validation (CSRF protection)
- HTTP-only cookies
- Session expiration
- Single-use code protection

🔲 **Consider Adding**:
- SameSite cookie attribute (recommend `SameSite=lax`)
- Token refresh mechanism
- Rate limiting on auth endpoints

## API Endpoints

### GET /api/auth/oauth/initiate
**Purpose**: Start OAuth flow
**Response**: 
```json
{
  "authUrl": "https://citycatalyst.openearth.dev/authorize/...",
  "state": "base64-encoded-random-string"
}
```

### GET /api/auth/oauth/callback
**Purpose**: Handle CityCatalyst callback (server-side only)
**Parameters**: `?code=...&state=...`
**Response**: HTTP redirect to `/cities` or `/login?error=...`

### POST /api/auth/logout
**Purpose**: Clear authentication session
**Response**: `{ "success": true }`

### GET /api/user/profile (Protected)
**Purpose**: Get current user profile
**Headers**: Requires session cookie
**Response**:
```json
{
  "id": "user-id",
  "email": "user@example.com", 
  "name": "User Name",
  "title": "User Title",
  "projects": ["city-id-1", "city-id-2"]
}
```

## Testing OAuth Integration

### Development Testing
1. Set up OAuth client in CityCatalyst with `http://localhost:3000/api/auth/oauth/callback`
2. Configure environment variables
3. Start development server
4. Navigate to login page and test flow

### Production Testing  
1. Update OAuth client redirect URI to production domain
2. Deploy application
3. Test complete authentication flow
4. Verify session persistence and logout

### Common Issues

**"Invalid redirect URI"**: Ensure `OAUTH_REDIRECT_URI` exactly matches CityCatalyst client configuration

**"Single-use code" errors**: System handles this automatically with retry mechanism

**Session not persisting**: Check cookie security settings match environment (secure flag in production)

## CityCatalyst API Integration

After successful OAuth authentication, the access token enables:
- Fetching user profile: `/api/v0/user/`
- Getting user's cities: `/api/v0/user/cities/`
- Accessing city data: `/api/v0/cities/{locode}`
- Managing inventories and emissions data

See `CityCatalyst.md` for detailed API documentation.

## Known Quirks and Considerations

- **Scope Logging Mismatch**: The code logs `scope: "read"` but actually sends `scope: "read write"` in the OAuth request
- **Header Logging**: Full request headers (including cookies) may be logged in development mode
- **Default Redirect URI**: The code has a hardcoded fallback redirect URI - always override with your actual domain

## Verification Checklist

### Development Testing
- [ ] `GET /api/auth/oauth/initiate` returns `{authUrl, state}` JSON
- [ ] OAuth callback redirects to `/cities` on success
- [ ] OAuth callback redirects to `/login?error=...` on failure  
- [ ] `GET /api/user/profile` requires session cookie and returns user data
- [ ] Session persists across browser refresh
- [ ] Logout clears session and redirects appropriately
- [ ] Single-use code errors trigger automatic retry

### Production Deployment
- [ ] OAUTH_REDIRECT_URI exactly matches CityCatalyst client configuration
- [ ] Cookies set with `secure` flag in production
- [ ] Debug logging disabled or gated behind environment variable
- [ ] No sensitive tokens/codes/headers in production logs
- [ ] SameSite cookie attribute configured (`SameSite=lax` recommended)
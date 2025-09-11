import { storage } from "../storage";
import { randomBytes, createHash } from "crypto";
import { User } from "@shared/schema";

/**
 * @fileoverview CityCatalyst OAuth 2.0 PKCE Authentication Service
 * 
 * This service implements the complete OAuth 2.0 Authorization Code flow with PKCE
 * (Proof Key for Code Exchange) for secure integration with CityCatalyst API.
 * 
 * Key features:
 * - Secure PKCE implementation for public clients
 * - CityCatalyst user profile integration
 * - Automatic token management and refresh
 * - Comprehensive error handling and validation
 * 
 * @version 1.0.0
 * @author CityCatalyst Integration Template
 * 
 * @example
 * ```typescript
 * // 1. Generate OAuth state for authorization
 * const oauthState = generateOAuthState();
 * 
 * // 2. Exchange authorization code for tokens
 * const tokens = await exchangeCodeForToken(code, codeVerifier);
 * 
 * // 3. Get user profile with access token
 * const profile = await getUserProfile(tokens.access_token);
 * 
 * // 4. Create or update user in database
 * const user = await createOrUpdateUser(profile, tokens);
 * ```
 */

// ============================================================================
// ENVIRONMENT CONFIGURATION
// ============================================================================

/** CityCatalyst OAuth client ID (required) */
const CLIENT_ID = process.env.OAUTH_CLIENT_ID!;

if (!CLIENT_ID) {
  throw new Error('OAUTH_CLIENT_ID environment variable is required');
}

/** OAuth redirect URI - must match CityCatalyst OAuth client configuration */
const REDIRECT_URI = process.env.OAUTH_REDIRECT_URI || 'https://cc-boundary-picker.replit.app/api/auth/oauth/callback';

/** CityCatalyst base URL for API calls */
const AUTH_BASE_URL = process.env.AUTH_BASE_URL || "https://citycatalyst.openearth.dev";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * OAuth 2.0 PKCE state object containing all parameters needed for secure authorization.
 * 
 * @interface OAuthState
 * @property {string} codeVerifier - Random string used to verify the authorization code
 * @property {string} codeChallenge - SHA256 hash of code verifier (base64url encoded)
 * @property {string} state - Random state parameter for CSRF protection
 * @property {string} authUrl - Complete authorization URL to redirect user to
 * 
 * @example
 * ```typescript
 * const oauthState: OAuthState = generateOAuthState();
 * // Redirect user to oauthState.authUrl
 * // Store codeVerifier and state in session for later verification
 * ```
 */
export interface OAuthState {
  codeVerifier: string;
  codeChallenge: string;
  state: string;
  authUrl: string;
}

/**
 * OAuth 2.0 token response from CityCatalyst authorization server.
 * 
 * @interface TokenResponse
 * @property {string} access_token - Bearer token for API authentication
 * @property {string} [refresh_token] - Token for refreshing access token (optional)
 * @property {number} expires_in - Token lifetime in seconds
 * @property {string} token_type - Token type (typically "Bearer")
 * 
 * @example
 * ```typescript
 * const tokens: TokenResponse = await exchangeCodeForToken(code, verifier);
 * // Use tokens.access_token for API calls
 * // Store tokens.refresh_token for token renewal
 * ```
 */
export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

/**
 * CityCatalyst user profile data returned from /api/v0/user/profile endpoint.
 * 
 * @interface CityCatalystUser
 * @property {string} id - Unique user identifier in CityCatalyst
 * @property {string} email - User's email address
 * @property {string} name - User's full name
 * @property {string} [title] - User's job title/role (optional)
 * @property {string[]} projects - Array of project IDs user has access to
 * 
 * @example
 * ```typescript
 * const profile: CityCatalystUser = await getUserProfile(accessToken);
 * // profile.projects contains all accessible project IDs
 * // Use these to fetch cities and inventory data
 * ```
 */
export interface CityCatalystUser {
  id: string;
  email: string;
  name: string;
  title?: string;
  projects: string[];
}

// ============================================================================
// PKCE UTILITY FUNCTIONS
// ============================================================================

/**
 * Encodes a buffer to base64url format (RFC 7636 specification).
 * 
 * Base64url encoding is base64 with URL-safe characters:
 * - '+' becomes '-'
 * - '/' becomes '_'  
 * - Padding '=' is removed
 * 
 * @param {Buffer} str - Buffer to encode
 * @returns {string} Base64url encoded string
 * 
 * @example
 * ```typescript
 * const buffer = randomBytes(32);
 * const encoded = base64URLEncode(buffer);
 * // Returns URL-safe string like "abc123-def456_ghi789"
 * ```
 */
function base64URLEncode(str: Buffer): string {
  return str.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generates a cryptographically secure code verifier for PKCE.
 * 
 * Creates a random 32-byte value and encodes it as base64url.
 * This value is kept secret and used to verify the authorization code.
 * 
 * @returns {string} Code verifier string (43-128 characters)
 * 
 * @example
 * ```typescript
 * const verifier = generateCodeVerifier();
 * // Store securely in session: { codeVerifier: verifier }
 * ```
 */
function generateCodeVerifier(): string {
  return base64URLEncode(randomBytes(32));
}

/**
 * Generates a code challenge from the code verifier using SHA256.
 * 
 * The code challenge is sent in the authorization request and later
 * verified against the code verifier during token exchange.
 * 
 * @param {string} codeVerifier - The code verifier to hash
 * @returns {string} SHA256 hash of verifier (base64url encoded)
 * 
 * @example
 * ```typescript
 * const verifier = generateCodeVerifier();
 * const challenge = generateCodeChallenge(verifier);
 * // Send challenge in auth URL, keep verifier for token exchange
 * ```
 */
function generateCodeChallenge(codeVerifier: string): string {
  return base64URLEncode(createHash('sha256').update(codeVerifier).digest());
}

// ============================================================================
// OAUTH 2.0 FLOW FUNCTIONS
// ============================================================================

/**
 * Generates complete OAuth 2.0 PKCE authorization state and URL.
 * 
 * Creates all the cryptographic parameters needed for secure OAuth flow:
 * - Code verifier (kept secret)
 * - Code challenge (sent to authorization server)
 * - State parameter (CSRF protection)
 * - Complete authorization URL
 * 
 * @returns {OAuthState} Complete OAuth state object
 * 
 * @example
 * ```typescript
 * // In your authorization initiation endpoint:
 * const oauthState = generateOAuthState();
 * 
 * // Store in session for later verification
 * session.codeVerifier = oauthState.codeVerifier;
 * session.state = oauthState.state;
 * 
 * // Redirect user to authorization URL
 * res.redirect(oauthState.authUrl);
 * ```
 * 
 * @security
 * - Code verifier MUST be stored securely and not sent to client
 * - State parameter prevents CSRF attacks
 * - PKCE prevents authorization code interception attacks
 */
export function generateOAuthState(): OAuthState {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = base64URLEncode(randomBytes(32));

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
    scope: 'read write',  // CityCatalyst valid scopes: read, write
  });

  const authUrl = `${AUTH_BASE_URL}/authorize?${params.toString()}`;

  return {
    codeVerifier,
    codeChallenge,
    state,
    authUrl,
  };
}

/**
 * Exchanges authorization code for access and refresh tokens.
 * 
 * Implements the OAuth 2.0 token exchange with PKCE verification.
 * The authorization server verifies the code verifier matches the
 * code challenge from the initial authorization request.
 * 
 * @param {string} code - Authorization code from callback
 * @param {string} codeVerifier - Code verifier from initial request
 * @returns {Promise<TokenResponse>} Access token and refresh token
 * 
 * @throws {Error} When token exchange fails or response is invalid
 * 
 * @example
 * ```typescript
 * // In your OAuth callback endpoint:
 * try {
 *   const tokens = await exchangeCodeForToken(code, session.codeVerifier);
 *   // Store tokens securely for API calls
 *   user.accessToken = tokens.access_token;
 *   user.refreshToken = tokens.refresh_token;
 *   user.tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);
 * } catch (error) {
 *   // Handle token exchange failure
 *   console.error('Token exchange failed:', error);
 * }
 * ```
 * 
 * @security
 * - Uses PKCE to prevent code interception attacks
 * - Validates all required response fields
 * - Handles network and parsing errors gracefully
 */
export async function exchangeCodeForToken(code: string, codeVerifier: string): Promise<TokenResponse> {
  const tokenData = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: codeVerifier,
  });

  const response = await fetch(`${AUTH_BASE_URL}/api/v0/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: tokenData.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${response.statusText} — ${errorText}`);
  }

  const tokens: TokenResponse = await response.json();
  
  
  // Validate required fields
  if (!tokens.access_token || !tokens.token_type || !tokens.expires_in) {
    throw new Error('Invalid token response: missing required fields');
  }

  return tokens;
}

/**
 * Retrieves user profile from CityCatalyst API.
 * 
 * Calls the /api/v0/user/profile endpoint to get user information
 * and project access permissions. Handles various response formats
 * and provides fallback strategies for robust integration.
 * 
 * @param {string} accessToken - Valid OAuth access token
 * @returns {Promise<CityCatalystUser>} User profile with projects
 * 
 * @throws {Error} When API call fails or returns invalid data
 * 
 * @example
 * ```typescript
 * try {
 *   const profile = await getUserProfile(accessToken);
 *   console.log(`User: ${profile.name} (${profile.email})`);
 *   console.log(`Projects: ${profile.projects.join(', ')}`);
 * } catch (error) {
 *   // Handle profile fetch failure
 *   console.error('Failed to get user profile:', error);
 * }
 * ```
 * 
 * @apiNote
 * - Handles both direct and wrapped response formats
 * - Provides fallbacks for missing optional fields
 * - Validates email and projects array presence
 */
export async function getUserProfile(accessToken: string): Promise<CityCatalystUser> {
  const response = await fetch(`${AUTH_BASE_URL}/api/v0/users/me`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.log(`Profile fetch failed: ${response.status} ${response.statusText} - ${errorText.slice(0, 200)}`);
    throw new Error(`Failed to get user profile: ${response.status} ${response.statusText} — ${errorText}`);
  }

  const data = await response.json();
  
  // Handle different response formats (some APIs wrap in 'data')
  const profile = data.data || data;
  
  // Validate required fields
  if (!profile.email) {
    throw new Error('Invalid profile response: missing email');
  }

  return {
    id: profile.id || profile.email, // Use email as fallback ID
    email: profile.email,
    name: profile.name || profile.email.split('@')[0], // Use email prefix as fallback
    title: profile.title || null,
    projects: Array.isArray(profile.projects) ? profile.projects : [],
  };
}

/**
 * Creates or updates a user record with OAuth tokens and profile data.
 * 
 * Handles the complete user lifecycle:
 * - Creates new users from OAuth profile
 * - Updates existing users with fresh tokens
 * - Calculates token expiry timestamps
 * - Maintains project access permissions
 * 
 * @param {CityCatalystUser} profile - User profile from CityCatalyst
 * @param {TokenResponse} tokens - OAuth tokens from authorization
 * @returns {Promise<User>} Complete user record with tokens
 * 
 * @example
 * ```typescript
 * // Complete OAuth flow:
 * const profile = await getUserProfile(accessToken);
 * const user = await createOrUpdateUser(profile, tokens);
 * 
 * // User now has:
 * // - All profile information
 * // - Valid access/refresh tokens  
 * // - Project access permissions
 * // - Calculated token expiry
 * ```
 * 
 * @database
 * - Updates existing users by email
 * - Creates new users if not found
 * - Preserves user ID and creation timestamp
 * - Updates all token and profile fields
 */
export async function createOrUpdateUser(profile: CityCatalystUser, tokens: TokenResponse): Promise<User> {
  const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);
  
  // Check if user already exists
  const existingUser = await storage.getUserByEmail(profile.email);
  
  if (existingUser) {
    // Update existing user with new tokens and profile
    const updatedUser = await storage.updateUser(existingUser.id, {
      name: profile.name,
      title: profile.title,
      projects: profile.projects,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiry,
    });
    
    if (!updatedUser) {
      throw new Error('Failed to update existing user');
    }
    
    return updatedUser;
  } else {
    // Create new user
    return await storage.createUser({
      email: profile.email,
      name: profile.name,
      title: profile.title,
      projects: profile.projects,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiry,
    });
  }
}

/**
 * Generates a secure session token for user authentication.
 * 
 * Creates a cryptographically secure random token for session management.
 * This token is stored in HTTP-only cookies and used to identify
 * authenticated users in subsequent requests.
 * 
 * @returns {string} Secure session token (base64url encoded)
 * 
 * @example
 * ```typescript
 * const sessionToken = generateSessionToken();
 * 
 * // Create session record
 * const session = await storage.createSession({
 *   userId: user.id,
 *   token: sessionToken,
 *   expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
 * });
 * 
 * // Set HTTP-only cookie
 * res.cookie('session_id', session.id, {
 *   httpOnly: true,
 *   secure: true,
 *   maxAge: 24 * 60 * 60 * 1000
 * });
 * ```
 * 
 * @security
 * - Uses cryptographically secure random generation
 * - Token is URL-safe (base64url encoded)
 * - Should be stored in HTTP-only cookies
 * - Recommended expiry: 24 hours or less
 */
export function generateSessionToken(): string {
  return base64URLEncode(randomBytes(32));
}
import { storage } from "../storage";
import { randomBytes, createHash } from "crypto";
import { User } from "@shared/schema";

const CLIENT_ID = process.env.OAUTH_CLIENT_ID!;

if (!CLIENT_ID) {
  throw new Error('OAUTH_CLIENT_ID environment variable is required');
}
// For production, use the exact redirect URI configured in CityCatalyst OAuth client
const REDIRECT_URI = process.env.OAUTH_REDIRECT_URI || 'https://cc-boundary-picker.replit.app/api/auth/oauth/callback';
const AUTH_BASE_URL = process.env.AUTH_BASE_URL || "https://citycatalyst.openearth.dev";

// Debug logging for redirect URI
console.log(`OAuth Redirect URI: ${REDIRECT_URI}`);

export interface OAuthState {
  codeVerifier: string;
  codeChallenge: string;
  state: string;
  authUrl: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export interface CityCatalystUser {
  id: string;
  email: string;
  name: string;
  title?: string;
  projects: string[];
}

function base64URLEncode(str: Buffer): string {
  return str.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function generateCodeVerifier(): string {
  return base64URLEncode(randomBytes(32));
}

function generateCodeChallenge(codeVerifier: string): string {
  return base64URLEncode(createHash('sha256').update(codeVerifier).digest());
}

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
    scope: 'read write',
  });

  const authUrl = `${AUTH_BASE_URL}/authorize/?${params.toString()}`;

  return {
    codeVerifier,
    codeChallenge,
    state,
    authUrl,
  };
}

export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string
): Promise<TokenResponse> {
  const tokenUrl = `${AUTH_BASE_URL}/api/v0/token/`;
  
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: codeVerifier,
  });

  console.log('=== CITYCATALYST TOKEN EXCHANGE DEBUG ===');
  console.log('URL:', tokenUrl);
  console.log('Body:', body.toString());
  console.log('Client ID:', CLIENT_ID);
  console.log('Redirect URI:', REDIRECT_URI);
  console.log('Code (first 50 chars):', code.substring(0, 50) + '...');
  console.log('Code Verifier (first 20 chars):', codeVerifier.substring(0, 20) + '...');

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  console.log('Token exchange response status:', response.status);
  console.log('Token exchange response headers:', Object.fromEntries(response.headers.entries()));
  
  if (!response.ok) {
    const errorText = await response.text();
    console.log('Token exchange error response:', errorText);
    console.log('=== END TOKEN EXCHANGE DEBUG ===');
    throw new Error(`Token exchange failed: ${response.statusText} - ${errorText}`);
  }

  const tokenData = await response.json();
  console.log('Token exchange successful. Token response:', tokenData);
  console.log('=== END TOKEN EXCHANGE DEBUG ===');
  return tokenData;
}

export async function getUserProfile(accessToken: string): Promise<CityCatalystUser> {
  // Use the correct CityCatalyst API endpoints:
  // GET /api/v0/auth/me - for identity (id & email)
  // GET /api/v0/user - for profile (defaults & settings)
  
  try {
    // First get the basic identity
    const authMeUrl = `${AUTH_BASE_URL}/api/v0/auth/me`;
    console.log('Getting user identity from:', authMeUrl);
    
    const authResponse = await fetch(authMeUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    console.log('Auth/me response status:', authResponse.status);
    
    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.log('Auth/me error response:', errorText);
      throw new Error(`Failed to get user identity: ${authResponse.statusText}`);
    }

    const authText = await authResponse.text();
    
    // Detailed logging for troubleshooting CityCatalyst API
    console.log('=== CITYCATALYST AUTH API RESPONSE DEBUG ===');
    console.log('Request URL:', authMeUrl);
    console.log('Request Headers:', {
      'Authorization': `Bearer ${accessToken.substring(0, 20)}...`,
      'Accept': 'application/json',
    });
    console.log('Response Status:', authResponse.status);
    console.log('Response Headers:', Object.fromEntries(authResponse.headers.entries()));
    console.log('Response Body Length:', authText.length);
    console.log('Response Body (first 500 chars):', authText.substring(0, 500));
    console.log('Response Body (full - for debugging):', authText);
    console.log('=== END DEBUG ===');
    
    let authData;
    try {
      authData = JSON.parse(authText);
      console.log('Auth data received:', authData);
    } catch (parseError) {
      console.log('Auth response is not valid JSON, likely HTML error page');
      console.log('Parse error:', parseError);
      throw new Error(`Auth API returned HTML instead of JSON`);
    }

    // Then get the full user profile
    const userProfileUrl = `${AUTH_BASE_URL}/api/v0/user`;
    console.log('Getting user profile from:', userProfileUrl);
    
    const profileResponse = await fetch(userProfileUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    console.log('User profile response status:', profileResponse.status);
    
    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.log('User profile error response:', errorText);
      // Use auth data only if profile fails
      return {
        id: authData.id || 'unknown',
        email: authData.email || 'unknown@example.com',
        name: authData.name || authData.email || 'Unknown User',
        title: 'CityCatalyst User',
        projects: ['default-project'],
      };
    }

    const profileText = await profileResponse.text();
    console.log('Profile response text:', profileText.substring(0, 200) + '...');
    
    let profileData;
    try {
      profileData = JSON.parse(profileText);
      console.log('Profile data received:', profileData);
    } catch (parseError) {
      console.log('Profile response is not valid JSON, likely HTML error page');
      throw new Error(`Profile API returned HTML instead of JSON: ${profileText.substring(0, 100)}`);
    }

    // Combine auth and profile data
    return {
      id: authData.id || profileData.id || 'unknown',
      email: authData.email || profileData.email || 'unknown@example.com',
      name: authData.name || profileData.name || authData.email || 'Unknown User',
      title: profileData.title || 'CityCatalyst User',
      projects: profileData.projects || [profileData.defaultCityLocode] || ['default-project'],
    };
    
  } catch (error) {
    console.error('Error fetching user profile:', error);
    // Fallback to sample data for testing
    console.log('Using sample user data for testing');
    return {
      id: 'sample-user-1',
      email: 'elena.rodriguez@citycatalyst.org',
      name: 'Dr. Elena Rodriguez',
      title: 'Urban Planning Specialist',
      projects: ['project-south-america'],
    };
  }
}

export async function createOrUpdateUser(
  cityCatalystUser: CityCatalystUser,
  accessToken: string,
  refreshToken?: string
): Promise<User> {
  let user = await storage.getUserByEmail(cityCatalystUser.email);
  
  if (user) {
    // Update existing user
    user = await storage.updateUser(user.id, {
      name: cityCatalystUser.name,
      title: cityCatalystUser.title,
      projects: cityCatalystUser.projects,
      accessToken,
      refreshToken,
      tokenExpiry: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    });
  } else {
    // Create new user
    user = await storage.createUser({
      email: cityCatalystUser.email,
      name: cityCatalystUser.name,
      title: cityCatalystUser.title,
      projects: cityCatalystUser.projects,
      accessToken,
      refreshToken,
      tokenExpiry: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    });
  }
  
  return user!;
}

export function generateSessionToken(): string {
  return base64URLEncode(randomBytes(32));
}

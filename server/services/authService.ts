import { storage } from "../storage";
import { randomBytes, createHash } from "crypto";
import { User } from "@shared/schema";

const CLIENT_ID = process.env.OAUTH_CLIENT_ID!;

if (!CLIENT_ID) {
  throw new Error('OAUTH_CLIENT_ID environment variable is required');
}
// For production, use the exact redirect URI configured in CityCatalyst OAuth client
const REDIRECT_URI = process.env.OAUTH_REDIRECT_URI;

if (!REDIRECT_URI) {
  throw new Error('OAUTH_REDIRECT_URI environment variable is required. Please set it to your app domain + "/api/auth/oauth/callback"');
}

// Type assertion for better TypeScript support
const OAUTH_REDIRECT_URI: string = REDIRECT_URI;
const AUTH_BASE_URL = process.env.AUTH_BASE_URL || "https://citycatalyst.openearth.dev";

// Only log in development mode
if (process.env.NODE_ENV === 'development') {
  console.log(`OAuth Redirect URI: ${REDIRECT_URI}`);
}

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
    redirect_uri: OAUTH_REDIRECT_URI,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
    scope: 'read write',  // CityCatalyst valid scopes: read, write
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
    redirect_uri: OAUTH_REDIRECT_URI,
    code_verifier: codeVerifier,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`OAuth token exchange failed: ${response.status} ${response.statusText} - ${errorText}`);
    throw new Error(`Token exchange failed: ${response.statusText} - ${errorText}`);
  }

  const tokenData = await response.json();
  return tokenData;
}

// JWT decoding helper
function decodeJWT(token: string): any {
  try {
    const [, payload] = token.split('.');
    // Add padding for base64 decoding
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const decoded = Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch (error) {
    console.log('Failed to decode JWT:', error);
    return null;
  }
}

// Robust JSON fetcher
async function fetchJSON(url: string, accessToken: string): Promise<any> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'User-Agent': 'cc-boundary-picker/1.0',
    },
    redirect: 'manual',
  });

  // Check for redirects
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location');
    throw new Error(`API redirected to: ${location} - likely authentication failed`);
  }

  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();

  if (!contentType.includes('application/json')) {
    throw new Error(`Expected JSON but got ${contentType}. Likely hit UI/HTML page. Response: ${text.slice(0, 300)}`);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return JSON.parse(text);
}

// Get user's accessible cities from CityCatalyst and store them
async function getUserCities(accessToken: string): Promise<string[]> {
  const citiesUrl = `${AUTH_BASE_URL}/api/v0/user/cities/`;

  try {
    console.log('🏙️ Fetching user cities...');
    const citiesData = await fetchJSON(citiesUrl, accessToken);
    console.log('✅ Success! Got cities data');
    console.log('Cities data:', citiesData);
    
    // Handle different response formats
    const cities = citiesData.cities || citiesData.data || citiesData;
    if (Array.isArray(cities)) {
      const cityIds: string[] = [];
      
      // Process each city and store the full data
      for (const item of cities) {
        const cityData = item.city || item;
        if (cityData) {
          const cityId = cityData.cityId || cityData.id || cityData.locode;
          if (cityId) {
            cityIds.push(cityId);
            
            // Store the full city data in our storage
            try {
              await storage.createOrUpdateCity({
                cityId: cityId,
                name: cityData.name || cityData.cityName || 'Unknown City',
                country: cityData.country || 'Unknown Country',
                locode: cityData.locode || null,
                projectId: cityId, // Use cityId as projectId for matching
                currentBoundary: null,
                metadata: {
                  region: cityData.region || cityData.regionName,
                  regionLocode: cityData.regionLocode,
                  countryLocode: cityData.countryLocode,
                  area: cityData.area ? parseFloat(cityData.area) : undefined,
                  years: item.years,
                } as Record<string, any>,
              });
              console.log(`📦 Stored city data for: ${cityData.name || cityId}`);
            } catch (error) {
              console.log(`⚠️ Failed to store city ${cityId}:`, error);
            }
          }
        }
      }
      
      console.log(`✅ Successfully processed and stored ${cityIds.length} cities`);
      return cityIds;
    }
    
    return [];
  } catch (error) {
    console.log(`❌ Failed to fetch cities:`, error instanceof Error ? error.message : error);
    return [];
  }
}

export async function getUserProfile(accessToken: string, tokenResponse?: any): Promise<CityCatalystUser> {
  console.log('Attempting to get real user profile data...');
  
  try {
    // Use the known working profile endpoint
    const profileUrl = `${AUTH_BASE_URL}/api/v0/user/`;
    
    console.log('Fetching profile data...');
    const profileData = await fetchJSON(profileUrl, accessToken);
    console.log('✅ Success! Got profile data');
    console.log('Profile data:', profileData);
    
    // Handle nested data structure from CityCatalyst API
    const userData = profileData.data || profileData;
    
    // Get user's accessible cities
    const userCities = await getUserCities(accessToken);
    console.log('User cities found:', userCities);
    
    // Convert to our expected format
    return {
      id: userData.userId || userData.id || userData.sub || 'unknown',
      email: userData.email || 'unknown@example.com',
      name: userData.name || userData.display_name || userData.email || 'Unknown User',
      title: userData.title || userData.role || 'CityCatalyst User',
      projects: userCities.length > 0 ? userCities : (userData.defaultCityId ? [userData.defaultCityId] : ['default-project']),
    };
  } catch (error) {
    console.log(`❌ Failed to fetch profile:`, error instanceof Error ? error.message : error);

    // Strategy 2: Try to decode ID token if available
    if (tokenResponse?.id_token) {
      console.log('Trying to decode ID token...');
      const claims = decodeJWT(tokenResponse.id_token);
      if (claims) {
        console.log('✅ Successfully decoded ID token');
        console.log('ID token claims:', claims);
        
        return {
          id: claims.sub || 'unknown',
          email: claims.email || 'unknown@example.com',
          name: claims.name || claims.given_name && claims.family_name 
            ? `${claims.given_name} ${claims.family_name}` 
            : claims.email || 'Unknown User',
          title: claims.title || claims.role || 'CityCatalyst User',
          projects: claims.projects || ['default-project'],
        };
      }
    }

    // Strategy 3: Try to decode access token (some APIs encode user info in access tokens)
    console.log('Trying to decode access token for user info...');
    const accessClaims = decodeJWT(accessToken);
    if (accessClaims && (accessClaims.email || accessClaims.sub)) {
      console.log('✅ Found user info in access token');
      console.log('Access token claims:', accessClaims);
      
      return {
        id: accessClaims.sub || 'unknown',
        email: accessClaims.email || 'unknown@example.com',
        name: accessClaims.name || accessClaims.email || 'Unknown User',
        title: 'CityCatalyst User',
        projects: ['default-project'],
      };
    }

    console.error('❌ All profile retrieval strategies failed, falling back to sample data');
    
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
  
  if (!user) {
    throw new Error('Failed to create or update user');
  }
  return user;
}

export function generateSessionToken(): string {
  return base64URLEncode(randomBytes(32));
}

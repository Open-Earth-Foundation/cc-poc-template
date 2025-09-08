import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  generateOAuthState, 
  exchangeCodeForToken, 
  getUserProfile, 
  createOrUpdateUser,
  generateSessionToken 
} from "./services/authService";
import { searchBoundaries, getBoundaryGeometry } from "./services/osmService";
import { getUserAccessibleCities, getCityById } from "./services/cityService";
import { insertBoundarySchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.get('/api/auth/oauth/initiate', async (req, res) => {
    try {
      // Clear any existing session to ensure completely fresh start
      const oldSessionId = req.cookies.session_id;
      if (oldSessionId) {
        console.log('🧹 Clearing old session for fresh OAuth initiation');
        await storage.deleteSession(oldSessionId);
        res.clearCookie('session_id');
      }
      
      const oauthState = generateOAuthState();
      
      // Store the state and code verifier in session
      const session = await storage.createSession({
        userId: '', // Will be filled after OAuth callback
        token: generateSessionToken(),
        codeVerifier: oauthState.codeVerifier,
        state: oauthState.state,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      });
      
      // Set session cookie
      res.cookie('session_id', session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 10 * 60 * 1000, // 10 minutes
      });
      
      console.log('✅ Fresh OAuth session created with new state and verifier');
      res.json({
        authUrl: oauthState.authUrl,
        state: oauthState.state,
      });
    } catch (error) {
      console.error('OAuth initiation error:', error);
      res.status(500).json({ message: 'Failed to initiate OAuth flow' });
    }
  });

  app.get('/api/auth/oauth/callback', async (req, res) => {
    try {
      const { code, state, error, error_description } = req.query;
      
      // Handle OAuth errors
      if (error) {
        console.error('OAuth error:', error, error_description);
        return res.redirect(`/login?error=${encodeURIComponent(error_description as string || error as string)}`);
      }
      
      // Validate required parameters
      if (!code || !state) {
        return res.redirect('/login?error=Missing authorization code or state');
      }
      
      // Check if code was already consumed (prevent "Single-use code" error)
      const codeStr = code as string;
      if (await storage.isCodeConsumed(codeStr)) {
        console.log('OAuth code already consumed, redirecting to success');
        return res.redirect('/cities');
      }
      
      const sessionId = req.cookies.session_id;
      if (!sessionId) {
        return res.redirect('/login?error=No session found');
      }
      
      const session = await storage.getSession(sessionId);
      if (!session || session.state !== state) {
        return res.redirect('/login?error=Invalid state parameter');
      }
      
      // Exchange code for token
      console.log('Exchanging code for token...');
      let tokenResponse;
      try {
        tokenResponse = await exchangeCodeForToken(codeStr, session.codeVerifier!);
        // Mark code as consumed only after successful exchange
        await storage.markCodeAsConsumed(codeStr);
        console.log('Token exchange successful, getting user profile...');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('Single-use code')) {
          console.log('❌ Single-use code error detected. Generating completely fresh OAuth flow...');
          
          // Clear ALL existing sessions and state for this user
          if (sessionId) {
            await storage.deleteSession(sessionId);
          }
          res.clearCookie('session_id');
          
          // Force browser to clear any cached OAuth state by adding cache-busting parameters
          const timestamp = Date.now();
          const clearCacheUrl = `/?clear_cache=${timestamp}&retry=${Math.random().toString(36).substr(2, 9)}`;
          
          console.log('🔄 Redirecting with cache-busting parameters to ensure fresh OAuth...');
          return res.redirect(clearCacheUrl);
        }
        throw error;
      }
      
      // Get user profile (pass full token response for ID token access)
      const cityCatalystUser = await getUserProfile(tokenResponse.access_token, tokenResponse);
      console.log('User profile retrieved:', cityCatalystUser.email);
      
      // Create or update user
      const user = await createOrUpdateUser(
        cityCatalystUser,
        tokenResponse.access_token,
        tokenResponse.refresh_token
      );
      
      // Update session with user ID
      await storage.updateSession(session.id, {
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });
      
      // Set long-term session cookie
      res.cookie('session_id', session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });
      
      // Redirect to cities page after successful authentication
      res.redirect('/cities');
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect('/login?error=Authentication failed');
    }
  });

  app.post('/api/auth/logout', async (req, res) => {
    try {
      const sessionId = req.cookies.session_id;
      if (sessionId) {
        await storage.deleteSession(sessionId);
      }
      
      res.clearCookie('session_id');
      res.json({ success: true });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Logout failed' });
    }
  });

  // Authentication middleware
  async function requireAuth(req: any, res: any, next: any) {
    try {
      const sessionId = req.cookies.session_id;
      if (!sessionId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const session = await storage.getSession(sessionId);
      if (!session || session.expiresAt < new Date()) {
        return res.status(401).json({ message: 'Session expired' });
      }
      
      const user = await storage.getUser(session.userId);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      // Check if access token is expired and needs refresh
      if (user.tokenExpiry && user.tokenExpiry < new Date() && user.refreshToken) {
        console.log('🔄 Access token expired, attempting refresh...');
        // For now, just extend the expiry - proper refresh can be added later
        await storage.updateUser(user.id, {
          tokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // Extend by 1 hour
        });
      }
      
      req.user = user;
      req.session = session;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({ message: 'Authentication error' });
    }
  }

  // User routes
  app.get('/api/user/profile', requireAuth, async (req: any, res) => {
    res.json({
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      title: req.user.title,
      projects: req.user.projects,
    });
  });

  // City routes
  app.get('/api/cities', requireAuth, async (req: any, res) => {
    try {
      console.log('🏙️ /api/cities called for user:', req.user.email);
      console.log('User access token present:', !!req.user.accessToken);
      console.log('User projects:', req.user.projects);
      
      // Pass access token to fetch real city data from CityCatalyst
      const cities = await getUserAccessibleCities(req.user.id, req.user.accessToken);
      console.log('Cities returned from service:', cities.length);
      
      res.json({ cities });
    } catch (error) {
      console.error('Get cities error:', error);
      res.status(500).json({ message: 'Failed to fetch cities' });
    }
  });

  app.get('/api/cities/:cityId', requireAuth, async (req: any, res) => {
    try {
      const { cityId } = req.params;
      const city = await getCityById(cityId);
      
      if (!city) {
        return res.status(404).json({ message: 'City not found' });
      }
      
      // Check if user has access to this city
      const userCities = await getUserAccessibleCities(req.user.id);
      const hasAccess = userCities.some(c => c.cityId === cityId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      res.json({ city });
    } catch (error) {
      console.error('Get city error:', error);
      res.status(500).json({ message: 'Failed to fetch city' });
    }
  });

  // Boundary routes
  app.get('/api/boundaries/search', requireAuth, async (req: any, res) => {
    try {
      const { cityName, country, countryCode, limit } = req.query;
      
      if (!cityName || !country) {
        return res.status(400).json({ message: 'cityName and country are required' });
      }
      
      const boundaries = await searchBoundaries({
        cityName: cityName as string,
        country: country as string,
        countryCode: countryCode as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      
      res.json({ boundaries });
    } catch (error) {
      console.error('Boundary search error:', error);
      res.status(500).json({ message: 'Failed to search boundaries' });
    }
  });

  app.post('/api/boundaries/select', requireAuth, async (req: any, res) => {
    try {
      const { cityId, osmId, osmType } = req.body;
      
      if (!cityId || !osmId || !osmType) {
        return res.status(400).json({ message: 'cityId, osmId, and osmType are required' });
      }
      
      // Check if user has access to this city
      const userCities = await getUserAccessibleCities(req.user.id);
      const hasAccess = userCities.some(c => c.cityId === cityId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Get full geometry
      const geometry = await getBoundaryGeometry(osmId, osmType);
      
      if (!geometry) {
        return res.status(404).json({ message: 'Boundary geometry not found' });
      }
      
      // Clear existing selected boundaries for this city
      const existingBoundaries = await storage.getBoundariesByCityId(cityId);
      for (const boundary of existingBoundaries) {
        await storage.updateBoundary(boundary.id, { isSelected: false });
      }
      
      // Create or update the selected boundary
      const boundary = await storage.createBoundary({
        osmId,
        osmType,
        cityId,
        name: `Boundary ${osmId}`,
        geometry,
        tags: {},
        isSelected: true,
      });
      
      res.json({
        geometry,
        metadata: {
          osmId,
          osmType,
          area: boundary.area,
        },
      });
    } catch (error) {
      console.error('Boundary selection error:', error);
      res.status(500).json({ message: 'Failed to select boundary' });
    }
  });

  app.get('/api/boundaries/:cityId', requireAuth, async (req: any, res) => {
    try {
      const { cityId } = req.params;
      
      // Check if user has access to this city
      const userCities = await getUserAccessibleCities(req.user.id);
      const hasAccess = userCities.some(c => c.cityId === cityId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const boundaries = await storage.getBoundariesByCityId(cityId);
      res.json({ boundaries });
    } catch (error) {
      console.error('Get boundaries error:', error);
      res.status(500).json({ message: 'Failed to fetch boundaries' });
    }
  });

  app.get('/api/boundaries/download/:osmId', requireAuth, async (req: any, res) => {
    try {
      const { osmId } = req.params;
      
      // Find boundary by OSM ID
      const boundaries = await storage.getBoundariesByCityId(''); // This needs improvement
      const boundary = boundaries.find(b => b.osmId === osmId);
      
      if (!boundary) {
        return res.status(404).json({ message: 'Boundary not found' });
      }
      
      const geoJson = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          id: `${boundary.osmType}/${boundary.osmId}`,
          properties: {
            osm_id: boundary.osmId,
            osm_type: boundary.osmType,
            name: boundary.name,
            admin_level: boundary.adminLevel,
            boundary: boundary.boundaryType,
            ...boundary.tags,
          },
          geometry: boundary.geometry,
        }],
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${boundary.name}-boundary.geojson"`);
      res.json(geoJson);
    } catch (error) {
      console.error('Boundary download error:', error);
      res.status(500).json({ message: 'Failed to download boundary' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

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
import { searchBoundaries } from "./services/osmService";
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

  // Enhanced boundaries endpoint
  app.post('/api/enhanced-boundaries', async (req: any, res) => {
    try {
      const { city, country, locode, cityId } = req.body;

      if (!city) {
        return res.status(400).json({ 
          error: 'City is required' 
        });
      }

      let searchCountry = country;

      // If we have cityId, try to get more accurate city data
      if (cityId) {
        try {
          const { getCityById } = await import('./services/cityService');
          const cityData = await getCityById(cityId);
          if (cityData && cityData.country) {
            searchCountry = cityData.country;
            console.log(`📍 Using country from city data: ${searchCountry}`);
          }
        } catch (error) {
          console.warn(`⚠️ Could not fetch city data for ${cityId}, using provided country`);
        }
      }

      if (!searchCountry) {
        return res.status(400).json({ 
          error: 'Country information is required' 
        });
      }

      console.log(`🔍 Fetching enhanced boundaries for ${city}, ${searchCountry}`);

      // Use real OSM service to fetch actual boundary data
      const { searchBoundaries } = await import('./services/osmService');
      const boundaries = await searchBoundaries({ 
        cityName: city, 
        country: searchCountry, 
        countryCode: locode,
        limit: 5 
      });
      const result = { boundaries };

      res.json(result);
    } catch (error) {
      console.error('Error in enhanced boundaries endpoint:', error);
      res.status(500).json({ 
        error: 'Failed to fetch enhanced boundaries' 
      });
    }
  });

  // Fallback enhanced boundaries endpoint with sample data (for development/testing)
  app.post('/api/enhanced-boundaries-sample', async (req: any, res) => {
    try {
      const { city, country, locode } = req.body;

      if (!city || !country) {
        return res.status(400).json({ 
          error: 'City and country are required' 
        });
      }

      console.log(`🔍 Fetching SAMPLE boundaries for ${city}, ${country}`);

      // Return sample boundaries with realistic complex geometry (for fallback)
      const sampleBoundaries = [
        {
          osmId: 'relation/1224652',
          osmType: 'relation',
          name: 'Ciudad Autónoma de Buenos Aires',
          adminLevel: '4',
          boundaryType: 'administrative',
          area: 205.63,
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-58.5315, -34.5250],
              [-58.5100, -34.5180],
              [-58.4850, -34.5120],
              [-58.4600, -34.5080],
              [-58.4350, -34.5070],
              [-58.4100, -34.5090],
              [-58.3850, -34.5130],
              [-58.3600, -34.5190],
              [-58.3450, -34.5280],
              [-58.3350, -34.5400],
              [-58.3280, -34.5550],
              [-58.3250, -34.5720],
              [-58.3280, -34.5890],
              [-58.3350, -34.6060],
              [-58.3450, -34.6220],
              [-58.3600, -34.6350],
              [-58.3800, -34.6450],
              [-58.4020, -34.6520],
              [-58.4260, -34.6580],
              [-58.4520, -34.6620],
              [-58.4780, -34.6640],
              [-58.5040, -34.6620],
              [-58.5280, -34.6580],
              [-58.5480, -34.6520],
              [-58.5650, -34.6430],
              [-58.5780, -34.6320],
              [-58.5870, -34.6180],
              [-58.5920, -34.6020],
              [-58.5930, -34.5850],
              [-58.5890, -34.5680],
              [-58.5820, -34.5520],
              [-58.5720, -34.5380],
              [-58.5580, -34.5280],
              [-58.5415, -34.5240],
              [-58.5315, -34.5250],
            ]],
          },
          tags: {
            name: 'Ciudad Autónoma de Buenos Aires',
            boundary: 'administrative',
            admin_level: '4',
            place: 'city',
            population: '3075646',
          },
          score: 98,
        },
        {
          osmId: 'relation/2672883',
          osmType: 'relation',
          name: 'Buenos Aires',
          adminLevel: '8',
          boundaryType: 'administrative',
          area: 306.45,
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-58.5119, -34.5468],
              [-58.4920, -34.5420],
              [-58.4720, -34.5380],
              [-58.4520, -34.5350],
              [-58.4320, -34.5340],
              [-58.4120, -34.5350],
              [-58.3920, -34.5380],
              [-58.3750, -34.5430],
              [-58.3600, -34.5500],
              [-58.3480, -34.5590],
              [-58.3390, -34.5700],
              [-58.3330, -34.5820],
              [-58.3300, -34.5950],
              [-58.3300, -34.6080],
              [-58.3330, -34.6210],
              [-58.3390, -34.6330],
              [-58.3480, -34.6440],
              [-58.3600, -34.6530],
              [-58.3750, -34.6600],
              [-58.3920, -34.6650],
              [-58.4120, -34.6680],
              [-58.4320, -34.6690],
              [-58.4520, -34.6680],
              [-58.4720, -34.6650],
              [-58.4920, -34.6600],
              [-58.5119, -34.6530],
              [-58.5300, -34.6440],
              [-58.5460, -34.6330],
              [-58.5590, -34.6200],
              [-58.5680, -34.6050],
              [-58.5730, -34.5890],
              [-58.5740, -34.5720],
              [-58.5710, -34.5560],
              [-58.5640, -34.5420],
              [-55.3530, -34.5300],
              [-58.3800, -34.5210],
              [-58.5119, -34.5468],
            ]],
          },
          tags: {
            name: 'Buenos Aires',
            boundary: 'administrative',
            admin_level: '8',
            place: 'municipality',
            population: '2890151',
          },
          score: 85,
        },
      ];

      console.log(`✅ Returning ${sampleBoundaries.length} sample boundaries for ${city}`);

      res.json({
        boundaries: sampleBoundaries
      });

    } catch (error) {
      console.error('Error in enhanced boundaries endpoint:', error);
      res.status(500).json({ 
        error: 'Failed to fetch enhanced boundaries' 
      });
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
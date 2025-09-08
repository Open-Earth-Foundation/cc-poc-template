import express from 'express';
import { storage } from './storage';
import { 
  initiateOAuth, 
  handleOAuthCallback, 
  refreshToken, 
  getUserProfile,
  generateSessionToken
} from './services/authService';
import { 
  getUserAccessibleCities, 
  getCityById 
} from './services/cityService';
import { 
  searchBoundaries,
  fetchBoundaryGeometry 
} from './services/osmService';
import { POST as enhancedBoundariesPOST, GET as enhancedBoundariesGET } from './routes/enhanced-boundaries';

export function setupRoutes(app: express.Application) {
  // Simple authentication middleware (Bearer token only)
  const requireAuth = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const token = authHeader.substring(7);
    req.token = token;
    next();
  };

  // Extract user from token middleware (simplified)
  const extractUser = async (req: any, res: any, next: any) => {
    try {
      const profile = await getUserProfile(req.token);
      req.user = profile;
      next();
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return res.status(401).json({ message: 'Invalid token' });
    }
  };

  // Auth routes
  app.get('/api/auth/oauth/initiate', async (req, res) => {
    try {
      const result = await initiateOAuth();
      res.json(result);
    } catch (error) {
      console.error('OAuth initiation error:', error);
      res.status(500).json({ message: 'Failed to initiate OAuth' });
    }
  });

  // OAuth callback - GET request from CityCatalyst (simplified)
  app.get('/api/auth/oauth/callback', async (req, res) => {
    try {
      const { code, state, error } = req.query;
      
      if (error) {
        return res.redirect(`/auth/callback?error=${encodeURIComponent(error as string)}`);
      }
      
      if (!code || !state) {
        return res.redirect('/auth/callback?error=Missing authorization code or state');
      }
      
      // Process OAuth and get user data
      const result = await handleOAuthCallback(code as string, state as string);
      
      // Redirect to frontend with user data in URL (temporary, for simple flow)
      const userData = encodeURIComponent(JSON.stringify(result.user));
      res.redirect(`/auth/callback?success=true&user=${userData}`);
      
    } catch (error) {
      console.error('OAuth callback error:', error);
      const errorMessage = error instanceof Error ? error.message : 'OAuth callback failed';
      res.redirect(`/auth/callback?error=${encodeURIComponent(errorMessage)}`);
    }
  });

  // Legacy POST endpoint for frontend API calls (if needed)
  app.post('/api/auth/oauth/callback', async (req, res) => {
    try {
      const { code, state } = req.body;
      const result = await handleOAuthCallback(code, state);
      res.json(result);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.status(500).json({ message: 'OAuth callback failed' });
    }
  });

  app.post('/api/auth/refresh', requireAuth, async (req: any, res) => {
    try {
      const result = await refreshToken(req.token);
      res.json(result);
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({ message: 'Failed to refresh token' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    res.json({ success: true });
  });

  // User routes
  app.get('/api/user/profile', requireAuth, extractUser, (req: any, res) => {
    res.json(req.user);
  });

  // City routes
  app.get('/api/cities', requireAuth, extractUser, async (req: any, res) => {
    try {
      const cities = await getUserAccessibleCities(req.user.id, req.token);
      res.json({ cities });
    } catch (error) {
      console.error('Failed to get cities:', error);
      res.status(500).json({ message: 'Failed to fetch cities' });
    }
  });

  app.get('/api/cities/:cityId', requireAuth, extractUser, async (req: any, res) => {
    try {
      const { cityId } = req.params;
      const city = await getCityById(cityId);

      if (!city) {
        return res.status(404).json({ message: 'City not found' });
      }

      // Check if user has access to this city
      const userCities = await getUserAccessibleCities(req.user.id, req.token);
      const hasAccess = userCities.some(c => c.cityId === cityId);

      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied' });
      }

      res.json({ city });
    } catch (error) {
      console.error('Failed to get city:', error);
      res.status(500).json({ message: 'Failed to fetch city' });
    }
  });

  // Enhanced boundaries routes (following reference implementation)
  app.post('/api/enhanced-boundaries', requireAuth, enhancedBoundariesPOST);
  app.get('/api/enhanced-boundaries', requireAuth, enhancedBoundariesGET);

  // Geometry fetching endpoint (following reference implementation)
  app.post('/api/enhanced-boundaries/select', requireAuth, async (req: any, res) => {
    try {
      const { osm_id, type } = req.body;

      if (!osm_id) {
        return res.status(400).json({ 
          error: 'OSM ID is required' 
        });
      }

      console.log(`🌍 Fetching geometry for OSM ID: ${osm_id}`);

      const geometry = await fetchBoundaryGeometry(osm_id);

      // If this is a preview request, just return geometry
      if (type === 'preview') {
        return res.json({
          geometry: geometry
        });
      }

      // For full selection, return complete GeoJSON feature
      const completeFeature = {
        type: "FeatureCollection",
        features: [{
          type: "Feature",
          id: osm_id,
          properties: {},
          geometry: geometry
        }]
      };

      res.json(completeFeature);
    } catch (error) {
      console.error('Error fetching boundary geometry:', error);
      res.status(500).json({ 
        error: 'Failed to fetch boundary geometry' 
      });
    }
  });

  // Legacy boundary routes
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

  app.post('/api/boundaries/select', requireAuth, extractUser, async (req: any, res) => {
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

      // Store the selected boundary
      const boundary = {
        cityId,
        osmId,
        osmType,
        selectedAt: new Date(),
        selectedBy: req.user.id,
      };

      await storage.createBoundary(boundary);

      res.json({ success: true, boundary });
    } catch (error) {
      console.error('Boundary selection error:', error);
      res.status(500).json({ message: 'Failed to select boundary' });
    }
  });

  app.get('/api/boundaries/:cityId', requireAuth, extractUser, async (req: any, res) => {
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
      console.error('Failed to get city boundaries:', error);
      res.status(500).json({ message: 'Failed to fetch boundaries' });
    }
  });

  app.get('/api/boundaries/download/:osmId', requireAuth, async (req, res) => {
    try {
      const { osmId } = req.params;

      const geometry = await fetchBoundaryGeometry(osmId);

      const geoJson = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: { osmId },
          geometry
        }]
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${osmId}.geojson"`);
      res.json(geoJson);
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ message: 'Failed to download boundary' });
    }
  });
}
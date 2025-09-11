import { storage } from "../storage";
import { City, User } from "@shared/schema";

/**
 * @fileoverview CityCatalyst API Integration Service
 * 
 * This service provides comprehensive integration with CityCatalyst's REST API
 * for retrieving city data, inventory information, and boundary geometries.
 * 
 * Key features:
 * - Type-safe API wrappers for all CityCatalyst endpoints
 * - Automatic error handling and response parsing
 * - Local caching with database storage
 * - Support for multiple data formats (JSON, GeoJSON)
 * - Robust locode normalization for international cities
 * 
 * @version 1.0.0
 * @author CityCatalyst Integration Template
 * 
 * @example
 * ```typescript
 * // Get all cities for authenticated user
 * const cities = await getUserCities(user, accessToken);
 * 
 * // Get detailed city information
 * const cityDetail = await getCityDetail("BR SER", accessToken);
 * 
 * // Get inventory data for specific year
 * const inventory = await getInventory("BR SER", 2022, accessToken);
 * 
 * // Get city boundary as GeoJSON
 * const boundary = await getCityBoundary("BR SER", accessToken);
 * ```
 */

/** CityCatalyst API base URL for all endpoints */
const AUTH_BASE_URL = process.env.AUTH_BASE_URL || 'https://citycatalyst.openearth.dev';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * CityCatalyst inventory metadata structure.
 * 
 * Represents a single inventory year and its identifier within CityCatalyst.
 * Used for tracking available emissions data for cities.
 * 
 * @interface CityCatalystInventory
 * @property {number} year - Inventory year (e.g., 2022, 2023)
 * @property {string} [id] - Optional inventory ID for detailed queries
 * 
 * @example
 * ```typescript
 * const inventory: CityCatalystInventory = {
 *   year: 2022,
 *   id: "inv-abc123"
 * };
 * ```
 */
export interface CityCatalystInventory {
  year: number;
  id?: string;
}

/**
 * Detailed city information from CityCatalyst API.
 * 
 * Complete city profile including available inventories and metadata.
 * Retrieved from /api/v0/city/{locode} endpoint.
 * 
 * @interface CityCatalystCityDetail
 * @property {string} locode - UN/LOCODE identifier (e.g., "BR SER", "US NYC")
 * @property {string} name - Official city name
 * @property {string} [country] - Country name (optional)
 * @property {CityCatalystInventory[]} [inventories] - Available inventory years
 * @property {Record<string, any>} [metadata] - Additional city metadata
 * 
 * @example
 * ```typescript
 * const cityDetail: CityCatalystCityDetail = {
 *   locode: "BR SER",
 *   name: "Serra",
 *   country: "Brazil",
 *   inventories: [
 *     { year: 2022, id: "inv-123" },
 *     { year: 2023, id: "inv-456" }
 *   ],
 *   metadata: { population: 500000, area: 553.1 }
 * };
 * ```
 */
export interface CityCatalystCityDetail {
  locode: string;
  name: string;
  country?: string;
  inventories?: CityCatalystInventory[];
  metadata?: Record<string, any>;
}

/**
 * CityCatalyst inventory data structure.
 * 
 * Contains complete emissions inventory data for a specific city and year.
 * Structure varies based on inventory format and completeness.
 * 
 * @interface CityCatalystInventoryData
 * @property {string} [key] - Dynamic structure based on CityCatalyst API response
 * 
 * @apiNote
 * This interface uses an index signature to accommodate varying
 * inventory data structures from different CityCatalyst versions.
 * 
 * @example
 * ```typescript
 * const inventoryData: CityCatalystInventoryData = {
 *   totalEmissions: 1234567,
 *   sectors: [
 *     { name: "Transport", emissions: 456789 },
 *     { name: "Buildings", emissions: 234567 }
 *   ],
 *   methodology: "GPC Basic+",
 *   lastUpdated: "2023-12-01"
 * };
 * ```
 */
export interface CityCatalystInventoryData {
  [key: string]: any;
}

// ============================================================================
// API HELPER FUNCTIONS
// ============================================================================

/**
 * Generic authenticated GET request to CityCatalyst API.
 * 
 * Handles common API patterns including:
 * - Bearer token authentication
 * - Response validation and error handling
 * - Automatic JSON parsing
 * - Support for wrapped responses (data field)
 * 
 * @template T - Expected response data type
 * @param {string} path - API endpoint path (e.g., "/api/v0/cities")
 * @param {string} accessToken - Valid OAuth access token
 * @returns {Promise<T>} Parsed response data
 * 
 * @throws {Error} When API call fails or returns invalid response
 * 
 * @example
 * ```typescript
 * // Get city list
 * const cities = await cityCatalystApiGet<City[]>("/api/v0/user/cities", token);
 * 
 * // Get specific city detail
 * const city = await cityCatalystApiGet<CityCatalystCityDetail>("/api/v0/city/BR_SER", token);
 * ```
 * 
 * @security
 * - Uses Bearer token authentication
 * - Validates HTTP response status
 * - Truncates error messages to prevent information leakage
 */
async function cityCatalystApiGet<T>(path: string, accessToken: string): Promise<T> {
  const url = `${AUTH_BASE_URL}${path}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GET ${path} failed: ${response.status} ${response.statusText} — ${text.slice(0, 300)}`);
  }

  const json = await response.json();
  
  // API wraps content under `data`
  return (json.data ?? json) as T;
}

/**
 * Attempts to fetch city details from multiple CityCatalyst endpoints.
 * 
 * Implements a fallback strategy for city data retrieval, trying
 * different endpoint variations to maximize compatibility across
 * CityCatalyst API versions.
 * 
 * @param {string} cityId - City identifier to search for
 * @param {string} accessToken - Valid OAuth access token
 * @returns {Promise<City | null>} City record or null if not found
 * 
 * @example
 * ```typescript
 * const city = await fetchCityFromCityCatalyst("buenos-aires", accessToken);
 * if (city) {
 *   console.log(`Found city: ${city.name} in ${city.country}`);
 * } else {
 *   console.log("City not found in CityCatalyst");
 * }
 * ```
 * 
 * @apiNote
 * - Tries multiple endpoint formats for maximum compatibility
 * - Normalizes response data to internal City schema
 * - Handles missing optional fields gracefully
 * - Returns null instead of throwing on 404 errors
 */
async function fetchCityFromCityCatalyst(cityId: string, accessToken: string): Promise<City | null> {
  const cityEndpoints = [
    `${AUTH_BASE_URL}/api/v0/cities/${cityId}`,
    `${AUTH_BASE_URL}/api/v0/cities/${cityId}/`,
  ];

  for (const url of cityEndpoints) {
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const city = data.data || data;

      // Normalize city data to our schema
      return {
        id: city.cityId || city.id || cityId,
        name: city.name || city.cityName || 'Unknown City',
        cityId: city.cityId || city.id || cityId,
        country: city.country || 'Unknown Country',
        locode: city.locode || null,
        projectId: 'citycatalyst-' + (city.cityId || city.id || cityId),
        currentBoundary: null,
        metadata: {
          region: city.region || city.regionName || null,
          area: city.area ? parseFloat(city.area) : null,
        },
        createdAt: new Date(),
      };
    } catch (error) {
      continue; // Try next endpoint
    }
  }
  
  return null;
}

// ============================================================================
// PUBLIC API FUNCTIONS
// ============================================================================

/**
 * Retrieves all cities accessible to the authenticated user.
 * 
 * Fetches cities from local storage based on user's project permissions.
 * This function prioritizes locally cached data for performance and
 * offline capability.
 * 
 * @param {User} user - Authenticated user with project access
 * @param {string} [accessToken] - Optional OAuth token for fresh data
 * @returns {Promise<City[]>} Array of accessible cities
 * 
 * @example
 * ```typescript
 * const cities = await getUserCities(authenticatedUser, accessToken);
 * console.log(`User has access to ${cities.length} cities:`);
 * cities.forEach(city => {
 *   console.log(`- ${city.name} (${city.country})`);
 * });
 * ```
 * 
 * @performance
 * - Uses local database cache for fast access
 * - Only makes API calls when cache is empty
 * - Filters by user's project permissions
 */
export async function getUserCities(user: User, accessToken?: string): Promise<City[]> {
  if (!user.projects || user.projects.length === 0) {
    return [];
  }
  
  // First check our local storage for cities with these project IDs
  const localCities = await storage.getCitiesByProjectIds(user.projects);
  
  if (localCities.length > 0) {
    return localCities;
  }
  
  return [];
}

/**
 * Retrieves a single city by its identifier.
 * 
 * Simple lookup function for accessing cached city data by unique ID.
 * 
 * @param {string} cityId - Unique city identifier
 * @returns {Promise<City | undefined>} City record or undefined if not found
 * 
 * @example
 * ```typescript
 * const city = await getCityById("city-buenos-aires");
 * if (city) {
 *   console.log(`Found: ${city.name}`);
 * }
 * ```
 */
export async function getCityById(cityId: string): Promise<City | undefined> {
  return await storage.getCity(cityId);
}

/**
 * Retrieves all cities accessible to a user by their ID.
 * 
 * Convenience function that combines user lookup with city access.
 * Useful for API endpoints that only have user ID available.
 * 
 * @param {string} userId - User's unique identifier
 * @param {string} [accessToken] - Optional OAuth token for fresh data
 * @returns {Promise<City[]>} Array of accessible cities
 * 
 * @throws {Error} When user is not found
 * 
 * @example
 * ```typescript
 * // In an API endpoint:
 * app.get('/api/user/:userId/cities', async (req, res) => {
 *   try {
 *     const cities = await getUserAccessibleCities(req.params.userId, req.user.accessToken);
 *     res.json({ cities });
 *   } catch (error) {
 *     res.status(404).json({ error: error.message });
 *   }
 * });
 * ```
 */
export async function getUserAccessibleCities(userId: string, accessToken?: string): Promise<City[]> {
  const user = await storage.getUser(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  return await getUserCities(user, accessToken);
}

// ============================================================================
// CITYCATALYST API ENDPOINTS
// ============================================================================

/**
 * Retrieves detailed city information including available inventories.
 * 
 * Calls CityCatalyst's /api/v0/city/{locode} endpoint to get comprehensive
 * city data including all available inventory years and metadata.
 * 
 * @param {string} locode - UN/LOCODE identifier (spaces converted to underscores)
 * @param {string} accessToken - Valid OAuth access token
 * @returns {Promise<CityCatalystCityDetail>} Complete city information
 * 
 * @throws {Error} When API call fails or locode is invalid
 * 
 * @example
 * ```typescript
 * try {
 *   const cityDetail = await getCityDetail("BR SER", accessToken);
 *   console.log(`${cityDetail.name} has ${cityDetail.inventories?.length} inventories`);
 *   
 *   // List available years
 *   cityDetail.inventories?.forEach(inv => {
 *     console.log(`- Year ${inv.year} (ID: ${inv.id})`);
 *   });
 * } catch (error) {
 *   console.error("Failed to get city details:", error.message);
 * }
 * ```
 * 
 * @apiNote
 * - Automatically converts spaces in locode to underscores
 * - Handles both "BR SER" and "BR_SER" formats
 * - Returns comprehensive inventory listing
 */
export async function getCityDetail(locode: string, accessToken: string): Promise<CityCatalystCityDetail> {
  if (!locode || locode === 'undefined') {
    throw new Error(`Invalid locode provided: ${locode}`);
  }
  // Convert spaces to underscores as per CityCatalyst API docs
  const normalizedLocode = locode.replace(/\s+/g, "_");
  return cityCatalystApiGet<CityCatalystCityDetail>(
    `/api/v0/city/${encodeURIComponent(normalizedLocode)}`, 
    accessToken
  );
}

/**
 * Retrieves emissions inventory data for a specific city and year.
 * 
 * Fetches complete inventory data from CityCatalyst's inventory endpoint,
 * including emissions by sector, methodology information, and metadata.
 * 
 * @param {string} locode - UN/LOCODE identifier
 * @param {number} year - Inventory year (e.g., 2022, 2023)
 * @param {string} accessToken - Valid OAuth access token
 * @returns {Promise<CityCatalystInventoryData>} Complete inventory data
 * 
 * @throws {Error} When API call fails or data is not available
 * 
 * @example
 * ```typescript
 * try {
 *   const inventory = await getInventory("BR SER", 2022, accessToken);
 *   console.log(`Total emissions: ${inventory.totalEmissions} tCO2e`);
 *   
 *   // Process sector data
 *   inventory.sectors?.forEach(sector => {
 *     console.log(`${sector.name}: ${sector.emissions} tCO2e`);
 *   });
 * } catch (error) {
 *   console.error("Inventory not available:", error.message);
 * }
 * ```
 * 
 * @format
 * - Returns data in JSON format by default
 * - Includes query parameter for explicit format specification
 * - Structure varies by inventory completeness and methodology
 */
export async function getInventory(locode: string, year: number, accessToken: string): Promise<CityCatalystInventoryData> {
  const normalizedLocode = locode.replace(/\s+/g, "_");
  return cityCatalystApiGet<CityCatalystInventoryData>(
    `/api/v0/city/${encodeURIComponent(normalizedLocode)}/inventory/${year}?format=json`, 
    accessToken
  );
}

/**
 * Retrieves city boundary geometry as GeoJSON.
 * 
 * Fetches the administrative boundary for a city as a GeoJSON Feature,
 * suitable for mapping and visualization applications.
 * 
 * @param {string} locode - UN/LOCODE identifier
 * @param {string} accessToken - Valid OAuth access token
 * @returns {Promise<GeoJSON.Feature>} City boundary as GeoJSON Feature
 * 
 * @throws {Error} When API call fails or boundary is not available
 * 
 * @example
 * ```typescript
 * try {
 *   const boundary = await getCityBoundary("BR SER", accessToken);
 *   
 *   // Use with mapping library (e.g., Leaflet, Mapbox)
 *   map.addLayer({
 *     type: 'fill',
 *     source: {
 *       type: 'geojson',
 *       data: boundary
 *     },
 *     paint: {
 *       'fill-color': '#088',
 *       'fill-opacity': 0.3
 *     }
 *   });
 * } catch (error) {
 *   console.error("Boundary not available:", error.message);
 * }
 * ```
 * 
 * @geoJson
 * - Returns valid GeoJSON Feature format
 * - Coordinates in WGS84 (EPSG:4326) projection
 * - May include properties with boundary metadata
 * - Geometry type typically Polygon or MultiPolygon
 */
export async function getCityBoundary(locode: string, accessToken: string): Promise<GeoJSON.Feature> {
  const normalizedLocode = locode.replace(/\s+/g, "_");
  return cityCatalystApiGet<GeoJSON.Feature>(
    `/api/v0/city/${encodeURIComponent(normalizedLocode)}/boundary`, 
    accessToken
  );
}

/**
 * Retrieves detailed information for a specific inventory by ID.
 * 
 * Fetches comprehensive inventory metadata including total emissions,
 * inventory type, global warming potential methodology, and associated
 * city information.
 * 
 * @param {string} inventoryId - Inventory identifier or "default" for user's default
 * @param {string} accessToken - Valid OAuth access token
 * @returns {Promise<Object>} Detailed inventory information with city data
 * 
 * @example
 * ```typescript
 * // Get specific inventory
 * const details = await getInventoryDetails("inv-abc123", accessToken);
 * console.log(`Inventory: ${details.inventoryName} (${details.year})`);
 * console.log(`Total emissions: ${details.totalEmissions} tCO2e`);
 * console.log(`City: ${details.city.name}, ${details.city.country}`);
 * 
 * // Get user's default inventory
 * const defaultInv = await getInventoryDetails("default", accessToken);
 * ```
 * 
 * @apiEndpoint
 * - /api/v0/inventory/{inventory} for specific inventory
 * - /api/v0/inventory/default for user's default inventory
 * 
 * @returns
 * Returns object with structure:
 * - inventoryId: string
 * - inventoryName: string
 * - year: number
 * - totalEmissions: number
 * - inventoryType: string
 * - globalWarmingPotentialType: string
 * - lastUpdated: string
 * - city: complete city details with project information
 */
export async function getInventoryDetails(inventoryId: string, accessToken: string): Promise<{
  inventoryId: string;
  inventoryName: string;
  year: number;
  totalEmissions: number;
  inventoryType: string;
  globalWarmingPotentialType: string;
  lastUpdated: string;
  city: {
    cityId: string;
    name: string;
    country: string;
    locode: string;
    project: {
      projectId: string;
      name: string;
    };
  };
}> {
  // Use 'default' for user's default inventory, or specific inventory ID
  const endpoint = inventoryId === 'default' ? '/api/v0/inventory/default' : `/api/v0/inventory/${inventoryId}`;
  return cityCatalystApiGet(endpoint, accessToken);
}

/**
 * Retrieves inventory overview for all cities accessible to the user.
 * 
 * Fetches a comprehensive list of all cities the user has access to,
 * along with their available inventory years and metadata. This is
 * the primary endpoint for building city/inventory selection interfaces.
 * 
 * @param {string} accessToken - Valid OAuth access token
 * @returns {Promise<Array>} Array of cities with inventory information
 * 
 * @throws {Error} When API call fails or returns invalid data
 * 
 * @example
 * ```typescript
 * try {
 *   const inventoriesData = await getInventoriesByCity(accessToken);
 *   
 *   console.log(`User has access to ${inventoriesData.length} cities:`);
 *   inventoriesData.forEach(cityData => {
 *     console.log(`${cityData.name} (${cityData.locode})`);
 *     console.log(`  Available years: ${cityData.years.join(', ')}`);
 *     console.log(`  Inventories: ${cityData.inventories.length}`);
 *   });
 * } catch (error) {
 *   console.error("Failed to fetch inventories:", error.message);
 * }
 * ```
 * 
 * @returns
 * Array of objects with structure:
 * - locode: string - UN/LOCODE identifier
 * - name: string - City name
 * - years: number[] - Available inventory years (sorted newest first)
 * - inventories: CityCatalystInventory[] - Complete inventory list
 * 
 * @apiStrategy
 * - Uses /api/v0/user/cities/ endpoint for user's cities
 * - Enhances data with detailed city information when available
 * - Handles various response formats for maximum compatibility
 * - Provides fallback data when detailed calls fail
 */
export async function getInventoriesByCity(accessToken: string): Promise<Array<{
  locode: string;
  name: string;
  years: number[];
  inventories: CityCatalystInventory[];
}>> {
  // Use the same endpoint as the auth service that actually works
  const citiesUrl = '/api/v0/user/cities/';
  const citiesData = await cityCatalystApiGet<any>(citiesUrl, accessToken);
  
  // Handle different response formats (same logic as authService.ts)
  const cities = citiesData.cities || citiesData.data || citiesData;
  
  if (!Array.isArray(cities)) {
    return [];
  }

  const details = await Promise.all(
    cities.map(async (item) => {
      // Use same data extraction logic as authService.ts
      const cityData = item.city || item;
      
      if (!cityData) {
        return { 
          locode: 'unknown', 
          name: 'Unknown City', 
          years: [], 
          inventories: [] 
        };
      }
      
      const locode = cityData.locode;
      const cityId = cityData.cityId || cityData.id || cityData.locode;
      const name = cityData.name || cityData.cityName || 'Unknown City';
      const years = item.years || [];
      
      // If we have a locode, try to get detailed inventory info
      if (locode && locode !== 'undefined') {
        try {
          const detail = await getCityDetail(locode, accessToken);
          const detailYears = (detail.inventories ?? [])
            .map((inv) => inv.year)
            .filter((y): y is number => Number.isFinite(y))
            .sort((a, b) => b - a);

          return { 
            locode: locode, 
            name: detail.name || name, 
            years: detailYears.length > 0 ? detailYears : years, 
            inventories: detail.inventories ?? [] 
          };
        } catch (error) {
          // Silently continue if city detail fetch fails
        }
      }
      
      // Fallback to basic data from the list response
      return { 
        locode: locode || cityId || 'unknown', 
        name: name, 
        years: Array.isArray(years) ? years : [], 
        inventories: [] 
      };
    })
  );

  return details;
}
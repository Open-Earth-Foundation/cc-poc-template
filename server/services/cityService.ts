import { storage } from "../storage";
import { City, User } from "@shared/schema";
import type { Feature } from 'geojson';

const AUTH_BASE_URL = process.env.AUTH_BASE_URL || 'https://citycatalyst.openearth.dev';

// Debug: Log the base URL being used
// Base URL configured via environment variable

// CityCatalyst API Types
export interface CityCatalystInventory {
  year: number;
  id?: string;
}

export interface CityCatalystCityDetail {
  locode: string;
  name: string;
  country?: string;
  inventories?: CityCatalystInventory[];
  metadata?: Record<string, any>;
}

export interface CityCatalystInventoryData {
  // This will be populated after we test the API to see the actual structure
  [key: string]: any;
}

// Generic API helper function
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
    console.error(`❌ CityCatalyst API error ${response.status}: ${text.slice(0, 300)}`);
    throw new Error(`GET ${path} failed: ${response.status} ${response.statusText} — ${text.slice(0, 300)}`);
  }

  const json = await response.json();
  // Response received successfully
  
  // API wraps content under `data`
  return (json.data ?? json) as T;
}

// Fetch city details from CityCatalyst API
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
        console.log(`❌ Non-OK response for ${url}: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) continue;
      
      const cityData = await response.json();
      const city = cityData.data || cityData;
      
      // Convert to our City format
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

export async function getCityById(cityId: string): Promise<City | undefined> {
  return await storage.getCity(cityId);
}

export async function getUserAccessibleCities(userId: string, accessToken?: string): Promise<City[]> {
  const user = await storage.getUser(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  return await getUserCities(user, accessToken);
}

// ============================================================================
// CityCatalyst Inventory API Documentation
// ============================================================================
/**
 * INVENTORY DATA RETRIEVAL GUIDE
 * 
 * This service provides multiple endpoints for retrieving inventory data from CityCatalyst.
 * Choose the appropriate function based on your specific use case:
 * 
 * 1. BASIC INVENTORY OVERVIEW:
 *    - Use: getInventoriesByCity()
 *    - Purpose: Get list of all cities and their available inventory years
 *    - Returns: Array of cities with basic inventory metadata
 *    - Use case: City selection screens, overview dashboards
 * 
 * 2. DETAILED INVENTORY METADATA:
 *    - Use: getInventoryDetails(inventoryId, accessToken)
 *    - Purpose: Get comprehensive metadata for a specific inventory
 *    - Returns: Full inventory details, city info, project context, timestamps
 *    - Use case: Inventory information panels, audit trails, basic inventory display
 * 
 * 3. COMPREHENSIVE INVENTORY DATA WITH EMISSIONS BREAKDOWN:
 *    - Use: getInventoryDownload(inventoryId, accessToken) 
 *    - Purpose: Get complete inventory with GPC sector/subsector emissions data
 *    - Returns: All metadata + inventoryValues array with detailed emissions by sector
 *    - Use case: Detailed analysis, emissions breakdown charts, sector comparisons
 * 
 * 4. LEGACY CITY/YEAR LOOKUP:
 *    - Use: getInventory(locode, year, accessToken)
 *    - Purpose: Get inventory data by city LOCODE and year (legacy endpoint)
 *    - Returns: Raw inventory data for specific city/year
 *    - Use case: Legacy integrations, when only LOCODE/year are available
 * 
 * RECOMMENDATION:
 * - For UI display with emissions breakdown: Use getInventoryDownload()
 * - For basic inventory info: Use getInventoryDetails()
 * - For overview/listing: Use getInventoriesByCity()
 */

/**
 * Get detailed city information including inventories list
 * @param cityId - UUID format city identifier (not LOCODE)
 */
export async function getCityDetail(cityId: string, accessToken: string): Promise<CityCatalystCityDetail> {
  if (!cityId || cityId === 'undefined') {
    throw new Error(`Invalid cityId provided: ${cityId}`);
  }
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(cityId)) {
    throw new Error(`Invalid cityId format. Expected UUID, got: ${cityId}`);
  }
  
  return cityCatalystApiGet<CityCatalystCityDetail>(
    `/api/v0/city/${encodeURIComponent(cityId)}`, 
    accessToken
  );
}

/**
 * Get inventory data for a specific city and year (LEGACY ENDPOINT)
 * 
 * @param locode - UN/LOCODE format city identifier (e.g., "BR CXL" for Caxias do Sul)
 * @param year - Inventory year (e.g., 2022)
 * @param accessToken - User's CityCatalyst access token
 * @returns Raw inventory data structure
 * 
 * @deprecated Consider using getInventoryDetails() or getInventoryDownload() with inventoryId for better data structure
 * 
 * Usage example:
 * ```
 * const inventory = await getInventory("BR CXL", 2022, userToken);
 * ```
 */
export async function getInventory(locode: string, year: number, accessToken: string): Promise<CityCatalystInventoryData> {
  const normalizedLocode = locode.replace(/\s+/g, "_");
  return cityCatalystApiGet<CityCatalystInventoryData>(
    `/api/v0/city/${encodeURIComponent(normalizedLocode)}/inventory/${year}?format=json`, 
    accessToken
  );
}

/**
 * Get city boundary as GeoJSON
 */
export async function getCityBoundary(locode: string, accessToken: string): Promise<Feature> {
  const normalizedLocode = locode.replace(/\s+/g, "_");
  return cityCatalystApiGet<Feature>(
    `/api/v0/city/${encodeURIComponent(normalizedLocode)}/boundary`, 
    accessToken
  );
}

/**
 * Get detailed inventory information by inventory ID (METADATA ONLY)
 * GET /api/v0/inventory/{inventory}
 * 
 * @param inventoryId - Unique inventory identifier (UUID format)
 * @param accessToken - User's CityCatalyst access token
 * @returns Comprehensive inventory metadata without emissions breakdown
 * 
 * Returns comprehensive inventory details including:
 * - inventoryId, inventoryName, year, totalEmissions, inventoryType
 * - globalWarmingPotentialType, lastUpdated, created, publishedAt
 * - Full city details with project information
 * - Does NOT include detailed emissions by sector/subsector
 * 
 * Usage example:
 * ```
 * const inventoryInfo = await getInventoryDetails("8fa31f4d-0a61-4d7e-89eb-00e584546e66", userToken);
 * console.log(inventoryInfo.inventoryName); // "Caxias do Sul - 2022"
 * console.log(inventoryInfo.totalEmissions); // 123456789
 * ```
 * 
 * @see getInventoryDownload() for detailed emissions breakdown by GPC sectors
 */
export async function getInventoryDetails(inventoryId: string, accessToken: string): Promise<{
  inventoryId: string;
  inventoryName: string;
  year: number;
  totalEmissions: number | null;
  cityId: string;
  totalCountryEmissions: number | null;
  isPublic: boolean;
  publishedAt: string | null;
  inventoryType: string;
  globalWarmingPotentialType: string;
  lastUpdated: string;
  created: string;
  city: {
    cityId: string;
    locode: string;
    name: string;
    shape: any;
    country: string;
    region: string;
    countryLocode: string;
    regionLocode: string;
    area: string;
    projectId: string;
    created: string;
    last_updated: string;
    project: {
      projectId: string;
      name: string;
      organizationId: string;
    };
  };
}> {
  // Use 'default' for user's default inventory, or specific inventory ID
  const endpoint = inventoryId === 'default' ? '/api/v0/inventory/default' : `/api/v0/inventory/${inventoryId}`;
  return cityCatalystApiGet(endpoint, accessToken);
}

/**
 * Get detailed inventory data with emissions breakdown from the download endpoint
 * GET /api/v0/inventory/{inventory}/download
 * 
 * @param inventoryId - Unique inventory identifier (UUID format)
 * @param accessToken - User's CityCatalyst access token
 * @returns Complete inventory data with detailed emissions breakdown by GPC sectors/subsectors
 * 
 * This is the MOST COMPREHENSIVE inventory endpoint that includes:
 * - All basic inventory metadata (same as getInventoryDetails())
 * - inventoryValues array with detailed emissions data organized by:
 *   - GPC reference numbers (I.1.1, II.1.1, III.1.1, etc.)
 *   - Sector and subsector information
 *   - CO2 equivalent emissions per sector
 *   - Data source information and data quality indicators
 *   - Activity values and gas breakdown
 *   - Unavailable reasons for missing data
 * 
 * Usage example:
 * ```
 * const fullData = await getInventoryDownload("8fa31f4d-0a61-4d7e-89eb-00e584546e66", userToken);
 * 
 * // Access basic info
 * console.log(fullData.inventoryName); // "Caxias do Sul - 2022"
 * 
 * // Access detailed emissions by sector
 * fullData.inventoryValues.forEach(value => {
 *   console.log(`${value.gpcReferenceNumber}: ${value.subSector.subsectorName}`);
 *   console.log(`Emissions: ${value.co2eq} CO2e`);
 *   console.log(`Data source: ${value.dataSource?.datasourceName || 'N/A'}`);
 * });
 * ```
 * 
 * @see getInventoryDetails() for basic metadata without emissions breakdown
 * @see organizeInventoryValuesBySector() helper function in frontend for organizing data by sector
 */
export async function getInventoryDownload(inventoryId: string, accessToken: string): Promise<{
  inventoryId: string;
  inventoryName: string;
  year: number;
  totalEmissions: number | null;
  cityId: string;
  totalCountryEmissions: number | null;
  isPublic: boolean;
  publishedAt: string | null;
  inventoryType: string;
  globalWarmingPotentialType: string;
  lastUpdated: string;
  created: string;
  last_updated: string;
  city: {
    cityId: string;
    locode: string;
    name: string;
    shape: any;
    country: string;
    region: string;
    countryLocode: string;
    regionLocode: string;
    area: string;
    projectId: string;
    created: string;
    last_updated: string;
  };
  inventoryValues: Array<{
    id: string;
    gpcReferenceNumber: string;
    activityUnits: string | null;
    activityValue: string | null;
    co2eq: string;
    co2eqYears: number;
    unavailableReason: string | null;
    unavailableExplanation: string | null;
    inputMethodology: string | null;
    sectorId: string;
    subSectorId: string;
    subCategoryId: string;
    inventoryId: string;
    datasourceId: string | null;
    created: string;
    last_updated: string;
    activityValues: any[];
    dataSource: {
      datasourceId: string;
      sourceType: string;
      datasetName: {
        [key: string]: string;
      };
      datasourceName: string;
      dataQuality: string;
    } | null;
    subSector: {
      subsectorId: string;
      subsectorName: string;
    };
  }>;
}> {
  return cityCatalystApiGet(`/api/v0/inventory/${inventoryId}/download`, accessToken);
}

/**
 * Get all inventories for multiple cities (used for overview)
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
    console.error('Cities data is not in expected format');
    return [];
  }


  const details = await Promise.all(
    cities.map(async (item) => {
      
      // Use same data extraction logic as authService.ts
      const cityData = item.city || item;
      
      if (!cityData) {
        console.log(`⚠️ No city data found in response item`);
        return { 
          locode: 'unknown', 
          name: 'Unknown City', 
          years: [], 
          inventories: [] 
        };
      }
      
      const locode = cityData.locode;
      const cityId = cityData.cityId || cityData.id;
      const name = cityData.name || cityData.cityName || 'Unknown City';
      const years = item.years || [];
      
      // If we have a cityId (UUID format), try to get detailed inventory info
      if (cityId && cityId !== 'undefined' && cityId !== locode) {
        try {
          const detail = await getCityDetail(cityId, accessToken);
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
          console.error(`❌ Failed to get details for city ${name} (${cityId}):`, error);
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

/**
 * Get CCRA (Climate Change Risk Assessment) dashboard data for a city inventory
 * GET /api/v0/city/{city}/modules/ccra/dashboard
 * 
 * @param cityId - UUID of the city (from inventory.city.cityId)  
 * @param inventoryId - UUID of the inventory
 * @param accessToken - User's CityCatalyst access token
 * @returns CCRA dashboard data with climate risk assessment information
 * 
 * This endpoint provides climate change risk assessment data for a specific city and inventory:
 * - Climate hazard information
 * - Vulnerability assessments  
 * - Risk scores and indicators
 * - Adaptation measures and recommendations
 * 
 * Usage example:
 * ```
 * // Get inventory details first to extract city UUID
 * const inventoryDetails = await getInventoryDetails(inventoryId, userToken);
 * const cityId = inventoryDetails.city.cityId;
 * 
 * // Then fetch CCRA data using both city and inventory UUIDs
 * const ccraData = await getCCRADashboard(cityId, inventoryId, userToken);
 * ```
 * 
 * Note: The city parameter is the city UUID (not LOCODE), which can be obtained 
 * from inventory.city.cityId when fetching inventory details.
 */
export async function getCCRADashboard(cityId: string, inventoryId: string, accessToken: string): Promise<any> {
  if (!cityId || !inventoryId) {
    throw new Error('Both cityId and inventoryId are required for CCRA dashboard');
  }
  
  // Validate UUID formats
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(cityId)) {
    throw new Error(`Invalid cityId format. Expected UUID, got: ${cityId}`);
  }
  if (!uuidRegex.test(inventoryId)) {
    throw new Error(`Invalid inventoryId format. Expected UUID, got: ${inventoryId}`);
  }
  
  return cityCatalystApiGet(
    `/api/v0/city/${encodeURIComponent(cityId)}/modules/ccra/dashboard?inventoryId=${encodeURIComponent(inventoryId)}`, 
    accessToken
  );
}

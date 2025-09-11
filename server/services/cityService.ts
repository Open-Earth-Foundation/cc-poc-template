import { storage } from "../storage";
import { City, User } from "@shared/schema";

const AUTH_BASE_URL = process.env.AUTH_BASE_URL || 'https://citycatalyst.openearth.dev';

// Debug: Log the base URL being used
console.log('🔧 CityCatalyst API base URL:', AUTH_BASE_URL);

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
      console.log(`🌐 Trying CityCatalyst endpoint: ${url}`);
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      console.log(`📡 Response status for ${url}: ${response.status}`);
      
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

// NEW CityCatalyst API Functions

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
 * Get inventory data for a specific city and year
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
export async function getCityBoundary(locode: string, accessToken: string): Promise<GeoJSON.Feature> {
  const normalizedLocode = locode.replace(/\s+/g, "_");
  return cityCatalystApiGet<GeoJSON.Feature>(
    `/api/v0/city/${encodeURIComponent(normalizedLocode)}/boundary`, 
    accessToken
  );
}

/**
 * Get detailed inventory information by inventory ID
 * GET /api/v0/inventory/{inventory}
 * 
 * Returns comprehensive inventory details including:
 * - inventoryId, inventoryName, year
 * - totalEmissions, inventoryType
 * - globalWarmingPotentialType, lastUpdated
 * - Full city details with project information
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

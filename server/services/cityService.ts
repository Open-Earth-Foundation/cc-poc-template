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
  console.log(`🌐 CityCatalyst API call: ${url}`);
  
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
  console.log(`✅ CityCatalyst API response for ${path}:`, json);
  
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
  
  console.log('🏙️ Getting user cities...');
  console.log('User project IDs:', user.projects);
  
  // First check our local storage for cities with these project IDs
  const localCities = await storage.getCitiesByProjectIds(user.projects);
  console.log(`📦 Found ${localCities.length} cities in local storage`);
  
  if (localCities.length > 0) {
    console.log('✅ Using stored city data');
    console.log('City names:', localCities.map(c => c.name));
    return localCities;
  }
  
  console.log('⚠️ No cities found in local storage, returning empty array');
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
 */
export async function getCityDetail(locode: string, accessToken: string): Promise<CityCatalystCityDetail> {
  if (!locode || locode === 'undefined') {
    throw new Error(`Invalid locode provided: ${locode}`);
  }
  // Convert spaces to underscores as per CityCatalyst API docs
  const normalizedLocode = locode.replace(/\s+/g, "_");
  console.log(`🔄 getCityDetail: Converting locode "${locode}" → "${normalizedLocode}"`);
  return cityCatalystApiGet<CityCatalystCityDetail>(
    `/api/v0/city/${encodeURIComponent(normalizedLocode)}`, 
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
  
  console.log(`🏙️ Raw CityCatalyst response:`, JSON.stringify(citiesData, null, 2));
  
  // Handle different response formats (same logic as authService.ts)
  const cities = citiesData.cities || citiesData.data || citiesData;
  
  if (!Array.isArray(cities)) {
    console.log('❌ Cities data is not an array:', cities);
    return [];
  }

  console.log(`🏙️ Found ${cities.length} cities for user`);

  const details = await Promise.all(
    cities.map(async (item) => {
      console.log(`🔍 Processing city item:`, JSON.stringify(item, null, 2));
      
      // Use same data extraction logic as authService.ts
      const cityData = item.city || item;
      
      if (!cityData) {
        console.log(`⚠️ No city data in item:`, item);
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
      
      console.log(`🏙️ Extracted: name="${name}", locode="${locode}", cityId="${cityId}", years:`, years);
      
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
          console.error(`❌ Failed to get details for city ${locode}:`, error);
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

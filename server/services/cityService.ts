import { storage } from "../storage";
import { City, User } from "@shared/schema";

const AUTH_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://citycatalyst.openearth.dev'
  : 'https://citycatalyst.openearth.dev';

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

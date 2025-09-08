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
  
  // If we have access token, try to fetch real cities from CityCatalyst
  if (accessToken) {
    console.log('🏙️ Fetching real city details from CityCatalyst API...');
    console.log('Access token (first 20 chars):', accessToken.substring(0, 20) + '...');
    console.log('User project IDs to fetch:', user.projects);
    
    const cityPromises = user.projects.map(async (cityId) => {
      console.log(`🔍 Fetching city details for: ${cityId}`);
      const result = await fetchCityFromCityCatalyst(cityId, accessToken);
      console.log(`${result ? '✅' : '❌'} City ${cityId}:`, result ? 'Found' : 'Not found');
      return result;
    });
    
    const cities = await Promise.all(cityPromises);
    const validCities = cities.filter(Boolean) as City[];
    
    console.log(`📊 CityCatalyst API results: ${validCities.length}/${user.projects.length} cities retrieved`);
    
    if (validCities.length > 0) {
      console.log(`✅ Retrieved ${validCities.length} real cities from CityCatalyst`);
      console.log('City names:', validCities.map(c => c.name));
      return validCities;
    } else {
      console.log('⚠️ No cities retrieved from CityCatalyst API');
    }
  } else {
    console.log('⚠️ No access token available, skipping CityCatalyst API calls');
  }
  
  // Fallback to local storage
  console.log('🔄 Falling back to local storage cities...');
  const localCities = await storage.getCitiesByProjectIds(user.projects);
  console.log(`📦 Local storage returned ${localCities.length} cities`);
  return localCities;
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

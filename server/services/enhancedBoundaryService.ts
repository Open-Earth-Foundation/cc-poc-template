// Enhanced Boundary Service - Recreating exact logic from implementation guide
interface OSMBoundary {
  osmId: string;
  osmType: 'way' | 'relation';
  name: string;
  adminLevel?: string;
  boundaryType: string;
  area: number;
  geometry: any;
  tags: any;
  score: number;
}

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

interface EnhancedBoundaryRequest {
  city: string;
  country: string;
  locode?: string;
}

// Country code mapping
function getCountryCode(country: string): string {
  const countryMap: Record<string, string> = {
    'Argentina': 'AR',
    'Brazil': 'BR', 
    'Chile': 'CL',
    'Colombia': 'CO',
    'Mexico': 'MX',
    'United States': 'US',
    'Canada': 'CA',
    'United Kingdom': 'GB',
    'France': 'FR',
    'Germany': 'DE',
    'Spain': 'ES',
    'Italy': 'IT',
  };
  return countryMap[country] || 'AR';
}

// Escape regex special characters
function escapeRegexSpecialChars(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Build Overpass query exactly as in implementation guide
function buildOverpassQuery(cityName: string, country: string): string {
  const countryCode = getCountryCode(country);
  const escapedCity = escapeRegexSpecialChars(cityName);
  
  return `
    [out:json][timeout:60];
    area["ISO3166-1:alpha2"="${countryCode}"]->.country;
    (
      rel(area.country)
        ["boundary"~"^(administrative|political)$"]
        ["name"~"^${escapedCity}$",i];
      way(area.country)
        ["boundary"~"^(administrative|political)$"]
        ["name"~"^${escapedCity}$",i];
      rel(area.country)
        ["boundary"="administrative"]
        ["admin_level"~"^[6-10]$"]
        ["name"~"${escapedCity}"];
      rel(area.country)
        ["place"~"^(city|town|municipality)$"]
        ["name"~"${escapedCity}"];
    );
    out geom;
  `;
}

// Calculate area of polygon in square kilometers
function calculateArea(geometry: any): number {
  if (!geometry || !geometry.coordinates) return 0;
  
  // Simple bounding box area calculation for now
  // In production, would use proper geodesic calculation
  const coords = geometry.coordinates[0];
  if (!coords || coords.length < 3) return 0;
  
  const lats = coords.map((c: number[]) => c[1]);
  const lngs = coords.map((c: number[]) => c[0]);
  
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  
  // Rough conversion to km²
  const latDiff = maxLat - minLat;
  const lngDiff = maxLng - minLng;
  const avgLat = (minLat + maxLat) / 2;
  const kmPerDegreeLat = 111;
  const kmPerDegreeLng = 111 * Math.cos(avgLat * Math.PI / 180);
  
  return Math.abs(latDiff * kmPerDegreeLat * lngDiff * kmPerDegreeLng);
}

// Scoring algorithm exactly from implementation guide
function scoreBoundary(boundary: OSMBoundary, searchTerm: string): number {
  let score = 0;
  const { tags } = boundary;

  // 1. Boundary type preference
  if (tags.boundary === 'administrative') score += 10;
  if (tags.boundary === 'political') score += 8;
  
  // 2. Administrative level scoring (city-level boundaries)
  const adminLevel = parseInt(tags.admin_level || '0');
  if (adminLevel >= 6 && adminLevel <= 10) {
    score += (11 - adminLevel); // Higher score for more specific levels
  }
  
  // 3. Place type preference
  if (tags.place === 'city') score += 8;
  if (tags.place === 'town') score += 6;
  if (tags.place === 'municipality') score += 7;
  
  // 4. Name matching
  const name = tags.name?.toLowerCase() || '';
  if (name === searchTerm.toLowerCase()) score += 15; // Exact match
  if (name.includes(searchTerm.toLowerCase())) score += 10; // Partial match
  
  // 5. Area-based scoring (reasonable city size)
  const areaSqKm = boundary.area || 0;
  if (areaSqKm > 50 && areaSqKm < 5000) score += 5; // Reasonable city size
  if (areaSqKm > 5 && areaSqKm < 50) score += 3; // Small city/district
  
  // 6. Population data bonus
  if (tags.population) score += 3;
  
  // 7. Type preference - relations are typically better for boundaries
  if (boundary.osmType === 'relation') score += 3;
  
  // 8. Penalize very high admin levels (country/state level)
  if (adminLevel > 0 && adminLevel <= 4) score -= 5;

  return score;
}

// Build polygon from way with geometry
function buildPolygonFromWay(way: any): any {
  if (!way.geometry || way.geometry.length < 3) return null;

  try {
    const coordinates = way.geometry.map((node: any) => [node.lon, node.lat]);
    
    // Ensure the way is closed for a valid polygon
    if (coordinates[0][0] !== coordinates[coordinates.length - 1][0] || 
        coordinates[0][1] !== coordinates[coordinates.length - 1][1]) {
      coordinates.push(coordinates[0]);
    }

    return {
      type: 'Polygon',
      coordinates: [coordinates],
    };
  } catch (error) {
    console.error('Error processing way geometry:', error);
    return null;
  }
}

// Build polygon from relation
function buildPolygonFromRelation(relation: any, ways: Map<string, any>): any {
  if (!relation.members || relation.members.length === 0) return null;

  try {
    // Get outer ways
    const outerMembers = relation.members.filter((m: any) => 
      m.role === 'outer' || m.role === ''
    );

    if (outerMembers.length === 0) return null;

    // For now, use first outer way
    const firstOuter = outerMembers[0];
    const way = ways.get(firstOuter.ref);
    
    if (way && way.geometry) {
      return buildPolygonFromWay(way);
    }

    // Fallback: create polygon from relation bounds if available
    if (relation.bounds) {
      const { minlat, minlon, maxlat, maxlon } = relation.bounds;
      return {
        type: 'Polygon',
        coordinates: [[
          [minlon, minlat],
          [maxlon, minlat],
          [maxlon, maxlat],
          [minlon, maxlat],
          [minlon, minlat],
        ]],
      };
    }
  } catch (error) {
    console.error('Error processing relation geometry:', error);
  }

  return null;
}

// Convert OSM data to GeoJSON boundaries exactly as in guide
function convertOSMToGeoJSON(osmData: any, searchTerm: string): OSMBoundary[] {
  const ways = new Map();
  const boundaries: OSMBoundary[] = [];
  
  // Build ways map
  osmData.elements?.forEach((element: any) => {
    if (element.type === 'way') {
      ways.set(element.id, element);
    }
  });
  
  // Process relations
  osmData.elements
    ?.filter((element: any) => element.type === 'relation' && element.tags)
    .forEach((relation: any) => {
      const geometry = buildPolygonFromRelation(relation, ways);
      if (geometry) {
        const boundary: OSMBoundary = {
          osmId: `relation/${relation.id}`,
          osmType: 'relation',
          name: relation.tags.name || 'Unknown',
          adminLevel: relation.tags.admin_level,
          boundaryType: relation.tags.boundary || 'administrative',
          area: calculateArea(geometry),
          geometry,
          tags: relation.tags,
          score: 0,
        };
        
        boundary.score = scoreBoundary(boundary, searchTerm);
        boundaries.push(boundary);
      }
    });
    
  // Process standalone ways
  osmData.elements
    ?.filter((element: any) => element.type === 'way' && element.geometry && element.tags)
    .forEach((way: any) => {
      const geometry = buildPolygonFromWay(way);
      if (geometry) {
        const boundary: OSMBoundary = {
          osmId: `way/${way.id}`,
          osmType: 'way',
          name: way.tags.name || 'Unknown',
          adminLevel: way.tags.admin_level,
          boundaryType: way.tags.boundary || 'administrative',
          area: calculateArea(geometry),
          geometry,
          tags: way.tags,
          score: 0,
        };
        
        boundary.score = scoreBoundary(boundary, searchTerm);
        boundaries.push(boundary);
      }
    });
    
  return boundaries.sort((a, b) => b.score - a.score);
}

// Fetch enhanced boundaries - main function matching implementation guide
export async function fetchEnhancedBoundaries(request: EnhancedBoundaryRequest): Promise<{ boundaries: OSMBoundary[] }> {
  const { city, country } = request;
  
  console.log(`🔍 Searching enhanced boundaries for ${city}, ${country}`);
  
  // Step 1: Build Overpass query
  const overpassQuery = buildOverpassQuery(city, country);
  console.log('📋 Overpass query:', overpassQuery.trim());
  
  try {
    // Step 2: Execute query
    const response = await fetch(OVERPASS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    });
    
    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.statusText}`);
    }
    
    const osmData = await response.json();
    console.log(`📊 OSM response: ${osmData.elements?.length || 0} elements`);
    
    // Step 3: Process and score boundaries
    const processedBoundaries = convertOSMToGeoJSON(osmData, city);
    console.log(`🏆 Processed ${processedBoundaries.length} boundaries`);
    
    // Step 4: Return top 5 scored boundaries
    const topBoundaries = processedBoundaries.slice(0, 5);
    console.log('✅ Top boundaries:', topBoundaries.map(b => `${b.name} (${b.score})`));
    
    return {
      boundaries: topBoundaries
    };
    
  } catch (error) {
    console.error('❌ Enhanced boundaries error:', error);
    
    // Return sample boundaries for development
    if (process.env.NODE_ENV === 'development') {
      console.log('🧪 Using sample boundaries for development');
      return {
        boundaries: getSampleBoundaries()
      };
    }
    
    throw error;
  }
}

// Sample boundaries for development 
function getSampleBoundaries(): OSMBoundary[] {
  return [
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
          [-58.5319, -34.5268],
          [-58.3350, -34.5268],
          [-58.3350, -34.7051],
          [-58.5319, -34.7051],
          [-58.5319, -34.5268],
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
          [-58.3550, -34.5468],
          [-58.3550, -34.6851],
          [-58.5119, -34.6851],
          [-58.5119, -34.5468],
        ]],
      },
      tags: {
        name: 'Buenos Aires',
        boundary: 'administrative',
        admin_level: '8',
        place: 'municipality',
      },
      score: 85,
    },
    {
      osmId: 'way/4095490',
      osmType: 'way',
      name: 'Buenos Aires Centro',
      adminLevel: '10',
      boundaryType: 'administrative',
      area: 45.23,
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-58.4431, -34.5708],
          [-58.3831, -34.5708],
          [-58.3831, -34.6308],
          [-58.4431, -34.6308],
          [-58.4431, -34.5708],
        ]],
      },
      tags: {
        name: 'Buenos Aires Centro',
        boundary: 'administrative',
        admin_level: '10',
      },
      score: 75,
    },
  ];
}
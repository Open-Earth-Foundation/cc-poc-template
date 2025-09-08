import { InsertBoundary } from "@shared/schema";
// @ts-ignore
import osmtogeojson from 'osmtogeojson';

export interface OSMBoundary {
  osmId: string;
  osmType: 'way' | 'relation';
  name: string;
  adminLevel?: string;
  boundaryType: string;
  area?: number;
  geometry: any;
  tags: Record<string, any>;
  score: number;
}

export interface BoundarySearchParams {
  cityName: string;
  country: string;
  countryCode?: string;
  limit?: number;
}

const OVERPASS_API_URL = process.env.OVERPASS_API_URL || 'https://overpass-api.de/api/interpreter';

// Helper function to get country code from country name
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
    'Australia': 'AU',
    'Japan': 'JP',
    'China': 'CN',
    'India': 'IN',
    'South Africa': 'ZA',
    'Netherlands': 'NL',
    'Belgium': 'BE',
    'Portugal': 'PT',
    'Greece': 'GR',
    'Poland': 'PL',
    'Sweden': 'SE',
    'Norway': 'NO',
    'Denmark': 'DK',
    'Finland': 'FI',
    'Ireland': 'IE',
    'Switzerland': 'CH',
    'Austria': 'AT',
    'Czech Republic': 'CZ',
    'Hungary': 'HU',
    'Romania': 'RO',
    'Bulgaria': 'BG',
    'Croatia': 'HR',
    'Serbia': 'RS',
    'Turkey': 'TR',
    'Russia': 'RU',
    'Ukraine': 'UA',
    'South Korea': 'KR',
    'Thailand': 'TH',
    'Vietnam': 'VN',
    'Indonesia': 'ID',
    'Malaysia': 'MY',
    'Singapore': 'SG',
    'Philippines': 'PH',
    'New Zealand': 'NZ',
    'Egypt': 'EG',
    'Morocco': 'MA',
    'Nigeria': 'NG',
    'Kenya': 'KE',
    'Ghana': 'GH',
    'Ethiopia': 'ET',
    'Israel': 'IL',
    'Lebanon': 'LB',
    'Jordan': 'JO',
    'Saudi Arabia': 'SA',
    'United Arab Emirates': 'AE',
    'Qatar': 'QA',
    'Kuwait': 'KW',
    'Bahrain': 'BH',
    'Oman': 'OM',
    'Iran': 'IR',
    'Iraq': 'IQ',
    'Pakistan': 'PK',
    'Bangladesh': 'BD',
    'Sri Lanka': 'LK',
    'Nepal': 'NP',
    'Myanmar': 'MM',
    'Cambodia': 'KH',
    'Laos': 'LA',
    'Mongolia': 'MN',
    'Kazakhstan': 'KZ',
    'Uzbekistan': 'UZ',
    'Afghanistan': 'AF',
    'Armenia': 'AM',
    'Azerbaijan': 'AZ',
    'Georgia': 'GE',
    'Moldova': 'MD',
    'Belarus': 'BY',
    'Lithuania': 'LT',
    'Latvia': 'LV',
    'Estonia': 'EE',
    'Slovenia': 'SI',
    'Slovakia': 'SK',
    'Bosnia and Herzegovina': 'BA',
    'Montenegro': 'ME',
    'North Macedonia': 'MK',
    'Albania': 'AL',
    'Cyprus': 'CY',
    'Malta': 'MT',
    'Iceland': 'IS',
    'Luxembourg': 'LU',
    'Monaco': 'MC',
    'Andorra': 'AD',
    'San Marino': 'SM',
    'Vatican City': 'VA',
    'Liechtenstein': 'LI'
  };
  
  // Try exact match first
  if (countryMap[country]) {
    return countryMap[country];
  }
  
  // Try case-insensitive match
  const lowerCountry = country.toLowerCase();
  for (const [key, value] of Object.entries(countryMap)) {
    if (key.toLowerCase() === lowerCountry) {
      return value;
    }
  }
  
  // Default fallback - log warning
  console.warn(`⚠️ Unknown country: ${country}, defaulting to AR`);
  return 'AR';
}

// Helper function to escape regex special characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function searchBoundaries(params: BoundarySearchParams): Promise<OSMBoundary[]> {
  const { cityName, country, limit = 5 } = params;
  const countryCode = getCountryCode(country);
  
  console.log(`🔍 Searching boundaries for ${cityName}, ${country} (${countryCode})`);
  
  // Stage 1: Build dynamic query with country filtering
  const searchQuery = `
    [out:json][timeout:30];
    area["ISO3166-1:alpha2"="${countryCode}"]->.country;
    (
      rel(area.country)["boundary"="administrative"]["admin_level"~"^(4|5|6|7|8|9|10)$"]["name"~"^${escapeRegex(cityName)}$",i];
      way(area.country)["boundary"="administrative"]["admin_level"~"^(4|5|6|7|8|9|10)$"]["name"~"^${escapeRegex(cityName)}$",i];
      rel(area.country)["place"~"^(city|town|municipality|village)$"]["name"~"^${escapeRegex(cityName)}$",i];
    );
    out tags;
  `;

  try {
    // Step 1: Get boundary metadata
    console.log(`📡 Query: ${searchQuery.trim()}`);
    console.log(`📡 Fetching boundary metadata for ${cityName} in ${country}...`);
    const requestBody = `data=${encodeURIComponent(searchQuery)}`;
    console.log(`📡 Request body length: ${requestBody.length}`);
    
    const searchResponse = await fetch(OVERPASS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: requestBody,
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error(`❌ Overpass API error (${searchResponse.status}): ${errorText}`);
      throw new Error(`Overpass API error: ${searchResponse.status} - ${errorText}`);
    }

    const searchData = await searchResponse.json();
    console.log(`📊 Found ${searchData.elements?.length || 0} potential boundaries`);
    
    if (!searchData.elements || searchData.elements.length === 0) {
      console.log(`❌ No boundaries found for ${cityName}`);
      return [];
    }

    // Process and score boundaries
    const candidateBoundaries = searchData.elements
      .filter((element: any) => element.tags && element.tags.name)
      .map((element: any) => ({
        id: element.id,
        type: element.type,
        tags: element.tags,
        score: calculateBoundaryScore({
          osmId: element.id.toString(),
          osmType: element.type,
          name: element.tags.name,
          adminLevel: element.tags.admin_level,
          boundaryType: element.tags.boundary,
          tags: element.tags,
          area: 0,
          geometry: null,
          score: 0
        }, cityName, countryCode)
      }))
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, limit);

    console.log(`🏆 Top ${candidateBoundaries.length} candidates selected for geometry fetch`);

    // Step 2: Fetch actual geometry for top candidates
    const boundariesWithGeometry = await Promise.all(
      candidateBoundaries.map(async (candidate: any) => {
        try {
          console.log(`🌍 Fetching geometry for ${candidate.tags.name} (${candidate.type}/${candidate.id})`);
          
          const geometry = await fetchBoundaryGeometry(candidate.id, candidate.type);
          
          if (!geometry) {
            console.warn(`⚠️ No geometry found for ${candidate.tags.name}`);
            return null;
          }

          // Calculate real area from polygon
          const area = calculateRealPolygonArea(geometry);

          return {
            osmId: `${candidate.type}/${candidate.id}`,
            osmType: candidate.type,
            name: candidate.tags.name,
            adminLevel: candidate.tags.admin_level,
            boundaryType: candidate.tags.boundary || 'administrative',
            area,
            geometry,
            tags: candidate.tags,
            score: candidate.score
          } as OSMBoundary;
        } catch (error) {
          console.error(`❌ Error fetching geometry for ${candidate.tags.name}:`, error);
          return null;
        }
      })
    );

    // Filter out failed geometry fetches
    const validBoundaries = boundariesWithGeometry.filter(b => b !== null) as OSMBoundary[];
    
    console.log(`✅ Successfully fetched ${validBoundaries.length} boundaries with geometry`);
    
    return validBoundaries;
    
  } catch (error) {
    console.error('❌ Error fetching boundaries from OSM:', error);
    throw error;
  }
}

// Process metadata only (no geometry yet)
// Fetch actual geometry for a specific boundary using osmtogeojson
async function fetchBoundaryGeometry(id: number, type: string): Promise<any> {
  const geomQuery = `
    [out:json][timeout:30];
    (
      ${type}(${id});
      way(r);
      node(w);
    );
    out geom;
  `;

  try {
    const geomResponse = await fetch(OVERPASS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(geomQuery)}`,
    });

    if (!geomResponse.ok) {
      throw new Error(`Geometry fetch error: ${geomResponse.statusText}`);
    }

    const rawOsmData = await geomResponse.json();
    
    // Convert OSM data to GeoJSON using osmtogeojson
    const geoJson = osmtogeojson(rawOsmData, { flatProperties: true });
    
    // Find the specific relation/way in the converted data
    const targetFeature = geoJson.features.find((f: any) => 
      f.id === `${type}/${id}`
    );

    if (targetFeature?.geometry) {
      return targetFeature.geometry;
    }

    console.warn(`⚠️ No geometry found for ${type}/${id} in converted GeoJSON`);
    return null;
    
  } catch (error) {
    console.error(`❌ Error fetching geometry for ${type}/${id}:`, error);
    throw error;
  }
}

// Calculate real polygon area using proper geographic calculation
function calculateRealPolygonArea(geometry: any): number {
  if (!geometry || (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon')) {
    return 0;
  }

  // For now, use a simplified calculation
  // In production, you'd use a library like turf.js for accurate spherical area calculation
  if (geometry.type === 'Polygon') {
    return calculateSimplePolygonArea(geometry.coordinates[0]);
  } else if (geometry.type === 'MultiPolygon') {
    // Sum up all polygon areas
    return geometry.coordinates.reduce((total: number, polygon: number[][][]) => {
      return total + calculateSimplePolygonArea(polygon[0]);
    }, 0);
  }

  return 0;
}

function calculateSimplePolygonArea(coords: number[][]): number {
  if (coords.length < 3) return 0;
  
  // Shoelace formula for polygon area (rough approximation)
  let area = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    area += (coords[i][0] * coords[i + 1][1] - coords[i + 1][0] * coords[i][1]);
  }
  
  // Convert to square kilometers (very rough approximation)
  return Math.abs(area) * 12.4; // Rough conversion factor
}


function calculateBoundaryScore(boundary: OSMBoundary, searchTerm: string, countryCode?: string): number {
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
  
  // 4. Name matching (improved)
  const name = tags.name?.toLowerCase() || '';
  const searchLower = searchTerm.toLowerCase();
  if (name === searchLower) score += 20; // Exact match
  if (name.includes(searchLower)) score += 15; // Partial match
  
  // Check alternative names
  const altNames = [
    tags['name:en'],
    tags['official_name'],
    tags['short_name'],
    tags['alt_name']
  ].filter(Boolean);
  
  for (const altName of altNames) {
    const altLower = altName?.toLowerCase() || '';
    if (altLower === searchLower) score += 18;
    else if (altLower.includes(searchLower)) score += 12;
  }
  
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
  
  // 9. Country validation bonus and penalty for wrong country
  if (countryCode) {
    if (tags['ISO3166-1:alpha2'] === countryCode) {
      score += 5;
    } else if (tags['ISO3166-1:alpha2'] && tags['ISO3166-1:alpha2'] !== countryCode) {
      // Strong penalty for boundaries from different countries
      score -= 20;
    }
  }
  
  // Also check addr:country tag
  if (countryCode && tags['addr:country'] && tags['addr:country'] !== countryCode) {
    score -= 15;
  }
  
  // 10. Prefer boundaries with explicit boundary tags
  if (tags.boundary && (tags.boundary === 'administrative' || tags.boundary === 'political')) {
    score += 2;
  }

  return score;
}

function buildPolygonFromRelation(relation: any, ways: Map<string, any>, nodes: Map<string, any>): any {
  // Simplified polygon building - in production, this would handle complex multipolygons
  const outerWays = relation.members?.filter((member: any) => 
    member.type === 'way' && member.role === 'outer'
  ) || [];

  if (outerWays.length === 0) return null;

  const coordinates: number[][] = [];
  
  outerWays.forEach((wayRef: any) => {
    const way = ways.get(wayRef.ref);
    if (way && way.geometry) {
      way.geometry.forEach((node: any) => {
        coordinates.push([node.lon, node.lat]);
      });
    }
  });

  if (coordinates.length < 3) return null;

  return {
    type: 'Polygon',
    coordinates: [coordinates],
  };
}

function buildPolygonFromWay(way: any, nodes: Map<string, any>): any {
  if (!way.geometry || way.geometry.length < 3) return null;

  const coordinates = way.geometry.map((node: any) => [node.lon, node.lat]);
  
  return {
    type: 'Polygon',
    coordinates: [coordinates],
  };
}


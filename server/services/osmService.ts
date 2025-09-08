
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
  
  return countryMap[country] || country.substring(0, 2).toUpperCase();
}

function calculateBoundingBoxArea(bbox: any): number {
  if (!bbox) return 0;
  const { minlat, maxlat, minlon, maxlon } = bbox;
  return (maxlat - minlat) * (maxlon - minlon);
}

function scoreFeature(feature: any, searchTerm: string): number {
  let score = 0;
  const tags = feature.properties;
  
  // Administrative boundary preference
  if (tags.boundary === 'administrative') score += 10;
  
  // Admin level preference (6-10 are typically city-level)
  const adminLevel = parseInt(tags.admin_level || '0');
  if (adminLevel >= 6 && adminLevel <= 10) score += 5;
  
  // Area-based scoring (avoid too small/large boundaries)
  const area = tags._area_deg2 || 0;
  if (area > 0.001 && area < 1) score += 3;
  
  // Name similarity
  if (tags.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
    score += 8;
  }
  
  // Exact name match bonus
  if (tags.name?.toLowerCase() === searchTerm.toLowerCase()) {
    score += 15;
  }
  
  return score;
}

export async function searchBoundaries(params: BoundarySearchParams): Promise<OSMBoundary[]> {
  const { cityName, country, limit = 5 } = params;
  const countryCode = getCountryCode(country);
  
  console.log(`🔍 Searching boundaries for ${cityName}, ${country} (${countryCode})`);
  
  // Step 1: Build Overpass query following reference implementation
  const overpassQuery = `
    [out:json][timeout:60];
    area["ISO3166-1:alpha2"~"^${countryCode}$"]->.country;
    (
      rel(area.country)["boundary"="administrative"]["name"~"${cityName}",i];
      way(area.country)["boundary"="administrative"]["name"~"${cityName}",i];
    );
    out ids tags bb;
  `;

  try {
    console.log(`📡 Executing Overpass query for ${cityName}...`);
    
    const response = await fetch(OVERPASS_API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded' 
      },
      body: new URLSearchParams({ data: overpassQuery }),
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.statusText}`);
    }

    const osmData = await response.json();
    console.log(`📊 Found ${osmData.elements?.length || 0} boundary elements`);
    
    if (!osmData.elements || osmData.elements.length === 0) {
      console.log(`❌ No boundaries found for ${cityName}`);
      return [];
    }

    // Step 2: Convert to features and score them (following reference implementation)
    const features = osmData.elements.map((element: any) => ({
      type: "Feature",
      id: `${element.type}/${element.id}`,
      properties: {
        osm_id: element.id,
        name: element.tags?.name || "Unnamed",
        admin_level: element.tags?.admin_level,
        place: element.tags?.place,
        boundary: element.tags?.boundary,
        _area_deg2: calculateBoundingBoxArea(element.bbox),
      },
      _bounds: element.bbox ? {
        minlat: element.bbox.minlat,
        minlon: element.bbox.minlon,
        maxlat: element.bbox.maxlat,
        maxlon: element.bbox.maxlon,
      } : null,
      geometry: null // Will be loaded separately
    }));

    // Step 3: Score and rank boundaries
    const scoredFeatures = features
      .map(feature => ({
        ...feature,
        score: scoreFeature(feature, cityName)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    console.log(`🏆 Top ${scoredFeatures.length} boundaries selected`);

    // Step 4: Convert to OSMBoundary format
    const boundaries: OSMBoundary[] = scoredFeatures.map(feature => ({
      osmId: feature.id,
      osmType: feature.id.startsWith('relation/') ? 'relation' : 'way',
      name: feature.properties.name,
      adminLevel: feature.properties.admin_level,
      boundaryType: feature.properties.boundary || 'administrative',
      area: feature.properties._area_deg2,
      geometry: null, // Will be fetched when needed
      tags: feature.properties,
      score: feature.score
    }));

    console.log(`✅ Returning ${boundaries.length} boundaries for ${cityName}`);
    return boundaries;
    
  } catch (error) {
    console.error('❌ Error fetching boundaries from OSM:', error);
    throw error;
  }
}

// Fetch geometry for a specific boundary (following reference implementation)
export async function fetchBoundaryGeometry(osmId: string): Promise<any> {
  console.log(`🌍 Fetching geometry for OSM ID: ${osmId}`);
  
  // Extract ID from osmId (format: "relation/123" or "way/123")
  const [type, id] = osmId.split('/');
  
  if (!id) {
    throw new Error('Invalid OSM ID format');
  }

  // Build geometry query following reference implementation
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
    const response = await fetch(OVERPASS_API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded' 
      },
      body: new URLSearchParams({ data: geomQuery }),
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.statusText}`);
    }

    const rawOsmData = await response.json();
    
    // Convert OSM data to GeoJSON using osmtogeojson
    const geoJson = osmtogeojson(rawOsmData, { flatProperties: true });
    
    // Find the specific feature in the converted data
    const targetFeature = geoJson.features.find((f: any) => 
      f.id === osmId
    );

    if (!targetFeature?.geometry) {
      throw new Error('No geometry found for this boundary');
    }

    console.log(`✅ Successfully fetched geometry for ${osmId}`);
    return targetFeature.geometry;
    
  } catch (error) {
    console.error(`❌ Error fetching geometry for ${osmId}:`, error);
    throw error;
  }
}

import { InsertBoundary } from "@shared/schema";

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
    // Add more mappings as needed
  };
  
  return countryMap[country] || 'AR';
}

// Helper function to escape regex special characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function searchBoundaries(params: BoundarySearchParams): Promise<OSMBoundary[]> {
  const { cityName, country, limit = 5 } = params;
  const countryCode = getCountryCode(country);
  
  console.log(`🔍 Searching boundaries for ${cityName}, ${country} (${countryCode})`);
  
  // Step 1: Get boundary IDs and metadata only (no geometry yet)
  const query = `
    [out:json][timeout:60];
    area["ISO3166-1:alpha2"="${countryCode}"]->.country;
    (
      rel(area.country)
        ["boundary"~"^(administrative|political)$"]
        ["name"~"^${escapeRegex(cityName)}$",i];
      way(area.country)
        ["boundary"~"^(administrative|political)$"]
        ["name"~"^${escapeRegex(cityName)}$",i];
    );
    out ids tags bb;
  `;

  try {
    const response = await fetch(OVERPASS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`📊 Found ${data.elements?.length || 0} potential boundaries`);
    
    // Process response to get boundary metadata without geometry
    const boundaryMetadata = await processOverpassMetadata(data, cityName);
    
    // Sort by score and take top results
    const topBoundaries = boundaryMetadata
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
      
    console.log(`🏆 Top ${topBoundaries.length} boundaries selected:`, 
      topBoundaries.map(b => `${b.name} (score: ${b.score})`));
    
    // Step 2: Load geometry for top boundaries in parallel
    const boundariesWithGeometry = await Promise.all(
      topBoundaries.map(async (boundary) => {
        try {
          console.log(`📐 Loading geometry for ${boundary.name} (${boundary.osmType}.${boundary.osmId})`);
          const geometry = await getBoundaryGeometry(boundary.osmId, boundary.osmType);
          if (geometry) {
            const area = calculatePolygonArea(geometry);
            return {
              ...boundary,
              geometry,
              area,
            };
          }
        } catch (error) {
          console.error(`Failed to load geometry for ${boundary.name}:`, error);
        }
        return boundary;
      })
    );
    
    return boundariesWithGeometry;
    
  } catch (error) {
    console.error('Error fetching boundaries from OSM:', error);
    // Return sample boundaries for development
    if (process.env.NODE_ENV === 'development') {
      console.log('🧪 Using sample boundaries for development');
      return getSampleBoundaries(cityName);
    }
    throw error;
  }
}

// Process metadata only (no geometry yet)
async function processOverpassMetadata(data: any, searchTerm: string): Promise<OSMBoundary[]> {
  const boundaries: OSMBoundary[] = [];

  data.elements?.forEach((element: any) => {
    if ((element.type === 'relation' || element.type === 'way') && element.tags) {
      const boundary = processBoundaryMetadata(element, searchTerm);
      if (boundary) {
        boundaries.push(boundary);
      }
    }
  });

  return boundaries;
}

function processBoundaryMetadata(element: any, searchTerm: string): OSMBoundary | null {
  const { tags } = element;
  
  if (!tags.boundary || !tags.name) return null;

  // Calculate boundary score
  const score = calculateBoundaryScore(element, searchTerm);
  
  // Estimate area from bounding box if available
  let estimatedArea = 0;
  if (element.bounds) {
    const { minlat, minlon, maxlat, maxlon } = element.bounds;
    const width = (maxlon - minlon) * 111; // rough km per degree
    const height = (maxlat - minlat) * 111;
    estimatedArea = Math.round(width * height);
  }

  return {
    osmId: element.id.toString(),
    osmType: element.type,
    name: tags.name,
    adminLevel: tags.admin_level,
    boundaryType: tags.boundary,
    area: estimatedArea,
    geometry: null, // Will be loaded separately
    tags,
    score,
  };
}

async function processOverpassResponse(data: any, searchTerm: string): Promise<OSMBoundary[]> {
  const boundaries: OSMBoundary[] = [];
  const ways = new Map();
  const nodes = new Map();

  // Build maps of ways and nodes
  data.elements?.forEach((element: any) => {
    if (element.type === 'way') {
      ways.set(element.id, element);
    } else if (element.type === 'node') {
      nodes.set(element.id, element);
    }
  });

  // Process relations and ways
  data.elements?.forEach((element: any) => {
    if ((element.type === 'relation' || element.type === 'way') && element.tags) {
      const boundary = processBoundaryElement(element, ways, nodes, searchTerm);
      if (boundary) {
        boundaries.push(boundary);
      }
    }
  });

  return boundaries;
}

function processBoundaryElement(
  element: any,
  ways: Map<string, any>,
  nodes: Map<string, any>,
  searchTerm: string
): OSMBoundary | null {
  const { tags } = element;
  
  if (!tags.boundary || !tags.name) return null;

  // Calculate boundary score
  const score = calculateBoundaryScore(element, searchTerm);
  
  // Build geometry
  let geometry;
  try {
    if (element.type === 'relation') {
      geometry = buildPolygonFromRelation(element, ways, nodes);
    } else {
      geometry = buildPolygonFromWay(element, nodes);
    }
  } catch (error) {
    console.error('Error building geometry:', error);
    return null;
  }

  if (!geometry) return null;

  // Calculate area
  const area = calculatePolygonArea(geometry);

  return {
    osmId: element.id.toString(),
    osmType: element.type,
    name: tags.name,
    adminLevel: tags.admin_level,
    boundaryType: tags.boundary,
    area,
    geometry,
    tags,
    score,
  };
}

function calculateBoundaryScore(element: any, searchTerm: string): number {
  let score = 0;
  const { tags } = element;

  // Administrative boundary preference
  if (tags.boundary === 'administrative') score += 10;
  
  // Admin level preference (6-10 are city-level)
  const adminLevel = parseInt(tags.admin_level || '0');
  if (adminLevel >= 6 && adminLevel <= 10) score += 5;
  
  // Exact name match gets highest score
  if (tags.name?.toLowerCase() === searchTerm.toLowerCase()) {
    score += 15;
  } else if (tags.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
    score += 8;
  }
  
  // Type preference - relations are typically better for boundaries
  if (element.type === 'relation') score += 3;
  
  // Boost score for common city boundary indicators
  if (tags.admin_level === '8') score += 3; // Municipality level
  if (tags.admin_level === '6') score += 2; // District level
  
  // Penalize very high admin levels (country/state level)
  if (parseInt(tags.admin_level || '0') <= 4) score -= 5;

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

function calculatePolygonArea(geometry: any): number {
  // Simplified area calculation - returns approximate area in km²
  if (!geometry || geometry.type !== 'Polygon') return 0;
  
  const coords = geometry.coordinates[0];
  if (coords.length < 3) return 0;
  
  // Very rough approximation
  const bounds = coords.reduce((acc: any, coord: number[]) => ({
    minLon: Math.min(acc.minLon, coord[0]),
    maxLon: Math.max(acc.maxLon, coord[0]),
    minLat: Math.min(acc.minLat, coord[1]),
    maxLat: Math.max(acc.maxLat, coord[1]),
  }), {
    minLon: Infinity,
    maxLon: -Infinity,
    minLat: Infinity,
    maxLat: -Infinity,
  });
  
  const width = (bounds.maxLon - bounds.minLon) * 111; // rough km per degree
  const height = (bounds.maxLat - bounds.minLat) * 111;
  
  return Math.round(width * height);
}

function getSampleBoundaries(cityName: string): OSMBoundary[] {
  // Sample boundaries based on real OSM data for Buenos Aires
  return [
    {
      osmId: 'R3082668',
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
      },
      score: 98,
    },
    {
      osmId: 'R2672883',
      osmType: 'relation',
      name: 'Lago Buenos Aires',
      adminLevel: '4',
      boundaryType: 'administrative',
      area: 28471.99,
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-71.2, -46.5],
          [-70.8, -46.5],
          [-70.8, -47.1],
          [-71.2, -47.1],
          [-71.2, -46.5],
        ]],
      },
      tags: {
        name: 'Lago Buenos Aires',
        boundary: 'administrative',
        admin_level: '4',
      },
      score: 85,
    },
    {
      osmId: 'R1632167',
      osmType: 'relation',
      name: 'Buenos Aires',
      adminLevel: '4',
      boundaryType: 'administrative',
      area: 306349.01,
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-62.0, -33.0],
          [-57.0, -33.0],
          [-57.0, -41.0],
          [-62.0, -41.0],
          [-62.0, -33.0],
        ]],
      },
      tags: {
        name: 'Buenos Aires',
        boundary: 'administrative',
        admin_level: '4',
      },
      score: 82,
    },
    {
      osmId: 'R1224652',
      osmType: 'relation',
      name: 'Buenos Aires',
      adminLevel: '4',
      boundaryType: 'administrative',
      area: 205.63,
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
        admin_level: '4',
      },
      score: 79,
    },
    {
      osmId: 'R4445883',
      osmType: 'relation',
      name: 'Buenos Aires Chico',
      adminLevel: '4',
      boundaryType: 'administrative',
      area: 0.43,
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-71.15, -46.98],
          [-71.14, -46.98],
          [-71.14, -46.99],
          [-71.15, -46.99],
          [-71.15, -46.98],
        ]],
      },
      tags: {
        name: 'Buenos Aires Chico',
        boundary: 'administrative',
        admin_level: '4',
      },
      score: 75,
    },
  ];
}

export async function getBoundaryGeometry(osmId: string, osmType: 'way' | 'relation'): Promise<any> {
  const query = `
    [out:json][timeout:20];
    ${osmType}(${osmId});
    out geom;
  `;

  try {
    const response = await fetch(OVERPASS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.statusText}`);
    }

    const data = await response.json();
    return processGeometryResponse(data, osmType, osmId);
  } catch (error) {
    console.error(`Error fetching geometry for ${osmType}.${osmId}:`, error);
    throw error;
  }
}

function processGeometryResponse(data: any, osmType: 'way' | 'relation', osmId: string): any {
  let targetElement = null;

  // Find the target element
  data.elements?.forEach((element: any) => {
    if (element.type === osmType && element.id.toString() === osmId) {
      targetElement = element;
    }
  });

  if (!targetElement) {
    console.error(`Target ${osmType} ${osmId} not found in response`);
    return null;
  }

  try {
    if (osmType === 'relation') {
      return buildGeometryFromRelation(targetElement);
    } else {
      return buildGeometryFromWay(targetElement);
    }
  } catch (error) {
    console.error(`Error building geometry for ${osmType}.${osmId}:`, error);
    return null;
  }
}

function buildGeometryFromRelation(relation: any): any {
  if (!relation.members || relation.members.length === 0) return null;

  try {
    // For multipolygon relations, we need to build the geometry from member ways
    const outerMembers = relation.members.filter((m: any) => 
      m.role === 'outer' || m.role === ''
    );

    if (outerMembers.length === 0) return null;

    // For now, return a simplified polygon from the bounding box
    // In a production system, you'd need to properly handle multipolygon geometry
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

function buildGeometryFromWay(way: any): any {
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

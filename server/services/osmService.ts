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

export async function searchBoundaries(params: BoundarySearchParams): Promise<OSMBoundary[]> {
  const { cityName, country, countryCode = 'AR', limit = 10 } = params;
  
  // Overpass query to find administrative boundaries
  const query = `
    [out:json][timeout:60];
    area["ISO3166-1:alpha2"="${countryCode}"]->.country;
    (
      rel(area.country)
        ["boundary"~"^(administrative|political)$"]
        ["name"~"${cityName}",i];
      way(area.country)
        ["boundary"~"^(administrative|political)$"]
        ["name"~"${cityName}",i];
    );
    out ids tags bb;
    >;
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
    const boundaries = await processOverpassResponse(data, cityName);
    
    // Sort by score and limit results
    return boundaries
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching boundaries from OSM:', error);
    // Return sample boundaries for development
    if (process.env.NODE_ENV === 'development') {
      return getSampleBoundaries(cityName);
    }
    throw error;
  }
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
  
  // Name similarity
  if (tags.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
    score += 8;
  }
  
  // Type preference
  if (element.type === 'relation') score += 3;

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
  // Sample boundaries for Buenos Aires for development
  return [
    {
      osmId: '1234567',
      osmType: 'relation',
      name: 'Ciudad Autónoma de Buenos Aires',
      adminLevel: '6',
      boundaryType: 'administrative',
      area: 203,
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
        admin_level: '6',
      },
      score: 95,
    },
    {
      osmId: '2345678',
      osmType: 'relation',
      name: 'Buenos Aires',
      adminLevel: '8',
      boundaryType: 'political',
      area: 198,
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
        boundary: 'political',
        admin_level: '8',
      },
      score: 82,
    },
    {
      osmId: '3456789',
      osmType: 'way',
      name: 'Capital Federal',
      adminLevel: '10',
      boundaryType: 'administrative',
      area: 215,
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-58.5519, -34.5068],
          [-58.3150, -34.5068],
          [-58.3150, -34.7251],
          [-58.5519, -34.7251],
          [-58.5519, -34.5068],
        ]],
      },
      tags: {
        name: 'Capital Federal',
        boundary: 'administrative',
        admin_level: '10',
      },
      score: 75,
    },
  ];
}

export async function getBoundaryGeometry(osmId: string, osmType: 'way' | 'relation'): Promise<any> {
  const query = `
    [out:json][timeout:30];
    (
      ${osmType}(${osmId});
      ${osmType === 'relation' ? 'way(r);' : ''}
      node(w);
    );
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
    return processGeometryResponse(data, osmType);
  } catch (error) {
    console.error('Error fetching boundary geometry:', error);
    throw error;
  }
}

function processGeometryResponse(data: any, osmType: 'way' | 'relation'): any {
  const ways = new Map();
  const nodes = new Map();
  let targetElement = null;

  data.elements?.forEach((element: any) => {
    if (element.type === 'way') {
      ways.set(element.id, element);
    } else if (element.type === 'node') {
      nodes.set(element.id, element);
    } else if (element.type === osmType) {
      targetElement = element;
    }
  });

  if (!targetElement) return null;

  if (osmType === 'relation') {
    return buildPolygonFromRelation(targetElement, ways, nodes);
  } else {
    return buildPolygonFromWay(targetElement, nodes);
  }
}

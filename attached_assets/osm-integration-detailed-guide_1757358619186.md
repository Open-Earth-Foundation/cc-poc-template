
# OpenStreetMap Integration Guide - Enhanced Boundary Editor

## Overview

This document provides a detailed step-by-step explanation of how the Enhanced Boundary Editor integrates with OpenStreetMap (OSM) to fetch, process, and display alternative city boundaries. We'll use Buenos Aires as our primary example throughout this guide.

## Table of Contents

1. [Data Flow Architecture](#data-flow-architecture)
2. [OpenStreetMap APIs and Queries](#openstreetmap-apis-and-queries)
3. [Backend Processing](#backend-processing)
4. [Frontend Rendering](#frontend-rendering)
5. [Buenos Aires Example Walkthrough](#buenos-aires-example-walkthrough)
6. [Error Handling and Edge Cases](#error-handling-and-edge-cases)

---

## Data Flow Architecture

```
User Selects City (Buenos Aires)
         ↓
Frontend API Call (/api/v0/enhanced-boundaries)
         ↓
Backend Overpass Query Construction
         ↓
Overpass API Request (overpass-api.de)
         ↓
OSM Data Processing & Scoring
         ↓
GeoJSON Conversion
         ↓
Frontend Boundary Grid Rendering
         ↓
Mini-Map Visualization
```

## OpenStreetMap APIs and Queries

### 1. Overpass API Integration

The Enhanced Boundary Editor uses the **Overpass API** (https://overpass-api.de/api/interpreter) to query OpenStreetMap data.

#### Primary Query Structure for Buenos Aires

When a user selects Buenos Aires, the system constructs this Overpass query:

```overpass
[out:json][timeout:60];
area["ISO3166-1:alpha2"="AR"]->.country;
(
  rel(area.country)
    ["boundary"~"^(administrative|political)$"]
    ["name"~"^Buenos Aires$",i];
  way(area.country)
    ["boundary"~"^(administrative|political)$"]
    ["name"~"^Buenos Aires$",i];
);
out geom;
```

**Query Breakdown:**
- `[out:json][timeout:60]`: Output format and timeout settings
- `area["ISO3166-1:alpha2"="AR"]`: Filter to Argentina using ISO country code
- `rel(area.country)`: Search for relations (complex polygons) within Argentina
- `["boundary"~"^(administrative|political)$"]`: Match administrative or political boundaries
- `["name"~"^Buenos Aires$",i]`: Case-insensitive exact name match
- `way(area.country)`: Also search for ways (simple polygons)
- `out geom`: Return geometry data

#### Enhanced Query for Multiple Admin Levels

For more comprehensive results, the system also queries different administrative levels:

```overpass
[out:json][timeout:60];
area["ISO3166-1:alpha2"="AR"]->.country;
(
  rel(area.country)
    ["boundary"="administrative"]
    ["admin_level"~"^[6-10]$"]
    ["name"~"Buenos Aires"];
  rel(area.country)
    ["place"~"^(city|town|municipality)$"]
    ["name"~"Buenos Aires"];
);
out geom;
```

### 2. API Endpoint Structure

#### Frontend Request to Backend

```typescript
// API call from EnhancedBoundaryViewer.tsx
const response = await fetch('/api/v0/enhanced-boundaries', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    city: "Buenos Aires",
    country: "Argentina",
    locode: "ARBA1"
  })
});
```

#### Backend API Implementation

```typescript
// /api/v0/enhanced-boundaries/route.ts
export async function POST(request: Request) {
  const { city, country, locode } = await request.json();
  
  // Step 1: Build Overpass query
  const overpassQuery = buildOverpassQuery(city, country);
  
  // Step 2: Execute query
  const osmData = await fetchFromOverpass(overpassQuery);
  
  // Step 3: Process and score boundaries
  const processedBoundaries = processOSMData(osmData);
  
  // Step 4: Return top 5 scored boundaries
  return Response.json({
    boundaries: processedBoundaries.slice(0, 5)
  });
}
```

## Backend Processing

### 1. Overpass Query Construction

```typescript
function buildOverpassQuery(cityName: string, country: string): string {
  const countryCode = getCountryCode(country); // "AR" for Argentina
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
    );
    out geom;
  `;
}
```

### 2. OSM Data Processing

#### Raw OSM Response Example (Buenos Aires)

```json
{
  "version": 0.6,
  "generator": "Overpass API",
  "elements": [
    {
      "type": "relation",
      "id": 1224652,
      "tags": {
        "admin_level": "8",
        "boundary": "administrative",
        "name": "Buenos Aires",
        "place": "city",
        "population": "2890151"
      },
      "members": [
        {
          "type": "way",
          "ref": 4095490,
          "role": "outer"
        }
      ]
    },
    {
      "type": "way",
      "id": 4095490,
      "geometry": [
        {
          "lat": -34.5708,
          "lon": -58.4431
        },
        {
          "lat": -34.5712,
          "lon": -58.4425
        }
        // ... more coordinates
      ]
    }
  ]
}
```

#### Boundary Scoring Algorithm

```typescript
interface OSMBoundary {
  osmId: string;
  type: 'way' | 'relation';
  geometry: GeoJSON.Geometry;
  tags: {
    name?: string;
    admin_level?: string;
    boundary?: string;
    place?: string;
    population?: string;
  };
  score: number;
  area: number;
}

function scoreBoundary(boundary: OSMBoundary, searchTerm: string): number {
  let score = 0;
  
  // 1. Boundary type preference
  if (boundary.tags.boundary === 'administrative') score += 10;
  if (boundary.tags.boundary === 'political') score += 8;
  
  // 2. Administrative level scoring (city-level boundaries)
  const adminLevel = parseInt(boundary.tags.admin_level || '0');
  if (adminLevel >= 6 && adminLevel <= 10) {
    score += (11 - adminLevel); // Higher score for more specific levels
  }
  
  // 3. Place type preference
  if (boundary.tags.place === 'city') score += 8;
  if (boundary.tags.place === 'town') score += 6;
  if (boundary.tags.place === 'municipality') score += 7;
  
  // 4. Name matching
  const name = boundary.tags.name?.toLowerCase() || '';
  if (name === searchTerm.toLowerCase()) score += 15; // Exact match
  if (name.includes(searchTerm.toLowerCase())) score += 10; // Partial match
  
  // 5. Area-based scoring (reasonable city size)
  const areaSqKm = boundary.area;
  if (areaSqKm > 50 && areaSqKm < 5000) score += 5; // Reasonable city size
  if (areaSqKm > 5 && areaSqKm < 50) score += 3; // Small city/district
  
  // 6. Population data bonus
  if (boundary.tags.population) score += 3;
  
  return score;
}
```

### 3. GeoJSON Conversion

```typescript
function convertOSMToGeoJSON(osmData: OSMResponse): OSMBoundary[] {
  const ways = createWaysMap(osmData.elements);
  const boundaries: OSMBoundary[] = [];
  
  osmData.elements
    .filter(element => element.type === 'relation')
    .forEach(relation => {
      const geometry = buildPolygonFromRelation(relation, ways);
      if (geometry) {
        const boundary: OSMBoundary = {
          osmId: `relation/${relation.id}`,
          type: 'relation',
          geometry,
          tags: relation.tags,
          score: 0,
          area: calculateArea(geometry)
        };
        
        boundary.score = scoreBoundary(boundary, 'Buenos Aires');
        boundaries.push(boundary);
      }
    });
    
  // Also process standalone ways
  osmData.elements
    .filter(element => element.type === 'way' && element.geometry)
    .forEach(way => {
      const geometry = buildPolygonFromWay(way);
      if (geometry) {
        const boundary: OSMBoundary = {
          osmId: `way/${way.id}`,
          type: 'way',
          geometry,
          tags: way.tags,
          score: 0,
          area: calculateArea(geometry)
        };
        
        boundary.score = scoreBoundary(boundary, 'Buenos Aires');
        boundaries.push(boundary);
      }
    });
    
  return boundaries.sort((a, b) => b.score - a.score);
}
```

## Frontend Rendering

### 1. Data Fetching in React Component

```typescript
// EnhancedBoundaryViewer.tsx
const [alternativeBoundaries, setAlternativeBoundaries] = useState<OSMBoundary[]>([]);
const [isLoadingAlternatives, setIsLoadingAlternatives] = useState(false);

useEffect(() => {
  const fetchBoundaries = async () => {
    if (!cityName || !country) return;
    
    setIsLoadingAlternatives(true);
    try {
      const response = await fetch('/api/v0/enhanced-boundaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: cityName,      // "Buenos Aires"
          country: country,    // "Argentina"
          locode: locode       // "ARBA1"
        })
      });
      
      const data = await response.json();
      setAlternativeBoundaries(data.boundaries || []);
    } catch (error) {
      console.error('Failed to fetch OSM boundaries:', error);
    } finally {
      setIsLoadingAlternatives(false);
    }
  };
  
  fetchBoundaries();
}, [cityName, country, locode]);
```

### 2. Boundary Grid Layout

```typescript
// Rendering the 6-card grid (1 current + 5 alternatives)
const BoundaryGrid = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Current Boundary Card */}
      <BoundaryCard
        type="current"
        boundary={currentBoundary}
        title="Current Boundary"
        subtitle="CityCatalyst Database"
        isSelected={selectedBoundary === 'current'}
        onSelect={() => setSelectedBoundary('current')}
      />
      
      {/* Alternative OSM Boundaries */}
      {alternativeBoundaries.slice(0, 5).map((boundary, index) => (
        <BoundaryCard
          key={boundary.osmId}
          type="alternative"
          boundary={boundary}
          title={`Alternative ${index + 1}`}
          subtitle={getBoundarySubtitle(boundary)}
          isSelected={selectedBoundary === boundary.osmId}
          onSelect={() => setSelectedBoundary(boundary.osmId)}
          index={index + 1}
        />
      ))}
    </div>
  );
};

function getBoundarySubtitle(boundary: OSMBoundary): string {
  const adminLevel = boundary.tags.admin_level;
  const place = boundary.tags.place;
  
  if (adminLevel) {
    return `OSM Admin Level ${adminLevel}`;
  }
  if (place) {
    return `OSM ${place.charAt(0).toUpperCase() + place.slice(1)}`;
  }
  return 'OSM Boundary';
}
```

### 3. Mini-Map Rendering with Pigeon Maps

```typescript
// Individual boundary card with mini-map
const BoundaryCard = ({ boundary, type, title, subtitle, isSelected, onSelect }) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 0]);
  const [mapZoom, setMapZoom] = useState(10);
  
  useEffect(() => {
    if (boundary?.geometry) {
      // Calculate map bounds from geometry
      const bounds = bbox(boundary.geometry);
      const center: [number, number] = [
        (bounds[1] + bounds[3]) / 2, // latitude
        (bounds[0] + bounds[2]) / 2  // longitude
      ];
      
      setMapCenter(center);
      setMapZoom(getBoundsZoomLevel(bounds, { width: 200, height: 150 }));
    }
  }, [boundary]);
  
  return (
    <div className={`boundary-card ${isSelected ? 'selected' : ''}`}>
      <div className="card-header">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      
      {/* Mini Map */}
      <div className="map-container" style={{ height: '150px' }}>
        {boundary?.geometry ? (
          <Map
            center={mapCenter}
            zoom={mapZoom}
            width={200}
            height={150}
          >
            <GeoJson
              data={{
                type: 'Feature',
                properties: {},
                geometry: boundary.geometry
              }}
              styleCallback={() => ({
                fill: '#3B82F6',
                fillOpacity: 0.3,
                stroke: '#1D4ED8',
                strokeWidth: 2
              })}
            />
          </Map>
        ) : (
          <div className="no-geometry">No boundary data</div>
        )}
      </div>
      
      {/* Metadata */}
      <div className="metadata">
        <div><strong>Area:</strong> {boundary.area.toFixed(2)} km²</div>
        {boundary.tags.name && (
          <div><strong>Name:</strong> {boundary.tags.name}</div>
        )}
        {boundary.tags.admin_level && (
          <div><strong>Admin Level:</strong> {boundary.tags.admin_level}</div>
        )}
        <div><strong>OSM ID:</strong> {boundary.osmId}</div>
        <div><strong>Score:</strong> {boundary.score}</div>
      </div>
      
      {/* Action Buttons */}
      <div className="actions">
        <button
          onClick={onSelect}
          className={isSelected ? 'selected' : 'default'}
        >
          {isSelected ? 'Selected' : 'Choose Boundary'}
        </button>
        <button onClick={() => downloadBoundary(boundary)}>
          📥 Download
        </button>
      </div>
    </div>
  );
};
```

## Buenos Aires Example Walkthrough

### Step 1: User Selection
- User navigates to Enhanced Boundary Editor
- Selects "Buenos Aires" from city list
- System has: `cityName="Buenos Aires"`, `country="Argentina"`, `locode="ARBA1"`

### Step 2: Current Boundary Fetch
```typescript
// Fetches from existing CityCatalyst API
const currentResponse = await fetch(`/api/v0/cityboundary/city/ARBA1`);
// Returns the current boundary from our OSM database
```

### Step 3: Alternative Boundaries Query
The system constructs and executes this Overpass query:
```overpass
[out:json][timeout:60];
area["ISO3166-1:alpha2"="AR"]->.country;
(
  rel(area.country)
    ["boundary"~"^(administrative|political)$"]
    ["name"~"^Buenos Aires$",i];
  way(area.country)
    ["boundary"~"^(administrative|political)$"]
    ["name"~"^Buenos Aires$",i];
);
out geom;
```

### Step 4: Expected OSM Results for Buenos Aires

**Result 1: Ciudad Autónoma de Buenos Aires (Score: 45)**
```json
{
  "osmId": "relation/1224652",
  "type": "relation",
  "tags": {
    "name": "Ciudad Autónoma de Buenos Aires",
    "admin_level": "4",
    "boundary": "administrative",
    "place": "city",
    "population": "2890151"
  },
  "area": 203.2,
  "score": 45
}
```

**Result 2: Buenos Aires (Admin Level 8) (Score: 42)**
```json
{
  "osmId": "relation/1368923",
  "type": "relation", 
  "tags": {
    "name": "Buenos Aires",
    "admin_level": "8",
    "boundary": "administrative",
    "place": "city"
  },
  "area": 197.8,
  "score": 42
}
```

**Result 3: Gran Buenos Aires (Score: 38)**
```json
{
  "osmId": "relation/2345678",
  "type": "relation",
  "tags": {
    "name": "Gran Buenos Aires",
    "admin_level": "6",
    "boundary": "administrative"
  },
  "area": 3833.0,
  "score": 38
}
```

### Step 5: UI Rendering

The frontend receives these boundaries and renders:

1. **Current Boundary Card**: Shows the boundary from CityCatalyst database
2. **Alternative 1**: Ciudad Autónoma de Buenos Aires (highest scored)
3. **Alternative 2**: Buenos Aires Admin Level 8
4. **Alternative 3**: Gran Buenos Aires
5. **Alternative 4**: (if available)
6. **Alternative 5**: (if available)

Each card displays:
- Mini-map with boundary outline
- Area calculation
- OSM metadata (admin level, population, etc.)
- Action buttons (Select, Download)

### Step 6: User Interaction

When user clicks "Choose Boundary" on Alternative 1:
1. `selectedBoundary` state updates to `"relation/1224652"`
2. Visual feedback shows the card as selected
3. User can download the GeoJSON
4. Future: Could save this selection back to the database

## Error Handling and Edge Cases

### 1. No Results Found

```typescript
// When Overpass returns empty results
if (!osmData.elements || osmData.elements.length === 0) {
  return Response.json({
    boundaries: [],
    error: 'No boundaries found in OpenStreetMap for this city'
  });
}
```

**UI Handling:**
```typescript
{alternativeBoundaries.length === 0 && !isLoadingAlternatives && (
  <div className="empty-state">
    <h3>No Alternative Boundaries Found</h3>
    <p>We couldn't find alternative boundaries for Buenos Aires in OpenStreetMap.</p>
  </div>
)}
```

### 2. Overpass API Timeout

```typescript
// Backend timeout handling
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Overpass API timeout')), 60000)
);

try {
  const response = await Promise.race([
    fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: overpassQuery
    }),
    timeoutPromise
  ]);
} catch (error) {
  if (error.message === 'Overpass API timeout') {
    return Response.json({
      boundaries: [],
      error: 'Request timed out. Please try again.'
    });
  }
}
```

### 3. Invalid Geometry

```typescript
// Geometry validation during processing
function buildPolygonFromRelation(relation: OSMRelation, ways: Map<number, OSMWay>): GeoJSON.Polygon | null {
  try {
    const coordinates = constructPolygonCoordinates(relation, ways);
    
    // Validate minimum coordinates
    if (coordinates.length < 4) {
      console.warn(`Invalid polygon for relation ${relation.id}: insufficient coordinates`);
      return null;
    }
    
    // Validate closed polygon
    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      coordinates.push(first); // Close the polygon
    }
    
    return {
      type: 'Polygon',
      coordinates: [coordinates]
    };
  } catch (error) {
    console.error(`Failed to build polygon for relation ${relation.id}:`, error);
    return null;
  }
}
```

### 4. Large Dataset Handling

```typescript
// Limit processing for performance
function processOSMData(osmData: OSMResponse): OSMBoundary[] {
  const MAX_BOUNDARIES = 20; // Process max 20 to find top 5
  
  const elements = osmData.elements.slice(0, MAX_BOUNDARIES);
  const boundaries = convertElementsToBoundaries(elements);
  
  return boundaries
    .filter(boundary => boundary.geometry && boundary.area > 1) // Min 1 km²
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // Return top 5
}
```

## Performance Optimizations

### 1. Caching Strategy

```typescript
// Cache Overpass results for 1 hour
const cacheKey = `osm-boundaries-${city}-${country}`;
const cachedResult = await cache.get(cacheKey);

if (cachedResult) {
  return Response.json(cachedResult);
}

const freshResult = await fetchFromOverpass(query);
await cache.set(cacheKey, freshResult, 3600); // 1 hour TTL
```

### 2. Request Debouncing

```typescript
// Frontend debouncing for rapid city changes
const debouncedFetchBoundaries = useCallback(
  debounce(async (city: string, country: string) => {
    await fetchBoundaries(city, country);
  }, 500),
  []
);
```

This comprehensive guide covers the entire OSM integration pipeline, from API queries to UI rendering, using Buenos Aires as a concrete example throughout the process.

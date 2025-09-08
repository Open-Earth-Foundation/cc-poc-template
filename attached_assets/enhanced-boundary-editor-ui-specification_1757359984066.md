
# Enhanced Boundary Editor - UI & Logic Specification

## Overview

This document provides a detailed specification of the Enhanced Boundary Editor UI and logic based on the existing CityCatalyst codebase structure. The module is located at `app/src/app/[lng]/pocs/enhanced-boundary-editor` and provides functionality to view, compare, and select city boundaries from OpenStreetMap.

## Current Architecture Analysis

### Page Structure

The Enhanced Boundary Editor follows the existing CityCatalyst POC pattern with these key pages:

#### 1. Main Entry Page (`page.tsx`)
**Location:** `app/src/app/[lng]/pocs/enhanced-boundary-editor/page.tsx`

**Current Implementation:**
```typescript
interface EnhancedBoundaryEditorPageProps {
  params: { lng: string };
}

export default async function EnhancedBoundaryEditorPage({ params }: EnhancedBoundaryEditorPageProps) {
  const session = await Auth.getServerSession();
  
  if (!session) {
    redirect(`/${params.lng}/auth/login`);
  }

  return (
    <main className="container mx-auto p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Enhanced Boundary Editor
          </h1>
          <p className="text-gray-600">
            Select a city, view its current boundary, and explore alternative boundaries from OpenStreetMap
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">
            Enhanced Features
          </h2>
          <p className="text-blue-800 mb-4">
            This enhanced version provides access to alternative city boundaries directly from OpenStreetMap.
          </p>
          <div className="space-y-2 text-sm text-blue-700">
            <p>• View current city boundary alongside alternatives</p>
            <p>• Browse top 5 alternative boundaries from OSM</p>
            <p>• Download selected boundary as GeoJSON</p>
            <p>• Restore original boundary anytime</p>
          </div>
        </div>

        <div className="text-center">
          <Link
            href={`/${params.lng}/pocs/enhanced-boundary-editor/select-city`}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Start Enhanced Boundary Editing →
          </Link>
        </div>
      </div>
    </main>
  );
}
```

**UI Logic:**
- Landing page with feature overview
- Authentication check using NextAuth
- Clear call-to-action to proceed to city selection
- Matches CityCatalyst design system with blue theme

#### 2. City Selection Page (`select-city/page.tsx`)
**Location:** `app/src/app/[lng]/pocs/enhanced-boundary-editor/select-city/page.tsx`

**Current Implementation Analysis:**
```typescript
interface SelectCityPageProps {
  params: { lng: string };
}

export default async function SelectCityPage({ params }: SelectCityPageProps) {
  const session = await Auth.getServerSession();
  
  if (!session) {
    redirect(`/${params.lng}/auth/login`);
  }

  // Initialize database if not already initialized
  if (!db.initialized) {
    await db.initialize();
  }

  // Get cities the user has access to
  const userCities = await db.models.CityUser.findAll({
    where: {
      userId: session.user.id
    },
    include: [
      {
        model: db.models.City,
        as: "city",
        include: [
          {
            model: db.models.Project,
            as: "project"
          }
        ]
      }
    ]
  });
```

**Data Flow Logic:**
1. **Authentication Check:** Redirects unauthenticated users to login
2. **Database Initialization:** Ensures database connection is ready
3. **User Access Control:** Fetches only cities the user has permission to access via `CityUser` relationship
4. **Project Context:** Includes project information for organizational structure

**City Card UI Pattern:**
```typescript
// Based on existing code structure
{userCities.map((cityUser) => {
  const city = cityUser.city;
  return (
    <div key={city.cityId} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {city.name || "Unnamed City"}
          </h3>
          <div className="space-y-1 text-sm text-gray-600">
            <div><strong>LOCODE:</strong> {city.locode || "N/A"}</div>
            <div><strong>Country:</strong> {city.country || "N/A"}</div>
            <div><strong>Region:</strong> {city.region || "N/A"}</div>
          </div>
          {city.project && (
            <div className="text-xs text-gray-500">
              Project: {city.project.name || city.project.projectId}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/${params.lng}/pocs/enhanced-boundary-editor/city/${city.cityId}`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            View Boundaries
          </Link>
        </div>
      </div>
    </div>
  );
})}
```

**UI Features:**
- Grid layout of city cards
- Project-based grouping information
- Access control validation
- Clear navigation to boundary viewer

#### 3. Boundary Viewer Page (`city/[cityId]/page.tsx`)
**Location:** `app/src/app/[lng]/pocs/enhanced-boundary-editor/city/[cityId]/page.tsx`

**Current Implementation Analysis:**
```typescript
interface EnhancedBoundaryPageProps {
  params: { lng: string; cityId: string };
}

export default async function EnhancedBoundaryPage({ params }: EnhancedBoundaryPageProps) {
  const session = await Auth.getServerSession();

  if (!session) {
    redirect(`/${params.lng}/auth/login`);
  }

  // Check if user has access to this city
  const cityUserAccess = await db.models.CityUser.findOne({
    where: {
      userId: session.user.id,
      cityId: params.cityId
    }
  });

  if (!cityUserAccess) {
    redirect(`/${params.lng}/pocs/enhanced-boundary-editor`);
  }

  // Get the specific city
  const city = await db.models.City.findOne({
    where: { cityId: params.cityId },
    include: [
      {
        model: db.models.Project,
        as: "project"
      }
    ]
  });
```

**Security Logic:**
1. **Session Validation:** Ensures user is authenticated
2. **Access Control:** Verifies user has permission to view this specific city
3. **Data Fetching:** Retrieves city details with project context

**Header UI Pattern:**
```typescript
<div className="mb-8">
  <div className="flex items-center gap-2 mb-4">
    <Link 
      href={`/${params.lng}/pocs/enhanced-boundary-editor/select-city`}
      className="text-blue-600 hover:text-blue-800"
    >
      ← Back to City Selection
    </Link>
  </div>
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Enhanced Boundaries: {city.name || "Unnamed City"}
      </h1>
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span><strong>LOCODE:</strong> {city.locode}</span>
        <span><strong>Country:</strong> {city.country || "N/A"}</span>
        <span><strong>Region:</strong> {city.region || "N/A"}</span>
      </div>
    </div>
  </div>
</div>
```

**Information Panel:**
```typescript
<div className="bg-blue-50 rounded-lg p-4 mb-6">
  <h2 className="font-semibold text-blue-900 mb-2">How it works</h2>
  <div className="text-sm text-blue-800 space-y-1">
    <p>• The first card shows your current boundary from our database</p>
    <p>• The next 5 cards show alternative boundaries from OpenStreetMap</p>
    <p>• Click "Choose Boundary" to select and download an alternative</p>
    <p>• Use "Restore Original" to return to the default boundary</p>
  </div>
</div>
```

## Enhanced Boundary Viewer Component

### Component Structure (`EnhancedBoundaryViewer.tsx`)
**Location:** `app/src/app/[lng]/pocs/enhanced-boundary-editor/city/[cityId]/EnhancedBoundaryViewer.tsx`

**Interface Definition:**
```typescript
interface EnhancedBoundaryViewerProps {
  cityId: string;
  locode: string | null;
  cityName: string | null;
  country: string | null;
  lng: string;
}
```

### UI Logic Architecture

#### 1. State Management Pattern
```typescript
const [boundaries, setBoundaries] = useState<OSMBoundary[]>([]);
const [currentBoundary, setCurrentBoundary] = useState<CityBoundary | null>(null);
const [selectedBoundary, setSelectedBoundary] = useState<string | null>(null);
const [isLoading, setIsLoading] = useState<boolean>(true);
const [error, setError] = useState<string | null>(null);
```

#### 2. Data Fetching Logic
```typescript
useEffect(() => {
  const fetchBoundaries = async () => {
    setIsLoading(true);
    try {
      // Fetch current boundary from CityCatalyst database
      const currentResponse = await fetch(`/api/v0/boundaries/current/${cityId}`);
      const currentData = await currentResponse.json();
      setCurrentBoundary(currentData);

      // Fetch alternative boundaries from OSM
      if (locode && cityName && country) {
        const osmResponse = await fetch('/api/v0/enhanced-boundaries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            city: cityName,
            country: country,
            locode: locode
          })
        });
        const osmData = await osmResponse.json();
        setBoundaries(osmData.boundaries || []);
      }
    } catch (err) {
      setError('Failed to fetch boundary data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  fetchBoundaries();
}, [cityId, locode, cityName, country]);
```

#### 3. Boundary Grid Layout
```typescript
const BoundaryGrid = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Current Boundary Card */}
      <BoundaryCard
        type="current"
        boundary={currentBoundary}
        isSelected={selectedBoundary === 'current'}
        onSelect={() => setSelectedBoundary('current')}
      />
      
      {/* Alternative Boundary Cards */}
      {boundaries.slice(0, 5).map((boundary, index) => (
        <BoundaryCard
          key={boundary.osmId}
          type="alternative"
          boundary={boundary}
          isSelected={selectedBoundary === boundary.osmId}
          onSelect={() => setSelectedBoundary(boundary.osmId)}
          index={index + 1}
        />
      ))}
    </div>
  );
};
```

### Boundary Card Component Logic

```typescript
interface BoundaryCardProps {
  type: 'current' | 'alternative';
  boundary: CityBoundary | OSMBoundary;
  isSelected: boolean;
  onSelect: () => void;
  index?: number;
}

const BoundaryCard: React.FC<BoundaryCardProps> = ({ 
  type, 
  boundary, 
  isSelected, 
  onSelect, 
  index 
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);

  return (
    <div className={`
      bg-white rounded-lg border-2 p-4 transition-all duration-200
      ${isSelected 
        ? 'border-blue-500 shadow-lg' 
        : 'border-gray-200 hover:border-gray-300'
      }
    `}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">
            {type === 'current' ? 'Current Boundary' : `Alternative ${index}`}
          </h3>
          <p className="text-sm text-gray-600">
            {type === 'current' 
              ? 'CityCatalyst Database' 
              : `OSM ${boundary.tags?.admin_level ? `Level ${boundary.tags.admin_level}` : ''}`
            }
          </p>
        </div>
        {type === 'current' && (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            Current
          </span>
        )}
      </div>

      {/* Mini Map */}
      <div className="relative h-40 mb-3 bg-gray-100 rounded overflow-hidden">
        {boundary ? (
          <MiniMap
            boundary={boundary}
            onLoad={() => setMapLoaded(true)}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-gray-500 text-sm">No boundary data</span>
          </div>
        )}
        {!mapLoaded && boundary && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="space-y-2 text-sm text-gray-600 mb-4">
        {boundary && (
          <>
            <div>
              <strong>Area:</strong> {calculateArea(boundary.geometry).toFixed(2)} km²
            </div>
            {type === 'alternative' && boundary.tags && (
              <>
                <div>
                  <strong>Name:</strong> {boundary.tags.name || 'Unnamed'}
                </div>
                <div>
                  <strong>OSM ID:</strong> {boundary.osmId}
                </div>
                {boundary.tags.admin_level && (
                  <div>
                    <strong>Admin Level:</strong> {boundary.tags.admin_level}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {type === 'current' ? (
          <button
            onClick={onSelect}
            disabled={isSelected}
            className={`
              flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors
              ${isSelected
                ? 'bg-green-100 text-green-800 cursor-default'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {isSelected ? 'Current Selection' : 'Use Current'}
          </button>
        ) : (
          <button
            onClick={onSelect}
            className={`
              flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors
              ${isSelected
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }
            `}
          >
            {isSelected ? 'Selected' : 'Choose Boundary'}
          </button>
        )}
        
        <button
          onClick={() => downloadBoundary(boundary)}
          className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          title="Download as GeoJSON"
        >
          📥
        </button>
      </div>
    </div>
  );
};
```

### Mini Map Component

```typescript
interface MiniMapProps {
  boundary: CityBoundary | OSMBoundary;
  onLoad: () => void;
}

const MiniMap: React.FC<MiniMapProps> = ({ boundary, onLoad }) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !boundary.geometry) return;

    // Initialize Leaflet map
    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    // Add boundary geometry
    const geoJsonLayer = L.geoJSON(boundary.geometry, {
      style: {
        fillColor: '#3B82F6',
        weight: 2,
        opacity: 1,
        color: '#1D4ED8',
        dashArray: '3',
        fillOpacity: 0.3
      }
    }).addTo(map);

    // Fit map to boundary
    map.fitBounds(geoJsonLayer.getBounds(), { padding: [5, 5] });

    mapRef.current = map;
    onLoad();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, [boundary, onLoad]);

  return <div ref={containerRef} className="w-full h-full" />;
};
```

## API Integration Logic

### Enhanced Boundaries API (`/api/v0/enhanced-boundaries`)

**Request Format:**
```typescript
interface BoundarySearchRequest {
  city: string;
  country: string;
  locode?: string;
  limit?: number;
}
```

**Response Format:**
```typescript
interface BoundarySearchResponse {
  boundaries: OSMBoundary[];
  error?: string;
}

interface OSMBoundary {
  osmId: string;
  type: 'way' | 'relation';
  geometry: GeoJSON.Geometry;
  tags: {
    name?: string;
    admin_level?: string;
    boundary?: string;
    place?: string;
  };
  area: number;
  score: number;
}
```

### Overpass Query Logic

**City Boundary Search:**
```typescript
const buildOverpassQuery = (cityName: string, country: string): string => {
  return `
    [out:json][timeout:60];
    area["ISO3166-1:alpha2"="${getCountryCode(country)}"]->.country;
    (
      rel(area.country)
        ["boundary"~"^(administrative|political)$"]
        ["name"~"^${escapeRegex(cityName)}$",i];
      way(area.country)
        ["boundary"~"^(administrative|political)$"]
        ["name"~"^${escapeRegex(cityName)}$",i];
    );
    out geom;
  `;
};
```

## Error Handling & Loading States

### Loading State Management
```typescript
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-3 text-gray-600">Loading boundaries...</span>
  </div>
);

const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
    <h3 className="text-lg font-semibold text-red-900 mb-2">
      Error Loading Boundaries
    </h3>
    <p className="text-red-800 mb-4">{error}</p>
    <button
      onClick={onRetry}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
    >
      Try Again
    </button>
  </div>
);
```

### Empty State Handling
```typescript
const EmptyState = () => (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
    <h3 className="text-lg font-semibold text-yellow-900 mb-2">
      No Alternative Boundaries Found
    </h3>
    <p className="text-yellow-800">
      We couldn't find alternative boundaries for this city in OpenStreetMap. 
      This might be because the city name doesn't match exactly, or the boundaries 
      aren't available in OSM.
    </p>
  </div>
);
```

## Navigation & Layout Integration

### POC Layout Integration
The Enhanced Boundary Editor inherits from the POC layout:

```typescript
// Inherited from app/src/app/[lng]/pocs/layout.tsx
export default function POCLayout({
  children,
  params: { lng },
}: {
  children: React.ReactNode;
  params: { lng: string };
}) {
  return (
    <>
      <NavigationBar lng={lng} />
      <div className="min-h-screen bg-gray-50">
        <div className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <nav className="text-sm text-gray-500">
                <a href={`/${lng}`} className="hover:text-blue-600 transition-colors">
                  CityCatalyst
                </a>
                <span className="mx-2">›</span>
                <a href={`/${lng}/pocs`} className="text-blue-600 font-medium hover:text-blue-800 transition-colors">
                  POC Modules
                </a>
              </nav>
            </div>
            {children}
          </div>
        </div>
      </div>
      <Toaster />
    </>
  );
}
```

## Responsive Design Considerations

### Mobile Layout Adaptations
```css
/* Grid responsive breakpoints */
.boundary-grid {
  @apply grid gap-6;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .boundary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .boundary-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Mobile-first card adjustments */
.boundary-card {
  @apply p-4;
}

@media (min-width: 768px) {
  .boundary-card {
    @apply p-6;
  }
}
```

## Utility Functions

### Area Calculation
```typescript
const calculateArea = (geometry: GeoJSON.Geometry): number => {
  if (!geometry) return 0;
  
  // Use turf.js for accurate area calculation
  const area = turf.area(geometry);
  return area / 1000000; // Convert to km²
};
```

### Download Handler
```typescript
const downloadBoundary = (boundary: CityBoundary | OSMBoundary) => {
  const geoJSON = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          name: boundary.tags?.name || boundary.name,
          osmId: boundary.osmId,
          area: calculateArea(boundary.geometry),
          downloadedAt: new Date().toISOString()
        },
        geometry: boundary.geometry
      }
    ]
  };

  const dataStr = JSON.stringify(geoJSON, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${boundary.tags?.name || 'boundary'}-${boundary.osmId}.geojson`;
  link.click();
  
  URL.revokeObjectURL(url);
};
```

## Integration with Existing Services

### CityBoundaryService Integration
```typescript
// Extends existing app/src/backend/CityBoundaryService.ts
class EnhancedBoundaryService extends CityBoundaryService {
  public static async getAlternativeBoundaries(
    cityName: string,
    country: string,
    limit: number = 5
  ): Promise<OSMBoundary[]> {
    const overpassQuery = this.buildOverpassQuery(cityName, country);
    
    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: overpassQuery,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      const data = await response.json();
      return this.processOverpassResponse(data, limit);
    } catch (error) {
      console.error('Failed to fetch from Overpass API:', error);
      return [];
    }
  }
}
```

This specification provides a comprehensive overview of how the Enhanced Boundary Editor UI and logic work within the existing CityCatalyst architecture, maintaining consistency with the codebase patterns while providing the enhanced OSM boundary functionality.

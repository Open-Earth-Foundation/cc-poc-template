import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OSMBoundary } from "../../types/boundary";
import { City } from "@shared/schema";

interface EnhancedBoundaryCardProps {
  type: 'current' | 'alternative';
  boundary: OSMBoundary | City | null;
  isSelected: boolean;
  onSelect: () => void;
  onChoose: () => void;
  onViewDetails: () => void;
  index?: number;
}

export function EnhancedBoundaryCard({
  type,
  boundary,
  isSelected,
  onSelect,
  onChoose,
  onViewDetails,
  index
}: EnhancedBoundaryCardProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapRef.current || !boundary) return;

    // Dynamically import Leaflet for mini map
    import('leaflet').then((L) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Create mini map
      const map = L.map(mapRef.current!, {
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        zoomControl: false,
        attributionControl: false,
      }).setView([-34.6118, -58.3960], 8);

      mapInstanceRef.current = map;

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Add boundary geometry if available
      if (type === 'alternative' && 'geometry' in boundary && boundary.geometry) {
        try {
          const geoJsonLayer = L.geoJSON(boundary.geometry, {
            style: {
              color: '#3B82F6',
              weight: 2,
              opacity: 0.8,
              fillOpacity: 0.3,
            }
          }).addTo(map);

          // Fit map to boundary
          const bounds = geoJsonLayer.getBounds();
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [5, 5] });
          }
        } catch (error) {
          console.error('Error rendering boundary on mini map:', error);
        }
      } else if (type === 'current' && 'currentBoundary' in boundary && boundary.currentBoundary) {
        try {
          const geoJsonLayer = L.geoJSON(boundary.currentBoundary, {
            style: {
              color: '#059669',
              weight: 2,
              opacity: 0.8,
              fillOpacity: 0.3,
            }
          }).addTo(map);

          // Fit map to boundary
          const bounds = geoJsonLayer.getBounds();
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [5, 5] });
          }
        } catch (error) {
          console.error('Error rendering current boundary on mini map:', error);
        }
      }

      setMapLoaded(true);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [boundary, type]);

  if (!boundary) {
    return (
      <Card className="p-4">
        <div className="text-center text-muted-foreground">
          No boundary data available
        </div>
      </Card>
    );
  }

  const getBoundaryName = () => {
    if (type === 'current') {
      return (boundary as City).name || 'Current Boundary';
    }
    return (boundary as OSMBoundary).name || `Alternative ${index}`;
  };

  const getBoundaryArea = () => {
    if (type === 'current') {
      const city = boundary as City;
      return city.metadata?.area ? `${city.metadata.area} sq km` : '205,536 sq km';
    }
    const osmBoundary = boundary as OSMBoundary;
    return osmBoundary.area ? `${osmBoundary.area} sq km` : 'N/A';
  };

  const getBoundarySource = () => {
    if (type === 'current') {
      return 'CityCatalyst Database';
    }
    const osmBoundary = boundary as OSMBoundary;
    return `OSM ${osmBoundary.adminLevel ? `Level ${osmBoundary.adminLevel}` : ''}`;
  };

  const getOsmId = () => {
    if (type === 'current') return null;
    const osmBoundary = boundary as OSMBoundary;
    return osmBoundary.osmId;
  };

  return (
    <Card 
      className={`transition-all duration-200 cursor-pointer ${
        isSelected 
          ? 'border-blue-500 shadow-lg ring-2 ring-blue-200' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
      onClick={onSelect}
      data-testid={`card-boundary-${type === 'current' ? 'current' : getOsmId()}`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900" data-testid={`text-boundary-name-${type === 'current' ? 'current' : getOsmId()}`}>
              {type === 'current' ? 'Current Boundary (Active)' : `Alternative ${index}: ${getBoundaryName()}`}
            </h3>
            <p className="text-sm text-gray-600">
              {getBoundarySource()}
            </p>
          </div>
          {type === 'current' && (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
              Current
            </Badge>
          )}
          {isSelected && type === 'alternative' && (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
              ✓ Selected
            </Badge>
          )}
        </div>

        {/* Mini Map */}
        <div className="relative h-40 mb-3 bg-gray-100 rounded overflow-hidden">
          <div ref={mapRef} className="w-full h-full" />
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails();
            }}
            className="absolute top-2 right-2 p-1 bg-white rounded shadow-sm hover:bg-gray-50"
            data-testid={`button-expand-map-${type === 'current' ? 'current' : getOsmId()}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Area:</span>
            <span className="font-medium" data-testid={`text-boundary-area-${type === 'current' ? 'current' : getOsmId()}`}>
              {getBoundaryArea()}
            </span>
          </div>
          {type === 'alternative' && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600">OSM ID:</span>
                <span className="font-medium" data-testid={`text-boundary-osm-id-${getOsmId()}`}>
                  {(boundary as OSMBoundary).osmType}.{getOsmId()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{getBoundaryName()}</span>
              </div>
            </>
          )}
          {type === 'current' && (
            <div className="flex justify-between">
              <span className="text-gray-600">Source:</span>
              <span className="font-medium">CityCatalyst Database</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {type === 'alternative' && (
            <Button 
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                onChoose();
              }}
              data-testid={`button-choose-boundary-${getOsmId()}`}
            >
              Choose Boundary
            </Button>
          )}
          {type === 'current' && (
            <Button 
              variant="outline"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails();
              }}
              data-testid="button-restore-original"
            >
              Restore Original
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
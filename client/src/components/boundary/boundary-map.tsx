import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OSMBoundary } from "@/types/boundary";
import { calculateBounds } from "@/utils/geojson";

interface BoundaryMapProps {
  boundaries: OSMBoundary[];
  selectedBoundary?: OSMBoundary;
  height?: string;
}

export function BoundaryMap({ 
  boundaries, 
  selectedBoundary, 
  height = "600px" 
}: BoundaryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Dynamically import Leaflet to avoid SSR issues
    import('leaflet').then((L) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Initialize map
      const map = L.map(mapRef.current!).setView([-34.6118, -58.3960], 10);
      mapInstanceRef.current = map;

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Clear existing layers
      layersRef.current.forEach(layer => map.removeLayer(layer));
      layersRef.current = [];

      // Add boundary layers
      boundaries.forEach((boundary, index) => {
        if (boundary.geometry && boundary.geometry.coordinates) {
          try {
            const isSelected = selectedBoundary?.osmId === boundary.osmId;
            const color = isSelected ? '#0097FB' : '#6B7280';
            const opacity = isSelected ? 0.8 : 0.4;
            const fillOpacity = isSelected ? 0.3 : 0.1;

            const geoJsonLayer = L.geoJSON(boundary.geometry, {
              style: {
                color,
                weight: isSelected ? 3 : 2,
                opacity,
                fillOpacity,
              }
            }).addTo(map);

            layersRef.current.push(geoJsonLayer);

            // Fit bounds to selected boundary or all boundaries
            if (isSelected || (index === 0 && !selectedBoundary)) {
              const bounds = calculateBounds(boundary.geometry);
              if (bounds) {
                map.fitBounds(bounds);
              }
            }
          } catch (error) {
            console.error('Error adding boundary to map:', error);
          }
        }
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [boundaries, selectedBoundary]);

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground" data-testid="text-map-title">
            Boundary Visualization
          </h3>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" data-testid="button-map-street">
              Street
            </Button>
            <Button variant="default" size="sm" data-testid="button-map-satellite">
              Satellite
            </Button>
            <Button variant="ghost" size="sm" data-testid="button-map-terrain">
              Terrain
            </Button>
          </div>
        </div>
      </div>
      
      <div 
        ref={mapRef} 
        style={{ height }}
        className="w-full"
        data-testid="map-boundary-visualization"
      />
    </Card>
  );
}

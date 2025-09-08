import { useState, useEffect } from 'react';
import { Map, GeoJson, GeoJsonFeature } from 'pigeon-maps';
import { bbox, centroid } from '@turf/turf';

interface MiniMapProps {
  boundary: any;
  onLoad: () => void;
}

export function MiniMap({ boundary, onLoad }: MiniMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 0]);
  const [mapZoom, setMapZoom] = useState(10);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (boundary?.geometry) {
      try {
        // Calculate map bounds and center from geometry
        const bounds = bbox(boundary.geometry);
        const center = centroid(boundary.geometry);
        
        const lat = center.geometry.coordinates[1];
        const lng = center.geometry.coordinates[0];
        
        // Set map center (note: Pigeon Maps uses [lat, lng] format)
        setMapCenter([lat, lng]);
        
        // Calculate appropriate zoom level based on bounds
        const latDiff = bounds[3] - bounds[1]; // maxLat - minLat
        const lngDiff = bounds[2] - bounds[0]; // maxLng - minLng
        const maxDiff = Math.max(latDiff, lngDiff);
        
        // Simple zoom calculation (adjust as needed)
        let zoom = 10;
        if (maxDiff < 0.01) zoom = 14;
        else if (maxDiff < 0.05) zoom = 12;
        else if (maxDiff < 0.1) zoom = 11;
        else if (maxDiff < 0.5) zoom = 9;
        else if (maxDiff < 1) zoom = 8;
        else zoom = 7;
        
        setMapZoom(zoom);
        setMapLoaded(true);
        onLoad();
      } catch (error) {
        console.error('Error processing boundary geometry for mini map:', error);
        // Fallback to Buenos Aires coordinates
        setMapCenter([-34.6118, -58.3960]);
        setMapZoom(10);
        setMapLoaded(true);
        onLoad();
      }
    } else {
      // No geometry, show default location
      setMapCenter([-34.6118, -58.3960]);
      setMapZoom(10);
      setMapLoaded(true);
      onLoad();
    }
  }, [boundary, onLoad]);

  if (!mapLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Map
      height={200}
      center={mapCenter}
      zoom={mapZoom}
      attributionPrefix={false}
    >
      {boundary?.geometry && (
        <GeoJson
          svgAttributes={{
            fill: "#648bff99",
            strokeWidth: "3", 
            stroke: "#648bff",
          }}
        >
          <GeoJsonFeature 
            feature={{ 
              type: "Feature", 
              geometry: boundary.geometry 
            }} 
          />
        </GeoJson>
      )}
    </Map>
  );
}
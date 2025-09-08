import { useEffect, useRef } from 'react';

interface MiniMapProps {
  boundary: any;
  onLoad: () => void;
}

export function MiniMap({ boundary, onLoad }: MiniMapProps) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !boundary?.geometry) return;

    // Dynamically import Leaflet to avoid SSR issues
    import('leaflet').then((L) => {
      // Clean up existing map
      if (mapRef.current) {
        mapRef.current.remove();
      }

      // Initialize Leaflet map with disabled interactions
      const map = L.map(containerRef.current!, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
      });

      mapRef.current = map;

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      try {
        // Add boundary geometry as GeoJSON layer
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

        // Auto-fit map to show entire boundary
        const bounds = geoJsonLayer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [5, 5] });
        } else {
          // Fallback to default view
          map.setView([-34.6118, -58.3960], 10);
        }

        onLoad();
      } catch (error) {
        console.error('Error rendering boundary in mini map:', error);
        // Fallback to default view
        map.setView([-34.6118, -58.3960], 10);
        onLoad();
      }
    }).catch((error) => {
      console.error('Error loading Leaflet:', error);
      onLoad();
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [boundary, onLoad]);

  return <div ref={containerRef} className="w-full h-full" />;
}
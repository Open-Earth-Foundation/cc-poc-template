import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { OSMBoundary } from "../../types/boundary";
import { City } from "@shared/core-schema";
import { downloadGeoJSON } from "@/core/utils/geojson";
import { MiniMap } from "./mini-map";

interface BoundaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  boundary: OSMBoundary | City | null;
  type: 'current' | 'alternative';
  onChoose?: () => void;
}

export function BoundaryModal({ 
  isOpen, 
  onClose, 
  boundary, 
  type, 
  onChoose 
}: BoundaryModalProps) {
  const [mapLoaded, setMapLoaded] = useState(false);

  if (!boundary) return null;

  const getBoundaryName = () => {
    if (type === 'current') {
      return (boundary as City).name || 'Current Boundary';
    }
    return (boundary as OSMBoundary).name || 'Alternative Boundary';
  };

  const getBoundaryArea = () => {
    if (type === 'current') {
      const city = boundary as City;
      return city.metadata?.area ? `${city.metadata.area} sq km` : '205.536 sq km';
    }
    const osmBoundary = boundary as OSMBoundary;
    return osmBoundary.area ? `${osmBoundary.area.toFixed(2)} sq km` : 'N/A';
  };

  const getOsmInfo = () => {
    if (type === 'current') return null;
    const osmBoundary = boundary as OSMBoundary;
    return {
      osmId: osmBoundary.osmId,
      osmType: osmBoundary.osmType,
      adminLevel: osmBoundary.adminLevel,
      tags: osmBoundary.tags
    };
  };

  const handleDownload = () => {
    if (type === 'alternative' && 'geometry' in boundary && boundary.geometry) {
      const osmBoundary = boundary as OSMBoundary;
      
      // Ensure we have valid geometry with coordinates
      if (!osmBoundary.geometry || !osmBoundary.geometry.coordinates) {
        console.error('No geometry coordinates available for download');
        return;
      }
      
      const geoJson = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          id: `${osmBoundary.osmType}/${osmBoundary.osmId}`,
          properties: {
            osm_id: osmBoundary.osmId,
            osm_type: osmBoundary.osmType,
            name: osmBoundary.name,
            admin_level: osmBoundary.adminLevel,
            boundary: osmBoundary.boundaryType,
            area: osmBoundary.area,
            ...osmBoundary.tags,
          },
          geometry: osmBoundary.geometry,
        }],
      };
      
      console.log('Downloading GeoJSON:', geoJson);
      downloadGeoJSON(geoJson, `${osmBoundary.name}-boundary.geojson`);
    } else if (type === 'current' && 'currentBoundary' in boundary && boundary.currentBoundary) {
      const city = boundary as City;
      
      // Ensure we have valid current boundary geometry
      if (!city.currentBoundary || !city.currentBoundary.coordinates) {
        console.error('No current boundary coordinates available for download');
        return;
      }
      
      const geoJson = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          id: city.cityId,
          properties: {
            city_id: city.cityId,
            name: city.name,
            country: city.country,
            locode: city.locode,
            area: city.metadata?.area || null,
          },
          geometry: city.currentBoundary,
        }],
      };
      
      console.log('Downloading current boundary GeoJSON:', geoJson);
      downloadGeoJSON(geoJson, `${city.name}-current-boundary.geojson`);
    } else {
      console.error('No valid boundary data available for download');
    }
  };

  const osmInfo = getOsmInfo();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{getBoundaryName()}</span>
            {type === 'current' && (
              <Badge className="bg-green-100 text-green-800">Current</Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Map */}
          <div className="relative h-96 bg-gray-100 rounded overflow-hidden">
            {boundary && (type === 'current' ? 
              ('currentBoundary' in boundary && boundary.currentBoundary) : 
              ('geometry' in boundary && boundary.geometry)
            ) ? (
              <MiniMap 
                boundary={type === 'current' ? 
                  { geometry: (boundary as City).currentBoundary } : 
                  boundary
                }
                onLoad={() => setMapLoaded(true)} 
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-gray-500">No boundary data available</span>
              </div>
            )}
            {!mapLoaded && boundary && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-lg font-bold text-blue-600">
                {getBoundaryArea()}
              </div>
              <div className="text-sm text-gray-600">Area</div>
            </div>
            
            {osmInfo && (
              <>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-lg font-bold text-blue-600">
                    {osmInfo.osmType}.{osmInfo.osmId}
                  </div>
                  <div className="text-sm text-gray-600">OSM ID</div>
                </div>
                
                {osmInfo.adminLevel && (
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-lg font-bold text-blue-600">
                      {osmInfo.adminLevel}
                    </div>
                    <div className="text-sm text-gray-600">Admin Level</div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Tags */}
          {osmInfo?.tags && Object.keys(osmInfo.tags).length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Tags</h4>
              <div className="bg-gray-50 rounded p-3 max-h-32 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {Object.entries(osmInfo.tags).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-gray-600">{key}:</span>
                      <span className="text-gray-900 ml-2">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-3 border-t">
            <Button
              variant="outline"
              onClick={handleDownload}
              data-testid="button-download-geojson"
            >
              Download GeoJSON
            </Button>
            
            {type === 'alternative' && onChoose && (
              <Button
                onClick={() => {
                  onChoose();
                  onClose();
                }}
                data-testid="button-choose-boundary-modal"
              >
                Choose Boundary
              </Button>
            )}
            
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
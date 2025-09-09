import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OSMBoundary } from "@/types/boundary";
import { downloadGeoJSON } from "@/utils/geojson";

interface BoundaryDetailsProps {
  boundary: OSMBoundary | null;
}

export function BoundaryDetails({ boundary }: BoundaryDetailsProps) {
  const handleDownload = () => {
    if (!boundary) return;
    
    const geoJson = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        id: `${boundary.osmType}/${boundary.osmId}`,
        properties: {
          osm_id: boundary.osmId,
          osm_type: boundary.osmType,
          name: boundary.name,
          admin_level: boundary.adminLevel,
          boundary: boundary.boundaryType,
          ...boundary.tags,
        },
        geometry: boundary.geometry,
      }],
    };
    
    downloadGeoJSON(geoJson, `${boundary.name}-boundary.geojson`);
  };

  if (!boundary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Boundary Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Select a boundary to view details
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle data-testid="text-boundary-details-title">Selected Boundary Details</CardTitle>
        <Button 
          onClick={handleDownload}
          size="sm"
          data-testid="button-download-boundary"
        >
          Download GeoJSON
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary" data-testid="text-boundary-area-display">
              {boundary.area || 'N/A'}
            </div>
            <div className="text-sm text-muted-foreground">Area (km²)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary" data-testid="text-boundary-perimeter-display">
              --
            </div>
            <div className="text-sm text-muted-foreground">Perimeter (km)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary" data-testid="text-boundary-admin-level-display">
              {boundary.adminLevel || 'N/A'}
            </div>
            <div className="text-sm text-muted-foreground">Admin Level</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary" data-testid="text-boundary-score-display">
              {boundary.score}
            </div>
            <div className="text-sm text-muted-foreground">Match Score</div>
          </div>
        </div>
        
        <div className="pt-4 border-t border-border">
          <h5 className="font-medium text-foreground mb-3">Metadata</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">OSM ID:</span>
              <span className="text-foreground ml-2" data-testid="text-boundary-osm-id">
                {boundary.osmType}/{boundary.osmId}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Boundary Type:</span>
              <span className="text-foreground ml-2" data-testid="text-boundary-type">
                {boundary.boundaryType}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Name:</span>
              <span className="text-foreground ml-2" data-testid="text-boundary-name-display">
                {boundary.name}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Data Source:</span>
              <span className="text-foreground ml-2">OpenStreetMap</span>
            </div>
          </div>
          
          {Object.keys(boundary.tags).length > 0 && (
            <div className="mt-4">
              <h6 className="font-medium text-foreground mb-2">OSM Tags</h6>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {Object.entries(boundary.tags).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-muted-foreground">{key}:</span>
                    <span className="text-foreground ml-2">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

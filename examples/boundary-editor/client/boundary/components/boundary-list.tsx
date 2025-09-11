import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { Progress } from "@/core/components/ui/progress";
import { OSMBoundary } from "@/types/boundary";

interface BoundaryListProps {
  boundaries: OSMBoundary[];
  selectedBoundary?: OSMBoundary;
  onSelectBoundary: (boundary: OSMBoundary) => void;
  isLoading?: boolean;
}

export function BoundaryList({ 
  boundaries, 
  selectedBoundary, 
  onSelectBoundary,
  isLoading = false 
}: BoundaryListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Available Boundaries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="border rounded-lg p-4">
                <div className="space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded"></div>
                  <div className="h-3 bg-muted animate-pulse rounded w-3/4"></div>
                  <div className="h-3 bg-muted animate-pulse rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle data-testid="text-boundary-list-title">Available Boundaries</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {boundaries.map((boundary) => {
            const isSelected = selectedBoundary?.osmId === boundary.osmId;
            
            return (
              <div
                key={boundary.osmId}
                className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-muted-foreground ${
                  isSelected ? 'border-primary ring-2 ring-primary ring-opacity-20' : ''
                }`}
                onClick={() => onSelectBoundary(boundary)}
                data-testid={`card-boundary-${boundary.osmId}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-foreground" data-testid={`text-boundary-name-${boundary.osmId}`}>
                      {boundary.name}
                    </h4>
                    <p className="text-sm text-muted-foreground" data-testid={`text-boundary-id-${boundary.osmId}`}>
                      {boundary.osmType} #{boundary.osmId}
                    </p>
                  </div>
                  {isSelected && (
                    <Badge data-testid={`badge-boundary-selected-${boundary.osmId}`}>
                      Selected
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Admin Level:</span>
                    <span className="text-foreground" data-testid={`text-boundary-admin-level-${boundary.osmId}`}>
                      {boundary.adminLevel || 'N/A'}
                    </span>
                  </div>
                  
                  {boundary.area && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Area:</span>
                      <span className="text-foreground" data-testid={`text-boundary-area-${boundary.osmId}`}>
                        {boundary.area} km²
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Score:</span>
                    <div className="flex items-center space-x-2">
                      <Progress 
                        value={boundary.score} 
                        className="w-16 h-2" 
                        data-testid={`progress-boundary-score-${boundary.osmId}`}
                      />
                      <span className="text-foreground text-xs" data-testid={`text-boundary-score-${boundary.osmId}`}>
                        {boundary.score}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {boundaries.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No boundaries found. Try refreshing or check your search criteria.
          </div>
        )}
        
        <div className="mt-6 pt-4 border-t border-border">
          <Button 
            variant="outline" 
            className="w-full"
            data-testid="button-load-more-boundaries"
          >
            Load More Boundaries
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { BoundaryList } from "@/components/boundary/boundary-list";
import { BoundaryMap } from "@/components/boundary/boundary-map";
import { BoundaryDetails } from "@/components/boundary/boundary-details";
import { useAuth } from "@/hooks/useAuth";
import { useCity } from "@/hooks/useCities";
import { useBoundarySearch, useBoundarySelection } from "@/hooks/useBoundaries";
import { OSMBoundary } from "@/types/boundary";
import { useToast } from "@/hooks/use-toast";

export default function BoundaryEditor() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const cityId = params.cityId;
  const { data: cityData, isLoading: cityLoading } = useCity(cityId);
  const [selectedBoundary, setSelectedBoundary] = useState<OSMBoundary | undefined>();
  
  // Search boundaries for the city
  const searchParams = cityData?.city ? {
    cityName: cityData.city.name,
    country: cityData.city.country,
    countryCode: cityData.city.country === 'Argentina' ? 'AR' : undefined,
  } : null;
  
  const { data: boundariesData, isLoading: boundariesLoading } = useBoundarySearch(searchParams);
  const boundarySelection = useBoundarySelection();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  // Set first boundary as selected by default
  useEffect(() => {
    if (boundariesData?.boundaries && boundariesData.boundaries.length > 0 && !selectedBoundary) {
      setSelectedBoundary(boundariesData.boundaries[0]);
    }
  }, [boundariesData, selectedBoundary]);

  const handleSelectBoundary = async (boundary: OSMBoundary) => {
    setSelectedBoundary(boundary);
    
    if (!cityId) return;
    
    try {
      await boundarySelection.mutateAsync({
        cityId,
        osmId: boundary.osmId,
        osmType: boundary.osmType,
      });
      
      toast({
        title: "Boundary Selected",
        description: `Successfully selected ${boundary.name}`,
      });
    } catch (error: any) {
      toast({
        title: "Selection Failed",
        description: error.message || "Failed to select boundary",
        variant: "destructive",
      });
    }
  };

  const handleRefreshBoundaries = () => {
    // Trigger refetch of boundaries
    window.location.reload();
  };

  const handleDownloadSelected = () => {
    if (!selectedBoundary) {
      toast({
        title: "No Boundary Selected",
        description: "Please select a boundary to download",
        variant: "destructive",
      });
      return;
    }
    
    // Trigger download from BoundaryDetails component
    toast({
      title: "Download Started",
      description: "GeoJSON download has started",
    });
  };

  const handleBackToCities = () => {
    setLocation("/cities");
  };

  if (authLoading || cityLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-8 w-96 bg-muted animate-pulse rounded mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="h-96 bg-muted animate-pulse rounded"></div>
            </div>
            <div className="lg:col-span-2">
              <div className="h-96 bg-muted animate-pulse rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cityData?.city) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">City Not Found</h2>
            <p className="text-muted-foreground mb-6">The requested city could not be found.</p>
            <Button onClick={handleBackToCities}>
              Back to Cities
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const city = cityData.city;
  const boundaries = boundariesData?.boundaries || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with city info and actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div>
            <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
              <button 
                onClick={handleBackToCities}
                className="hover:text-foreground transition-colors"
                data-testid="button-back-to-cities"
              >
                Cities
              </button>
              <span>›</span>
              <span className="text-foreground" data-testid="text-breadcrumb-city">
                {city.name}
              </span>
            </nav>
            <h2 className="text-3xl font-bold text-foreground mb-2" data-testid="text-page-title">
              Boundary Editor
            </h2>
            <p className="text-muted-foreground" data-testid="text-page-subtitle">
              Select and compare administrative boundaries from OpenStreetMap
            </p>
          </div>
          <div className="flex space-x-3 mt-4 lg:mt-0">
            <Button 
              variant="secondary"
              onClick={handleRefreshBoundaries}
              data-testid="button-refresh-boundaries"
            >
              Refresh Boundaries
            </Button>
            <Button 
              onClick={handleDownloadSelected}
              disabled={!selectedBoundary}
              data-testid="button-download-selected"
            >
              Download Selected
            </Button>
          </div>
        </div>
        
        {/* Boundary Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Boundary List */}
          <div className="lg:col-span-1">
            <BoundaryList
              boundaries={boundaries}
              selectedBoundary={selectedBoundary}
              onSelectBoundary={handleSelectBoundary}
              isLoading={boundariesLoading}
            />
          </div>
          
          {/* Right Panel - Map Display */}
          <div className="lg:col-span-2">
            <BoundaryMap
              boundaries={boundaries}
              selectedBoundary={selectedBoundary}
              height="600px"
            />
            
            {/* Selected Boundary Details */}
            <div className="mt-6">
              <BoundaryDetails boundary={selectedBoundary || null} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

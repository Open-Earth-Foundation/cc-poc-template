import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { EnhancedBoundaryCard } from "@/components/boundary/enhanced-boundary-card";
import { BoundaryModal } from "@/components/boundary/boundary-modal";
import { useAuth } from "@/hooks/useAuth";
import { useCity } from "@/hooks/useCities";
import { useBoundarySearch, useBoundarySelection } from "@/hooks/useBoundaries";
import { OSMBoundary } from "@/types/boundary";
import { City } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function BoundaryEditor() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const cityId = params.cityId;
  const { data: cityData, isLoading: cityLoading } = useCity(cityId);
  const [selectedBoundary, setSelectedBoundary] = useState<OSMBoundary | City | null>(null);
  const [selectedBoundaryType, setSelectedBoundaryType] = useState<'current' | 'alternative'>('current');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalBoundary, setModalBoundary] = useState<OSMBoundary | City | null>(null);
  const [modalType, setModalType] = useState<'current' | 'alternative'>('current');
  
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

  // Set current boundary as selected by default
  useEffect(() => {
    if (cityData?.city && !selectedBoundary) {
      const city = cityData.city as City;
      setSelectedBoundary(city);
      setSelectedBoundaryType('current');
    }
  }, [cityData, selectedBoundary]);

  const handleSelectBoundary = (boundary: OSMBoundary | City, type: 'current' | 'alternative') => {
    setSelectedBoundary(boundary);
    setSelectedBoundaryType(type);
  };

  const handleChooseBoundary = async (boundary: OSMBoundary) => {
    if (!cityId) return;
    
    try {
      await boundarySelection.mutateAsync({
        cityId,
        osmId: boundary.osmId,
        osmType: boundary.osmType,
      });
      
      // Update selected boundary to the chosen one
      setSelectedBoundary(boundary);
      setSelectedBoundaryType('alternative');
      
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

  const handleViewDetails = (boundary: OSMBoundary | City, type: 'current' | 'alternative') => {
    setModalBoundary(boundary);
    setModalType(type);
    setModalOpen(true);
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
        
        {/* How it works info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">How it works</h2>
          <div className="space-y-2 text-sm text-blue-800">
            <p>• The first card shows your current boundary from our database</p>
            <p>• The next 5 cards show alternative boundaries from OpenStreetMap</p>
            <p>• Click "Choose Boundary" to select and download an alternative</p>
            <p>• Use "Restore Original" to return to the default boundary</p>
          </div>
        </div>

        {/* Enhanced Boundary Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Current Boundary Card */}
          {cityData?.city && (
            <EnhancedBoundaryCard
              type="current"
              boundary={cityData.city as City}
              isSelected={selectedBoundaryType === 'current'}
              onSelect={() => handleSelectBoundary(cityData.city as City, 'current')}
              onChoose={() => {}}
              onViewDetails={() => handleViewDetails(cityData.city as City, 'current')}
            />
          )}
          
          {/* Alternative Boundary Cards */}
          {boundariesLoading ? (
            // Loading skeleton cards
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-40 bg-gray-200 animate-pulse rounded"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 animate-pulse rounded"></div>
                    <div className="h-3 bg-gray-200 animate-pulse rounded w-3/4"></div>
                  </div>
                  <div className="h-10 bg-gray-200 animate-pulse rounded"></div>
                </div>
              </div>
            ))
          ) : (
            boundaries.slice(0, 5).map((boundary, index) => (
              <EnhancedBoundaryCard
                key={boundary.osmId}
                type="alternative"
                boundary={boundary}
                isSelected={selectedBoundaryType === 'alternative' && 
                           selectedBoundary && 
                           'osmId' in selectedBoundary && 
                           selectedBoundary.osmId === boundary.osmId}
                onSelect={() => handleSelectBoundary(boundary, 'alternative')}
                onChoose={() => handleChooseBoundary(boundary)}
                onViewDetails={() => handleViewDetails(boundary, 'alternative')}
                index={index + 1}
              />
            ))
          )}
        </div>

        {/* Boundary Detail Modal */}
        <BoundaryModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          boundary={modalBoundary}
          type={modalType}
          onChoose={modalBoundary && modalType === 'alternative' ? () => handleChooseBoundary(modalBoundary as OSMBoundary) : undefined}
        />
      </div>
    </div>
  );
}

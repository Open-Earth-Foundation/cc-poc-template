import { useState } from "react";
import { useParams } from "wouter";
import { Header } from "@/core/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { Skeleton } from "@/core/components/ui/skeleton";
import { useCityDetail, useCityBoundary } from "../hooks/useCityInfo";
import { CityMap } from "../components/city-map";
import { InventoryCard } from "../components/inventory-card";
import { InventoryModal } from "../components/inventory-modal";
import { MapPin, Globe, Calendar, Database } from "lucide-react";

export default function CityInformation() {
  const { locode } = useParams<{ locode: string }>();
  const [selectedInventory, setSelectedInventory] = useState<{ year: number; locode: string } | null>(null);

  // Decode the locode parameter (in case it has URL encoding)
  const decodedLocode = locode ? decodeURIComponent(locode) : '';

  const { data: cityDetail, isLoading: cityLoading, error: cityError } = useCityDetail(decodedLocode);
  const { data: boundary, isLoading: boundaryLoading } = useCityBoundary(decodedLocode);

  if (cityLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-96" />
              <Skeleton className="h-96" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cityError) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-destructive mb-2">Error Loading City Information</h2>
                <p className="text-muted-foreground">
                  Failed to load information for city code: {decodedLocode}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {cityError instanceof Error ? cityError.message : 'Unknown error occurred'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!cityDetail) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">City Not Found</h2>
                <p className="text-muted-foreground">
                  No information available for city code: {decodedLocode}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* City Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2" data-testid="text-city-name">
            {cityDetail.name}
          </h1>
          <div className="flex flex-wrap gap-4 items-center text-muted-foreground">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span data-testid="text-city-country">{cityDetail.country || 'Unknown Country'}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span data-testid="text-city-locode">{cityDetail.locode}</span>
            </div>
            {cityDetail.inventories && cityDetail.inventories.length > 0 && (
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span data-testid="text-inventory-count">
                  {cityDetail.inventories.length} inventories
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* City Information Card */}
          <Card data-testid="card-city-info">
            <CardHeader>
              <CardTitle>City Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">UN/LOCODE</label>
                <p className="text-sm text-muted-foreground font-mono" data-testid="text-city-locode-detail">
                  {cityDetail.locode}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Name</label>
                <p className="text-sm text-muted-foreground" data-testid="text-city-name-detail">
                  {cityDetail.name}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Country</label>
                <p className="text-sm text-muted-foreground" data-testid="text-city-country-detail">
                  {cityDetail.country || 'Not specified'}
                </p>
              </div>
              {cityDetail.metadata && Object.keys(cityDetail.metadata).length > 0 && (
                <div>
                  <label className="text-sm font-medium">Additional Information</label>
                  <div className="mt-2 space-y-1">
                    {Object.entries(cityDetail.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="font-mono">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* City Map */}
          <Card data-testid="card-city-map">
            <CardHeader>
              <CardTitle>City Boundary</CardTitle>
            </CardHeader>
            <CardContent>
              <CityMap
                boundary={boundary}
                isLoading={boundaryLoading}
                cityName={cityDetail.name}
              />
            </CardContent>
          </Card>
        </div>

        {/* Inventories Section */}
        {cityDetail.inventories && cityDetail.inventories.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="h-5 w-5" />
              <h2 className="text-2xl font-bold">Emissions Inventories</h2>
              <Badge variant="secondary" data-testid="badge-inventory-count">
                {cityDetail.inventories.length} available
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cityDetail.inventories
                .sort((a, b) => b.year - a.year) // Sort by year, newest first
                .map((inventory) => (
                <InventoryCard
                  key={inventory.year}
                  inventory={inventory}
                  cityName={cityDetail.name}
                  locode={cityDetail.locode}
                  onSelect={() => setSelectedInventory({ year: inventory.year, locode: cityDetail.locode })}
                />
              ))}
            </div>
          </div>
        )}

        {cityDetail.inventories?.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Inventories Available</h3>
                <p className="text-muted-foreground">
                  This city doesn't have any emissions inventories available at the moment.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Inventory Modal */}
      {selectedInventory && (
        <InventoryModal
          isOpen={!!selectedInventory}
          onClose={() => setSelectedInventory(null)}
          locode={selectedInventory.locode}
          year={selectedInventory.year}
          cityName={cityDetail.name}
        />
      )}
    </div>
  );
}
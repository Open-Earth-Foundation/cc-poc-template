import { useParams, Link } from "wouter";
import { Header } from "@/core/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { Skeleton } from "@/core/components/ui/skeleton";
import { useCityInformation } from "../hooks/useCityInformation";
import { MapPin, Globe, Calendar, Database, ArrowLeft, Building2, Clock } from "lucide-react";

export default function CityInformation() {
  const { cityId } = useParams<{ cityId: string }>();
  
  // Use our new working API
  const { data: cityInfo, isLoading, error } = useCityInformation(cityId);

  if (isLoading) {
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

  if (error || !cityInfo) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Link href="/cities">
              <Button variant="ghost" className="mb-4" data-testid="button-back-to-cities">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Cities
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-destructive mb-2">Error Loading City Information</h2>
                <p className="text-muted-foreground">
                  Failed to load information for city: {cityId}
                </p>
                {error && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {error instanceof Error ? error.message : 'Unknown error occurred'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const city = cityInfo.data;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="mb-6">
          <Link href="/cities">
            <Button variant="ghost" className="mb-4" data-testid="button-back-to-cities">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cities
            </Button>
          </Link>
        </div>

        {/* City Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2" data-testid="text-city-name">
            {city.name}
          </h1>
          <div className="flex flex-wrap gap-4 items-center text-muted-foreground">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span data-testid="text-city-country">{city.country}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span data-testid="text-city-locode">{city.locode}</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span data-testid="text-inventory-count">
                {city.totalInventories} inventories available
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* City Information Card */}
          <Card data-testid="card-city-info">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                City Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">City Name</label>
                <p className="text-sm text-muted-foreground" data-testid="text-city-name-detail">
                  {city.name}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Country</label>
                <p className="text-sm text-muted-foreground" data-testid="text-city-country-detail">
                  {city.country}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">UN/LOCODE</label>
                <p className="text-sm text-muted-foreground font-mono" data-testid="text-city-locode-detail">
                  {city.locode}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Country Code</label>
                <p className="text-sm text-muted-foreground" data-testid="text-city-country-code">
                  {city.locodePrefix}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Available Data Years</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {city.availableYears.map(year => (
                    <Badge key={year} variant="secondary" data-testid={`badge-year-${year}`}>
                      {year}
                    </Badge>
                  ))}
                </div>
              </div>
              {city.latestUpdate && (
                <div>
                  <label className="text-sm font-medium">Last Updated</label>
                  <p className="text-sm text-muted-foreground" data-testid="text-last-update">
                    {new Date(city.latestUpdate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data Overview Card */}
          <Card data-testid="card-data-overview">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <div className="text-3xl font-bold text-primary mb-2" data-testid="text-total-inventories">
                  {city.totalInventories}
                </div>
                <p className="text-muted-foreground">Total Inventories</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Latest Year</span>
                  <span className="text-sm text-muted-foreground" data-testid="text-latest-year">
                    {city.availableYears[0] || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Earliest Year</span>
                  <span className="text-sm text-muted-foreground" data-testid="text-earliest-year">
                    {city.availableYears[city.availableYears.length - 1] || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Year Range</span>
                  <span className="text-sm text-muted-foreground" data-testid="text-year-range">
                    {city.availableYears.length > 0 
                      ? `${city.availableYears[city.availableYears.length - 1]} - ${city.availableYears[0]}`
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventories Section */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="h-5 w-5" />
            <h2 className="text-2xl font-bold">Emissions Inventories</h2>
            <Badge variant="secondary" data-testid="badge-inventory-count">
              {city.totalInventories} available
            </Badge>
          </div>

          {city.years.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {city.years
                .sort((a, b) => (b.year || 0) - (a.year || 0)) // Sort by year, newest first
                .map((yearData) => (
                  <Card key={yearData.inventoryId} className="hover:shadow-md transition-shadow" data-testid={`card-inventory-${yearData.year}`}>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-2xl font-bold text-primary" data-testid={`text-year-${yearData.year}`}>
                              {yearData.year}
                            </div>
                            <p className="text-sm text-muted-foreground">Emissions Inventory</p>
                          </div>
                          <Badge variant="outline" data-testid={`badge-status-${yearData.year}`}>
                            Available
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Inventory ID</span>
                            <span className="font-mono text-xs" data-testid={`text-inventory-id-${yearData.year}`}>
                              {yearData.inventoryId.slice(0, 8)}...
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Last Update</span>
                            <span className="text-xs" data-testid={`text-update-date-${yearData.year}`}>
                              {new Date(yearData.lastUpdate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            disabled
                            data-testid={`button-view-inventory-${yearData.year}`}
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            View Details (Coming Soon)
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
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
      </div>
    </div>
  );
}
import { useState } from "react";
import { useLocation } from "wouter";
import { Input } from "@/core/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Header } from "@/core/components/layout/header";
import { CityCard } from "@/core/components/city/city-card";
import { UserDataCard } from "@/core/components/user/user-data-card";
import { useAuth } from "@/core/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { City } from "@shared/schema";

export default function CitySelection() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  // Use CityCatalyst inventories data instead of local database
  const { data: inventoriesData, isLoading: citiesLoading } = useQuery({
    queryKey: ['/api/citycatalyst/inventories'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("all");

  // Redirect to login if not authenticated
  if (!authLoading && !isAuthenticated) {
    setLocation("/login");
    return null;
  }

  const handleCitySelect = (cityId: string) => {
    setLocation(`/city-information/${cityId}`);
  };

  // Transform CityCatalyst inventories into city format
  const cities = (inventoriesData?.data || []).map((city: any) => {
    const countryMap: Record<string, string> = {
      'AR': 'Argentina', 'BR': 'Brazil', 'US': 'United States',
      'MX': 'Mexico', 'JP': 'Japan', 'ZM': 'Zambia',
      'DE': 'Germany', 'CA': 'Canada', 'AU': 'Australia'
    };
    const prefix = city.locode.split(' ')[0];
    return {
      id: city.locode,
      cityId: city.locode, 
      name: city.name,
      country: countryMap[prefix] || prefix,
      locode: city.locode,
      projectId: `project-${prefix.toLowerCase()}`,
      metadata: { inventoryCount: city.years.length },
      createdAt: new Date()
    };
  });
  
  // Filter cities based on search and project
  const filteredCities = cities.filter(city => {
    const matchesSearch = city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         city.country.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = selectedProject === "all" || city.projectId === selectedProject;
    return matchesSearch && matchesProject;
  });

  // Get unique projects for filter
  const projects = Array.from(new Set(cities.map(city => city.projectId)));

  if (authLoading || citiesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="h-8 w-48 bg-muted animate-pulse rounded mb-2"></div>
            <div className="h-4 w-96 bg-muted animate-pulse rounded"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="border rounded-lg p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted animate-pulse rounded"></div>
                  <div className="h-3 bg-muted animate-pulse rounded w-3/4"></div>
                  <div className="h-3 bg-muted animate-pulse rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Data Section */}
        {user && (
          <div className="mb-8">
            <UserDataCard user={user} />
          </div>
        )}

        
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2" data-testid="text-page-title">
            Select a City
          </h2>
          <p className="text-muted-foreground" data-testid="text-page-subtitle">
            Choose a city to see its data
          </p>
        </div>
        
        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search cities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-city-search"
              />
              <svg 
                className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
          
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-full sm:w-48" data-testid="select-project-filter">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(projectId => (
                <SelectItem key={projectId} value={projectId}>
                  {projectId.replace('project-', '').replace('-', ' ').split(' ').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Cities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="grid-cities">
          {filteredCities.map((city) => (
            <CityCard
              key={city.id}
              city={city}
              onSelect={handleCitySelect}
              isActive={true}
            />
          ))}
        </div>
        
        {filteredCities.length === 0 && !citiesLoading && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4" data-testid="text-no-cities">
              {searchTerm ? "No cities match your search criteria." : "No cities available."}
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-primary hover:underline"
                data-testid="button-clear-search"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

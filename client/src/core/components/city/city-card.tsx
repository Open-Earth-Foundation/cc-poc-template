import { Card, CardContent } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { City } from "@/core/types/city";

interface CityCardProps {
  city: City;
  onSelect: (cityId: string) => void;
  isActive?: boolean;
}

export function CityCard({ city, onSelect, isActive = true }: CityCardProps) {
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${!isActive ? 'opacity-60' : ''}`}
      onClick={() => isActive && onSelect(city.locode || city.cityId)}
      data-testid={`card-city-${city.cityId}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground" data-testid={`text-city-name-${city.cityId}`}>
              {city.name}
            </h3>
            <p className="text-sm text-muted-foreground" data-testid={`text-city-country-${city.cityId}`}>
              {city.country}
            </p>
            {city.locode && (
              <p className="text-xs text-muted-foreground mt-1" data-testid={`text-city-locode-${city.cityId}`}>
                LOCODE: {city.locode}
              </p>
            )}
          </div>
          <Badge variant={isActive ? "default" : "secondary"} data-testid={`badge-city-status-${city.cityId}`}>
            {isActive ? "Active" : "Pending"}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Project:</span>
            <span className="text-foreground" data-testid={`text-city-project-${city.cityId}`}>
              {city.projectId}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Boundaries:</span>
            <span className="text-foreground">Available</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status:</span>
            <span className="text-foreground">{isActive ? "Ready" : "Pending Access"}</span>
          </div>
        </div>
        
        {!isActive && (
          <div className="mt-4 text-xs text-muted-foreground">
            Access pending approval
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { CityCatalystInventory } from "../types/city-info";
import { Calendar, Database, ExternalLink, Activity } from "lucide-react";
import { InventoryDetailsModal } from "./inventory-details-modal";

interface InventoryCardProps {
  inventory: {
    year: number;
    inventoryId: string;
    lastUpdate: string;
  };
  cityName: string;
  locode: string;
  onSelect?: () => void;
}

export function InventoryCard({ inventory, cityName, locode, onSelect }: InventoryCardProps) {
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow" data-testid={`card-inventory-${inventory.year}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {inventory.year}
          </CardTitle>
          <Badge variant="outline" data-testid={`badge-inventory-year-${inventory.year}`}>
            <Activity className="h-3 w-3 mr-1" />
            Emissions
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          <p>Emissions inventory for {cityName}</p>
          <p className="font-mono text-xs mt-1">ID: {inventory.inventoryId}</p>
        </div>
        
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Database className="h-3 w-3" />
            <span>UN/LOCODE: {locode}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            <span>Updated: {formatDate(inventory.lastUpdate)}</span>
          </div>
        </div>

        <InventoryDetailsModal 
          inventoryId={inventory.inventoryId} 
          year={inventory.year} 
          cityName={cityName}
        >
          <Button 
            className="w-full"
            variant="outline"
            data-testid={`button-view-inventory-${inventory.year}`}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </InventoryDetailsModal>
      </CardContent>
    </Card>
  );
}
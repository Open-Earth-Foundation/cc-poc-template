import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { CityCatalystInventory } from "../types/city-info";
import { Calendar, Database, ExternalLink } from "lucide-react";

interface InventoryCardProps {
  inventory: CityCatalystInventory;
  cityName: string;
  locode: string;
  onSelect: () => void;
}

export function InventoryCard({ inventory, cityName, locode, onSelect }: InventoryCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid={`card-inventory-${inventory.year}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {inventory.year}
          </CardTitle>
          <Badge variant="outline" data-testid={`badge-inventory-year-${inventory.year}`}>
            Emissions
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          <p>Emissions inventory for {cityName}</p>
          {inventory.id && (
            <p className="font-mono text-xs">ID: {inventory.id}</p>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Database className="h-3 w-3" />
          <span>UN/LOCODE: {locode}</span>
        </div>

        <Button 
          onClick={onSelect}
          className="w-full"
          variant="outline"
          data-testid={`button-view-inventory-${inventory.year}`}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View Inventory Data
        </Button>
      </CardContent>
    </Card>
  );
}
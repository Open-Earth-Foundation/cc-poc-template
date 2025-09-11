import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/core/components/ui/dialog";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { Skeleton } from "@/core/components/ui/skeleton";
import { ExternalLink, Calendar, Database, Building2, Activity, Clock } from "lucide-react";
import { useInventoryDetails } from "../hooks/useInventoryDetails";
import { format } from "date-fns";
import { useState } from "react";
import { analytics } from '@/core/lib/analytics';

interface InventoryDetailsModalProps {
  inventoryId: string;
  year: number;
  cityName: string;
  children: React.ReactNode;
}

export function InventoryDetailsModal({ inventoryId, year, cityName, children }: InventoryDetailsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: inventoryData, isLoading, error } = useInventoryDetails(isOpen ? inventoryId : undefined);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      analytics.inventory.detailsOpened(inventoryId);
    }
  };

  const formattedDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM dd, yyyy');
    } catch {
      return 'Unknown';
    }
  };

  const renderContent = () => {
    if (!isOpen) return null;

    if (isLoading) {
      return (
        <>
          <DialogHeader>
            <DialogTitle>Loading Inventory Details...</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        </>
      );
    }

    if (error || !inventoryData?.data) {
      return (
        <>
          <DialogHeader>
            <DialogTitle>Error Loading Inventory Details</DialogTitle>
          </DialogHeader>
          <p className="text-destructive">
            Failed to load inventory details: {error?.message || 'Unknown error'}
          </p>
        </>
      );
    }

    const inventory = inventoryData.data;
    return (
      <>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl" data-testid="text-inventory-title">
            <Database className="h-5 w-5" />
            {inventory.inventoryName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="font-medium text-muted-foreground">Year</label>
                <p className="text-foreground" data-testid="text-inventory-year">{inventory.year}</p>
              </div>
              <div>
                <label className="font-medium text-muted-foreground">Type</label>
                <Badge variant="outline" className="text-xs" data-testid="badge-inventory-type">
                  {inventory.inventoryType.toUpperCase()}
                </Badge>
              </div>
              <div>
                <label className="font-medium text-muted-foreground">Total Emissions</label>
                <p className="text-foreground" data-testid="text-total-emissions">
                  {inventory.totalEmissions !== null 
                    ? `${inventory.totalEmissions.toLocaleString()} CO₂e` 
                    : 'Not calculated'}
                </p>
              </div>
              <div>
                <label className="font-medium text-muted-foreground">Status</label>
                <Badge variant={inventory.isPublic ? "default" : "secondary"} data-testid="badge-inventory-status">
                  {inventory.isPublic ? "Public" : "Private"}
                </Badge>
              </div>
            </div>
          </div>

          {/* City Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              City Details
            </h3>
            
            <div className="space-y-3 text-sm">
              <div>
                <label className="font-medium text-muted-foreground">City</label>
                <p className="text-foreground" data-testid="text-inventory-city">{inventory.city.name}</p>
              </div>
              <div>
                <label className="font-medium text-muted-foreground">Country & Region</label>
                <p className="text-foreground">{inventory.city.country}, {inventory.city.region}</p>
              </div>
              <div>
                <label className="font-medium text-muted-foreground">LOCODE</label>
                <p className="text-foreground font-mono">{inventory.city.locode}</p>
              </div>
              <div>
                <label className="font-medium text-muted-foreground">Area</label>
                <p className="text-foreground">{inventory.city.area} km²</p>
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Technical Details
            </h3>
            
            <div className="space-y-3 text-sm">
              <div>
                <label className="font-medium text-muted-foreground">Global Warming Potential</label>
                <p className="text-foreground">{inventory.globalWarmingPotentialType.toUpperCase()}</p>
              </div>
              <div>
                <label className="font-medium text-muted-foreground">Country Emissions</label>
                <p className="text-foreground">
                  {inventory.totalCountryEmissions !== null 
                    ? `${inventory.totalCountryEmissions.toLocaleString()} CO₂e` 
                    : 'Not available'}
                </p>
              </div>
              <div>
                <label className="font-medium text-muted-foreground">Inventory ID</label>
                <p className="text-foreground font-mono text-xs">{inventory.inventoryId}</p>
              </div>
            </div>
          </div>

          {/* Project & Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Timeline & Project
            </h3>
            
            <div className="space-y-3 text-sm">
              <div>
                <label className="font-medium text-muted-foreground">Project</label>
                <p className="text-foreground">{inventory.city.project.name}</p>
              </div>
              <div>
                <label className="font-medium text-muted-foreground">Created</label>
                <p className="text-foreground">{formattedDate(inventory.created)}</p>
              </div>
              <div>
                <label className="font-medium text-muted-foreground">Last Updated</label>
                <p className="text-foreground">{formattedDate(inventory.lastUpdated)}</p>
              </div>
              {inventory.publishedAt && (
                <div>
                  <label className="font-medium text-muted-foreground">Published</label>
                  <p className="text-foreground">{formattedDate(inventory.publishedAt)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" size="sm" data-testid="button-view-citycatalyst">
            <ExternalLink className="h-4 w-4 mr-2" />
            View in CityCatalyst
          </Button>
        </div>
      </>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
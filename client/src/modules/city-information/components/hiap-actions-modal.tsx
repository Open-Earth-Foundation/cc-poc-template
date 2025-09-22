import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/core/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { Skeleton } from "@/core/components/ui/skeleton";
import { useHIAPData } from "../hooks/useHIAPData";
import { HIAPData } from "../types/city-info";
import { Leaf, Shield, AlertTriangle, ExternalLink } from "lucide-react";

interface HIAPActionsModalProps {
  inventoryId: string;
  actionType: 'mitigation' | 'adaptation';
  trigger: React.ReactNode;
  title: string;
  description: string;
}

export function HIAPActionsModal({ 
  inventoryId, 
  actionType, 
  trigger, 
  title, 
  description 
}: HIAPActionsModalProps) {
  const [open, setOpen] = useState(false);
  
  const { data: hiapData, isLoading, error } = useHIAPData(
    open ? inventoryId : undefined, // Only fetch when modal is open
    actionType,
    'en'
  );

  const renderActionCard = (action: any, index: number) => (
    <Card key={index} className="border" data-testid={`card-action-${index}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge 
            variant={actionType === 'mitigation' ? 'default' : 'secondary'} 
            className="text-xs"
          >
            {action.category || actionType}
          </Badge>
          {action.priority && (
            <Badge variant="outline" className="text-xs">
              Priority: {action.priority}
            </Badge>
          )}
        </div>
        <CardTitle className="text-sm font-medium">
          {action.title || action.name || `${actionType} Action ${index + 1}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {action.description && (
          <p className="text-sm text-muted-foreground">
            {action.description}
          </p>
        )}
        
        {action.healthBenefits && action.healthBenefits.length > 0 && (
          <div>
            <label className="text-xs font-medium text-muted-foreground">Health Benefits:</label>
            <div className="flex flex-wrap gap-1 mt-1">
              {action.healthBenefits.slice(0, 3).map((benefit: string, idx: number) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {benefit}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {action.sector && (
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Sector:</span>
            <span className="font-medium">{action.sector}</span>
          </div>
        )}
        
        {action.timeframe && (
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Timeframe:</span>
            <span className="font-medium">{action.timeframe}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Unable to load actions</h3>
          <p className="text-muted-foreground text-sm" data-testid="text-hiap-error">
            {error instanceof Error ? error.message : 'Failed to fetch action data'}
          </p>
        </div>
      );
    }

    if (!hiapData?.data) {
      return (
        <div className="text-center py-8">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            {actionType === 'mitigation' ? <Leaf className="h-6 w-6" /> : <Shield className="h-6 w-6" />}
          </div>
          <h3 className="text-lg font-semibold mb-2">No actions available</h3>
          <p className="text-muted-foreground">
            No {actionType} actions are available for this inventory.
          </p>
        </div>
      );
    }

    // Handle different possible data structures
    const actions = hiapData.data.actions || 
                   hiapData.data.recommendations || 
                   hiapData.data.data || 
                   (Array.isArray(hiapData.data) ? hiapData.data : []);

    if (!Array.isArray(actions) || actions.length === 0) {
      return (
        <div className="space-y-2">
          <h4 className="font-medium">Raw HIAP Data</h4>
          <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto max-h-96" data-testid="text-hiap-raw-data">
            {JSON.stringify(hiapData.data, null, 2)}
          </pre>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
        {actions.map((action, index) => renderActionCard(action, index))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {actionType === 'mitigation' ? 
              <Leaf className="h-5 w-5 text-green-600" /> : 
              <Shield className="h-5 w-5 text-blue-600" />
            }
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
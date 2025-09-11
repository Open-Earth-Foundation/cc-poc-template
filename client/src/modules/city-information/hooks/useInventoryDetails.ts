import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/core/lib/queryClient";

export interface InventoryDetails {
  inventoryId: string;
  inventoryName: string;
  year: number;
  totalEmissions: number | null;
  cityId: string;
  totalCountryEmissions: number | null;
  isPublic: boolean;
  publishedAt: string | null;
  inventoryType: string;
  globalWarmingPotentialType: string;
  lastUpdated: string;
  created: string;
  city: {
    cityId: string;
    locode: string;
    name: string;
    shape: any;
    country: string;
    region: string;
    countryLocode: string;
    regionLocode: string;
    area: string;
    projectId: string;
    created: string;
    last_updated: string;
    project: {
      projectId: string;
      name: string;
      organizationId: string;
    };
  };
}

async function getInventoryDetails(inventoryId: string): Promise<{ data: InventoryDetails }> {
  const res = await apiRequest("GET", `/api/citycatalyst/inventory/${inventoryId}`);
  return await res.json();
}

export function useInventoryDetails(inventoryId: string | undefined) {
  return useQuery({
    queryKey: ['/api/citycatalyst/inventory', inventoryId],
    queryFn: () => getInventoryDetails(inventoryId!),
    enabled: !!inventoryId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
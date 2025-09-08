import { apiRequest } from "@/lib/queryClient";
import { OSMBoundary, BoundarySearchParams, Boundary } from "@/types/boundary";

export async function searchBoundaries(params: BoundarySearchParams): Promise<{ boundaries: OSMBoundary[] }> {
  const queryParams = new URLSearchParams({
    cityName: params.cityName,
    country: params.country,
    ...(params.countryCode && { countryCode: params.countryCode }),
    ...(params.limit && { limit: params.limit.toString() }),
  });
  
  const res = await apiRequest("GET", `/api/boundaries/search?${queryParams}`);
  return await res.json();
}

export async function selectBoundary(cityId: string, osmId: string, osmType: 'way' | 'relation') {
  const res = await apiRequest("POST", "/api/boundaries/select", {
    cityId,
    osmId,
    osmType,
  });
  return await res.json();
}

export async function getCityBoundaries(cityId: string): Promise<{ boundaries: Boundary[] }> {
  const res = await apiRequest("GET", `/api/boundaries/${cityId}`);
  return await res.json();
}

export async function downloadBoundary(osmId: string): Promise<Blob> {
  const res = await apiRequest("GET", `/api/boundaries/download/${osmId}`);
  return await res.blob();
}

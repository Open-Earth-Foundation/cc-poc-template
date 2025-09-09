import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { OSMBoundary, BoundarySearchParams, Boundary } from "@/modules/boundary/types/boundary";
import { searchBoundaries, selectBoundary, getCityBoundaries } from "@/modules/boundary/services/osmService";

export function useBoundarySearch(params: BoundarySearchParams | null) {
  return useQuery<{ boundaries: OSMBoundary[] }>({
    queryKey: ['/api/boundaries/search', params],
    queryFn: () => searchBoundaries(params!),
    enabled: !!params,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCityBoundaries(cityId: string | undefined) {
  return useQuery<{ boundaries: Boundary[] }>({
    queryKey: ['/api/boundaries', cityId],
    queryFn: () => getCityBoundaries(cityId!),
    enabled: !!cityId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useBoundarySelection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ cityId, osmId, osmType }: { cityId: string; osmId: string; osmType: 'way' | 'relation' }) =>
      selectBoundary(cityId, osmId, osmType),
    onSuccess: (data, variables) => {
      // Invalidate city boundaries to refetch
      queryClient.invalidateQueries({ queryKey: ['/api/boundaries', variables.cityId] });
    },
  });
}

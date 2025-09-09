import { useQuery } from "@tanstack/react-query";
import { City } from "@/core/types/city";
import { getCities, getCity } from "@/core/services/cityService";

export function useCities() {
  return useQuery<{ cities: City[] }>({
    queryKey: ['/api/cities'],
    queryFn: getCities,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCity(cityId: string | undefined) {
  return useQuery<{ city: City }>({
    queryKey: ['/api/cities', cityId],
    queryFn: () => getCity(cityId!),
    enabled: !!cityId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

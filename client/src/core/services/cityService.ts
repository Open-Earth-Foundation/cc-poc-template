import { apiRequest } from "@/core/lib/queryClient";
import { City } from "@/core/types/city";

export async function getCities(): Promise<{ cities: City[] }> {
  const res = await apiRequest("GET", "/api/cities");
  return await res.json();
}

export async function getCity(cityId: string): Promise<{ city: City }> {
  const res = await apiRequest("GET", `/api/cities/${cityId}`);
  return await res.json();
}

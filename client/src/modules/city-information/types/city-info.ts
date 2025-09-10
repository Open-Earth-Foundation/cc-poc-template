// Types for CityCatalyst city information data
export interface CityCatalystInventory {
  year: number;
  id?: string;
}

export interface CityCatalystCityDetail {
  locode: string;
  name: string;
  country?: string;
  inventories?: CityCatalystInventory[];
  metadata?: Record<string, any>;
}

export interface CityCatalystInventoryData {
  // This will be populated as we discover the actual API structure
  [key: string]: any;
  sectors?: GPCSector[];
  total?: number;
  year?: number;
}

export interface GPCSector {
  id: string;
  name: string;
  emissions?: number;
  subsectors?: GPCSubsector[];
}

export interface GPCSubsector {
  id: string;
  name: string;
  emissions?: number;
  data?: any[];
}

export interface CityBoundary {
  type: "Feature";
  properties: Record<string, any>;
  geometry: {
    type: string;
    coordinates: any;
  };
}

export interface CityInventorySummary {
  locode: string;
  name: string;
  years: number[];
  inventories: CityCatalystInventory[];
}
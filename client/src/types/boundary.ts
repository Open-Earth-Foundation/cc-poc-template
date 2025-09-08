export interface Boundary {
  id: string;
  osmId: string;
  osmType: 'way' | 'relation';
  cityId: string;
  name: string;
  adminLevel?: string;
  boundaryType: string;
  area?: string;
  geometry: any;
  tags: Record<string, any>;
  score?: string;
  isSelected: boolean;
  createdAt: Date;
}

export interface OSMBoundary {
  osmId: string;
  osmType: 'way' | 'relation';
  name: string;
  adminLevel?: string;
  boundaryType: string;
  area?: number;
  geometry: any;
  tags: Record<string, any>;
  score: number;
}

export interface BoundarySearchParams {
  cityName: string;
  country: string;
  countryCode?: string;
  limit?: number;
}

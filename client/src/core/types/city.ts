export interface City {
  id: string;
  cityId: string;
  name: string;
  country: string;
  locode?: string;
  projectId: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  cities: string[];
}

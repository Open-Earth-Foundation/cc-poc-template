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

// CCRA (Climate Change Risk Assessment) Dashboard Types
export interface CCRADashboardData {
  // Flexible structure to accommodate various CCRA data formats
  [key: string]: any;
  
  // Common CCRA fields that might be present
  hazards?: ClimateHazard[];
  vulnerabilities?: VulnerabilityAssessment[];
  riskScores?: RiskScore[];
  adaptationMeasures?: AdaptationMeasure[];
  assessmentSummary?: AssessmentSummary;
}

export interface ClimateHazard {
  id: string;
  name: string;
  type: string;
  severity?: string | number;
  likelihood?: string | number;
  description?: string;
}

export interface VulnerabilityAssessment {
  sector: string;
  vulnerabilityLevel: string | number;
  description?: string;
  affectedPopulation?: number;
}

export interface RiskScore {
  category: string;
  score: number;
  level: 'Low' | 'Medium' | 'High' | 'Critical';
  description?: string;
}

export interface AdaptationMeasure {
  id: string;
  title: string;
  description: string;
  category: string;
  priority?: string;
  status?: string;
  estimatedCost?: number;
}

export interface AssessmentSummary {
  overallRiskLevel: string;
  majorHazards: string[];
  prioritySectors: string[];
  keyRecommendations: string[];
  lastUpdated?: string;
}
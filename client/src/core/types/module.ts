export interface ModuleRoute {
  path: string;
  component: React.ComponentType;
}

export interface ModuleConfig {
  id: string;
  name: string;
  description: string;
  routes: ModuleRoute[];
  enabled: boolean;
}

export interface ModuleRegistry {
  [moduleId: string]: ModuleConfig;
}

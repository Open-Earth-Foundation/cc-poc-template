import { Route } from 'wouter';
import { moduleRegistry } from './module-registry';

export function DynamicModuleRoutes() {
  return (
    <>
      {Object.values(moduleRegistry)
        .filter(module => module.enabled)
        .flatMap(module =>
          module.routes.map(route => (
            <Route
              key={`${module.id}-${route.path}`}
              path={route.path}
              component={route.component}
            />
          ))
        )}
    </>
  );
}

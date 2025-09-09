import { Switch, Route } from "wouter";
import { queryClient } from "@/core/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/core/components/ui/toaster";
import { TooltipProvider } from "@/core/components/ui/tooltip";
import { CityCatalystTab } from "@/core/components/layout/citycatalyst-tab";

// Core pages
import Login from "@/core/pages/login";
import CitySelection from "@/core/pages/city-selection";
import { OAuthCallback } from "@/core/components/auth/oauth-callback";
import NotFound from "@/core/pages/not-found";

// Dynamic module routing
import { DynamicModuleRoutes } from "@/core/routing/dynamic-routes";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/login" component={Login} />
      <Route path="/auth/callback" component={OAuthCallback} />
      <Route path="/cities" component={CitySelection} />
      
      {/* Dynamically loaded module routes */}
      <DynamicModuleRoutes />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <CityCatalystTab />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

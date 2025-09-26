import posthog from 'posthog-js';

/**
 * Analytics utility for consistent event tracking across the application
 *
 * This utility provides a consistent way to track events in PostHog with
 * automatic context injection (current path, app metadata, etc.)
 *
 * Event Naming Convention:
 * Use "Feature — Action — Result" format for consistency
 * Examples: "Auth — Login — Success", "City — Selected", "Language — Changed"
 */

export function track(event: string, props: Record<string, any> = {}) {
  if (!posthog) return;

  posthog.capture(event, {
    path: window.location.pathname,
    timestamp: new Date().toISOString(),
    ...props,
  });
}

export function identify(user?: {
  id: string;
  email?: string;
  role?: string;
  name?: string;
}) {
  if (!posthog || !user) return;

  posthog.identify(user.id, {
    email: user.email,
    role: user.role,
    name: user.name,
    identified_at: new Date().toISOString(),
  });
}

/**
 * Track page views manually (useful for SPA navigation)
 */
export function trackPageView(pageName?: string) {
  if (!posthog) return;

  posthog.capture('Page — Viewed', {
    page_name: pageName,
    path: window.location.pathname,
    url: window.location.href,
  });
}

/**
 * Track errors with context
 */
export function trackError(error: Error, context?: Record<string, any>) {
  if (!posthog) return;

  posthog.capture('Error — Occurred', {
    error_message: error.message,
    error_stack: error.stack,
    error_name: error.name,
    path: window.location.pathname,
    ...context,
  });
}

/**
 * Set user properties (without identifying)
 */
export function setUserProperties(properties: Record<string, any>) {
  if (!posthog) return;

  posthog.setPersonProperties(properties);
}

/**
 * Track feature usage
 */
export function trackFeature(
  feature: string,
  action: string,
  props?: Record<string, any>
) {
  track(`${feature} — ${action}`, props);
}

/**
 * Debounce helper for search tracking
 */
let searchDebounceTimer: NodeJS.Timeout | null = null;

/**
 * Common event trackers for frequently used patterns
 */
export const analytics = {
  // Authentication events
  auth: {
    loginAttempt: (method: string) =>
      track('Auth — Login — Attempt', { method }),
    loginSuccess: (userId: string, method: string) =>
      track('Auth — Login — Success', { user_id: userId, method }),
    loginFailure: (reason: string, method: string) =>
      track('Auth — Login — Failure', { reason, method }),
    logout: (userId: string) => track('Auth — Logout', { user_id: userId }),
  },

  // Navigation events
  navigation: {
    citySelected: (cityId: string, cityName: string) =>
      track('City — Selected', { city_id: cityId, city_name: cityName }),
    moduleOpened: (moduleName: string) =>
      track('Module — Opened', { module_name: moduleName }),
    pageViewed: (pageName: string) => trackPageView(pageName),
  },

  // User preferences
  preferences: {
    languageChanged: (from: string, to: string) =>
      track('Language — Changed', { from_language: from, to_language: to }),
    themeChanged: (theme: string) => track('Theme — Changed', { theme }),
  },

  // Inventory events
  inventory: {
    itemSelected: (inventoryId: string, type: string) =>
      track('Inventory — Item — Selected', { inventory_id: inventoryId, type }),
    itemViewed: (inventoryId: string, type: string) =>
      track('Inventory — Item — Viewed', { inventory_id: inventoryId, type }),
    detailsOpened: (inventoryId: string) =>
      track('Inventory — Details — Opened', { inventory_id: inventoryId }),
  },

  // Search and filter events
  search: {
    performed: (query: string, resultsCount?: number, debounceMs = 300) => {
      if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        track('Search — Performed', {
          query,
          results_count: resultsCount,
          search_type: 'text',
        });
      }, debounceMs);
    },
    cleared: (previousQuery: string) =>
      track('Search — Cleared', { previous_query: previousQuery }),
  },

  filter: {
    applied: (filterType: string, filterValue: string, fromValue?: string) =>
      track('Filter — Applied', {
        filter_type: filterType,
        filter_value: filterValue,
        from_value: fromValue,
      }),
  },

  // Error tracking
  error: {
    boundary: (error: Error, componentStack?: string) =>
      trackError(error, { component_stack: componentStack, type: 'boundary' }),
    api: (endpoint: string, status: number, error: string) =>
      track('Error — API', { endpoint, status, error }),
    generic: (error: Error, context?: Record<string, any>) =>
      trackError(error, { type: 'generic', ...context }),
  },
};

// Export the posthog instance for advanced usage
export { posthog };

import { useEffect, useRef } from 'react';
import posthog from 'posthog-js';

/**
 * PostHog Boot Component
 *
 * Initializes PostHog with persistent properties and app grouping.
 * This component runs once at app startup to:
 * 1. Register persistent properties attached to ALL events from this app instance
 * 2. Set up app grouping so each remix/instance is analyzable separately
 * 3. Send an initial app loaded event
 */
export function PostHogBoot() {
  const initialized = useRef(false);

  useEffect(() => {
    // Prevent duplicate initialization in StrictMode during development
    if (initialized.current) return;
    initialized.current = true;
    // Get environment variables
    const APP_ID = import.meta.env.VITE_PUBLIC_APP_ID || 'unknown-app';
    const APP_ENV = import.meta.env.VITE_PUBLIC_APP_ENV || 'dev';

    // Attach properties to ALL events from this remix/instance
    posthog.register({
      app_id: APP_ID,
      app_env: APP_ENV,
      app_url: window.location.host,
      app_pathname: window.location.pathname,
      template_name: 'city-catalyst', // This identifies the template type
      user_agent: navigator.userAgent,
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
    });

    // Group analytics: treat each remix as an "app" group
    // This allows filtering/grouping by app instance in PostHog
    posthog.group('app', APP_ID, {
      name: APP_ID,
      url: window.location.host,
      template: 'city-catalyst',
      environment: APP_ENV,
      created_at: new Date().toISOString(),
    });

    // Send startup event for dashboard visibility
    posthog.capture('App — Loaded', {
      path: window.location.pathname,
      referrer: document.referrer,
      load_time: Date.now(),
    });

    // Track page visibility changes for engagement metrics
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        posthog.capture('App — Focused');
      } else {
        posthog.capture('App — Blurred');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null; // This component doesn't render anything
}

# Analytics Implementation Guide

This guide explains how PostHog analytics are implemented in this application and how to add new events when developing new features.

## Overview

PostHog analytics have been integrated to track user behavior and provide insights across all remixes of this template. Each remix/instance is identifiable by its unique `app_id` while reporting to the same PostHog project.

## Configuration

### Environment Variables

The following environment variables are required for PostHog to work:

```bash
VITE_PUBLIC_POSTHOG_KEY=your-posthog-api-key
VITE_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com  # EU region
VITE_PUBLIC_APP_ID=your-unique-app-identifier
VITE_PUBLIC_APP_ENV=dev|staging|prod
```

### Automatic Setup

- **PostHog Provider**: Initialized in `client/src/main.tsx` with proper configuration
- **App Identification**: Each remix gets unique properties and grouping via `PostHogBoot` component
- **Persistent Properties**: All events automatically include app metadata (app_id, environment, URL, etc.)

## Analytics Utility

Use the analytics utility at `client/src/core/lib/analytics.ts` for consistent event tracking:

```typescript
import { analytics, track, identify } from '@/core/lib/analytics'

// Quick tracking with predefined events
analytics.auth.loginSuccess(userId, 'oauth')
analytics.navigation.citySelected(cityId, cityName)
analytics.inventory.itemSelected(inventoryId, type)

// Custom events
track('Feature — Action — Result', { 
  custom_property: 'value',
  // path and timestamp are automatically added
})

// User identification
identify({
  id: 'user-123',
  email: 'user@example.com',
  name: 'John Doe'
})
```

## Event Naming Convention

Follow the **"Feature — Action — Result"** pattern for consistency:

- ✅ `Auth — Login — Success`
- ✅ `City — Selected`
- ✅ `Search — Performed`
- ✅ `Inventory — Details — Opened`
- ❌ `user_clicked_button`
- ❌ `LoginEvent`

## Predefined Event Categories

### Authentication Events
```typescript
analytics.auth.loginAttempt(method: string)
analytics.auth.loginSuccess(userId: string, method: string)
analytics.auth.loginFailure(reason: string, method: string)
analytics.auth.logout(userId: string)
```

### Navigation Events
```typescript
analytics.navigation.citySelected(cityId: string, cityName: string)
analytics.navigation.moduleOpened(moduleName: string)
analytics.navigation.pageViewed(pageName: string)
```

### User Preferences
```typescript
analytics.preferences.languageChanged(from: string, to: string)
analytics.preferences.themeChanged(theme: string)
```

### Inventory Events
```typescript
analytics.inventory.itemSelected(inventoryId: string, type: string)
analytics.inventory.itemViewed(inventoryId: string, type: string)
analytics.inventory.detailsOpened(inventoryId: string)
```

### Error Tracking
```typescript
analytics.error.boundary(error: Error, componentStack?: string)
analytics.error.api(endpoint: string, status: number, error: string)
analytics.error.generic(error: Error, context?: Record<string, any>)
```

## Adding Analytics to New Features

### 1. Import the Analytics Utility

```typescript
import { analytics, track } from '@/core/lib/analytics'
```

### 2. Track User Actions

Add tracking to important user interactions:

```typescript
const handleNewFeatureAction = () => {
  // Track the action
  analytics.featureName.actionName('parameter')
  
  // Or use custom tracking
  track('Feature — Action', {
    feature_id: 'unique-id',
    action_context: 'button_click'
  })
  
  // Your existing logic
  performAction()
}
```

### 3. Track Page Views

For new pages, add page view tracking:

```typescript
export default function NewPage() {
  // Track page view on mount
  useEffect(() => {
    analytics.navigation.pageViewed('New Feature Page')
  }, [])
  
  return <div>...</div>
}
```

### 4. Track Form Submissions

For forms and user input:

```typescript
const handleSubmit = (data: FormData) => {
  track('Form — Submit — Attempt', {
    form_name: 'contact_form',
    field_count: Object.keys(data).length
  })
  
  try {
    await submitForm(data)
    track('Form — Submit — Success', { form_name: 'contact_form' })
  } catch (error) {
    track('Form — Submit — Error', { 
      form_name: 'contact_form',
      error_message: error.message
    })
  }
}
```

### 5. Track Search and Filtering

For search functionality:

```typescript
const handleSearch = (query: string, results: any[]) => {
  track('Search — Performed', {
    query,
    results_count: results.length,
    search_type: 'full_text'
  })
}

const handleFilter = (filterType: string, filterValue: string) => {
  track('Filter — Applied', {
    filter_type: filterType,
    filter_value: filterValue
  })
}
```

## Best Practices

### 1. Be Consistent
- Use the same event naming pattern
- Include relevant context properties
- Track both attempts and results for important actions

### 2. Don't Over-Track
- Focus on meaningful user actions
- Avoid tracking every click or hover
- Consider user privacy

### 3. Include Context
- Always include relevant IDs (user_id, item_id, etc.)
- Add contextual information (current_page, feature_flag, etc.)
- Include error details for failures

### 4. Test Your Events
- Use the browser developer tools to verify events are sent
- Check PostHog dashboard to confirm events appear correctly
- Test edge cases and error scenarios

## Development Tips

### Debugging Events
PostHog will log events in development mode. Check the browser console for confirmation that events are being tracked.

### Testing Events
Create a test user flow and verify that all expected events are captured in PostHog.

### Performance
The analytics utility is lightweight and events are tracked asynchronously, but avoid tracking in tight loops or performance-critical code paths.

## Common Integration Points

### New Pages/Routes
```typescript
// Add to your page component
useEffect(() => {
  analytics.navigation.pageViewed('Page Name')
}, [])
```

### Interactive Components
```typescript
// Buttons, links, cards
<button onClick={() => {
  analytics.category.action(id)
  handleClick()
}}>
```

### Forms
```typescript
// Form submissions
const onSubmit = (data) => {
  track('Form — Submit', { form_type: 'registration' })
  // ... rest of logic
}
```

### Modals/Dialogs
```typescript
// When opened
const handleOpen = () => {
  track('Modal — Opened', { modal_type: 'confirmation' })
  setIsOpen(true)
}
```

### Error Boundaries
```typescript
// In error boundary components
componentDidCatch(error, errorInfo) {
  analytics.error.boundary(error, errorInfo.componentStack)
}
```

## Summary

This analytics setup provides comprehensive tracking while remaining flexible for future features. The combination of predefined event categories and custom tracking ensures consistent data collection across all template instances while allowing for specific feature requirements.

Remember: Analytics should enhance user experience insights, not hinder application performance. Track meaningful interactions and always consider user privacy when implementing new tracking.
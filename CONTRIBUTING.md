# Development Contract - CityCatalyst Template

## About This Template

This is a **proof-of-concept template** for CityCatalyst integrations, designed for **remixing and adaptation** to specific climate action use cases. When you remix this template, adapt these requirements to your specific needs.

## ⚠️ Non-Negotiable Requirements

Every new feature MUST follow these two rules. No exceptions.

### 🌐 Rule 1: Internationalization (i18n)

**NO hardcoded UI strings.** All user-facing text must support multiple languages.

```typescript
// ❌ WRONG - Hardcoded text
<Button>Submit Form</Button>

// ✅ CORRECT - Internationalized
const { t } = useTranslation();
<Button>{t('forms.submitButton')}</Button>
```

**Required Actions:**
- Add keys to both `client/src/locales/en.json` AND `client/src/locales/pt.json`
- Use consistent key structure: `module.component.text`
- Import `useTranslation` from `@/lib/i18n`

📚 **Full Documentation:** [docs/i18n.md](./docs/i18n.md)

### 📊 Rule 2: Analytics Integration

**ALL user interactions must be tracked** with PostHog events.

```typescript
// ✅ Required for every new page
useEffect(() => {
  analytics.track('Page Viewed', {
    page: 'Feature Name',
    path: window.location.pathname
  });
}, []);

// ✅ Required for user actions
const handleSubmit = () => {
  analytics.track('Feature — Action — Result', {
    feature: 'Contact Form',
    action: 'Submit',
    result: 'Success'
  });
};
```

**Naming Convention:** `Feature — Action — Result`

📚 **Full Documentation:** [docs/analytics.md](./docs/analytics.md)

## Definition of Done Checklist

Before marking any feature complete:

- [ ] **i18n Keys Added:** Both `en.json` and `pt.json` updated with new text
- [ ] **No Hardcoded Strings:** All UI text uses `t()` function
- [ ] **Page Tracking:** `Page Viewed` event added to new pages/routes
- [ ] **Action Tracking:** User interactions tracked with proper naming convention
- [ ] **Analytics Import:** Uses helpers from `client/src/core/lib/analytics.ts`

## Quick Reference

- **i18n Hook:** `import { useTranslation } from '@/lib/i18n'`
- **Analytics:** `import { analytics } from '@/core/lib/analytics'`
- **Locale Files:** `client/src/locales/{en,pt}.json`

## Enforcement

These requirements are automatically checked via PR templates and should be verified during code review. Non-compliance blocks feature acceptance.
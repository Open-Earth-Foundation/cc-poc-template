## Development Contract Compliance

### 🌐 Internationalization (i18n)
- [ ] Added keys to `client/src/locales/en.json`
- [ ] Added keys to `client/src/locales/pt.json`
- [ ] No hardcoded UI strings (all use `useTranslation()`)
- [ ] Key structure follows `module.component.text` pattern

### 📊 Analytics Integration
- [ ] Added `Page Viewed` events for new pages/routes
- [ ] User actions tracked with PostHog events
- [ ] Event naming follows "Feature — Action — Result" convention
- [ ] Uses helpers from `client/src/core/lib/analytics.ts`

### Files Modified (Check applicable)
- [ ] `client/src/locales/en.json`
- [ ] `client/src/locales/pt.json`
- [ ] Components use `useTranslation()` hook
- [ ] Components use `analytics.track()` for interactions

## Description

Brief description of changes...

---
📚 **Reference**: [CONTRIBUTING.md](../CONTRIBUTING.md) | [docs/i18n.md](../docs/i18n.md) | [docs/analytics.md](../docs/analytics.md)
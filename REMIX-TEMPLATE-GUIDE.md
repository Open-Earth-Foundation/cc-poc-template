
# How to Remix This CityCatalyst Template

This template is designed for **remixing and adaptation** to specific climate action use cases. Here's a step-by-step guide to customize it for your needs.

## 🎯 Template Remixing Framework

**Sample Prompt Structure:**
```
I want to reuse this template to create [YOUR APP NAME]. 

I want to keep most of the core functionality:
✅ OAuth authentication with CityCatalyst
✅ PostHog analytics tracking  
✅ Internationalization (i18n) support
✅ API calls to CityCatalyst services

But I want to REMOVE from the city selection page:
- [ ] Search functionality
- [ ] Project filtering  
- [ ] City metadata display
- [ ] [List other features you don't need]

And when the user selects a city, they should get:
[Describe your custom functionality here]

For example:
- A carbon tracking dashboard with trend charts
- A climate risk assessment tool with interactive maps
- A policy planning interface with action recommendations
- An emissions monitoring platform with real-time data
- [Your specific use case]

I have also added a PRD (Product Requirements Document) that describes the detailed goals of my module.
```

## 🏗️ Template Architecture Overview

This template follows a **modular architecture** designed for easy customization:

### Core Infrastructure (Keep As-Is)
Located in `client/src/core/` - **Don't modify these unless necessary**:
- **Authentication**: OAuth 2.0 PKCE flow with CityCatalyst (`core/hooks/useAuth.ts`)
- **Analytics**: PostHog integration (`core/lib/analytics.ts`) 
- **Internationalization**: i18n setup (`lib/i18n.ts`, `locales/`)
- **API Layer**: Query client and service abstractions (`core/services/`)
- **UI Components**: shadcn/ui component library (`core/components/ui/`)

### Customization Zone (Modify Here)
Located in `client/src/modules/` - **This is where you build your app**:
- **Current Module**: `city-information/` (emissions inventory viewer)
- **Your Module**: Create new folders here for your specific functionality

## 🔄 Step-by-Step Remix Process

### 1. Define Your Use Case
Choose your specific climate action focus:
- 📊 Municipal carbon tracking
- ⚠️ Climate risk assessment  
- 🎯 Policy planning tool
- 📈 Emissions monitoring
- 🏢 Building energy management
- 🚗 Transportation planning

### 2. Customize City Selection Page
Edit `client/src/core/pages/city-selection.tsx`:

**Remove unwanted features:**
- Search bar (`searchTerm` state and filtering logic)
- Project dropdown (`selectedProject` state and Select component)  
- City metadata cards (modify `CityCard` component display)
- User profile section (`UserDataCard` component)

**Keep essential functionality:**
- City list from CityCatalyst API
- City selection navigation
- Authentication requirements

### 3. Create Your Custom Module

**A. Create module structure:**
```
client/src/modules/your-module-name/
├── components/          # Your custom components
├── hooks/              # Data fetching hooks  
├── pages/              # Main page components
├── services/           # API service functions
└── types/              # TypeScript interfaces
```

**B. Register your module in routing:**
Edit `client/src/core/routing/module-registry.ts` to add your routes.

**C. Leverage existing CityCatalyst services:**
The template provides comprehensive API access - see [`CityCatalyst.md`](./CityCatalyst.md):
- **Inventory data**: Emissions with GPC sector breakdowns
- **CCRA data**: Climate Change Risk Assessment  
- **HIAP data**: Health Impact Assessment Policy recommendations
- **City boundaries**: GeoJSON boundary data
- **User cities**: Access-controlled city lists

### 4. Adapt Server Services (Optional)
Located in `server/services/` - **Extend if needed**:
- `cityService.ts` - Add new CityCatalyst API endpoints
- `authService.ts` - Keep as-is (handles OAuth flow)

## 📚 Key Documentation References

Before starting your remix, review these essential docs:

### Development Requirements
- **[CONTRIBUTING.md](./CONTRIBUTING.md)**: Required patterns for all new features
  - ✅ Internationalization: Add keys to `en.json` and `pt.json`  
  - ✅ Analytics: Track user actions with PostHog

### API Integration
- **[CityCatalyst.md](./CityCatalyst.md)**: Complete API endpoint documentation
- **[OAuth.md](./OAuth.md)**: Authentication flow details
- **[API.md](./API.md)**: Client-server API reference

### Setup & Configuration  
- **[SETUP.md](./SETUP.md)**: Environment and deployment guide
- **[replit.md](./replit.md)**: Template overview and architecture

## 🛠️ Common Customization Patterns

### Pattern 1: Data Dashboard
**Goal**: Show city metrics and trends
**Keep**: City selection, authentication, API services
**Modify**: Create chart components, add time-series data hooks
**Remove**: Complex inventory details, HIAP/CCRA modals

### Pattern 2: Risk Assessment Tool
**Goal**: Visualize climate risks and vulnerabilities  
**Keep**: CCRA services, city boundary data, authentication
**Modify**: Add risk scoring components, interactive maps
**Remove**: Emissions inventory details, policy recommendations

### Pattern 3: Policy Planning Interface
**Goal**: Action planning and implementation tracking
**Keep**: HIAP services, user authentication, city access
**Modify**: Create action management interface, progress tracking
**Remove**: Technical inventory data, risk assessment details

## 🚀 Development Workflow

1. **Fork this template** on Replit
2. **Define your use case** and create a PRD
3. **Remove unwanted features** from city selection page
4. **Create your module** in `client/src/modules/your-module/`
5. **Register routes** in module registry
6. **Add i18n keys** to translation files
7. **Implement analytics** for user actions
8. **Test authentication flow** with CityCatalyst
9. **Deploy on Replit** using existing configuration

## 💡 Pro Tips for Remixing

- **Reuse existing hooks**: `useCityInformation`, `useCCRADashboard`, `useHIAPData`
- **Follow naming patterns**: Use "Feature — Action — Result" for analytics
- **Leverage UI components**: shadcn/ui provides comprehensive component library
- **Keep authentication flow**: OAuth integration works out-of-the-box
- **Extend, don't rebuild**: Build on existing CityCatalyst service integration

## 📋 Template Checklist

Before publishing your remix:
- [ ] Core authentication still works
- [ ] Analytics tracking implemented for new features
- [ ] Internationalization keys added for UI text
- [ ] CityCatalyst API integration maintained
- [ ] README updated to reflect your specific use case
- [ ] Environment variables documented
- [ ] Module follows established patterns

---

**Need help?** Check the [CityCatalyst Documentation](https://citycatalyst.openearth.dev/docs/) for the latest API specifications and best practices.

**Ready to remix?** Start by defining your specific climate action use case and follow this guide to create your customized application!

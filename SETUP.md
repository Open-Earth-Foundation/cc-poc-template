# CityCatalyst Template Setup Guide

This guide provides step-by-step instructions for setting up and customizing this **CityCatalyst integration template**.

## About This Template

This is a **proof-of-concept template** that demonstrates comprehensive CityCatalyst API integration. It's designed for **remixing and adaptation** to specific climate action use cases.

### What This Template Includes
- ✅ Complete OAuth 2.0 PKCE authentication flow
- ✅ City emissions inventory data with GPC sector breakdowns
- ✅ Climate Change Risk Assessment (CCRA) dashboard
- ✅ Health Impact Assessment Policy (HIAP) action recommendations
- ✅ Comprehensive API documentation for future development

### Remix Workflow
1. **🔄 Remix** this template on Replit
2. **🎯 Define your specific use case** (e.g., municipal carbon tracking, risk assessment tool, policy planning dashboard)
3. **🔧 Customize the template** by adapting features to your needs
4. **📋 Update documentation** to reflect your new purpose

💡 **Developer Tip**: When in doubt about CityCatalyst APIs, authentication, or data structures, always refer to the official [CityCatalyst Documentation](https://citycatalyst.openearth.dev/docs/) for the most current information.

## Prerequisites

- Node.js 18+ installed
- Replit account (for deployment)
- CityCatalyst developer account and OAuth credentials

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the root directory with these variables:

```bash
# CityCatalyst OAuth Configuration
CLIENT_ID=your_citycatalyst_client_id
CLIENT_SECRET=your_citycatalyst_client_secret
AUTH_BASE_URL=https://citycatalyst.openearth.dev

# Application Configuration  
NODE_ENV=development
REPLIT_DOMAIN=your-app-name.replit.app

# Session Security (generate random strings)
SESSION_SECRET=your-very-long-random-session-secret
```

### Getting CityCatalyst Credentials

1. **Register your application** with CityCatalyst:
   - Visit CityCatalyst developer portal
   - Create new OAuth application
   - Set redirect URI to: `https://your-app-name.replit.app/api/auth/oauth/callback`

2. **Copy credentials** to your `.env` file:
   - Client ID from your OAuth app
   - Client Secret from your OAuth app

## Installation

1. **Remix this template on Replit:**
   - Click the "Fork" or "Remix" button on the Replit interface
   - Or clone locally:
   ```bash
   git clone <this-repository>
   cd citycatalyst-template
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   - Copy `.env.example` to `.env`
   - Fill in your CityCatalyst OAuth credentials
   - Update `REPLIT_DOMAIN` with your app's domain

## Development

### Running Locally

```bash
npm run dev
```

This starts the integrated Express + Vite development server on port 5000 with hot reloading.

### Project Structure

```
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── core/             # Core components and utilities
│   │   │   ├── components/   # Reusable UI components (shadcn/ui)
│   │   │   ├── hooks/        # Custom React hooks
│   │   │   ├── lib/          # Utility functions and query client
│   │   │   └── pages/        # Core page components
│   │   └── modules/          # Feature modules
│   │       └── city-information/  # City data display module
├── server/                   # Backend Express application
│   ├── services/            # Business logic services
│   │   ├── authService.ts   # OAuth and user management
│   │   └── cityService.ts   # CityCatalyst API integration
│   ├── routes.ts           # API route definitions
│   └── storage.ts          # Data storage interface
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Drizzle schemas and types
└── examples/              # Reference implementations
    └── boundary-editor/   # Advanced map editing example
```

### Key Files to Customize

#### 1. **Environment Configuration** (`.env`)
- Update OAuth credentials
- Set your domain and app name

#### 2. **Branding** (`client/src/core/components/`)
- Update app name and colors in components
- Modify `index.css` for custom styling

#### 3. **Data Schema** (`shared/schema.ts`)
- Add custom data models as needed
- Extend user or city schemas

#### 4. **API Routes** (`server/routes.ts`)
- Add custom API endpoints
- Extend CityCatalyst proxy endpoints

## Adding New Features

### 1. Create a New Module

```bash
mkdir client/src/modules/your-module
mkdir client/src/modules/your-module/{components,hooks,pages}
```

Example module structure:
```typescript
// client/src/modules/your-module/pages/your-page.tsx
export default function YourPage() {
  return <div>Your custom page</div>;
}
```

### 2. Register in Module Registry

```typescript
// client/src/core/routing/module-registry.ts
import YourPage from "@/modules/your-module/pages/your-page";

export const moduleRegistry: ModuleRegistry = {
  "your-module": {
    id: "your-module",
    name: "Your Module",
    description: "Description of your module",
    routes: [
      {
        path: "/your-path/:param",
        component: YourPage,
      },
    ],
    enabled: true,
  },
  // ... existing modules
};
```

### 3. Add API Endpoints

```typescript
// server/routes.ts
app.get('/api/your-endpoint', requireAuth, async (req: any, res) => {
  try {
    // Your endpoint logic
    res.json({ data: "your-data" });
  } catch (error) {
    res.status(500).json({ message: 'Error message' });
  }
});
```

## Internationalization (i18n)

This template includes complete internationalization support for English and Portuguese, with an easy-to-extend structure for additional languages.

### Features
- ✅ English and Portuguese translations
- ✅ Automatic language detection from browser preferences
- ✅ Language preference persistence in localStorage
- ✅ Elegant language switcher component
- ✅ Translation key organization by feature domain

### Quick Start
1. **Switch languages:** Use the language switcher (🇺🇸 EN / 🇧🇷 PT) in the app header
2. **Languages persist:** Your language choice is saved automatically
3. **All content translated:** Forms, navigation, data displays, and error messages

### For Developers
- **📖 Complete Documentation:** See [`docs/i18n.md`](docs/i18n.md) for comprehensive setup and usage guide
- **🌍 Adding Languages:** Step-by-step instructions for adding new languages
- **🔧 Translation Management:** How to add and organize translation keys
- **⚛️ Component Integration:** Best practices for using translations in React components

### Adding Translation/Language Support

**Quick checklist for contributors:**
- Add new translation keys to **all** language files (`en.json`, `pt.json`)
- Test language switching after changes
- Group keys by feature domain (e.g., `login.*`, `citySelection.*`)
- Use `t('key.path')` instead of hardcoded strings in components

For detailed instructions, see [`docs/i18n.md`](docs/i18n.md).

## Database Integration

### Using PostgreSQL (Advanced)

**Note:** This template uses in-memory storage by default, which is suitable for most use cases.

For persistent data storage beyond the current in-memory setup:

1. **Enable PostgreSQL in Replit:**
   - Use the database panel to create a PostgreSQL database
   - Copy connection details to environment variables

2. **Implement database storage:**
   - Extend the `IStorage` interface in `server/storage.ts`
   - Replace `MemStorage` with a database implementation
   - Use Drizzle ORM with schemas from `shared/schema.ts`

3. **This is an advanced customization** that requires additional setup beyond this template.

## Deployment on Replit

### 1. Import Project
- Import this repository to Replit
- Ensure the "Start application" workflow is configured to run `npm run dev`

### 2. Configure Environment
- Set environment variables in Replit Secrets panel
- Update `AUTH_BASE_URL` and redirect URLs

### 3. Update OAuth Redirect
- In your CityCatalyst OAuth app settings
- Set redirect URI to: `https://your-replit-app.replit.app/api/auth/oauth/callback`

### 4. Deploy
- Your app is automatically deployed when you run the workflow
- Access via `https://your-replit-app.replit.app`

## Customization Examples

### Custom API Service

```typescript
// server/services/yourService.ts
export class YourApiService {
  constructor(private accessToken: string) {}

  async getData(params: any) {
    // Your API integration logic
    return cityCatalystApiGet('/your/endpoint', this.accessToken);
  }
}
```

### Custom Frontend Hook

```typescript
// client/src/modules/your-module/hooks/useYourData.ts
import { useQuery } from '@tanstack/react-query';

export function useYourData(params: any) {
  return useQuery({
    queryKey: ['/api/your-endpoint', params],
    enabled: !!params
  });
}
```

### Custom Component

```typescript
// client/src/modules/your-module/components/YourComponent.tsx
import { Button } from "@/core/components/ui/button";
import { useYourData } from "../hooks/useYourData";

export function YourComponent({ cityId }: { cityId: string }) {
  const { data, isLoading, error } = useYourData({ cityId });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Your Data</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <Button onClick={() => window.location.reload()}>
        Refresh
      </Button>
    </div>
  );
}
```

## Troubleshooting

### Common Issues

#### 1. OAuth Redirect Mismatch
**Error:** "redirect_uri_mismatch"
**Solution:** Ensure OAuth app redirect URI exactly matches your deployed URL

#### 2. API 401 Errors
**Error:** "Not authenticated"  
**Solution:** Check if user is properly logged in and session is valid

#### 3. UUID Format Errors
**Error:** "Invalid cityId format"
**Solution:** Ensure you're using UUID format for city detail endpoints, LOCODE for inventory endpoints

#### 4. CORS Issues
**Error:** Cross-origin requests blocked  
**Solution:** This template serves frontend and backend from the same port, avoiding CORS issues

### Debug Mode

Enable verbose logging by setting:
```bash
NODE_ENV=development
DEBUG=true
```

### Logs and Monitoring

- Check Replit console for server errors
- Use browser developer tools for frontend issues
- Monitor network tab for API request/response details

## Next Steps

1. **Review the API documentation** in `API.md` for detailed endpoint information
2. **Examine the examples** in `examples/boundary-editor/` for advanced features
3. **Customize styling** and branding to match your needs
4. **Add your specific business logic** following the modular architecture
5. **Test thoroughly** with your CityCatalyst credentials before deployment

## Support

For issues specific to this template:
- Check the API documentation for proper endpoint usage
- Review error responses and implement proper error handling
- Ensure environment variables are correctly configured

For CityCatalyst API issues:
- Consult CityCatalyst API documentation
- Contact CityCatalyst support for OAuth or API access issues
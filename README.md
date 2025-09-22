# CityCatalyst Integration Template

A comprehensive **proof-of-concept template** for building climate action applications that integrate with CityCatalyst's data platform.

## 🎯 Purpose

This template is designed for **remixing and adaptation** to specific climate action use cases. When you remix this project, define your specific use case and adapt the template accordingly.

## 🌟 What This Template Demonstrates

- ✅ **Complete OAuth 2.0 PKCE Authentication** with CityCatalyst
- ✅ **City Emissions Inventory Data** with GPC sector breakdowns  
- ✅ **Climate Change Risk Assessment (CCRA)** visualization
- ✅ **Health Impact Assessment Policy (HIAP)** action recommendations
- ✅ **Comprehensive API Documentation** for future remixes
- ✅ **Modular Architecture** for easy customization

## 🚀 Quick Start

### 1. Remix This Template
- Click "Fork" or "Remix" on Replit
- Or clone locally: `git clone <this-repository>`

### 2. Define Your Use Case
Choose what you want to build:
- 📊 **Municipal Carbon Tracking Dashboard**
- ⚠️ **Climate Risk Assessment Tool** 
- 🎯 **Policy Planning Application**
- 📈 **Emissions Monitoring Platform**
- 🔄 **Climate Action Progress Tracker**

### 3. Customize the Template
- Remove features you don't need
- Enhance features relevant to your use case
- Adapt the UI to your requirements
- Update documentation to reflect your purpose

## 📚 Documentation

- **[Setup Guide](./SETUP.md)** - Installation and configuration
- **[API Documentation](./API.md)** - Complete endpoint reference
- **[Integration Guide](./CityCatalyst-OAuth-Integration-Guide.md)** - Detailed implementation guide
- **[Contributing Guidelines](./CONTRIBUTING.md)** - Development requirements

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Authentication**: OAuth 2.0 PKCE with CityCatalyst
- **State Management**: TanStack Query for server state
- **Maps**: Leaflet for boundary visualization
- **Database**: PostgreSQL with Drizzle ORM

## 🔧 Environment Setup

Required environment variables:
```bash
# CityCatalyst OAuth
CLIENT_ID=your_citycatalyst_client_id
CLIENT_SECRET=your_citycatalyst_client_secret
AUTH_BASE_URL=https://citycatalyst.openearth.dev

# Application
NODE_ENV=development
SESSION_SECRET=your-session-secret
```

## 🎨 Example Use Cases

### Carbon Tracking Dashboard
Keep inventory data, remove CCRA/HIAP features, add custom emissions tracking charts.

### Climate Risk Tool  
Focus on CCRA data, remove inventory details, add risk scoring and mapping features.

### Policy Planning App
Emphasize HIAP recommendations, add action tracking and progress monitoring.

## 📖 Learn More

- **[CityCatalyst Platform](https://citycatalyst.openearth.dev)** - Main platform
- **[Replit](https://replit.com)** - Development and hosting platform
- **[Full Documentation](./docs/)** - Detailed guides and examples

---

**Ready to build your climate action application?** Start by defining your specific use case, then adapt this template to your needs!
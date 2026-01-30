# CoreTech Stack Alignment Tool

## Overview

This is a full-stack web application for MSPs (Managed Service Providers) to track customer software stacks against recommended baselines. The tool generates gap reports with coverage scores and upsell-ready recommendations.

The application allows users to:
- Define technology categories (RMM, PSA, Security, etc.)
- Manage a catalog of software tools within categories
- Create baseline configurations representing ideal tool stacks
- Track each customer's current software stack
- Generate gap reports comparing customer stacks to baselines

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query) for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite
- **Animations**: Framer Motion

The frontend follows a pages-based structure with shared components:
- `/client/src/pages/` - Main page components (stack-tracker, admin-portal)
- `/client/src/components/ui/` - Reusable UI components from shadcn/ui
- `/client/src/hooks/` - Custom React hooks for data fetching and state
- `/client/src/lib/` - Utility functions and API client

### Backend Architecture
- **Framework**: Express 5 on Node.js
- **Language**: TypeScript with ES modules
- **API Style**: RESTful JSON API
- **Database ORM**: Drizzle ORM with PostgreSQL

The backend uses a simple layered architecture:
- `/server/routes.ts` - API route handlers
- `/server/storage.ts` - Data access layer using Drizzle
- `/db/index.ts` - Database connection configuration
- `/shared/schema.ts` - Shared type definitions and Zod schemas

### Data Model
Core entities defined in the shared schema:
- **Categories**: Technology categories (RMM, PSA, etc.) with sort order
- **Tools**: Software products belonging to categories
- **Baselines**: Recommended tool configurations with required/optional tools
- **Customers**: Customer records with their current tool selections, optional ConnectWise linkage
- **Users**: Basic user accounts for authentication

### ConnectWise Integration
The application integrates with ConnectWise Manage for automated customer and tool synchronization:
- **ConnectwiseSettings**: API credentials and sync configuration
- **ConnectwiseTypeMappings**: Maps CW company types to baselines and service tiers
- **ConnectwiseSkuMappings**: Maps agreement SKUs to application tools
- **ConnectwiseSyncLogs**: Audit trail for sync operations

Key integration files:
- `/server/connectwise-api.ts` - ConnectWise REST API client with pagination
- `/server/connectwise-sync.ts` - Sync service for importing companies and activating tools
- `/client/src/pages/connectwise-admin.tsx` - Admin UI for managing the integration

### Development vs Production
- Development: Vite dev server with HMR, proxied through Express
- Production: Vite builds static assets, Express serves them from `/dist/public`

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connected via `DATABASE_URL` environment variable
- **Drizzle ORM**: Database migrations stored in `/migrations` directory
- **connect-pg-simple**: Session storage in PostgreSQL

### UI Components
- **shadcn/ui**: Comprehensive component library built on Radix UI primitives
- **Radix UI**: Headless UI primitives for accessibility
- **Lucide React**: Icon library

### Build & Development
- **Vite**: Frontend build tool and dev server
- **esbuild**: Server bundling for production
- **tsx**: TypeScript execution for development

### Validation
- **Zod**: Schema validation for API requests
- **drizzle-zod**: Auto-generates Zod schemas from Drizzle tables
# Overview

This is an interactive 3D globe visualization application for displaying and analyzing global conflicts. The application presents conflict data on a realistic Earth globe using Three.js/React Three Fiber, allowing users to explore conflicts through an immersive 3D interface with filtering, comparison, and real-time update capabilities.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

### Core Technology Stack
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server with HMR support
- **React Three Fiber** and **@react-three/drei** for 3D rendering and WebGL-based globe visualization
- **TailwindCSS** for utility-first styling with custom theme configuration
- **Radix UI** components for accessible, unstyled UI primitives
- **GSAP** for smooth animations and camera transitions

### 3D Visualization Layer
The application uses a WebGL-based 3D globe as the primary interface:
- Custom Globe component with realistic Earth textures and country borders
- Dynamic conflict markers positioned using latitude/longitude coordinates converted to 3D vectors
- Intelligent camera controller that adjusts zoom based on visible conflicts
- Country labels with priority-based visibility and distance-based scaling
- GLSL shader support for advanced visual effects

### State Management
- Local React state for UI interactions and selections
- URL state synchronization for shareable filtered views
- WebSocket connection for real-time conflict data updates
- TanStack Query for server state management and caching

### Component Architecture
The UI is organized into specialized components:
- **Globe rendering**: Core 3D visualization (Globe, ConflictMarker, CountryBorders, CountryLabels)
- **Interactive panels**: Sidebar for details, FilterPanel, Timeline, ComparisonView
- **Admin features**: AdminPanel for monitoring WebSocket connection status
- **Error handling**: ErrorBoundary for graceful WebGL failure recovery

## Backend Architecture

### Server Framework
- **Express.js** server with TypeScript and ESM modules
- **Vite middleware** in development for HMR and asset serving
- **WebSocket server** for real-time conflict data synchronization

### API Structure
- RESTful endpoints for conflict CRUD operations
- WebSocket protocol for push-based updates (conflict:added, conflict:updated, conflict:deleted)
- File-based storage for conflicts data (JSON)
- In-memory user storage with interface for potential database migration

### Development vs Production
- Development: Vite middleware handles client-side rendering and HMR
- Production: Pre-built static assets served from dist/public
- Separate build processes for client (Vite) and server (esbuild)

## Data Storage Solutions

### Current Implementation
- **File-based storage**: Conflicts stored in `server/data/conflicts.json`
- **In-memory user storage**: MemStorage class implementing IStorage interface
- **Schema definitions**: Drizzle ORM schemas defined for future PostgreSQL migration

### Database Preparation
The application is configured for **PostgreSQL** via Drizzle ORM:
- Schema defined in `shared/schema.ts` with users table
- Drizzle Kit configured for migrations to `./migrations`
- Neon serverless PostgreSQL driver ready for deployment
- Current implementation uses interface pattern allowing easy swap from MemStorage to database implementation

### Data Models
- **Conflict**: Comprehensive conflict data including coordinates, severity, casualties, media links, and educational resources
- **User**: Basic authentication schema with username/password
- **Filter State**: UI state for region, severity, timeline, and search queries

## External Dependencies

### 3D Rendering & Visualization
- **@react-three/fiber**: React renderer for Three.js
- **@react-three/drei**: Helper components for R3F (OrbitControls, Stars, Html)
- **@react-three/postprocessing**: Visual effects pipeline
- **three.js**: Core 3D graphics library
- **vite-plugin-glsl**: GLSL shader compilation support

### UI Component Library
- **Radix UI**: Complete suite of accessible headless components (Dialog, Dropdown, Select, Tabs, Toast, etc.)
- **class-variance-authority**: Type-safe component variant styling
- **cmdk**: Command palette interface
- **tailwind-merge & clsx**: CSS class composition utilities

### Animation & Interactions
- **GSAP**: Professional-grade animation library for camera movements and marker transitions
- **embla-carousel-react**: Touch-friendly carousel component

### Data & State Management
- **@tanstack/react-query**: Server state management, caching, and synchronization
- **zod**: Schema validation for API contracts
- **drizzle-zod**: Integration between Drizzle ORM and Zod validation

### WebSocket Communication
- **ws**: WebSocket server implementation for real-time updates
- Custom hooks for connection management and message handling

### Database & ORM
- **drizzle-orm**: Type-safe SQL query builder and ORM
- **drizzle-kit**: Migration management and schema push utilities
- **@neondatabase/serverless**: Serverless PostgreSQL driver for Neon

### Developer Experience
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **tsx**: TypeScript execution for development server
- **date-fns**: Date manipulation and formatting

### Session & Authentication (Prepared)
- **connect-pg-simple**: PostgreSQL session store for Express (configured but not active)
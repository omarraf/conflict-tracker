# Global Conflict Tracker

An interactive 3D globe visualization platform for tracking and analyzing global conflicts with real-time data updates.

## Description

Global Conflict Tracker provides an immersive way to explore and understand ongoing conflicts around the world. The application features an interactive 3D globe powered by Mapbox, displaying conflict zones with detailed information, casualty statistics, and related media resources. Users can filter conflicts by region, severity, and timeline, compare multiple conflicts side-by-side, and receive real-time updates through WebSocket connections.

The platform automatically ingests conflict data from multiple trusted sources including ACLED, GDELT, and various RSS feeds, ensuring up-to-date information is always available.

## Tech Stack

### Frontend
- **React** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Mapbox GL JS** - Interactive 3D globe visualization
- **TailwindCSS** - Utility-first CSS framework
- **Vite** - Build tool and dev server

### Backend
- **Express.js** - Web application framework
- **WebSocket (ws)** - Real-time bidirectional communication
- **TypeScript** - Type-safe JavaScript
- **Drizzle ORM** - TypeScript ORM for database operations

### Database
- **PostgreSQL** - Primary data store (via Neon)

### Data Ingestion
- **ACLED API** - Armed Conflict Location & Event Data
- **GDELT** - Global Database of Events, Language, and Tone
- **RSS Feeds** - News aggregation from multiple sources

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React App (TypeScript)                                  │   │
│  │  ├─ Mapbox GL JS (3D Globe Visualization)               │   │
│  │  ├─ Filter Panel (Region/Severity/Timeline)             │   │
│  │  ├─ Conflict Sidebar (Details & Media)                  │   │
│  │  ├─ Comparison View (Multi-conflict Analysis)           │   │
│  │  └─ Export Panel (Data Export)                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ HTTP/REST & WebSocket (Real-time)
                        │
┌───────────────────────▼─────────────────────────────────────────┐
│                        Server Layer                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Express.js API Server (TypeScript)                      │   │
│  │  ├─ REST API Endpoints                                   │   │
│  │  │  ├─ GET    /api/conflicts                            │   │
│  │  │  ├─ POST   /api/conflicts                            │   │
│  │  │  ├─ PUT    /api/conflicts/:id                        │   │
│  │  │  └─ DELETE /api/conflicts/:id                        │   │
│  │  ├─ WebSocket Server (/ws)                              │   │
│  │  │  └─ Real-time conflict updates broadcast             │   │
│  │  └─ Data Ingestion Scheduler                            │   │
│  │     ├─ ACLED Service (Conflict events)                  │   │
│  │     ├─ GDELT Service (Global events)                    │   │
│  │     ├─ RSS Service (News feeds)                         │   │
│  │     └─ Matching Engine (Deduplication)                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ Drizzle ORM (SQL Queries)
                        │
┌───────────────────────▼─────────────────────────────────────────┐
│                      Database Layer                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  PostgreSQL (Neon)                                       │   │
│  │  ├─ conflicts table                                      │   │
│  │  │  ├─ Core data (name, region, severity, coordinates)  │   │
│  │  │  ├─ Media & resources (articles, educational links)  │   │
│  │  │  ├─ Recent updates (auto-ingested data)              │   │
│  │  │  └─ Flags (isAutoIngested, status)                   │   │
│  │  └─ users table (authentication)                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                        ▲
                        │
        ┌───────────────┴───────────────┬─────────────────┐
        │                               │                 │
┌───────▼────────┐            ┌─────────▼──────┐  ┌──────▼─────┐
│  ACLED API     │            │   GDELT API    │  │ RSS Feeds  │
│ (Conflict Data)│            │ (Events Data)  │  │ (News)     │
└────────────────┘            └────────────────┘  └────────────┘

External Data Sources (Scheduled Ingestion)
```

## Features

- **Interactive 3D Globe**: Explore conflicts on a rotating Earth powered by Mapbox GL JS
- **Real-time Updates**: WebSocket connections provide instant conflict data updates
- **Advanced Filtering**: Filter by region, severity level, and timeline
- **Conflict Comparison**: Compare up to 4 conflicts side-by-side
- **Data Export**: Export filtered conflict data in various formats
- **Automatic Data Ingestion**: Scheduled jobs pull data from ACLED, GDELT, and news sources
- **Responsive Design**: Mobile-friendly interface with touch controls
- **Source Attribution**: Links to original sources for verification

## API Endpoints

- `GET /api/conflicts` - Retrieve all conflicts
- `POST /api/conflicts` - Create a new conflict entry
- `PUT /api/conflicts/:id` - Update an existing conflict
- `DELETE /api/conflicts/:id` - Delete a conflict
- `GET /api/health` - Health check endpoint
- `WS /ws` - WebSocket connection for real-time updates

## Development

```bash
# Development mode
npm run dev

# Type checking
npm run check

# Build for production
npm run build

# Run production build
npm start

# Database operations
npm run db:push      # Push schema changes
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations
npm run db:studio    # Open Drizzle Studio

# Data ingestion
npm run ingest       # Manual data ingestion
npm run seed         # Seed curated conflicts
```

## Environment Variables

See `.env.example` for required environment variables.

## License

MIT

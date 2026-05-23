# Global Conflict Tracker

An interactive 3D globe for tracking global conflicts, backed by a production-grade data pipeline built with Kafka, Airflow, and dbt.

## What it does

Visualizes active conflicts on a 3D Mapbox globe with real-time updates via WebSocket. Conflict data is ingested from GDELT, ACLED, and RSS feeds, streamed through Kafka, stored in Postgres, and transformed by dbt before being served to the frontend.

## Data Pipeline

The ingestion architecture replaces a simple scheduler with a full event-driven pipeline:

```
Airflow DAGs → Python Producers → Confluent Kafka
                                         ↓
                              KafkaJS Consumer (Node.js)
                                         ↓
                              raw_gdelt_events (Postgres)
                                         ↓
                              dbt (staging → intermediate → marts)
                                         ↓
                    fct_conflicts  agg_regional_trends  agg_casualties_over_time
                                         ↓
                              REST API + WebSocket → Globe UI
```

**Airflow** (`airflow/`) — orchestrates hourly GDELT ingestion and daily dbt runs. Uses TaskFlow API, HttpSensor, XComs, and a custom `KafkaPublishOperator` with a local-JSONL fallback for development.

**Kafka** (`pipeline/`) — Pydantic-validated producers publish to `conflict-articles`. The KafkaJS consumer validates with Zod, writes raw events to Postgres, and fan-outs updates to `conflict-updates` for future consumers.

**dbt** (`dbt/`) — 3-layer transformation: staging models clean raw tables, intermediate models union sources and deduplicate by country, mart tables power the API and analytics endpoints. Includes a Haversine macro, regions seed, and data quality tests.

## Stack

| Layer | Tools |
|-------|-------|
| Frontend | React, TypeScript, Mapbox GL JS, TailwindCSS |
| Backend | Express, WebSocket, Drizzle ORM |
| Pipeline | Apache Airflow, Confluent Kafka, dbt Core |
| Database | Neon Postgres |
| Languages | TypeScript (server + client), Python (pipeline) |

## Running locally

```bash
# App
npm install
npm run dev          # http://localhost:3000

# Database
npm run db:push      # apply schema (includes raw ingestion tables)
npm run seed         # seed curated conflicts

# Airflow (requires Docker)
cd airflow
cp .env.example .env && echo "AIRFLOW_UID=$(id -u)" >> .env
docker compose up -d # UI → http://localhost:8080  (admin / admin)

# dbt
cd dbt
pip install -r requirements.txt
export DBT_HOST=... DBT_USER=... DBT_PASSWORD=... DBT_DBNAME=...
DBT_PROFILES_DIR=. dbt run && dbt test
```

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/conflicts` | All curated conflicts |
| POST | `/api/conflicts` | Create conflict |
| PUT | `/api/conflicts/:id` | Update conflict |
| DELETE | `/api/conflicts/:id` | Delete conflict |
| GET | `/api/analytics/regional-trends` | Weekly severity by region (dbt mart) |
| GET | `/api/analytics/casualties-timeline` | Daily fatalities over time (dbt mart) |
| GET | `/api/health` | Health check |
| WS | `/ws` | Real-time conflict updates |

## Environment variables

Copy `.env.example` and fill in:
- `DATABASE_URL` — Neon Postgres connection string
- `KAFKA_BOOTSTRAP_SERVERS`, `KAFKA_API_KEY`, `KAFKA_API_SECRET` — Confluent Cloud (optional; falls back to local JSONL)
- `ACLED_API_KEY` — optional, enables ACLED ingestion

## License

MIT

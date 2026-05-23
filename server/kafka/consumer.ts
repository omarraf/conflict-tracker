import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { WebSocketServer } from 'ws';
import { z } from 'zod';
import { storage } from '../storage';
import { findMatchingCuratedConflict, isDuplicateArticle, filterRecentArticles } from '../services/matching';
import { publishUpdate } from './producer';
import { getDb } from '../db';
import { rawGdeltEvents } from '@shared/schema';

// ── Incoming message schema (matches ConflictArticleMessage in Python) ──────

const ArticleRefSchema = z.object({
  url: z.string(),
  title: z.string(),
  domain: z.string().default(''),
  seen_at: z.string().default(''),
});

const ConflictArticleMessageSchema = z.object({
  source: z.enum(['gdelt', 'acled', 'rss']),
  country_code: z.string(),
  country: z.string(),
  region: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  avg_tone: z.number(),
  article_count: z.number(),
  articles: z.array(ArticleRefSchema),
  ingested_at: z.string(),
});

type ConflictArticleMessage = z.infer<typeof ConflictArticleMessageSchema>;

// ── Country → capital coordinates (mirrors gdelt.ts) ────────────────────────

const COUNTRY_COORDS: Record<string, { lat: number; lon: number }> = {
  'United States': { lat: 38.9072, lon: -77.0369 },
  'Ukraine':       { lat: 50.4501, lon: 30.5234 },
  'Russia':        { lat: 55.7558, lon: 37.6173 },
  'Israel':        { lat: 31.7683, lon: 35.2137 },
  'Palestine':     { lat: 31.9522, lon: 35.2332 },
  'Syria':         { lat: 33.5138, lon: 36.2765 },
  'Iraq':          { lat: 33.3152, lon: 44.3661 },
  'Afghanistan':   { lat: 34.5553, lon: 69.2075 },
  'Yemen':         { lat: 15.3694, lon: 44.191  },
  'Somalia':       { lat:  2.0469, lon: 45.3182 },
  'Sudan':         { lat: 15.5007, lon: 32.5599 },
  'Myanmar':       { lat: 16.8661, lon: 96.1951 },
  'China':         { lat: 39.9042, lon: 116.4074 },
  'India':         { lat: 28.6139, lon: 77.209  },
  'Pakistan':      { lat: 33.6844, lon: 73.0479 },
  'Nigeria':       { lat:  9.0765, lon:  7.3986 },
  'Ethiopia':      { lat:  9.145,  lon: 40.4897 },
  'Venezuela':     { lat: 10.4806, lon: -66.9036 },
  'Colombia':      { lat:  4.711,  lon: -74.0721 },
  'Mexico':        { lat: 19.4326, lon: -99.1332 },
};

// ── Transform Kafka message → InsertConflict ─────────────────────────────────

function toInsertConflict(msg: ConflictArticleMessage) {
  const coords = COUNTRY_COORDS[msg.country] ?? { lat: 0, lon: 0 };
  return {
    id: `kafka-${msg.source}-${msg.country_code}-${Date.now()}`,
    name: `Conflict Events in ${msg.country}`,
    startDate: new Date(msg.ingested_at),
    casualties: 0,
    countries: [msg.country],
    region: msg.region,
    severity: msg.severity,
    latitude: coords.lat,
    longitude: coords.lon,
    description:
      `${msg.article_count} articles aggregated from ${msg.source.toUpperCase()}. ` +
      `Average sentiment tone: ${msg.avg_tone}.`,
    mediaLinks: msg.articles.slice(0, 5).map((a) => ({
      type: 'article' as const,
      url: a.url,
      title: a.title || 'Conflict Report',
    })),
    educationalResources: [],
    status: 'active' as const,
    isAutoIngested: true,
  };
}

// ── WebSocket broadcast ──────────────────────────────────────────────────────

function broadcast(wss: WebSocketServer, type: string, data: unknown): void {
  const msg = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(msg);
  });
}

// ── Per-message handler ──────────────────────────────────────────────────────

async function writeRawEvent(msg: ConflictArticleMessage): Promise<void> {
  try {
    const db = getDb();
    await db.insert(rawGdeltEvents).values({
      countryCode: msg.country_code,
      country: msg.country,
      region: msg.region,
      severity: msg.severity,
      avgTone: msg.avg_tone,
      articleCount: msg.article_count,
      rawPayload: msg as unknown as Record<string, unknown>,
    });
  } catch (err) {
    console.error('[kafka-consumer] failed to write raw event:', err);
  }
}

async function handleMessage(
  raw: string,
  wss: WebSocketServer,
): Promise<void> {
  const parsed = ConflictArticleMessageSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    console.warn('[kafka-consumer] invalid message schema:', parsed.error.flatten());
    return;
  }

  const msg = parsed.data;

  // Write to raw table for dbt to consume
  await writeRawEvent(msg);

  const conflict = toInsertConflict(msg);
  const allConflicts = await storage.getConflicts();

  const curated = findMatchingCuratedConflict(
    { name: conflict.name, latitude: conflict.latitude, longitude: conflict.longitude, countries: conflict.countries },
    allConflicts,
  );

  if (curated) {
    const newArticle = {
      url: msg.articles[0]?.url ?? '',
      title: msg.articles[0]?.title ?? conflict.name,
      source: msg.source,
      publishedAt: new Date().toISOString(),
    };

    if (!isDuplicateArticle(newArticle, curated.recentArticles ?? [])) {
      const updated = await storage.updateConflict(curated.id, {
        recentArticles: filterRecentArticles([...(curated.recentArticles ?? []), newArticle]),
        recentDataUpdated: new Date(),
      });
      broadcast(wss, 'conflict:updated', updated);
      await publishUpdate({ type: 'conflict:updated', data: updated });
    }
    return;
  }

  const existing = await storage.getConflict(conflict.id);
  if (existing) {
    const updated = await storage.updateConflict(conflict.id, { ...conflict, isAutoIngested: true });
    broadcast(wss, 'conflict:updated', updated);
    await publishUpdate({ type: 'conflict:updated', data: updated });
  } else {
    const created = await storage.createConflict(conflict);
    broadcast(wss, 'conflict:added', created);
    await publishUpdate({ type: 'conflict:added', data: created });
  }
}

// ── Consumer lifecycle ───────────────────────────────────────────────────────

let _consumer: Consumer | null = null;

export async function startKafkaConsumer(wss: WebSocketServer): Promise<void> {
  const kafka = new Kafka({
    clientId: 'conflict-tracker-consumer',
    brokers: [process.env.KAFKA_BOOTSTRAP_SERVERS!],
    ssl: true,
    sasl: {
      mechanism: 'plain',
      username: process.env.KAFKA_API_KEY!,
      password: process.env.KAFKA_API_SECRET!,
    },
  });

  _consumer = kafka.consumer({ groupId: 'conflict-tracker-server' });
  await _consumer.connect();
  await _consumer.subscribe({ topics: ['conflict-articles'], fromBeginning: false });

  await _consumer.run({
    eachMessage: async ({ message }: EachMessagePayload) => {
      if (!message.value) return;
      try {
        await handleMessage(message.value.toString(), wss);
      } catch (err) {
        console.error('[kafka-consumer] error processing message:', err);
      }
    },
  });

  console.log('[kafka-consumer] subscribed to conflict-articles');
}

export async function stopKafkaConsumer(): Promise<void> {
  if (_consumer) {
    await _consumer.disconnect();
    _consumer = null;
  }
}

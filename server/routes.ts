import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer } from "ws";
import { getScheduler } from "./services/scheduler";
import { startKafkaConsumer, stopKafkaConsumer } from "./kafka/consumer";
import { disconnectProducer } from "./kafka/producer";
import { insertConflictSchema } from "@shared/schema";
import { z } from "zod";

function broadcastUpdate(wss: WebSocketServer, type: string, data: any) {
  const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({
    server: httpServer,
    path: "/ws",
    verifyClient: (info) => {
      // In production, validate origin
      if (process.env.NODE_ENV === 'production' && process.env.ALLOWED_ORIGINS) {
        const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');
        const origin = info.origin || info.req.headers.origin;
        return allowedOrigins.includes(origin as string);
      }
      return true;
    }
  });

  // Ingestion: Kafka consumer (Phase 2) takes priority; fall back to scheduler.
  if (process.env.KAFKA_BOOTSTRAP_SERVERS) {
    console.log('Kafka configured — starting KafkaJS consumer (scheduler disabled)');
    startKafkaConsumer(wss).catch((err) => {
      console.error('Failed to start Kafka consumer:', err);
    });

    // Clean up on server shutdown
    process.on('SIGTERM', async () => {
      await stopKafkaConsumer();
      await disconnectProducer();
    });
  } else if (process.env.DATABASE_URL) {
    console.log('Initializing automatic data ingestion scheduler...');
    const scheduler = getScheduler(wss);
    scheduler.start();
  } else {
    console.warn('DATABASE_URL not configured - automatic data updates disabled');
  }

  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");

    ws.send(JSON.stringify({
      type: "connected",
      message: "Connected to conflict updates",
      timestamp: new Date().toISOString()
    }));

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });
  });

  app.get("/api/conflicts", async (req, res) => {
    try {
      const conflicts = await storage.getConflicts();
      res.json(conflicts);
    } catch (error) {
      console.error("Error fetching conflicts:", error);
      res.status(500).json({ error: "Failed to fetch conflicts" });
    }
  });

  app.post("/api/conflicts", async (req, res) => {
    try {
      // Validate request body
      const validationResult = insertConflictSchema.safeParse({
        ...req.body,
        id: req.body.id || `conflict-${Date.now()}`,
      });

      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid request data",
          details: validationResult.error.errors,
        });
      }

      const created = await storage.createConflict(validationResult.data);
      broadcastUpdate(wss, "conflict:added", created);
      res.status(201).json(created);
    } catch (error) {
      console.error("Error creating conflict:", error);
      res.status(500).json({ error: "Failed to create conflict" });
    }
  });

  app.put("/api/conflicts/:id", async (req, res) => {
    try {
      // Validate request body (partial update allowed)
      const validationResult = insertConflictSchema.partial().safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid request data",
          details: validationResult.error.errors,
        });
      }

      const updated = await storage.updateConflict(req.params.id, validationResult.data);

      if (!updated) {
        return res.status(404).json({ error: "Conflict not found" });
      }

      broadcastUpdate(wss, "conflict:updated", updated);
      res.json(updated);
    } catch (error) {
      console.error("Error updating conflict:", error);
      res.status(500).json({ error: "Failed to update conflict" });
    }
  });

  app.delete("/api/conflicts/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteConflict(req.params.id);

      if (!deleted) {
        return res.status(404).json({ error: "Conflict not found" });
      }

      broadcastUpdate(wss, "conflict:deleted", { id: req.params.id });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting conflict:", error);
      res.status(500).json({ error: "Failed to delete conflict" });
    }
  });

  // Analytics endpoints — powered by dbt mart tables
  app.get("/api/analytics/regional-trends", async (req, res) => {
    try {
      const trends = await storage.getRegionalTrends();
      res.json(trends);
    } catch (error) {
      console.error("Error fetching regional trends:", error);
      res.status(500).json({ error: "Failed to fetch regional trends" });
    }
  });

  app.get("/api/analytics/casualties-timeline", async (req, res) => {
    try {
      const timeline = await storage.getCasualtiesTimeline();
      res.json(timeline);
    } catch (error) {
      console.error("Error fetching casualties timeline:", error);
      res.status(500).json({ error: "Failed to fetch casualties timeline" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      database: process.env.DATABASE_URL ? "connected" : "not configured",
      timestamp: new Date().toISOString(),
    });
  });

  return httpServer;
}

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer } from "ws";
import { getScheduler } from "./services/scheduler";

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
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  // Start the scheduler for automatic data updates
  if (process.env.DATABASE_URL) {
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

  app.get("/api/mapbox-token", (req, res) => {
    res.json({ token: process.env.MAPBOX_ACCESS_TOKEN || '' });
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
      const newConflict = {
        ...req.body,
        id: req.body.id || `conflict-${Date.now()}`,
      };

      const created = await storage.createConflict(newConflict);
      broadcastUpdate(wss, "conflict:added", created);
      res.status(201).json(created);
    } catch (error) {
      console.error("Error creating conflict:", error);
      res.status(500).json({ error: "Failed to create conflict" });
    }
  });

  app.put("/api/conflicts/:id", async (req, res) => {
    try {
      const updated = await storage.updateConflict(req.params.id, req.body);

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

  // Admin endpoint to manually trigger data ingestion
  app.post("/api/admin/ingest", async (req, res) => {
    try {
      if (!process.env.DATABASE_URL) {
        return res.status(503).json({ error: "Database not configured" });
      }

      const scheduler = getScheduler(wss);

      // Trigger ingestion asynchronously
      scheduler.triggerManualIngestion().catch(error => {
        console.error('Manual ingestion error:', error);
      });

      res.json({
        message: "Data ingestion started",
        status: "running"
      });
    } catch (error) {
      console.error("Error triggering ingestion:", error);
      res.status(500).json({ error: "Failed to trigger ingestion" });
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

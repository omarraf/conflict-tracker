import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer } from "ws";
import fs from "fs";
import path from "path";

const conflictsPath = path.join(process.cwd(), "server/data/conflicts.json");

if (!fs.existsSync(path.join(process.cwd(), "server/data"))) {
  fs.mkdirSync(path.join(process.cwd(), "server/data"), { recursive: true });
}

if (!fs.existsSync(conflictsPath)) {
  const clientData = path.join(process.cwd(), "client/src/data/conflicts.json");
  if (fs.existsSync(clientData)) {
    fs.copyFileSync(clientData, conflictsPath);
  } else {
    fs.writeFileSync(conflictsPath, "[]");
  }
}

function readConflicts() {
  try {
    const data = fs.readFileSync(conflictsPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading conflicts:", error);
    return [];
  }
}

function writeConflicts(conflicts: any[]) {
  try {
    fs.writeFileSync(conflictsPath, JSON.stringify(conflicts, null, 2));
    return true;
  } catch (error) {
    console.error("Error writing conflicts:", error);
    return false;
  }
}

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

  app.get("/api/conflicts", (req, res) => {
    const conflicts = readConflicts();
    res.json(conflicts);
  });

  app.post("/api/conflicts", (req, res) => {
    const conflicts = readConflicts();
    const newConflict = {
      ...req.body,
      id: `conflict-${Date.now()}`,
    };
    
    conflicts.push(newConflict);
    
    if (writeConflicts(conflicts)) {
      broadcastUpdate(wss, "conflict:added", newConflict);
      res.status(201).json(newConflict);
    } else {
      res.status(500).json({ error: "Failed to save conflict" });
    }
  });

  app.put("/api/conflicts/:id", (req, res) => {
    const conflicts = readConflicts();
    const index = conflicts.findIndex((c: any) => c.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: "Conflict not found" });
    }
    
    conflicts[index] = { ...conflicts[index], ...req.body };
    
    if (writeConflicts(conflicts)) {
      broadcastUpdate(wss, "conflict:updated", conflicts[index]);
      res.json(conflicts[index]);
    } else {
      res.status(500).json({ error: "Failed to update conflict" });
    }
  });

  app.delete("/api/conflicts/:id", (req, res) => {
    const conflicts = readConflicts();
    const filteredConflicts = conflicts.filter((c: any) => c.id !== req.params.id);
    
    if (conflicts.length === filteredConflicts.length) {
      return res.status(404).json({ error: "Conflict not found" });
    }
    
    if (writeConflicts(filteredConflicts)) {
      broadcastUpdate(wss, "conflict:deleted", { id: req.params.id });
      res.json({ success: true });
    } else {
      res.status(500).json({ error: "Failed to delete conflict" });
    }
  });

  return httpServer;
}

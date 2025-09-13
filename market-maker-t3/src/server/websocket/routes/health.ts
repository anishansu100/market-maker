import type { Express } from "express";

export function setupHealthRoutes(app: Express) {
  // Basic health check endpoint
  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Redis status endpoint (now required for user/message storage)
  app.get("/redis-status", async (req, res) => {
    try {
      if (!process.env.UPSTASH_REDIS_REST_URL) {
        res.status(500).json({ 
          status: "not_configured", 
          message: "Redis is required for user and message storage",
          timestamp: new Date().toISOString()
        });
        return;
      }

      const { redis } = await import("../../redis/index.js");
      await redis?.ping();
      res.json({ 
        status: "connected", 
        timestamp: new Date().toISOString(),
        url: process.env.UPSTASH_REDIS_REST_URL?.substring(0, 30) + "...",
        message: "Redis connected - storing users and messages"
      });
    } catch (error) {
      res.status(500).json({ 
        status: "error", 
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        message: "Redis connection failed - user and message storage unavailable"
      });
    }
  });

  // Debug endpoint to check what's stored for a specific room
  app.get("/debug-room/:roomCode", async (req, res) => {
    try {
      const { roomCode } = req.params;
      const { redis } = await import("../../redis/index.js");
      
      if (!redis) {
        res.status(500).json({ error: "Redis not available" });
        return;
      }

      // Check various Redis keys for this room
      const keys = await redis.keys(`*${roomCode}*`);
      const messageIds = await redis.zrange(`room:${roomCode}:messages`, 0, -1);
      const userCount = await redis.scard(`room:${roomCode}:users`);
      const roomInfo = await redis.get(`room:${roomCode}:info`);

      let parsedRoomInfo = null;
      if (roomInfo && typeof roomInfo === 'string') {
        try {
          parsedRoomInfo = JSON.parse(roomInfo) as unknown;
        } catch {
          parsedRoomInfo = null;
        }
      }

      res.json({
        roomCode,
        keys,
        messageIds,
        userCount,
        roomInfo: parsedRoomInfo,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Debug room error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
} 
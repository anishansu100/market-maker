import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

// Add global error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

console.log("🔍 Starting WebSocket server...");

try {
  // Import route handlers
  const { setupHealthRoutes } = await import("./routes/health.js");
  console.log("✅ Health routes loaded");

  // Import WebSocket handlers
  const { setupRoomHandlers } = await import("./handlers/rooms.js");
  const { setupMessageHandlers } = await import("./handlers/message.js");
  const { setupUserHandlers } = await import("./handlers/user.js");
  const { setupConnectionHandlers } = await import("./handlers/connection.js");
  console.log("✅ WebSocket handlers loaded");

  const app = express();
  app.use(cors());

  // Setup HTTP routes
  setupHealthRoutes(app);

  const httpServer = createServer(app);

  // Increase max listeners to prevent warning
  httpServer.setMaxListeners(20);

  const io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // Track active connections, need to find a better way to do this
  const activeConnections = new Set<string>();

  io.on("connection", (socket) => {
    // Check if this is a duplicate connection
    if (activeConnections.has(socket.id)) {
      console.log("🔄 Duplicate connection attempt:", socket.id);
      return;
    }

    activeConnections.add(socket.id);
    console.log("✅ User connected:", socket.id, `(Total: ${activeConnections.size})`);

    // Remove from tracking on disconnect
    socket.on("disconnect", (reason) => {
      activeConnections.delete(socket.id);
      console.log("❌ User disconnected:", socket.id, `(Reason: ${reason}, Remaining: ${activeConnections.size})`);
    });

    try {
      // Setup WebSocket event handlers
      setupRoomHandlers(socket, io);
      setupMessageHandlers(socket, io);
      setupUserHandlers(socket, io);
      setupConnectionHandlers(socket);
    } catch (error) {
      console.error("❌ Error setting up socket handlers:", error);
      activeConnections.delete(socket.id);
    }
  });

  // Graceful shutdown
  let isShuttingDown = false;

  const gracefulShutdown = (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    
    console.log(`🛑 Received ${signal}, shutting down gracefully`);
    
    void io.close(() => {
      console.log("📡 Socket.IO server closed");
      httpServer.close(() => {
        console.log("🌐 HTTP server closed");
        process.exit(0);
      });
    });
    
    // Force exit after 10 seconds
    void setTimeout(() => {
      console.log("⏰ Force exit after timeout");
      process.exit(1);
    }, 10000);
  };

  process.once("SIGINT", () => gracefulShutdown("SIGINT"));
  process.once("SIGTERM", () => gracefulShutdown("SIGTERM"));

  const PORT = process.env.WEBSOCKET_PORT ?? 4000;

  httpServer.listen(PORT, () => {
    console.log(`🚀 Socket.IO Room Server running on http://localhost:${PORT}`);
    console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`📊 Redis status: http://localhost:${PORT}/redis-status`);
    console.log(`🎮 Pure Socket.IO Rooms - No complex session management`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  });

} catch (error) {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
}

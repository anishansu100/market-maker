import type { Socket } from "socket.io";

export function setupConnectionHandlers(socket: Socket) {
  // Handle ping for connection health
  socket.on("ping", () => {
    socket.emit("pong", { timestamp: Date.now() });
  });

  // Handle errors
  socket.on("error", (error) => {
    console.error("🚨 Socket error:", error);
  });
} 
import type { Server } from "socket.io";
import { redisHelpers } from "../../redis/index.js";
import type { Message } from "../../redis/index.js";
import type { CustomSocket } from "../types.js";

export function setupMessageHandlers(socket: CustomSocket, io: Server) {
  // Send message to room
  socket.on("send_message", async ({ content }: { content: string }) => {
    if (!content || content.trim() === "") {
      socket.emit("error", { message: "Message content is required" });
      return;
    }

    try {
      if (!socket.user || !socket.room) {
        socket.emit("error", { message: "User not in any room" });
        return;
      }

      // Create message object
      const message: Message = {
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: content.trim(),
        user: socket.user,
        room: socket.room,
        timestamp: Date.now(),
      };

      // Store message in Redis
      await redisHelpers.addMessage(message);

      // Update room activity
      await redisHelpers.updateRoomInfo(socket.room);

      // Broadcast message to all users in the room (real-time via Socket.IO)
      io.to(socket.room).emit("new_message", message);

      console.log(`💬 Message from ${socket.user} in room ${socket.room}: ${content}`);
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // Get room message history
  socket.on("get_messages", async ({ limit = 50 }: { limit?: number } = {}) => {
    console.log(`📥 get_messages request from ${socket.user} in room ${socket.room}, limit: ${limit}`);
    
    try {
      if (!socket.room) {
        console.log("❌ User not in any room");
        socket.emit("error", { message: "User not in any room" });
        return;
      }

      console.log(`🔍 Fetching messages for room ${socket.room} from Redis...`);
      const messages = await redisHelpers.getRoomMessages(socket.room, limit);
      console.log(`📦 Found ${messages.length} messages in Redis for room ${socket.room}`);
      
      socket.emit("message_history", { messages, roomCode: socket.room });
      console.log(`📤 Sent message history to ${socket.user}`);
    } catch (error) {
      console.error("Error getting messages:", error);
      socket.emit("error", { message: "Failed to get messages" });
    }
  });
} 
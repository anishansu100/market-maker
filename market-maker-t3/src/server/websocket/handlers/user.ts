import type { Server } from "socket.io";
import { redisHelpers } from "../../redis/index.js";
import type { CustomSocket } from "../types.js";


export function setupUserHandlers(socket: CustomSocket, io?: Server) {
  // Simple join event (sets user only)
  socket.on("join", async ({ user }: { user: string }) => {
    if (!user || user.trim() === "") {
      socket.emit("error", { message: "User is required" });
      return;
    }

    try {
      // Set socket attributes
      socket.user = user;
      
      socket.emit("joined", { 
        user, 
        socketId: socket.id,
        timestamp: Date.now()
      });

      console.log(`👤 User ${user} connected`);
    } catch (error) {
      console.error("Error joining user:", error);
      socket.emit("error", { message: "Failed to join" });
    }
  });

  // Handle disconnect
  socket.on("disconnect", async () => {
    try {
      if (socket.user && socket.room) {
        // Remove user from Redis
        const removedUser = await redisHelpers.removeUser(socket.id);
        
        if (removedUser) {
          // Update room info in Redis
          const roomInfo = await redisHelpers.updateRoomInfo(socket.room);
          
          // Get updated user list after removing this user
          const updatedUsers = await redisHelpers.getRoomUsers(socket.room);
          
          // Broadcast updated user list to ALL remaining users in the room
          if (io) {
            io.to(socket.room).emit("room_users_updated", { 
              roomCode: socket.room,
              users: updatedUsers,
              totalUsers: roomInfo.userCount,
              timestamp: Date.now()
            });
          }

          console.log(`❌ User ${socket.user} disconnected from room ${socket.room} (Remaining: ${roomInfo.userCount})`);
        }
      } else {
        console.log("❌ User disconnected:", socket.id);
      }
    } catch (error) {
      console.error("Error handling disconnect:", error);
    }
  });
} 
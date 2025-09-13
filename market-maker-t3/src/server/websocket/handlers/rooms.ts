import type { Socket, Server } from "socket.io";
import { redisHelpers, redis } from "../../redis/index.js";
import type { User } from "../../redis/index.js";
import type { CustomSocket } from "../types.js";

export function setupRoomHandlers(socket: CustomSocket, io?: Server) {
  // Create a new room
  socket.on("create_room", async ({ roomCode }: { roomCode: string }) => {
    if (!roomCode || roomCode.trim() === "") {
      socket.emit("error", { message: "Room code is required" });
      return;
    }

    try {
      // Check if room already has users in Redis
      const existingUsers = await redisHelpers.getRoomUsers(roomCode);
      if (existingUsers.length > 0) {
        socket.emit("error", { message: "Room code already exists" });
        return;
      }

      // Initialize room info in Redis
      await redisHelpers.updateRoomInfo(roomCode);

      socket.emit("room_created", { 
        roomCode,
        timestamp: Date.now()
      });

      console.log(`🎮 Room ${roomCode} created`);
    } catch (error) {
      console.error("Error creating room:", error);
      socket.emit("error", { message: "Failed to create room" });
    }
  });

  // Join a room
  socket.on("join_room", async ({ user, roomCode }: { 
    user: string; 
    roomCode: string;
  }) => {
    if (!user || user.trim() === "") {
      socket.emit("error", { message: "User is required" });
      return;
    }

    if (!roomCode || roomCode.trim() === "") {
      socket.emit("error", { message: "Room code is required" });
      return;
    }

    try {
      // Check if user is already in this room (Redis check)
      const userExists = await redisHelpers.userExistsInRoom(roomCode, user);
      if (userExists) {
        socket.emit("error", { message: "User already in this room" });
        return;
      }

      // Set socket attributes
      socket.user = user;
      socket.room = roomCode;
      // Join Socket.IO room for real-time communication
      await socket.join(roomCode);

      // Store user in Redis
      const userData: User = {
        user,
        socketId: socket.id,
        room: roomCode,
        joinedAt: Date.now()
      };
      await redisHelpers.addUser(userData);

      // Debug: Test getRoomUsers immediately after addUser
      console.log(`🧪 Testing getRoomUsers immediately after addUser for room ${roomCode}`);
      const testUsers = await redisHelpers.getRoomUsers(roomCode);
      console.log(`🧪 Test result - found ${testUsers.length} users:`, testUsers.map(u => u.user));

      // Update room info in Redis
      const roomInfo = await redisHelpers.updateRoomInfo(roomCode);

      // Load existing messages from Redis
      const existingMessages = await redisHelpers.getRoomMessages(roomCode);
      
      // Get updated user list after adding this user
      const updatedUsers = await redisHelpers.getRoomUsers(roomCode);

      socket.emit("room_joined", { 
        user,
        socketId: socket.id,
        roomCode,
        timestamp: Date.now(),
        messages: existingMessages,
        users: updatedUsers  // Include full user list
      });
      
      // Broadcast updated user list to ALL users in the room (including the one who just joined)
      if (io) {
        io.to(roomCode).emit("room_users_updated", { 
          roomCode,
          users: updatedUsers,
          totalUsers: roomInfo.userCount,
          timestamp: Date.now()
        });
      }

      console.log(`👤 User ${user} joined room ${roomCode} (Total: ${roomInfo.userCount})`);
    } catch (error) {
      console.error("Error joining room:", error);
      socket.emit("error", { message: "Failed to join room" });
    }
  });

  // Get room info
  socket.on("get_room_info", async () => {
    try {
      if (!socket.room) {
        socket.emit("error", { message: "User not in any room" });
        return;
      }

      // Get users from Redis
      const users = await redisHelpers.getRoomUsers(socket.room);
      const roomInfo = await redisHelpers.getRoomInfo(socket.room);
      const messages = await redisHelpers.getRoomMessages(socket.room);

      socket.emit("room_info", {
        roomCode: socket.room,
        users,
        totalUsers: users.length,
        currentUser: {
          user: socket.user,
          socketId: socket.id,
          room: socket.room
        },
        roomInfo,
        messages
      });
    } catch (error) {
      console.error("Error getting room info:", error);
      socket.emit("error", { message: "Failed to get room info" });
    }
  });

  // Delete room (remove all data from Redis)
  socket.on("delete_room", async ({ roomCode }: { roomCode: string }) => {
    try {
      if (!redis) {
        console.log("⚠️ Redis not available, cannot delete room data");
        return;
      }

      if (!io) {
        console.log("⚠️ Socket.IO server not available, cannot disconnect users");
        return;
      }

      console.log(`🗑️ Deleting room ${roomCode} and all associated data`);

      // Get all users in the room first
      const users = await redisHelpers.getRoomUsers(roomCode);
      
      // Notify all users in the room that it's being deleted and sets everything to null
      io.to(roomCode).emit("room_deleted", { 
        roomCode, 
        message: "Room has been deleted",
        timestamp: Date.now()
      });

      // Remove all users from the Socket.IO room (but keep them connected to server)
      const socketsInRoom = await io.in(roomCode).fetchSockets();
      for (const roomSocket of socketsInRoom) {
        // Remove from room and clear socket attributes
        roomSocket.leave(roomCode);
        const customSocket = roomSocket as unknown as CustomSocket;
        customSocket.user = undefined;
        customSocket.room = undefined;
      }

      // Delete all room data - users, messages, and metadata
      const deletedKeysCount = await redisHelpers.deleteRoom(roomCode);
      
      console.log(`✅ Room ${roomCode} deleted successfully, ${socketsInRoom.length} users disconnected, ${deletedKeysCount} keys removed`);
    } catch (error) {
      console.error(`❌ Error deleting room ${roomCode}:`, error);
    }
  });

  // Start game (notify all users in the room to move to game phase)
  socket.on("start_game", async () => {
    try {
      if (!socket.room) {
        socket.emit("error", { message: "User not in any room" });
        return;
      }

      if (!io) {
        socket.emit("error", { message: "Cannot start game - server error" });
        return;
      }

      console.log(`🎮 Starting game in room ${socket.room}`);

      // Broadcast to ALL users in the room (including the one who started it)
      io.to(socket.room).emit("game_started", { 
        roomCode: socket.room,
        startedBy: socket.user,
        timestamp: Date.now()
      });

      console.log(`✅ Game started in room ${socket.room} by ${socket.user}`);
      
      // Start host explanation sequence after a brief delay
      if (socket.room && io) {
        setTimeout(() => {
          startHostExplanation(socket.room!, io);
        }, 1000);
      }
    } catch (error) {
      console.error(`❌ Error starting game in room ${socket.room}:`, error);
      socket.emit("error", { message: "Failed to start game" });
    }
  });

}

// Host explanation function
function startHostExplanation(roomCode: string, io: Server) {
  const GAME_RULES = [
    "🎮 Welcome to Market Maker!",
  ];

  // Notify all users that host explanation is starting
  io.to(roomCode).emit("host_explanation_started");

  // Send rules sequentially with delays
  GAME_RULES.forEach((rule, index) => {
    setTimeout(() => {
      // Send host message to all users in the room
      io.to(roomCode).emit("host_message", {
        content: rule,
        timestamp: Date.now()
      });
      
      // End explanation after last rule
      if (index === GAME_RULES.length - 1) {
        setTimeout(() => {
          io.to(roomCode).emit("host_message", {
            content: "💬 You can now start chatting! Good luck everyone!",
            timestamp: Date.now()
          });
          
          // Notify that explanation is finished
          io.to(roomCode).emit("host_explanation_finished");
        }, 2000); // Wait 2 seconds after last rule
      }
    }, index * 2000); // 2 seconds between each rule
  });
}
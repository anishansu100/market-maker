import { redis } from "../client.js";
import type { RoomInfo } from "../types.js";

export const roomHelpers = {
    async getRoomInfo(roomCode: string): Promise<RoomInfo | null> {
        if (!redis) return null;
        
        const roomData = await redis.get(`room:${roomCode}:info`);
        if (roomData && typeof roomData === "string") {
          try {
            return JSON.parse(roomData) as RoomInfo;
          } catch {
            return null;
          }
        }
        return null;
    },
  
    async updateRoomInfo(roomCode: string): Promise<RoomInfo> {
        if (!redis) {
        // Return default room info if Redis not available
        return { roomCode, createdAt: Date.now(), lastActivity: Date.now(), userCount: 0 };
        }
        
        // Get user count from hash length instead of set cardinality
        const usersData = await redis.hgetall(`room:${roomCode}:users`);
        const userCount = usersData && typeof usersData === "object" ? Object.keys(usersData).length : 0;
        const now = Date.now();
        
        let roomInfo: RoomInfo;
        const existingData = await redis.get(`room:${roomCode}:info`);
        
        if (existingData && typeof existingData === "string") {
        try {
            roomInfo = JSON.parse(existingData) as RoomInfo;
            roomInfo.lastActivity = now;
            roomInfo.userCount = userCount;
        } catch {
            roomInfo = { roomCode, createdAt: now, lastActivity: now, userCount };
        }
        } else {
        roomInfo = { roomCode, createdAt: now, lastActivity: now, userCount };
        }
        
        await redis.set(`room:${roomCode}:info`, JSON.stringify(roomInfo), { ex: 86400 });
        return roomInfo;
    },

    async deleteRoom(roomCode: string): Promise<number> {
        if (!redis) {
            console.log("⚠️ Redis not available, skipping room deletion");
            return 0;
        }
        
        console.log(`🗑️ Deleting all data for room ${roomCode}`);
        
        try {
            // Get all keys for this room
            const roomKeys = await redis.keys(`room:${roomCode}:*`);
            
            if (!Array.isArray(roomKeys) || roomKeys.length === 0) {
                console.log(`📋 No keys found for room ${roomCode}`);
                return 0;
            }
            
            console.log(`📋 Found ${roomKeys.length} keys to delete:`, roomKeys);
            
            // Delete all room keys at once
            await redis.del(...roomKeys);
            
            console.log(`✅ Deleted ${roomKeys.length} keys for room ${roomCode}`);
            return roomKeys.length;
        } catch (error) {
            console.error(`❌ Failed to delete room ${roomCode}:`, error);
            return 0;
        }
    },
}; 
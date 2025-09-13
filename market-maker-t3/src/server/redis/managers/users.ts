import { redis } from "../client.js";
import type { User } from "../types.js";

export const userHelpers = {
  async addUser(user: User): Promise<void> {
    if (!redis) throw new Error("Redis not configured");
    
    try {
      await Promise.all([
        redis.hset(`room:${user.room}:users`, { [user.socketId]: JSON.stringify(user) }),
        redis.hset(`room:${user.room}:usernames`, { [user.user]: user.socketId }),
      ]);
    } catch (error) {
      console.error(`❌ Failed to store user ${user.user}:`, error);
      throw error;
    }
  },

  async getUser(socketId: string): Promise<User | null> {
    if (!redis) return null;
    
    try {
      const roomKeys = await redis.keys("room:*:users");
      
      for (const roomKey of roomKeys) {
        if (typeof roomKey === "string") {
          const userData = await redis.hget(roomKey, socketId);
          if (userData && typeof userData === "string") {
      try {
              const user = JSON.parse(userData) as User;
              return user;
            } catch (error) {
              console.error(`❌ Failed to parse user data for ${socketId}:`, error);
            }
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Error getting user ${socketId}:`, error);
      return null;
    }
  },

  async removeUser(socketId: string): Promise<User | null> {
    if (!redis) return null;
    
    const user = await this.getUser(socketId);
    if (!user) {
      return null;
    }
    
    try {
      await Promise.all([
        redis.hdel(`room:${user.room}:users`, socketId),
        redis.hdel(`room:${user.room}:usernames`, user.user),
      ]);
      
      return user;
    } catch (error) {
      console.error(`❌ Failed to remove user ${socketId}:`, error);
      return null;
    }
  },

  async getRoomUsers(roomCode: string): Promise<User[]> {
    if (!redis) return [];
    
    try {
      const usersData = await redis.hgetall(`room:${roomCode}:users`);
      const users: User[] = [];
    
      if (usersData && typeof usersData === "object") {
        for (const [socketId, userData] of Object.entries(usersData)) {
          if (typeof userData === "string") {
            try {
              const user = JSON.parse(userData) as User;
              users.push(user);
            } catch (error) {
              console.error(`❌ Failed to parse user data for ${socketId}:`, error);
            }
          } else if (userData && typeof userData === "object") {
            const user = userData as User;
            users.push(user);
        }
      }
    }
    
    return users;
    } catch (error) {
      console.error(`❌ Error getting room users for ${roomCode}:`, error);
      return [];
    }
  },

  async userExistsInRoom(roomCode: string, username: string): Promise<boolean> {
    if (!redis) return false;
    
    const socketId = await redis.hget(`room:${roomCode}:usernames`, username);
    return socketId !== null;
  },
}; 
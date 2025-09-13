import { redis } from "../client.js";
import type { Message } from "../types.js";

export const messageHelpers = {
  async addMessage(message: Message): Promise<void> {
    if (!redis) {
      console.log("⚠️ Redis not available, skipping message storage");
      return;
    }
    
    await Promise.all([
      redis.hset(`room:${message.room}:messages`, { [message.messageId]: JSON.stringify(message) }),
      redis.zadd(`room:${message.room}:timeline`, { score: message.timestamp, member: message.messageId }),
    ]);
  },

  async getRoomMessages(roomCode: string, limit = 50): Promise<Message[]> {
    if (!redis) {
      console.log("⚠️ Redis not available, returning empty messages");
      return [];
    }
    
    const messageIds = await redis.zrange(`room:${roomCode}:timeline`, -limit, -1, { rev: true });
    const messages: Message[] = [];
    
    if (Array.isArray(messageIds) && messageIds.length > 0) {
      const stringIds = messageIds.filter((id): id is string => typeof id === "string").reverse();
      if (stringIds.length > 0) {
        const messageData = await redis.hmget(`room:${roomCode}:messages`, ...stringIds);
        
        if (messageData) {
          for (let i = 0; i < stringIds.length; i++) {
            const data = messageData[i];
            if (data && typeof data === "string") {
              try {
                const message = JSON.parse(data) as Message;
                messages.push(message);
              } catch (error) {
                console.error(`❌ Failed to parse message ${stringIds[i]}:`, error);
              }
            }
          }
        }
      }
    }
    
    return messages;
  },

  async removeMessage(messageId: string, roomCode: string): Promise<boolean> {
    if (!redis) {
      console.log("⚠️ Redis not available, skipping message removal");
      return false;
    }
    
    console.log(`🗑️ Removing message ${messageId} from room ${roomCode}`);
    
    try {
      await Promise.all([
        // Remove message data from room hash
        redis.hdel(`room:${roomCode}:messages`, messageId),
        // Remove message ID from room timeline
        redis.zrem(`room:${roomCode}:timeline`, messageId),
      ]);
      
      console.log(`✅ Message ${messageId} removed successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to remove message ${messageId}:`, error);
      return false;
    }
  },
}; 
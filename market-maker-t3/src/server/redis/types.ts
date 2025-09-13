// Define data interfaces for Redis storage with Socket.IO rooms
export interface User {
  user: string;
  socketId: string;
  room: string;
  joinedAt: number;
}

export interface Message {
  messageId: string;
  content: string;
  user: string;
  room: string;
  timestamp: number;
}

export interface RoomInfo {
  roomCode: string;
  createdAt: number;
  lastActivity: number;
  userCount: number;
} 
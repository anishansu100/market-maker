"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { io, type Socket } from "socket.io-client";

// Match the server-side interfaces
interface User {
  user: string;
  socketId: string;
  room: string;
  joinedAt: number;
}

interface Message {
  messageId: string;
  content: string;
  user: string;
  room: string;
  timestamp: number;
}

interface RoomInfo {
  roomCode: string;
  createdAt: number;
  lastActivity: number;
  userCount: number;
}

type GamePhase = "welcome" | "lobby" | "chat";


export function useGameSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [roomUsers, setRoomUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  
  // Game lobby state
  const [gamePhase, setGamePhase] = useState<GamePhase>("welcome");
  
  // Host bot state
  const [hostIsExplaining, setHostIsExplaining] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);

  // Helper function to create host messages
  const createHostMessage = useCallback((content: string): Message => {
    return {
      messageId: `host_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      user: "🤖 Game Host",
      room: currentRoom ?? "",
      timestamp: Date.now()
    };
  }, [currentRoom]);



  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socket = io("http://localhost:4000", {
      transports: ["websocket"],
      forceNew: true,
    });

    socket.on("connect", () => {
      console.log("✅ Connected to WebSocket server");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from WebSocket server");
      setIsConnected(false);
      setCurrentRoom(null);
      setCurrentUser(null);
      setRoomUsers([]);
      setMessages([]);
      setRoomInfo(null);
      setGamePhase("welcome");
    });

    // Room events
    socket.on("room_created", ({ roomCode, _timestamp }: { roomCode: string; _timestamp: number }) => {
      console.log("🎮 Room/Game created:", roomCode);
      setGamePhase("lobby"); // Game created = lobby phase
    });

    socket.on("room_joined", ({ user, socketId, roomCode, timestamp, messages: roomMessages, users }: { 
      user: string; 
      socketId: string; 
      roomCode: string; 
      timestamp: number;
      messages?: Message[];
      users?: User[];
    }) => {
      console.log("✅ Joined room/game:", { user, roomCode });
      setCurrentRoom(roomCode);
      setCurrentUser({ user, socketId, room: roomCode, joinedAt: timestamp });
      setGamePhase("lobby"); // Joined room = lobby phase
      
      // Load existing messages from the room
      if (roomMessages && Array.isArray(roomMessages)) {
        setMessages(roomMessages);
      }
      
      // Set initial user list
      if (users && Array.isArray(users)) {
        setRoomUsers(users);
      }
    });

    socket.on("room_users_updated", ({ roomCode, users, totalUsers, timestamp }: {
      roomCode: string;
      users: User[];
      totalUsers: number;
      timestamp: number;
    }) => {
      console.log("👥 Room users updated:", { roomCode, totalUsers, userCount: users.length });
      
      // Set the complete user list
      setRoomUsers(users);
    });

    socket.on("game_started", ({ roomCode, startedBy, timestamp }: {
      roomCode: string;
      startedBy: string;
      timestamp: number;
    }) => {
      console.log("🎮 Game started:", { roomCode, startedBy });
      
      // Move all users to the chat/game phase
      setGamePhase("chat");
      // Note: Host explanation will be triggered by server
    });

    socket.on("host_explanation_started", () => {
      console.log("🤖 Host explanation started");
      setHostIsExplaining(true);
    });

    socket.on("host_message", ({ content, timestamp }: {
      content: string;
      timestamp: number;
    }) => {
      console.log("🤖 Host message:", content);
      const hostMessage = createHostMessage(content);
      setMessages(prev => [...prev, hostMessage]);
    });

    socket.on("host_explanation_finished", () => {
      console.log("🤖 Host explanation finished");
      setHostIsExplaining(false);
    });





    socket.on("room_info", ({ roomCode, users, totalUsers, currentUser: user, roomInfo: info, messages: roomMessages }: {
      roomCode: string;
      users: User[];
      totalUsers: number;
      currentUser: User;
      roomInfo?: RoomInfo;
      messages?: Message[];
    }) => {
      console.log("📊 Room/Game info:", { roomCode, totalUsers });
      setCurrentRoom(roomCode);
      setCurrentUser(user);
      setRoomUsers(users);
      if (info) setRoomInfo(info);
      
      if (roomMessages && Array.isArray(roomMessages)) {
        setMessages(roomMessages);
      }
    });

    // Message events
    socket.on("new_message", (message: Message) => {
      console.log("💬 New message:", message);
      setMessages(prev => [...prev, message]);
    });

    socket.on("message_history", ({ messages: historyMessages, roomCode }: {
      messages: Message[];
      roomCode: string;
    }) => {
      console.log("📜 Message history loaded:", { count: historyMessages.length, roomCode, messages: historyMessages });
      setMessages(historyMessages);
    });

    // User events
    socket.on("joined", ({ user, socketId, timestamp }: {
      user: string;
      socketId: string;
      timestamp: number;
    }) => {
      console.log("👋 User joined:", user);
    });

    // Connection events
    socket.on("pong", ({ _timestamp }: { _timestamp: number }) => {
              console.log("🏓 Pong received:", new Date(_timestamp));
    });

    socket.on("room_deleted", ({ roomCode, message, timestamp }: {
      roomCode: string;
      message: string;
      timestamp: number;
    }) => {
      console.log("🗑️ Room deleted:", { roomCode, message });
      
      // Reset all room/game state to go back to welcome page
      setCurrentRoom(null);
      setCurrentUser(null);
      setRoomUsers([]);
      setMessages([]);
      setRoomInfo(null);
      setGamePhase("welcome");

      // Show notification (optional)
      alert(`Room ${roomCode} was deleted: ${message}`);
    });

    socket.on("error", ({ message }: { message: string }) => {
      console.error("❌ Socket error:", message);
      alert(`Error: ${message}`);
    });

    socketRef.current = socket;
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setCurrentRoom(null);
    setCurrentUser(null);
    setRoomUsers([]);
    setMessages([]);
    setRoomInfo(null);
    setGamePhase("welcome");
  }, []);

  // Generate a random 6-character game code
  const generateGameCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Room/message functions
  const createRoom = useCallback((roomCode: string) => {
    if (socketRef.current) {
      socketRef.current.emit("create_room", { roomCode });
    }
  }, []);

  const joinRoom = useCallback(({ user, roomCode }: { user: string; roomCode: string }) => {
    if (socketRef.current) {
      socketRef.current.emit("join_room", { user, roomCode });
    }
  }, []);

  const getRoomInfo = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("get_room_info");
    }
  }, []);

  const sendMessage = useCallback((content: string) => {
    if (socketRef.current) {
      socketRef.current.emit("send_message", { content });
    }
  }, []);

  const getMessages = useCallback((limit = 50) => {
    console.log("📤 Requesting messages from server, limit:", limit);
    if (socketRef.current) {
      socketRef.current.emit("get_messages", { limit });
    } else {
      console.error("❌ Socket not connected");
    }
  }, []);

  const ping = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("ping");
    }
  }, []);

  // Game functions (mapped to room functions)
  const createGame = useCallback((userName: string, maxUsers: number) => {
    if (socketRef.current && isConnected) {
      const gameCode = generateGameCode();
      // Game creation = Room creation + User joining
      socketRef.current.emit("create_room", { roomCode: gameCode });
      // Auto-join the creator
      setTimeout(() => {
        socketRef.current?.emit("join_room", { user: userName, roomCode: gameCode });
      }, 100);
    }
  }, [isConnected]);

  const joinGame = useCallback((userName: string, gameCode: string) => {
    if (socketRef.current && isConnected) {
      // Game joining = Room joining
      socketRef.current.emit("join_room", { user: userName, roomCode: gameCode });
    }
  }, [isConnected]);

  const leaveGame = useCallback(() => {
    if (socketRef.current && currentRoom) {
      // Delete the entire room when any user leaves
      socketRef.current.emit("delete_room", { roomCode: currentRoom });
      
      // Reset local state immediately
      setCurrentRoom(null);
      setCurrentUser(null);
      setRoomUsers([]);
      setMessages([]);
      setRoomInfo(null);
      setGamePhase("welcome");
    }
  }, [currentRoom]);

  const startGame = useCallback(() => {
    if (socketRef.current && currentRoom) {
      // Emit start_game event to server to notify all users
      socketRef.current.emit("start_game");
    }
  }, [currentRoom]);



  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // Connection state
    isConnected,
    
    // Room/message state (works for both room chat and game lobby)
    currentRoom,
    currentUser,
    roomUsers,
    messages,
    roomInfo,
    
    // Game lobby state
    gamePhase,
    setGamePhase,
    
    // Host bot state
    hostIsExplaining,
    
    // Connection functions
    connect,
    disconnect,
    
    // Room/message functions
    createRoom,
    joinRoom,
    getRoomInfo,
    sendMessage,
    getMessages,
    ping,
    
    // Game functions (mapped to room functions)
    createGame,
    joinGame,
    leaveGame,
    startGame,
  };
} 
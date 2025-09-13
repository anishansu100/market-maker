"use client";
import { useEffect } from "react";
import GameWelcome from "@/components/GameWelcome";
import GameLobby from "@/components/GameLobby";
import GameChat from "@/components/GameChat";
import { toast } from "sonner";
import { useGameSocket } from "@/hooks/use-socket";

const Index = () => {
  const {
    isConnected,
    currentRoom,
    currentUser,
    roomUsers,
    messages,
    roomInfo,
    gamePhase,
    hostIsExplaining,
    connect,
    createGame,
    joinGame,
    leaveGame,
    startGame,
    sendMessage,
  } = useGameSocket();

  // Connect to WebSocket server on mount
  useEffect(() => {
    connect();
  }, [connect]);

  // Handle game creation with real-time WebSocket
  const handleCreateGame = (userName: string, maxUsers: number) => {
    if (!isConnected) {
      toast.error("Not connected", {
        description: "Please wait for connection to the game server",
      });
      return;
    }

    createGame(userName, maxUsers);
    
    toast.success("Creating game...", {
      description: "Please wait while we set up your game",
        });
  };

  // Handle game joining with real-time WebSocket
  const handleJoinGame = (userName: string, gameCode: string) => {
    if (!isConnected) {
      toast.error("Not connected", {
        description: "Please wait for connection to the game server",
      });
      return;
    }

    joinGame(userName, gameCode);
    
    toast.success("Joining game...", {
      description: `Attempting to join game ${gameCode}`,
    });
  };

  // Handle leaving game with real-time WebSocket
  const handleLeaveGame = () => {
    leaveGame();
    
    toast.success("Leaving game...", {
      description: "You are leaving the game lobby",
    });
  };

  // Handle starting game with real-time WebSocket  
  const handleStartGame = () => {
    startGame();
    
    toast.success("Starting game...", {
      description: "Welcome to the chat room!",
    });
  };

  // Show connection status
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Connecting to Game Server</h2>
              <p className="text-gray-600">Please wait while we establish connection...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show welcome screen if no room/game state
  if (!currentRoom || !currentUser) {
    return (
      <GameWelcome 
        onCreateGame={handleCreateGame}
        onJoinGame={handleJoinGame}
      />
    );
  }

  // Convert room data to game lobby format for existing components
  const gameCode = currentRoom;
  
  // Add current user to roomUsers if not already present (for immediate display)
  const allUsers = [...roomUsers];
  if (currentUser && !roomUsers.some(u => u.socketId === currentUser.socketId)) {
    allUsers.push(currentUser);
  }
  
  const maxUsers = roomInfo?.userCount ?? 10; // Use roomInfo if available, fallback to 10

  // Show lobby phase
  if (gamePhase === "lobby") {
    return (
      <GameLobby
        gameCode={gameCode}
        users={allUsers}
        currentUser={currentUser}
        maxUsers={maxUsers}
        onLeaveGame={handleLeaveGame}
        onStartGame={handleStartGame}
      />
    );
  }

  // Show chat phase
  if (gamePhase === "chat") {
    return (
      <GameChat
        gameCode={gameCode}
        users={allUsers}
        currentUser={currentUser}
        messages={messages}
        hostIsExplaining={hostIsExplaining}
        onLeaveGame={handleLeaveGame}
        onSendMessage={sendMessage}
      />
    );
  }

  return null;
};

export default Index;
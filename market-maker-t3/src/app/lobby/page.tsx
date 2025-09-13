"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Users, Crown, LogOut, Dices } from "lucide-react";
import { toast } from "sonner";

// Use the same User interface as the server
interface User {
  user: string;
  socketId: string;
  room: string;
  joinedAt: number;
}

interface GameLobbyProps {
  gameCode: string;
  users: User[];
  currentUser: User;
  maxUsers: number;
  onLeaveGame: () => void;
  onStartGame?: () => void;
}

export default function GameLobby({ 
  gameCode, 
  users, 
  currentUser, 
  maxUsers,
  onLeaveGame,
  onStartGame 
}: GameLobbyProps) {
  const [copiedCode, setCopiedCode] = useState(false);

  const copyGameCode = async () => {
    try {
      await navigator.clipboard.writeText(gameCode);
      setCopiedCode(true);
      toast.success("Code copied!", {
        description: "Game code copied to clipboard",
      });
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      toast.error("Failed to copy", {
        description: "Could not copy game code to clipboard",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-secondary">
      <div className="w-full max-w-2xl space-y-6">
        {/* The Header is the same as home/page.tsx */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg">
            <Dices className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Market Maker
          </h1>
          
          <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50 shadow-xl">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Game Code</p>
                <div className="flex items-center justify-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className="text-2xl font-mono px-4 py-2 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20"
                  >
                    {gameCode}
                  </Badge>
                  <Button
                    onClick={copyGameCode}
                    variant="outline"
                    size="sm"
                    className="h-10"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this code with friends to let them join
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Users ({users.length}/{maxUsers})
            </CardTitle>
            <CardDescription>
              {users.length < 2 
                ? "Waiting for at least one more user to start..."
                : `Ready to start! (${users.length}/${maxUsers} users)`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users.map((user) => (
                <div 
                  key={user.socketId}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">
                      {user.user}
                      {user.socketId === currentUser.socketId && " (You)"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {users.length < 2 ? (
              <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border/50">
                <p className="text-sm text-muted-foreground text-center">
                  Share the game code with friends. Need at least 2 users to start.
                </p>
              </div>
            ) : (
              <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-center font-medium">
                  🎉 Ready to play! Any user can start the game now.
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              {onStartGame && (
                <Button 
                  onClick={onStartGame}
                  className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                  size="lg"
                >
                  Start Game
                </Button>
              )}
              <Button 
                onClick={onLeaveGame}
                variant="outline"
                size="lg"
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Leave Game
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
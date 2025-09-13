"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Dices, Plus, Minus } from "lucide-react";

interface GameWelcomeProps {
  onCreateGame: (userName: string, maxUsers: number) => void;
  onJoinGame: (userName: string, gameCode: string) => void;
}

export default function GameWelcome({ onCreateGame, onJoinGame }: GameWelcomeProps) {
  const [userName, setUserName] = useState("");
  const [gameCode, setGameCode] = useState("");
  const [mode, setMode] = useState<"home" | "join">("home");

  const handleCreateGame = () => {
    if (userName.trim()) {
      onCreateGame(userName.trim(), 10);
    }
  };

  const handleJoinGame = () => {
    if (userName.trim() && gameCode.trim()) {
      onJoinGame(userName.trim(), gameCode.trim().toUpperCase());
    }
  };
  

  return (
    <div className="flex items-center justify-center p-4 bg-gradient-to-br from-background via-background  fixed inset-0 to-secondary">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg">
            <Dices className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Market Maker
          </h1>
          <p className="text-muted-foreground">Connect with friends and start playing!</p>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur shadow-xl text-center">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">
              {mode === "home" ? "Get Started" : "Join Game"}
            </CardTitle>
            <CardDescription>
              {mode === "home" 
                ? "Enter your name to create or join a game" 
                : "Enter the game code to join"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="mb-2">
                <label htmlFor="userName" className="text-sm font-medium">
                  Your Name
                </label>
              </div>
              <Input
                id="userName"
                placeholder="Enter your name"
                value={userName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserName(e.target.value)}
                className="bg-input/50"
              />
            </div>


            {mode === "join" && (
              <div className="space-y-2">
                <label htmlFor="gameCode" className="text-sm font-medium">
                  Game Code
                </label>
                <Input
                  id="gameCode"
                  placeholder="Enter game code"
                  value={gameCode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGameCode(e.target.value.toUpperCase())}
                  className="bg-input/50 text-center text-lg font-mono tracking-wider"
                  maxLength={6}
                />
              </div>
            )}

            <div className="space-y-3 pt-2">
              {mode === "home" ? (
                <>
                  <Button 
                    onClick={handleCreateGame}
                    disabled={!userName.trim()}
                    className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                    size="lg"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Create Game Room
                  </Button>
                  <Button 
                    onClick={() => setMode("join")}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    Join Existing Game
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    onClick={handleJoinGame}
                    disabled={!userName.trim() || !gameCode.trim()}
                    className="w-full bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90"
                    size="lg"
                  >
                    Join Game
                  </Button>
                  <Button 
                    onClick={() => setMode("home")}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    Back
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
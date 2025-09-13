
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Send, Users, Crown, LogOut, ChevronDown, Dices} from "lucide-react";
import { toast } from "sonner";

// Use the same interfaces as the server
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

interface GameChatProps {
  gameCode: string;
  users: User[];
  currentUser: User;
  messages: Message[];
  hostIsExplaining: boolean;
  onLeaveGame: () => void;
  onSendMessage: (content: string) => void;
}

export default function GameChat({ 
  gameCode, 
  users, 
  currentUser, 
  messages,
  hostIsExplaining,
  onLeaveGame,
  onSendMessage 
}: GameChatProps) {
  const [newMessage, setNewMessage] = useState("");
  const [firstMessageSent, setFirstMessageSent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Check if any real messages exist (not system messages)
    const hasRealMessages = messages.some(msg => msg.user !== "system");
    setFirstMessageSent(hasRealMessages);
  }, [messages]);

  const canSendMessage = () => {
    return !hostIsExplaining; // Disable messaging while host is explaining rules
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !canSendMessage()) return;

    onSendMessage(newMessage.trim());
    setNewMessage("");
    
    // Mark that the first message has been sent
    if (!firstMessageSent) {
      setFirstMessageSent(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const getInputPlaceholder = () => {
    if (hostIsExplaining) {
      return "🤖 Host is explaining the rules...";
    }
    return "Type your message...";
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-secondary">
      {/* Users Header - Fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="p-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Game Info */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Dices className="w-5 h-5" />
                    <span className="font-semibold">Market Maker</span>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className="font-mono bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20"
                  >
                    {gameCode}
                  </Badge>
                </div>

                {/* Users Dropdown */}
                <div className="flex items-center gap-4">
                  {/* Current User Display */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                    <span className="text-sm font-medium">
                      {currentUser.user} (You)
                    </span>
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  </div>

                  {/* Users Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Users className="w-4 h-4" />
                        <span>Users ({users.length})</span>
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      className="w-56 bg-background/95 backdrop-blur-sm border-border/50 z-[100]"
                    >
                      {users.map((user) => (
                        <DropdownMenuItem 
                          key={user.socketId}
                          className={`flex items-center justify-between gap-2 ${
                            user.socketId === currentUser.socketId ? 'bg-primary/10' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {user.user}
                              {user.socketId === currentUser.socketId && " (You)"}
                            </span>
                          </div>
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  {/* Leave Game Button */}
                  <Button 
                    onClick={onLeaveGame}
                    variant="outline"
                    size="sm"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Leave Game
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chat Area - Fills remaining screen */}
      <div className="flex-1 flex flex-col pt-32 p-4">
        <Card className="flex-1 flex flex-col border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Game Chat Room</CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col space-y-4">
            {/* Messages */}
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-3">
                {messages.map((message) => (
                  <div 
                    key={message.messageId}
                    className={`flex ${
                      message.user === currentUser.user ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div className={`max-w-[60%] ${
                      message.user === "system" || message.user === "🤖 Game Host" ? 'mx-auto' : ''
                    }`}>
                      {message.user === "system" ? (
                        <div className="text-center p-3 rounded-lg bg-muted/50 border border-border/50">
                          <p className="text-sm text-muted-foreground">{message.content}</p>
                        </div>
                      ) : message.user === "🤖 Game Host" ? (
                        <div className="text-center p-4 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">🤖 Game Host</span>
                          </div>
                          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">{message.content}</p>
                        </div>
                      ) : (
                        <div className={`p-3 rounded-2xl ${
                          message.user === currentUser.user
                            ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground ml-4'
                            : 'bg-secondary/50 border border-border/50 mr-4'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium opacity-80">
                              {message.user}
                            </span>
                            <span className="text-xs opacity-60">
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm">{message.content}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="flex gap-2 pt-2 border-t border-border/50">
              <Input
                ref={inputRef}
                placeholder={getInputPlaceholder()}
                value={newMessage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 bg-input/50"
                maxLength={500}
                disabled={!canSendMessage()}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || !canSendMessage()}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                size="lg"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
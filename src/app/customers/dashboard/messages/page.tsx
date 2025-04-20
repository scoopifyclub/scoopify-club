"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    role: "CUSTOMER" | "EMPLOYEE" | "ADMIN";
    avatarUrl?: string;
  };
  timestamp: Date;
  isRead: boolean;
}

interface Conversation {
  id: string;
  participant: {
    id: string;
    name: string;
    role: "CUSTOMER" | "EMPLOYEE" | "ADMIN";
    avatarUrl?: string;
  };
  lastMessage: {
    content: string;
    timestamp: Date;
    isRead: boolean;
  };
  messages: Message[];
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching conversations
    setTimeout(() => {
      const mockConversations: Conversation[] = [
        {
          id: "1",
          participant: {
            id: "201",
            name: "Support Team",
            role: "EMPLOYEE",
            avatarUrl: "/avatars/support.jpg"
          },
          lastMessage: {
            content: "We'll send a technician tomorrow between 9-11 AM.",
            timestamp: new Date(Date.now() - 3600000),
            isRead: false
          },
          messages: [
            {
              id: "m1",
              content: "Hello, I'd like to know when my pool cleaning will be completed?",
              sender: {
                id: "101", // Current customer ID
                name: "Current Customer",
                role: "CUSTOMER"
              },
              timestamp: new Date(Date.now() - 86400000),
              isRead: true
            },
            {
              id: "m2",
              content: "We'll send a technician tomorrow between 9-11 AM.",
              sender: {
                id: "201",
                name: "Support Team",
                role: "EMPLOYEE"
              },
              timestamp: new Date(Date.now() - 3600000),
              isRead: false
            }
          ]
        },
        {
          id: "2",
          participant: {
            id: "301",
            name: "Scheduling Team",
            role: "ADMIN",
            avatarUrl: "/avatars/admin.jpg"
          },
          lastMessage: {
            content: "Your next regular maintenance is scheduled for May 15th.",
            timestamp: new Date(Date.now() - 86400000),
            isRead: true
          },
          messages: [
            {
              id: "m3",
              content: "When is my next scheduled maintenance?",
              sender: {
                id: "101", // Current customer ID
                name: "Current Customer",
                role: "CUSTOMER"
              },
              timestamp: new Date(Date.now() - 172800000),
              isRead: true
            },
            {
              id: "m4",
              content: "Your next regular maintenance is scheduled for May 15th.",
              sender: {
                id: "301",
                name: "Scheduling Team",
                role: "ADMIN"
              },
              timestamp: new Date(Date.now() - 86400000),
              isRead: true
            }
          ]
        }
      ];

      setConversations(mockConversations);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const newMessageObj: Message = {
      id: `m${Date.now()}`,
      content: newMessage,
      sender: {
        id: "101", // Current customer ID
        name: "Current Customer",
        role: "CUSTOMER"
      },
      timestamp: new Date(),
      isRead: true
    };

    const updatedConversation = {
      ...selectedConversation,
      messages: [...selectedConversation.messages, newMessageObj],
      lastMessage: {
        content: newMessage,
        timestamp: new Date(),
        isRead: true
      }
    };

    setConversations(conversations.map(conv => 
      conv.id === selectedConversation.id ? updatedConversation : conv
    ));
    setSelectedConversation(updatedConversation);
    setNewMessage("");
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading conversations...</div>;
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="w-1/3 border-r">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Messages</h2>
          <p className="text-sm text-muted-foreground">Contact support or management</p>
        </div>
        
        <ScrollArea className="h-[calc(100vh-140px)]">
          {conversations.length > 0 ? (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-accent/50 transition-colors ${
                  selectedConversation?.id === conversation.id ? "bg-accent" : ""
                } ${!conversation.lastMessage.isRead ? "font-medium" : ""}`}
                onClick={() => setSelectedConversation(conversation)}
              >
                <Avatar>
                  <AvatarImage src={conversation.participant.avatarUrl} />
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="font-medium truncate">{conversation.participant.name}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(conversation.lastMessage.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {conversation.lastMessage.content}
                  </p>
                </div>
                {!conversation.lastMessage.isRead && (
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                )}
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              No conversations found
            </div>
          )}
        </ScrollArea>
        
        <div className="p-4 border-t">
          <Button variant="outline" className="w-full">
            Start new conversation
          </Button>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="p-4 border-b flex items-center gap-4">
              <Avatar>
                <AvatarImage src={selectedConversation.participant.avatarUrl} />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">{selectedConversation.participant.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedConversation.participant.role === "EMPLOYEE" ? "Support" : "Admin"}
                </p>
              </div>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              {selectedConversation.messages.map((message, index) => {
                const isCurrentUser = message.sender.role === "CUSTOMER";
                const showDate = index === 0 || 
                  formatDate(message.timestamp) !== formatDate(selectedConversation.messages[index - 1].timestamp);
                
                return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="text-center my-4">
                        <span className="text-xs bg-accent px-2 py-1 rounded-full">
                          {formatDate(message.timestamp)}
                        </span>
                      </div>
                    )}
                    <div className={`flex mb-4 ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                      <div className={`flex gap-2 max-w-[80%] ${isCurrentUser ? "flex-row-reverse" : ""}`}>
                        {!isCurrentUser && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={message.sender.avatarUrl} />
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          <div className={`p-3 rounded-lg ${
                            isCurrentUser 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-accent"
                          }`}>
                            {message.content}
                          </div>
                          <div className={`text-xs text-muted-foreground mt-1 ${
                            isCurrentUser ? "text-right" : ""
                          }`}>
                            {formatTime(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </ScrollArea>
            
            <div className="p-4 border-t flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                Send
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
} 
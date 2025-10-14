"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Search } from "lucide-react";

type Seller = {
  id: number;
  sellerId: string;
  updatedAt: string;
};

type Message = {
  id: string;
  sender: "me" | "other";
  text: string;
  time: string;
  date: string; // 🆕 Added field
};

export default function MessagesPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  // ✅ Fetch seller list from API
  useEffect(() => {
    const fetchSellers = async () => {
      const res = await fetch("/api/chatbot/getSellers");
      const data = await res.json();
      setSellers(data);
      if (data.length > 0) setSelectedSeller(data[0]);
    };
    fetchSellers();
  }, []);

  // ✅ Example: Load dummy chat messages for UI (replace later with real)
  useEffect(() => {
    if (selectedSeller) {
      setMessages([
        {
          id: "1",
          sender: "other",
          text: `Hello! I'm the chatbot for ${selectedSeller.sellerId}. How can I help you?`,
          time: "10:30 AM",
          date: new Date().toLocaleDateString(), // ✅ added
        },
      ]);
    }
  }, [selectedSeller]);

  const handleSend = async () => {
    if (!messageText.trim() || !selectedSeller) return;

    const now = new Date();
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: "me",
      text: messageText,
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      date: now.toLocaleDateString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessageText("");

    const res = await fetch(`/api/chatbot/${selectedSeller.sellerId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: messageText }),
    });

    const data = await res.json();
    const botReply: Message = {
      id: Date.now().toString() + "-bot",
      sender: "other",
      text: data.answer || "Sorry, I didn’t understand that.",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      date: new Date().toLocaleDateString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    };

    setMessages((prev) => [...prev, botReply]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Messages</h1>

        <Card>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
              {/* ✅ Left Sidebar (Seller List) */}
              <div className="border-r border-border">
                <div className="p-4 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search sellers..." className="pl-10" />
                  </div>
                </div>

                <ScrollArea className="h-[540px]">
                  {sellers.map((seller) => (
                    <div
                      key={seller.id}
                      onClick={() => setSelectedSeller(seller)}
                      className={`p-4 border-b border-border cursor-pointer hover:bg-muted transition-smooth ${
                        selectedSeller?.id === seller.id ? "bg-muted" : ""
                      }`}
                    >
                      <div className="flex gap-3 items-center">
                        <Avatar>
                          <AvatarImage src="" />
                          <AvatarFallback>{seller.sellerId[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm truncate">
                            {seller.sellerId}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Updated{" "}
                            {new Date(seller.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </div>

              {/* ✅ Right Section (Messages) */}
              <div className="md:col-span-2 flex flex-col">
                {selectedSeller ? (
                  <>
                    {/* Header */}
                    <div className="p-4 border-b border-border flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {selectedSeller.sellerId[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">
                          {selectedSeller.sellerId}
                        </h3>
                        <p className="text-xs text-success">Active now</p>
                      </div>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {messages.map((m) => (
                          <div
                            key={m.id}
                            className={`flex ${
                              m.sender === "me"
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                m.sender === "me"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-foreground"
                              }`}
                            >
                              <p className="text-sm">{m.text}</p>
                              <span className="text-xs opacity-70 mt-1 block">
                                {m.date} • {m.time}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    {/* Input */}
                    <div className="p-4 border-t border-border flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      />
                      <Button size="icon" onClick={handleSend}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    Select a seller to start chatting.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

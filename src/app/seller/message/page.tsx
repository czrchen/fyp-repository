"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format, isToday, isYesterday } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Search, ArrowLeft } from "lucide-react";
import { useSellerMessages } from "@/contexts/SellerMessageContext"; //  Seller context

type Buyer = {
  id: number;
  full_name: string;
  updatedAt: string;
};

export default function SellerMessagesPage() {
  const {
    sessions,
    activeSession,
    setActiveSession,
    sendMessage,
    markSessionAsRead,
  } = useSellerMessages();

  const [messageText, setMessageText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  //  Find messages for the currently active session
  const currentMessages =
    sessions.find((s) => s.id === activeSession?.id)?.messages || [];

  //  Handle send message (for seller)
  const handleSend = async () => {
    if (!messageText.trim() || !activeSession) return;

    sendMessage(activeSession.id, messageText, "seller"); // 👈 Seller now
    const content = messageText.trim();
    setMessageText("");
  };

  //  Filter sessions by buyer name
  const filteredSessions = sessions.filter((session) =>
    session.buyerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // inside your component
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (!scrollRef.current) return;

    // ScrollArea wraps content in a viewport div
    const viewport = scrollRef.current.querySelector(
      "[data-radix-scroll-area-viewport]"
    );
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, activeSession?.id]);

  //  Group messages by date
  const groupedMessages = currentMessages.reduce((groups, message) => {
    const date = format(new Date(message.createdAt), "yyyy-MM-dd");
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {} as Record<string, typeof currentMessages>);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-14">
          <div className="flex items-center h-16">
            <Link href="/seller">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>
      <div className="container mx-auto px-18 py-8">
        <h1 className="text-3xl font-bold mb-6 text-foreground">
          Customer Messages
        </h1>

        <Card>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
              {/* Left Sidebar (Buyer List) */}
              <div className="border-r border-border">
                <div className="p-4 border-b border-border">
                  <div className="relative flex items-center">
                    <Search
                      className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none"
                      style={{ top: "50%", transform: "translateY(-50%)" }}
                    />
                    <Input
                      placeholder="Search buyers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 py-2 text-sm"
                    />
                  </div>
                </div>

                <ScrollArea className="h-[540px]">
                  {filteredSessions.length > 0 ? (
                    filteredSessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={async () => {
                          setActiveSession(session.id);
                          setTimeout(scrollToBottom, 100);
                          if (session.unreadCount > 0) {
                            await markSessionAsRead(session.id); //  instant + backend sync
                          }
                        }}
                        className={`p-4 border-b border-border cursor-pointer hover:bg-muted transition-smooth ${
                          activeSession?.id === session.id ? "bg-muted" : ""
                        }`}
                      >
                        <div className="flex gap-3 items-center justify-between">
                          {/* Buyer Info */}
                          <div className="flex gap-3 items-center">
                            <Avatar>
                              <AvatarImage src="" />
                              <AvatarFallback>
                                {session.buyerName?.[0] ?? "B"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm truncate">
                                {session.buyerName ?? "Unknown Buyer"}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {session.isActive ? "Active" : "Offline"}
                              </p>
                            </div>
                          </div>

                          {/* Unread badge */}
                          {session.unreadCount > 0 && (
                            <span className="bg-blue-500 text-white text-[10px] font-semibold px-2 py-1 rounded-full min-w-[20px] text-center">
                              {session.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-sm text-muted-foreground">
                      No buyers found.
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Right Section (Messages) */}
              <div className="md:col-span-2 flex flex-col h-[600px]">
                {" "}
                {/* added fixed height */}
                {activeSession ? (
                  <>
                    {/* Header */}
                    <div className="p-4 border-b border-border flex items-center gap-3 flex-shrink-0">
                      <Avatar>
                        <AvatarFallback>
                          {activeSession.buyerName?.[0] ?? "B"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">
                          {activeSession.buyerName ?? "Unknown Buyer"}
                        </h3>
                        <p className="text-xs text-success">Active now</p>
                      </div>
                    </div>

                    {/* Messages */}
                    <ScrollArea
                      ref={scrollRef}
                      className="flex-1 p-4 overflow-y-auto bg-[url('/chat-bg.png')] bg-cover"
                    >
                      <div className="space-y-6">
                        {Object.entries(groupedMessages).map(
                          ([date, messages]) => (
                            <div key={date}>
                              {/* Date divider */}
                              <div className="text-center text-xs text-muted-foreground mb-3">
                                {isToday(new Date(date))
                                  ? "Today"
                                  : isYesterday(new Date(date))
                                  ? "Yesterday"
                                  : format(new Date(date), "d MMM yyyy")}
                              </div>

                              {/* Message bubbles */}
                              <div className="space-y-2">
                                {messages.map((m) => (
                                  <div
                                    key={m.id}
                                    className={`flex ${
                                      m.senderType === "seller"
                                        ? "justify-end"
                                        : "justify-start"
                                    }`}
                                  >
                                    <div
                                      className={`relative rounded-2xl px-4 pt-2 pb-5 max-w-[75%] min-w-[70px] shadow-sm leading-relaxed ${
                                        m.senderType === "seller"
                                          ? "bg-[#DCF8C6] text-black" // WhatsApp green
                                          : "bg-white text-black border border-gray-200"
                                      }`}
                                      style={{
                                        borderTopRightRadius:
                                          m.senderType === "seller"
                                            ? "6px"
                                            : "1.25rem",
                                        borderTopLeftRadius:
                                          m.senderType === "seller"
                                            ? "1.25rem"
                                            : "6px",
                                      }}
                                    >
                                      {/* Message text */}
                                      <p className="text-[15px] break-words">
                                        {m.content}
                                      </p>

                                      {/* Time at bottom right */}
                                      <span className="text-[11px] text-gray-500 absolute bottom-1.5 right-3">
                                        {format(
                                          new Date(m.createdAt),
                                          "h:mm a"
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </ScrollArea>

                    {/* Input */}
                    <div className="p-4 border-t border-border flex gap-2 flex-shrink-0">
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
                    Select a buyer to start chatting.
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

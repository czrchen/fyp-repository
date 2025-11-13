"use client";

import { useEffect, useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Search, Check, CheckCheck } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { useBuyerMessages } from "@/contexts/BuyerMessageContext"; // ✅ Import context

type Seller = {
  id: number;
  sellerId: string;
  updatedAt: string;
};

export default function MessagesPage() {
  const {
    sessions,
    activeSession,
    setActiveSession,
    sendMessage,
    markSessionAsRead,
  } = useBuyerMessages();

  const [messageText, setMessageText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([]);
  const [isChatbotMode, setIsChatbotMode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const searchParams = useSearchParams();
  const sellerName = searchParams.get("seller");

  useEffect(() => {
    if (!sellerName || sessions.length === 0) return;

    // Find the session with this seller name
    const match = sessions.find(
      (s) => s.sellerName.toLowerCase() === sellerName.toLowerCase()
    );

    if (match) {
      setActiveSession(match.id);
      markSessionAsRead(match.id);
      // Optional: scroll chat window to bottom
      setTimeout(scrollToBottom, 150);
    }
  }, [sellerName]);

  // ✅ Find messages for the currently active session
  const currentMessages =
    sessions.find((s) => s.id === activeSession?.id)?.messages || [];

  const handleSend = async () => {
    if (!messageText.trim() || !activeSession) return;
    const content = messageText.trim();
    setMessageText("");

    if (isChatbotMode) {
      // 🤖 Chatbot Mode
      await sendMessage(activeSession.id, content, "buyer", true);
      setIsTyping(true);

      try {
        const res = await fetch(`/api/chatbot/${activeSession.sellerId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: content }),
        });
        const data = await res.json();
        await sendMessage(activeSession.id, data.answer, "chatbot", true);
      } catch (error) {
        console.error("❌ AI reply failed:", error);
      } finally {
        setIsTyping(false);
      }
    } else {
      // 👥 Normal Seller Chat
      await sendMessage(activeSession.id, content, "buyer", false);
    }
  };

  // ✅ Filter sessions by seller name
  const filteredSessions = sessions.filter((session) =>
    session.sellerName?.toLowerCase().includes(searchTerm.toLowerCase())
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

  // ✅ Group messages by date
  const groupedMessages = currentMessages.reduce((groups, message) => {
    const date = format(new Date(message.createdAt), "yyyy-MM-dd");
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {} as Record<string, typeof currentMessages>);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-18 py-8">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Messages</h1>

        <Card>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
              {/* ✅ Left Sidebar (Seller List) */}
              <div className="border-r border-border">
                <div className="p-4 border-b border-border">
                  <div className="relative flex items-center">
                    <Search
                      className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none"
                      style={{ top: "50%", transform: "translateY(-50%)" }}
                    />
                    <Input
                      placeholder="Search sellers..."
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
                            await markSessionAsRead(session.id); // ✅ instant + backend sync
                          }
                        }}
                        className={`p-4 border-b border-border cursor-pointer hover:bg-muted transition-smooth ${
                          activeSession?.id === session.id ? "bg-muted" : ""
                        }`}
                      >
                        <div className="flex gap-3 items-center justify-between">
                          {/* 🧑‍ Buyer Info */}
                          <div className="flex gap-3 items-center">
                            <Avatar>
                              <AvatarImage src="" />
                              <AvatarFallback>
                                {session.sellerName?.[0] ?? "B"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm truncate">
                                {session.sellerName ?? "Unknown Buyer"}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {session.isActive ? "Active" : "Offline"}
                              </p>
                            </div>
                          </div>

                          {/* 🔵 Unread badge */}
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

              {/* ✅ Right Section (Messages) */}
              <div className="md:col-span-2 flex flex-col h-[600px]">
                {" "}
                {/* ✅ added fixed height */}
                {activeSession ? (
                  <>
                    {/* Header */}
                    <div className="p-4 border-b border-border flex items-center gap-3 flex-shrink-0">
                      <Avatar>
                        <AvatarFallback>
                          {activeSession.sellerName?.[0] ?? "B"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">
                          {activeSession.sellerName ?? "Unknown Buyer"}
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
                              {/* 🗓️ Date divider */}
                              <div className="text-center text-xs text-muted-foreground mb-3">
                                {isToday(new Date(date))
                                  ? "Today"
                                  : isYesterday(new Date(date))
                                  ? "Yesterday"
                                  : format(new Date(date), "d MMM yyyy")}
                              </div>

                              {/* 💬 Message bubbles */}
                              <div className="space-y-2">
                                {messages.map((m) => (
                                  <div
                                    key={m.id}
                                    className={`flex ${
                                      m.senderType === "buyer"
                                        ? "justify-end"
                                        : "justify-start"
                                    }`}
                                  >
                                    <div
                                      className={`relative rounded-2xl px-4 pt-2 pb-5 max-w-[75%] min-w-[70px] shadow-sm leading-relaxed ${
                                        m.senderType === "buyer"
                                          ? "bg-[#DCF8C6] text-black" // WhatsApp green
                                          : "bg-white text-black border border-gray-200"
                                      }`}
                                      style={{
                                        borderTopRightRadius:
                                          m.senderType === "buyer"
                                            ? "6px"
                                            : "1.25rem",
                                        borderTopLeftRadius:
                                          m.senderType === "buyer"
                                            ? "1.25rem"
                                            : "6px",
                                      }}
                                    >
                                      {/* 💬 Message text */}
                                      <p className="text-[15px] break-words">
                                        {m.content}
                                      </p>

                                      {/* ⏰ Time at bottom right */}
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

                              {isTyping && (
                                <div className="flex justify-start items-center gap-2 mt-2 ml-2">
                                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2 shadow-sm">
                                    <div className="flex items-center space-x-1">
                                      <span
                                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                        style={{ animationDelay: "0ms" }}
                                      />
                                      <span
                                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                        style={{ animationDelay: "150ms" }}
                                      />
                                      <span
                                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                        style={{ animationDelay: "300ms" }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </ScrollArea>

                    {/* Input Bar */}
                    <div className="p-4 border-t border-border flex items-center gap-2 flex-shrink-0 bg-background">
                      {/* 🤖 Chat with AI Button */}
                      <Button
                        variant="secondary"
                        onClick={async () => {
                          if (!activeSession) return;

                          if (!isChatbotMode) {
                            // ✅ Switching to chatbot mode
                            setIsChatbotMode(true);
                            await sendMessage(
                              activeSession.id,
                              "How can I help you?",
                              "chatbot",
                              true
                            );
                          } else {
                            // ✅ Switching back to normal seller chat
                            setIsChatbotMode(false);
                            await sendMessage(
                              activeSession.id,
                              "You are now chatting with the seller again.",
                              "chatbot",
                              true
                            );
                          }
                        }}
                        className="cursor-pointer"
                      >
                        🤖
                        <span className="hidden sm:inline text-sm font-medium">
                          {isChatbotMode ? "Chat with Seller" : "Chat with AI"}
                        </span>
                      </Button>
                      {/* Text Input */}
                      <Input
                        placeholder="Type a message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        className="flex-1"
                      />

                      {/* ✉️ Send Button */}
                      <Button
                        size="icon"
                        onClick={handleSend}
                        title="Send message"
                        className="cursor-pointer"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* 📄 Chatbot FAQ section */}
                    {isChatbotMode && (
                      <>
                        {/* View FAQs button */}
                        <div className="flex justify-center p-3 border-t border-border bg-background">
                          <Button
                            variant="outline"
                            onClick={async () => {
                              try {
                                const res = await fetch(
                                  `/api/chatbot/faqs/${activeSession?.sellerId}`
                                );
                                if (!res.ok)
                                  throw new Error("Failed to fetch FAQs");
                                const data = await res.json();
                                setFaqs(data.faqs || []);

                                // 🧠 Optional: send bot message into chat
                                await sendMessage(
                                  activeSession!.id,
                                  "Here are some frequently asked questions:",
                                  "chatbot",
                                  true
                                );
                              } catch (err) {
                                console.error("❌ Failed to load FAQs:", err);
                              }
                            }}
                          >
                            📄 View FAQs
                          </Button>
                        </div>

                        {/* FAQ buttons list */}
                        {faqs.length > 0 && (
                          <div className="flex flex-wrap gap-2 p-3 bg-background border-t border-border">
                            {faqs.map((faq, index) => (
                              <Button
                                key={index}
                                variant="secondary"
                                size="sm"
                                onClick={async () => {
                                  await sendMessage(
                                    activeSession!.id,
                                    faq.question,
                                    "buyer",
                                    true
                                  );
                                  await sendMessage(
                                    activeSession!.id,
                                    faq.answer,
                                    "chatbot",
                                    true
                                  );
                                }}
                              >
                                {faq.question}
                              </Button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
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

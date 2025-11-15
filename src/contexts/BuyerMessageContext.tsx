"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { useSession } from "next-auth/react";

type ChatMessage = {
  id: string;
  senderType: "buyer" | "seller" | "chatbot";
  senderId: string;
  content: string;
  isRead: boolean;
  isChatbot: boolean;
  createdAt: string;
};

type ChatSession = {
  id: string;
  buyerId: string;
  sellerId: string;
  sellerName: string;
  sellerLogo?: string;
  isActive: boolean;
  unreadCount: number;
  messages: ChatMessage[];
};

type BuyerMessageContextType = {
  sessions: ChatSession[];
  activeSession: ChatSession | null;
  setActiveSession: (id: string) => void;
  sendMessage: (
    sessionId: string,
    content: string,
    senderType: "buyer" | "seller" | "chatbot",
    isChatbot: boolean
  ) => Promise<void>;
  refetchSessions: () => Promise<void>;
  markSessionAsRead: (sessionId: string) => Promise<void>;
};

const BuyerMessageContext = createContext<BuyerMessageContextType | undefined>(
  undefined
);

export const BuyerMessageProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActive] = useState<ChatSession | null>(null);

  // Fetch all sessions for the seller
  const fetchSessions = useCallback(async () => {
    try {
      if (status !== "authenticated" || !session?.user?.id) {
        console.log("⚠️ No active session — skipping chat fetch.");
        setSessions([]);
        return;
      }
      const res = await fetch("/api/messages/buyer");
      if (!res.ok) {
        const text = await res.text();
        console.error("Fetch failed:", res.status, text);
        throw new Error("Failed to load buyer messages");
      }
      const data: ChatSession[] = await res.json();
      setSessions(data.filter((s) => s.isActive));
    } catch (err) {
      console.error("❌ Failed to fetch buyer sessions:", err);
      setSessions([]);
    }
  }, [session, status]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const setActiveSession = (id: string) => {
    const session = sessions.find((s) => s.id === id) || null;
    setActive(session);
  };

  // ✉️ Send new message
  const sendMessage = async (
    sessionId: string,
    content: string,
    senderType: "buyer" | "seller" | "chatbot",
    isChatbot: boolean
  ) => {
    if (!content.trim()) return;

    setSessions((prev: ChatSession[]) =>
      prev.map(
        (s): ChatSession =>
          s.id === sessionId
            ? {
                ...s,
                messages: [
                  ...s.messages,
                  {
                    id: crypto.randomUUID(),
                    senderType,
                    senderId: "temp",
                    content,
                    isRead: false,
                    isChatbot,
                    createdAt: new Date().toISOString(),
                  },
                ],
              }
            : s
      )
    );

    try {
      await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, content, senderType, isChatbot }),
      });
    } catch (err) {
      console.error("❌ Failed to send buyer message:", err);
    }
  };

  // ✅ Mark messages as read instantly + update DB
  const markSessionAsRead = async (sessionId: string) => {
    if (!sessionId) return;

    // --- 1️⃣ Optimistic UI update (instant)
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              unreadCount: 0,
              messages: s.messages.map((m) =>
                m.senderType === "seller" ? { ...m, isRead: true } : m
              ),
            }
          : s
      )
    );

    // --- 2️⃣ Update DB
    try {
      const res = await fetch(`/api/messages/markAsRead/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userType: "buyer" }),
      });

      if (!res.ok) {
        console.error("❌ markAsRead failed:", await res.text());
      }
    } catch (err) {
      console.error("❌ Network error marking messages as read:", err);
    }
  };

  return (
    <BuyerMessageContext.Provider
      value={{
        sessions,
        activeSession,
        setActiveSession,
        sendMessage,
        refetchSessions: fetchSessions,
        markSessionAsRead,
      }}
    >
      {children}
    </BuyerMessageContext.Provider>
  );
};

// ✅ Custom hook
export const useBuyerMessages = () => {
  const context = useContext(BuyerMessageContext);
  if (!context) {
    throw new Error(
      "useBuyerMessages must be used within a BuyerMessageProvider"
    );
  }
  return context;
};

"use client";

import {
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
  createdAt: string;
};

type ChatSession = {
  id: string;
  buyerId: string;
  sellerId: string;
  buyerName?: string;
  isActive: boolean;
  unreadCount: number;
  messages: ChatMessage[];
};

type SellerMessageContextType = {
  sessions: ChatSession[];
  activeSession: ChatSession | null;
  setActiveSession: (id: string) => void;
  sendMessage: (
    sessionId: string,
    content: string,
    senderType: "buyer" | "seller" | "chatbot"
  ) => Promise<void>;
  refetchSessions: () => Promise<void>;
  markSessionAsRead: (sessionId: string) => Promise<void>;
};

const SellerMessageContext = createContext<
  SellerMessageContextType | undefined
>(undefined);

export const SellerMessageProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
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
      const res = await fetch("/api/messages/seller");
      if (!res.ok) {
        const text = await res.text();
        console.error("Fetch failed:", res.status, text);
        throw new Error("Failed to load seller messages");
      }
      const data: ChatSession[] = await res.json();
      setSessions(data.filter((s) => s.isActive));
    } catch (err) {
      console.error("❌ Failed to fetch seller sessions:", err);
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

  const sendMessage = async (
    sessionId: string,
    content: string,
    senderType: "buyer" | "seller" | "chatbot"
  ) => {
    if (!content.trim()) return;

    // Optimistic update
    setSessions((prev) =>
      prev.map((s) =>
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
        body: JSON.stringify({ sessionId, content, senderType }),
      });
    } catch (err) {
      console.error("❌ Failed to send seller message:", err);
    }
  };

  // ✅ Mark messages as read instantly + update DB
  const markSessionAsRead = async (sessionId: string) => {
    // --- 1️⃣ Optimistic UI update (instant)
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              unreadCount: 0,
              messages: s.messages.map((m) =>
                m.senderType === "buyer" ? { ...m, isRead: true } : m
              ),
            }
          : s
      )
    );

    // --- 2️⃣ Update the backend
    try {
      const res = await fetch(`/api/messages/markAsRead/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userType: "seller" }),
      });

      if (!res.ok) {
        console.error("❌ markAsRead failed:", await res.text());
      }
    } catch (err) {
      console.error("❌ Network error marking messages as read:", err);
    }
  };

  return (
    <SellerMessageContext.Provider
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
    </SellerMessageContext.Provider>
  );
};

export const useSellerMessages = () => {
  const context = useContext(SellerMessageContext);
  if (!context)
    throw new Error(
      "useSellerMessages must be used within a SellerMessageProvider"
    );
  return context;
};

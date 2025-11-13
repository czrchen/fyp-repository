"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import axios from "axios";

import { useSession } from "next-auth/react";

// 🧠 Type definitions
type FAQItem = {
  id: string;
  question: string;
  answer: string;
};

type ChatbotData = {
  id: number;
  sellerId: string;
  storeDescription?: string;
  faqs: FAQItem[];
  createdAt?: string;
  updatedAt?: string;
  seller?: {
    id: string;
    store_name: string;
    store_logo?: string | null;
  };
};

type ChatbotContextType = {
  chatbot: ChatbotData | null;
  isLoading: boolean;
  refetchChatbot: () => void;
  setChatbot: React.Dispatch<React.SetStateAction<ChatbotData | null>>;
};

// ---------------------------------------------------------

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export function ChatbotProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [chatbot, setChatbot] = useState<ChatbotData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🔁 Fetch seller chatbot data (from Prisma-backed API)
  const fetchChatbot = useCallback(async () => {
    try {
      if (status !== "authenticated" || !session?.user?.id) {
        console.log("⚠️ No active session — skipping chatbot fetch.");
        return;
      }
      setIsLoading(true);

      const res = await fetch("/api/seller/chatbot");
      if (!res.ok) throw new Error("Failed to load chatbot");
      const data = await res.json();

      if (data && data.id) {
        // Parse JSON FAQs if stored as JSON in Prisma
        const formattedFaqs =
          typeof data.faqs === "string" ? JSON.parse(data.faqs) : data.faqs;

        setChatbot({
          ...data,
          faqs: formattedFaqs || [],
        });
      } else {
        console.warn("⚠️ No chatbot found for this seller.");
        setChatbot(null);
      }
    } catch (error) {
      console.error("❌ Failed to fetch chatbot:", error);
      setChatbot(null);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchChatbot();
  }, [fetchChatbot]);

  return (
    <ChatbotContext.Provider
      value={{
        chatbot,
        isLoading,
        refetchChatbot: fetchChatbot,
        setChatbot,
      }}
    >
      {children}
    </ChatbotContext.Provider>
  );
}

export const useChatbot = () => {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error("useChatbot must be used within a ChatbotProvider");
  }
  return context;
};

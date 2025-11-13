"use client";

import { SellerProvider } from "@/contexts/SellerContext";
import { ChatbotProvider } from "@/contexts/ChatbotContext";
import { SellerMessageProvider } from "@/contexts/SellerMessageContext";

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SellerProvider>
      <ChatbotProvider>
        <SellerMessageProvider>
          <div className="min-h-screen bg-background">{children}</div>
        </SellerMessageProvider>
      </ChatbotProvider>
    </SellerProvider>
  );
}

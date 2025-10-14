// app/chat/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import Script from "next/script";

export default function ChatPage() {
  const [isOpen, setIsOpen] = useState(false);

  // Load Pickaxe script once and mount chatbot immediately (hidden by default)
  useEffect(() => {
    // Wait until script is available
    const interval = setInterval(() => {
      if ((window as any).Pickaxe) {
        (window as any).Pickaxe.mount();
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition"
        aria-label="Toggle Chat"
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {/* Chat popup container (always rendered, just hidden when minimized) */}
      <div
        className={`fixed bottom-20 right-6 w-[420px] h-[600px] bg-white shadow-2xl rounded-xl border border-gray-200 overflow-hidden z-50 transition-all duration-300 ${
          isOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <div
          id="deployment-7ab42b44-99b9-48ba-805b-b0348fce53d5"
          className="w-full h-full"
        />
      </div>

      {/* Load Pickaxe script once */}
      <Script
        src="https://studio.pickaxe.co/api/embed/bundle.js"
        strategy="afterInteractive"
      />
    </main>
  );
}

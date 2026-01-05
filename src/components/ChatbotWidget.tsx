"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import { MessageCircle, X } from "lucide-react";

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);

  //  Persist open state
  useEffect(() => {
    const saved = sessionStorage.getItem("chatOpen");
    if (saved === "true") setIsOpen(true);
  }, []);

  useEffect(() => {
    sessionStorage.setItem("chatOpen", isOpen ? "true" : "false");
  }, [isOpen]);

  //  Load Pickaxe once and mount automatically
  useEffect(() => {
    const load = () => {
      const pickaxe = (window as any).Pickaxe;
      if (pickaxe) {
        pickaxe.mount();
      }
    };

    // run once script loaded
    const checkReady = setInterval(() => {
      if ((window as any).Pickaxe) {
        load();
        clearInterval(checkReady);
      }
    }, 500);

    return () => clearInterval(checkReady);
  }, []);

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition z-50"
        aria-label="Toggle Chatbot"
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-24 right-6 w-[420px] h-[500px] bg-white shadow-2xl rounded-xl border border-gray-200 overflow-hidden z-50 transition-all duration-300 ${
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

      {/* Load Pickaxe script globally once */}
      <Script
        src="https://studio.pickaxe.co/api/embed/bundle.js"
        strategy="afterInteractive"
      />
    </>
  );
}

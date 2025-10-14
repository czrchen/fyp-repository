"use client";

import { useState } from "react";

export default function ChatPage({ params }: { params: { sellerId: string } }) {
  const { sellerId } = params;
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<{ role: string; text: string }[]>(
    []
  );
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!question.trim()) return;

    // add user's message
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setLoading(true);

    try {
      const res = await fetch(`/api/chatbot/${sellerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();

      // add bot's message
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: data.answer || "No response." },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Error connecting to chatbot." },
      ]);
    }

    setLoading(false);
    setQuestion("");
  };

  return (
    <div className="flex flex-col items-center p-6 min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">Chat with Seller #{sellerId}</h1>

      <div className="w-full max-w-md bg-white border rounded-lg shadow p-4 flex flex-col space-y-3">
        <div className="h-80 overflow-y-auto border p-3 rounded">
          {messages.length === 0 && (
            <p className="text-gray-400 text-center mt-8">
              Start asking a question…
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`p-2 my-1 rounded-lg ${
                m.role === "user"
                  ? "bg-blue-100 self-end text-right"
                  : "bg-gray-100 self-start text-left"
              }`}
            >
              {m.text}
            </div>
          ))}
          {loading && (
            <p className="text-sm text-gray-500 italic mt-2">
              Bot is typing...
            </p>
          )}
        </div>

        <div className="flex gap-2 mt-3">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your question..."
            className="flex-1 border rounded p-2"
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

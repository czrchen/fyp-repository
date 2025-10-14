"use client";

import { useState } from "react";

type FAQ = { question: string; answer: string };

export default function ChatbotSetupPage() {
  const [sellerId, setSellerId] = useState("001");
  const [storeDescription, setStoreDescription] = useState("");
  const [faqs, setFaqs] = useState<FAQ[]>([{ question: "", answer: "" }]);
  const [saving, setSaving] = useState(false);

  const handleChange = (i: number, field: keyof FAQ, value: string) => {
    const updated = [...faqs];
    updated[i][field] = value;
    setFaqs(updated);
  };

  const addFaq = () =>
    setFaqs((prev) => [...prev, { question: "", answer: "" }]);

  const saveChatbot = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/chatbot/saveChatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId, faqs, storeDescription }),
      });
      const data = await res.json();
      alert(data.message ?? "Saved");
    } catch {
      alert("Failed to save chatbot");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold mb-2">Customize Your Chatbot</h1>

      <div>
        <label className="font-semibold block mb-1">Seller ID</label>
        <input
          className="border p-2 rounded w-full"
          value={sellerId}
          onChange={(e) => setSellerId(e.target.value)}
        />
      </div>

      <div>
        <label className="font-semibold block mb-1">Store Description</label>
        <textarea
          className="border p-2 rounded w-full"
          placeholder="Describe your store, e.g. We sell handmade skincare products using natural ingredients."
          value={storeDescription}
          onChange={(e) => setStoreDescription(e.target.value)}
          rows={3}
        />
      </div>

      <h2 className="text-lg font-semibold mt-6">FAQs</h2>
      {faqs.map((f, i) => (
        <div key={i} className="border rounded p-3 my-2">
          <input
            type="text"
            placeholder="Question"
            value={f.question}
            onChange={(e) => handleChange(i, "question", e.target.value)}
            className="border p-2 w-full mb-2 rounded"
          />
          <textarea
            placeholder="Answer"
            value={f.answer}
            onChange={(e) => handleChange(i, "answer", e.target.value)}
            className="border p-2 w-full rounded"
          />
        </div>
      ))}

      <div className="flex gap-3">
        <button onClick={addFaq} className="bg-gray-200 px-4 py-2 rounded">
          + Add FAQ
        </button>
        <button
          onClick={saveChatbot}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

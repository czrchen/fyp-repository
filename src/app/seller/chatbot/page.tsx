"use client";

import { useState } from "react";
import Link from "next/link";
import { useChatbot } from "@/contexts/ChatbotContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Plus, Trash2, AlertCircle, Save } from "lucide-react";
import { toast } from "sonner";

export default function ChatbotManagement() {
  const { chatbot, isLoading, setChatbot, refetchChatbot } = useChatbot();
  const [newFaq, setNewFaq] = useState({ question: "", answer: "" });
  const [isSaving, setIsSaving] = useState(false);

  // 🧱 Fallback chatbot template for new users
  const emptyChatbot = {
    id: -1,
    sellerId: "",
    storeDescription: "",
    faqs: [],
  };

  // 🕓 Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Loading chatbot data...
      </div>
    );
  }

  // 🧠 Use either existing chatbot or a blank template
  const currentChatbot = chatbot ?? emptyChatbot;
  const MAX_FAQS = 10;
  const remainingSlots = MAX_FAQS - (currentChatbot.faqs?.length ?? 0);

  // 🧠 Update store description in context
  const handleDescriptionChange = (value: string) => {
    setChatbot((prev) =>
      prev
        ? { ...prev, storeDescription: value }
        : { ...emptyChatbot, storeDescription: value }
    );
  };

  // ➕ Add new FAQ
  const handleAddFaq = () => {
    if (!newFaq.question || !newFaq.answer) {
      toast.error("Please fill in both question and answer");
      return;
    }

    if (currentChatbot.faqs.length >= MAX_FAQS) {
      toast.error(`You can only add up to ${MAX_FAQS} FAQs`);
      return;
    }

    const newItem = { id: Date.now().toString(), ...newFaq };
    setChatbot((prev) =>
      prev
        ? { ...prev, faqs: [...prev.faqs, newItem] }
        : { ...emptyChatbot, faqs: [newItem] }
    );

    setNewFaq({ question: "", answer: "" });
    toast.success("FAQ added successfully!");
  };

  // ❌ Delete FAQ
  const handleDeleteFaq = (id: string) => {
    setChatbot((prev) =>
      prev ? { ...prev, faqs: prev.faqs.filter((f) => f.id !== id) } : prev
    );
    toast.info("FAQ removed successfully");
  };

  // 💾 Save chatbot to DB (create or update)
  const handleSaveChatbot = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/chatbot/saveChatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId: currentChatbot.sellerId,
          faqs: currentChatbot.faqs.map(({ question, answer }) => ({
            question,
            answer,
          })),
          storeDescription: currentChatbot.storeDescription,
        }),
      });

      if (!res.ok) throw new Error("Failed to save chatbot");

      toast.success("Chatbot and store info saved successfully!");
      await refetchChatbot();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save chatbot configuration");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 🧭 Navigation Bar */}
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-14">
          <div className="flex items-center h-16">
            <Link href="/seller" passHref>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-18 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Chatbot Management
          </h1>
          <p className="text-muted-foreground">
            Manage your automated FAQ responses and store information
          </p>
        </div>

        {/* 🏪 Store Description */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Store Description</CardTitle>
            <CardDescription>
              This text helps your chatbot introduce your store to customers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Write a short description about your store..."
              rows={4}
              value={currentChatbot.storeDescription ?? ""}
              onChange={(e) => handleDescriptionChange(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* ℹ️ Info Alert */}
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You can add up to {MAX_FAQS} FAQs. Currently using{" "}
            {currentChatbot.faqs.length} of {MAX_FAQS} slots.
          </AlertDescription>
        </Alert>

        {/* ➕ Add New FAQ */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Add New FAQ</CardTitle>
                <CardDescription>
                  Create automated responses for common questions.
                </CardDescription>
              </div>
              <Badge variant={remainingSlots > 3 ? "secondary" : "destructive"}>
                {remainingSlots} slots remaining
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question">Question</Label>
                <Input
                  id="question"
                  placeholder="Enter a frequently asked question"
                  value={newFaq.question}
                  onChange={(e) =>
                    setNewFaq({ ...newFaq, question: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="answer">Answer</Label>
                <Textarea
                  id="answer"
                  placeholder="Enter your answer"
                  rows={3}
                  value={newFaq.answer}
                  onChange={(e) =>
                    setNewFaq({ ...newFaq, answer: e.target.value })
                  }
                />
              </div>

              <Button
                onClick={handleAddFaq}
                disabled={currentChatbot.faqs.length >= MAX_FAQS}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add FAQ
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 📋 Existing FAQs */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your FAQs ({currentChatbot.faqs.length})</CardTitle>
            <CardDescription>
              Manage your existing automated responses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentChatbot.faqs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No FAQs added yet. Add your first FAQ above.
              </div>
            ) : (
              <div className="space-y-4">
                {currentChatbot.faqs.map((faq) => (
                  <div
                    key={faq.id ?? faq.question}
                    className="p-4 rounded-lg border border-border hover:bg-accent transition-smooth"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground mb-2">
                          {faq.question}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {faq.answer}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteFaq(faq.id ?? faq.question)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 💾 Save All Changes */}
        <div className="flex justify-end">
          <Button onClick={handleSaveChatbot} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

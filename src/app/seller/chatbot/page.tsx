"use client";

import { useState } from "react";
import Link from "next/link";
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

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export default function ChatbotManagement() {
  // 🧠 Example seller ID — replace with actual logged-in seller ID later
  const sellerId = "seller001";

  const [storeDescription, setStoreDescription] = useState(
    "Welcome to our store! We provide high-quality products at affordable prices."
  );

  const [faqs, setFaqs] = useState<FAQ[]>([
    {
      id: "1",
      question: "What are your shipping times?",
      answer: "We ship within 2-3 business days.",
    },
    {
      id: "2",
      question: "Do you offer refunds?",
      answer: "Yes, we offer a 30-day money-back guarantee.",
    },
  ]);

  const [newFaq, setNewFaq] = useState({ question: "", answer: "" });
  const [isSaving, setIsSaving] = useState(false);

  const MAX_FAQS = 10;
  const remainingSlots = MAX_FAQS - faqs.length;

  const handleAddFaq = () => {
    if (!newFaq.question || !newFaq.answer) {
      toast.error("Please fill in both question and answer");
      return;
    }

    if (faqs.length >= MAX_FAQS) {
      toast.error(`You can only add up to ${MAX_FAQS} FAQs`);
      return;
    }

    setFaqs([...faqs, { id: Date.now().toString(), ...newFaq }]);
    setNewFaq({ question: "", answer: "" });
    toast.success("FAQ added successfully!");
  };

  const handleDeleteFaq = (id: string) => {
    setFaqs(faqs.filter((faq) => faq.id !== id));
    toast.info("FAQ removed successfully");
  };

  // 🧩 Save to database via your API
  const handleSaveChatbot = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/chatbot/saveChatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId,
          faqs: faqs.map((f) => ({
            question: f.question,
            answer: f.answer,
          })),
          storeDescription,
        }),
      });

      if (!res.ok) throw new Error("Failed to save chatbot");

      toast.success("Chatbot and store info saved successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save chatbot configuration");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-4">
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

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Chatbot Management
          </h1>
          <p className="text-muted-foreground">
            Manage your automated FAQ responses and store info
          </p>
        </div>

        {/* ✅ Store Description Section */}
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
              value={storeDescription}
              onChange={(e) => setStoreDescription(e.target.value)}
            />
          </CardContent>
        </Card>

        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You can add up to {MAX_FAQS} FAQs. Currently using {faqs.length} of{" "}
            {MAX_FAQS} slots.
          </AlertDescription>
        </Alert>

        {/* Add New FAQ */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Add New FAQ</CardTitle>
                <CardDescription>
                  Create automated responses for common questions
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
                  placeholder="Enter frequently asked question"
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
                disabled={faqs.length >= MAX_FAQS}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add FAQ
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Existing FAQs */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your FAQs ({faqs.length})</CardTitle>
            <CardDescription>
              Manage your existing automated responses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {faqs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No FAQs added yet. Add your first FAQ above.
              </div>
            ) : (
              <div className="space-y-4">
                {faqs.map((faq) => (
                  <div
                    key={faq.id}
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
                        onClick={() => handleDeleteFaq(faq.id)}
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

        {/* ✅ Save All Changes Button */}
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

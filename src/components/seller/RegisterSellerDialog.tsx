"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { X, Store, FileText, Image, Sparkles } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import ImageUploader from "@/components/ImageUploader";
import { toast } from "sonner";

export default function RegisterSellerDialog({
  userId,
  onRegistered,
}: {
  userId: string;
  onRegistered: (sellerData: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    store_name: "",
    store_description: "",
    store_logo: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.store_name.trim()) {
      toast.error("Store name is required");
      return;
    }

    try {
      const res = await fetch(`/api/seller/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, userId }),
      });

      if (!res.ok) throw new Error("Failed to register seller");

      onRegistered({
        id: crypto.randomUUID(),
        userId,
      });

      toast.success("Seller registration successful!");
      setForm({ store_name: "", store_description: "", store_logo: "" });
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
      console.error(err);
    } finally {
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full sm:w-auto whitespace-nowrap">
          Register as Seller
        </Button>
      </DialogTrigger>

      <DialogContent
        className="
      sm:max-w-[600px] w-[90%] max-h-[90vh] overflow-y-auto
      fixed !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2
      p-10 sm:p-8 md:p-10 rounded-xl shadow-lg bg-background
      border border-border
    "
      >
        <DialogHeader>
          <DialogTitle>Register as a Seller</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="store_name">Store Name</Label>
            <Input
              id="store_name"
              name="store_name"
              value={form.store_name}
              onChange={handleChange}
              placeholder="e.g., Yume Grocery"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="store_description">Store Description</Label>
            <Textarea
              id="store_description"
              name="store_description"
              value={form.store_description}
              onChange={handleChange}
              placeholder="Describe your store..."
            />
          </div>

          <div className="space-y-2">
            <Label>Store Logo</Label>

            <ImageUploader
              onUploaded={(url: any) =>
                setForm((prev) => ({
                  ...prev,
                  store_logo: url,
                }))
              }
            />

            {form.store_logo && (
              <div className="relative mt-2 w-24 h-24">
                <img
                  src={form.store_logo}
                  alt="Store Logo Preview"
                  className="w-24 h-24 rounded-md object-cover border"
                />

                <button
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, store_logo: "" }))
                  }
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

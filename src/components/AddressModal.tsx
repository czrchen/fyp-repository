"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/contexts/ProfileContext";
import type { Address } from "@/contexts/ProfileContext";
import { toast } from "sonner";

export type AddressData = Address;

type AddressModalProps = {
  userId: string;
  open: boolean;
  onClose: () => void;
  addressToEdit?: AddressData | null; // if passed, it becomes "edit" mode
  onAdded?: (newAddress: AddressData) => void; // 🧩 add this
};

export default function AddressModal({
  userId,
  open,
  onClose,
  addressToEdit,
  onAdded,
}: AddressModalProps) {
  const { refreshProfile } = useProfile();
  const isEditMode = !!addressToEdit;

  const [formData, setFormData] = useState<Partial<AddressData>>({
    userId,
    label: "",
    street: "",
    city: "",
    state: "",
    postcode: "",
    country: "",
  });
  const [loading, setLoading] = useState(false);

  // Prefill form when editing
  useEffect(() => {
    if (addressToEdit) {
      setFormData(addressToEdit);
    } else {
      setFormData({
        userId,
        label: "",
        street: "",
        city: "",
        state: "",
        postcode: "",
        country: "",
      });
    }
  }, [addressToEdit, userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch(
        isEditMode ? `/api/address/${addressToEdit?.id}` : `/api/address`,
        {
          method: isEditMode ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (!res.ok) throw new Error("Failed to save address");

      const savedAddress = await res.json(); // ⬅️ get new/updated data

      toast.success(
        isEditMode
          ? "Address updated successfully!"
          : "Address added successfully!"
      );

      // ⬅️ UPDATE UI FIRST before fetching fresh profile
      if (!isEditMode && onAdded) {
        onAdded(savedAddress);
      }

      refreshProfile(); // optional, but keep for consistency

      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="
      sm:max-w-[500px] w-[90%] max-h-[90vh] overflow-y-auto
      fixed !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2
      p-10 sm:p-8 md:p-10 rounded-xl shadow-lg bg-background
      border border-border
    "
      >
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Address" : "Add New Address"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="label">Label (e.g. Home, Office)</Label>
            <Input
              id="label"
              value={formData.label ?? ""}
              onChange={handleChange}
              placeholder="Enter label"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="street">Street</Label>
            <Input
              id="street"
              value={formData.street}
              onChange={handleChange}
              placeholder="Enter street address"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Enter city"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="Enter state"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-2">
              <Label htmlFor="postcode">Postcode</Label>
              <Input
                id="postcode"
                value={formData.postcode ?? ""}
                onChange={handleChange}
                placeholder="Enter postcode"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country ?? ""}
                onChange={handleChange}
                placeholder="Enter country"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : isEditMode ? "Update" : "Add"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

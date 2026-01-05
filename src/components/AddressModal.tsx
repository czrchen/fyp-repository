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
  onAdded?: (newAddress: AddressData) => void; //  add this
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

      // Parse response once
      const data = await res.json();

      if (!res.ok) {
        // Backend validation error (e.g. Default address rule)
        if (data?.error) {
          toast.error(data.error);
        } else {
          toast.error("Failed to save address");
        }
        return;
      }

      // Success
      toast.success(
        isEditMode
          ? "Address updated successfully!"
          : "Address added successfully!"
      );

      // Update UI immediately for add mode
      if (!isEditMode && onAdded) {
        onAdded(data);
      }

      refreshProfile(); // keep for consistency
      onClose();
    } catch (err) {
      toast.error("Unable to save address. Please try again.");
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
            <Label htmlFor="label">Label</Label>

            <select
              id="label"
              name="label"
              value={formData.label ?? "Home"}
              onChange={(e) =>
                handleChange({
                  target: {
                    id: "label",
                    value: e.target.value,
                  },
                } as any)
              }
              className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-60"
            >
              {isEditMode && (
                <>
                  <option value="Default">Default</option>
                </>
              )}
              {/* Always show Default */}
              <option value="Home">Home</option>
              <option value="Office">Office</option>
              <option value="School">School</option>
              <option value="Others">Others</option>
              {/* Only show other options when NOT editing */}
            </select>
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

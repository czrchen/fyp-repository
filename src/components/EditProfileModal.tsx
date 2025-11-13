"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/contexts/ProfileContext";
import { toast } from "sonner";

export default function EditProfileModal({
  user,
  onEdited,
}: {
  user: any;
  onEdited: (updatedFields: { location: string; phone: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    location: user?.location || "",
    phone: user?.phone || "",
  });
  const [loading, setLoading] = useState(false);

  const { refreshProfile } = useProfile();

  const handleSubmit = async () => {
    try {
      const res = await fetch(`/api/user/${user.id}/editProfile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: formData.location,
          phone: formData.phone,
        }),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      onEdited({
        location: formData.location,
        phone: formData.phone,
      });

      await refreshProfile();

      toast.success("Profile updated successfully!");
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile");
    } finally {
    }
  };

  return (
    <>
      {/* Trigger */}
      <Button variant="outline" onClick={() => setOpen(true)}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.232 5.232l3.536 3.536M9 13l3-3 6 6m-6-6l6-6"
          />
        </svg>
        Edit Profile
      </Button>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="
      sm:max-w-[400px] w-[90%] max-h-[90vh] overflow-y-auto
      fixed !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2
      p-10 sm:p-8 md:p-10 rounded-xl shadow-lg bg-background
      border border-border
    "
        >
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Enter your location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

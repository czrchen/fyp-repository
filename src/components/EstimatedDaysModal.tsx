"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface EstimatedDaysModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (days: number) => void;
}

export function EstimatedDaysModal({
  open,
  onClose,
  onConfirm,
}: EstimatedDaysModalProps) {
  const [days, setDays] = useState("");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Estimated Delivery Days</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Enter estimated days"
            value={days}
            onChange={(e) => setDays(e.target.value)}
          />

          <Button className="w-full" onClick={() => onConfirm(Number(days))}>
            Confirm Delivered
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

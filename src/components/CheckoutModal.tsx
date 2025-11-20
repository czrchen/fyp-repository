"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  MapPin,
  CreditCard,
  Package,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

export default function CheckoutModal({
  open,
  onClose,
  selectedItems,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  selectedItems: any[];
  onSuccess: () => void;
}) {
  const [addresses, setAddresses] = useState<any[]>([]);
  const { data: userSession } = useSession();
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [payment, setPayment] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingAddress, setFetchingAddress] = useState(true);

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        setFetchingAddress(true);
        const res = await fetch("/api/user/current");
        if (!res.ok) {
          console.error("Failed to fetch current user");
          return;
        }

        const data = await res.json();
        setAddresses(data.addresses || []);

        // Auto-select first address if available
        if (data.addresses?.length > 0) {
          setSelectedAddress(data.addresses[0].id);
        }
      } catch (error) {
        console.error("Error fetching addresses:", error);
      } finally {
        setFetchingAddress(false);
      }
    };

    if (userSession?.user?.email && open) {
      fetchAddress();
    }
  }, [userSession, open]);

  const totalAmount = selectedItems.reduce(
    (sum, item) => sum + (item.price * item.quantity || 0),
    0
  );

  // const handleConfirm = async () => {
  //   if (!selectedAddress) {
  //     toast.error("Please select a delivery address");
  //     return;
  //   }

  //   if (!payment) {
  //     toast.error("Please select a payment method");
  //     return;
  //   }

  //   try {
  //     setLoading(true);
  //     const res = await fetch("/api/checkout", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         items: selectedItems,
  //         addressId: selectedAddress,
  //         paymentMethod: payment,
  //         userSession: localStorage.getItem("sessionId") || "guest",
  //       }),
  //     });

  //     if (!res.ok) throw new Error("Checkout failed");

  //     toast.success("Order placed successfully!");
  //     onSuccess();
  //     onClose();
  //   } catch (err) {
  //     console.error(err);
  //     toast.error("Failed to complete checkout. Please try again.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleConfirm = async () => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }

    if (!payment) {
      toast.error("Please select a payment method");
      return;
    }

    try {
      // setLoading(true);

      // Get logged-in user from NextAuth using cookies
      const resp = await fetch("/api/user/current", { cache: "no-store" });
      const user = await resp.json();

      if (!user?.id) {
        toast.error("Please login before checkout");
        setLoading(false);
        return;
      }

      // Save everything needed for checkout AFTER FPX redirect
      localStorage.setItem(
        "checkout_data",
        JSON.stringify({
          userId: user.id,
          items: selectedItems,
          addressId: selectedAddress,
          paymentMethod: payment,
        })
      );

      // Create FPX payment session
      const payRes = await fetch("/api/payment/fpx/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: selectedItems.reduce(
            (sum: number, item: any) => sum + item.price * item.quantity,
            0
          ),
        }),
      });

      const { redirectUrl } = await payRes.json();
      window.location.href = redirectUrl;
    } catch (err) {
      console.error(err);
      toast.error("Failed to start payment. Please try again.");
      setLoading(false); // only stop loading on error, success will leave page
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
        <DialogHeader className="space-y-3 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            Checkout
          </DialogTitle>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {selectedItems.length}{" "}
              {selectedItems.length === 1 ? "item" : "items"}
            </span>
            <span className="font-semibold text-lg">
              RM {totalAmount.toFixed(2)}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Address Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">Delivery Address</h4>
            </div>

            {fetchingAddress ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : addresses.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900">
                    No saved addresses
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    Please add a delivery address in your profile settings
                    before checking out.
                  </p>
                </div>
              </div>
            ) : (
              <RadioGroup
                value={selectedAddress ?? ""}
                onValueChange={setSelectedAddress}
                className="space-y-2"
              >
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`relative flex items-start gap-3 rounded-lg border-2 p-4 transition-all cursor-pointer hover:border-primary/50 ${
                      selectedAddress === addr.id
                        ? "border-primary bg-primary/5"
                        : "border-slate-200"
                    }`}
                  >
                    <RadioGroupItem
                      value={addr.id}
                      id={addr.id}
                      className="mt-1"
                    />
                    <Label
                      htmlFor={addr.id}
                      className="flex-1 cursor-pointer space-y-1"
                    >
                      <span className="font-semibold text-foreground block">
                        {addr.label || "Unnamed Address"}
                      </span>
                      <span className="text-sm text-muted-foreground block leading-relaxed">
                        {addr.street}
                        <br />
                        {addr.city}, {addr.state} {addr.postcode}
                        <br />
                        {addr.country}
                      </span>
                    </Label>
                    {selectedAddress === addr.id && (
                      <ChevronRight className="w-5 h-5 text-primary absolute right-4 top-1/2 -translate-y-1/2" />
                    )}
                  </div>
                ))}
              </RadioGroup>
            )}
          </div>

          {/* Payment Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">Payment Method</h4>
            </div>

            <RadioGroup value={payment ?? ""} onValueChange={setPayment}>
              <div
                className={`flex items-center gap-3 rounded-lg border-2 p-4 transition-all cursor-pointer hover:border-primary/50 ${
                  payment === "fpx"
                    ? "border-primary bg-primary/5"
                    : "border-slate-200"
                }`}
              >
                <RadioGroupItem value="fpx" id="fpx" />
                <Label htmlFor="fpx" className="flex-1 cursor-pointer">
                  <span className="font-medium block">FPX Online Banking</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Order Summary */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">RM {totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium text-green-600">FREE</span>
            </div>
            <div className="border-t pt-2 flex items-center justify-between">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold text-primary">
                RM {totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              loading || !selectedAddress || !payment || addresses.length === 0
            }
            className="flex-1"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              "Confirm Order"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

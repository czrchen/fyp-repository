"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const doCheckout = async () => {
      const raw = localStorage.getItem("checkout_data");
      if (!raw) {
        toast.error("Missing checkout data");
        return;
      }

      const checkoutData = JSON.parse(raw);

      // Confirm FPX payment (optional)
      const sessionId = searchParams.get("session_id");
      await fetch("/api/payment/fpx/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      // Proceed with checkout
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutData),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error("Order creation failed");
        return;
      }

      toast.success("Order created!");

      // Clean storage
      localStorage.removeItem("checkout_data");

      router.push(`/cart`);
    };

    doCheckout();
  }, []);

  return <p>Processing your payment...</p>;
}

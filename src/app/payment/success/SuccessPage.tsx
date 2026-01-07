"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { useProfile } from "@/contexts/ProfileContext";
import { useOrders } from "@/contexts/OrderContext";
import { useBuyerMessages } from "@/contexts/BuyerMessageContext";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchCart } = useCart();
  const { refreshProfile } = useProfile();
  const { fetchOrders } = useOrders();
  const { sessions, sendMessage } = useBuyerMessages();

  useEffect(() => {
    const doCheckout = async () => {
      const raw = localStorage.getItem("checkout_data");
      if (!raw) {
        toast.error("Missing checkout data");
        return;
      }

      const checkoutData = JSON.parse(raw);
      const chatSessionId = checkoutData.sessionId;

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

      if (!res.ok) {
        const errorData = await res.json();

        if (errorData.refundRequired) {
          toast.error(
            "Payment was successful, but the item is no longer available. A refund will be processed."
          );
        } else {
          toast.error("Order creation failed");
        }

        return;
      }

      await fetchCart();
      await refreshProfile();
      await fetchOrders();
      toast.success("Order created!");
      const returnUrl = checkoutData.returnUrl;
      // Clean storage
      localStorage.removeItem("checkout_data");
      if (chatSessionId) {
        // 1. Success message
        await sendMessage(
          chatSessionId,
          "Your payment has been completed successfully 🎉",
          "chatbot",
          true,
          "text",
          null
        );

        // // 2. Find session to get sellerId
        // const session = sessions.find((s) => s.id === chatSessionId);
        // const sellerId = session?.sellerId;

        // // 3. Fetch full cart
        // const refreshedCart = await fetch("/api/cart").then((r) => r.json());

        // // 4. Filter items belonging to this seller
        // const sellerCartItems = refreshedCart.items.filter(
        //   (item: any) => item.sellerId === sellerId
        // );

        // // 5. Send correct cart bubble based on filtered items
        // if (sellerCartItems.length === 0) {
        //   await sendMessage(
        //     chatSessionId,
        //     "Your cart is now empty for this store.",
        //     "chatbot",
        //     true,
        //     "text",
        //     null
        //   );
        // } else {
        //   await sendMessage(
        //     chatSessionId,
        //     "Here are your updated cart items:",
        //     "chatbot",
        //     true,
        //     "cart_list",
        //     sellerCartItems
        //   );
        // }
      }

      router.push(returnUrl);
    };

    doCheckout();
  }, []);

  return <p>Processing your payment...</p>;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft } from "lucide-react";

export default function PaymentCancelledPage() {
  const router = useRouter();
  const raw = localStorage.getItem("checkout_data");
  if (!raw) {
    return;
  }

  const checkoutData = JSON.parse(raw);
  const returnUrl = checkoutData.returnUrl;

  useEffect(() => {
    localStorage.removeItem("checkout_data");
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <XCircle className="w-12 h-12 text-orange-600 dark:text-orange-400" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
            Payment Cancelled
          </h1>

          {/* Description */}
          <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
            Your payment was cancelled and no charges were made to your account.
            You can return to your cart to try again or continue shopping.
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={() => router.push(returnUrl)}
              className="w-full"
              size="lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

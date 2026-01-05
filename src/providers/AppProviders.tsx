"use client";

import { useSession } from "next-auth/react";
import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/contexts/CartContext";
import { OrderProvider } from "@/contexts/OrderContext";
import { ProductProvider } from "@/contexts/ProductContext";
import { BuyerMessageProvider } from "@/contexts/BuyerMessageContext";
import { CategoryProvider } from "@/contexts/CategoryContext";
import { AllSellerInfoProvider } from "@/contexts/AllSellerInfoContext";
import ChatbotWidget from "@/components/ChatbotWidget";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { RecommenderProvider } from "@/contexts/RecommenderContext";
import { Toaster } from "sonner";

function AuthenticatedProviders({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  //  Always wrap with ProfileProvider
  // ProfileProvider itself will handle session detection
  return <ProfileProvider>{children}</ProfileProvider>;
}

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <Toaster position="bottom-right" richColors closeButton />

      {/* Wrap entire app in all providers */}
      <RecommenderProvider>
        <CartProvider>
          <OrderProvider>
            <ProductProvider>
              <CategoryProvider>
                <BuyerMessageProvider>
                  <AllSellerInfoProvider>
                    <AuthenticatedProviders>{children}</AuthenticatedProviders>
                  </AllSellerInfoProvider>
                </BuyerMessageProvider>
              </CategoryProvider>
            </ProductProvider>
          </OrderProvider>
        </CartProvider>
      </RecommenderProvider>

      {/* <ChatbotWidget /> */}
    </SessionProvider>
  );
}

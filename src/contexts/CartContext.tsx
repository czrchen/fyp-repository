"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export interface CartItem {
  id: string; // cartItem UUID
  productId: string; // reference to Product
  variantId?: string | null; // optional reference to ProductVariant
  attributes?: Record<string, string> | null;
  name: string; // display name (variant name or product name)
  price: number;
  image: string;
  quantity: number;
  sellerId?: string;
  sellerName?: string;
  product?: any; // full product object (if included from API)
  variant?: any; // full variant object (if included from API)
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (productId: string, variantId?: string | null) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    variantId?: string | null
  ) => void;
  clearCart: () => void;
  fetchCart: () => Promise<void>;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<CartItem[]>([]);

  // 🛒 Add item to cart
  const addToCart = (item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.productId === item.productId && i.variantId === item.variantId
      );

      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId && i.variantId === item.variantId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  // 🗑 Remove item locally
  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // 🔢 Update item quantity locally
  const updateQuantity = (id: string, quantity: number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
  };

  // 🧹 Clear entire cart
  const clearCart = () => {
    setItems([]);
    toast.warning(`Cart cleared`, {
      description: "All items have been removed from your cart",
    });
  };

  // 🔄 Fetch cart from backend
  const fetchCart = useCallback(async () => {
    if (status !== "authenticated" || !session?.user?.id) {
      setItems([]);
      return;
    }

    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch cart");
      const data = await res.json();

      // backend should include: product + variant + seller
      setItems(data.items || []);
      console.log("🛍️ Cart items loaded:", data.items);
    } catch (err) {
      console.error("❌ Failed to fetch cart:", err);
    }
  }, [session?.user?.id, status]);

  // 👤 Re-fetch on auth changes
  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      fetchCart();
    } else if (status === "unauthenticated") {
      setItems([]);
    }
  }, [status, session?.user?.id, fetchCart]);

  // 🧮 Total quantity counter
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        fetchCart,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// ✅ Hook
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};

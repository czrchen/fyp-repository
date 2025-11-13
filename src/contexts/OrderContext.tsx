"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner"; // optional for notifications

// 🧩 Type definitions matching your Prisma models
export interface OrderItem {
  id: string;
  productId: string;
  variantId?: string | null;
  sellerId: string;
  name: string;
  imageUrl?: string | null;
  price: number;
  quantity: number;
  subtotal: number;
  status: string;
  estimatedDays?: number | null;
  deliveredAt?: string | null;
  receivedAt?: string | null;
  rating?: number | null;
  feedback?: string | null;
  attributes?: Record<string, any> | null;
}

export interface Order {
  id: string;
  totalAmount: number;
  paymentMethod?: string | null;
  createdAt: string;
  updatedAt: string;
  addressId?: number | null;
  items: OrderItem[];
}

interface OrderContextType {
  orders: Order[];
  isloading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
}

// 🧱 Create context
const OrderContext = createContext<OrderContextType>({
  orders: [],
  isloading: false,
  error: null,
  fetchOrders: async () => {},
});

// 🧩 Provider implementation
export function OrderProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isloading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Fetch all orders for logged-in user
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      if (status !== "authenticated" || !session?.user?.id) {
        setLoading(false);
        return;
      }
      setError(null);

      const res = await fetch("/api/user/order", {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to fetch orders");

      const data = await res.json();

      // 🧠 Map and format the data properly
      const formattedOrders: Order[] = (data.orders || []).map(
        (order: any) => ({
          id: order.id,
          totalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          addressId: order.addressId,
          items: order.items.map((i: any) => ({
            id: i.id,
            productId: i.productId,
            variantId: i.variantId,
            sellerId: i.sellerId,
            name: i.product.name,
            imageUrl: i.product.imageUrl,
            price: i.price,
            quantity: i.quantity,
            subtotal: i.subtotal,
            status: i.status,
            estimatedDays: i.estimatedDays,
            deliveredAt: i.deliveredAt,
            receivedAt: i.receivedAt,
            rating: i.rating,
            feedback: i.feedback,
            attributes: i.attributes || {},
          })),
        })
      );

      setOrders(formattedOrders);
    } catch (err: any) {
      console.error("❌ Error fetching orders:", err);
      setError(err.message || "Failed to load orders");
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, status]);

  // ✅ Auto-fetch orders on mount
  useEffect(() => {
    fetchOrders();
  }, [session?.user?.id, status]);

  return (
    <OrderContext.Provider value={{ orders, isloading, error, fetchOrders }}>
      {children}
    </OrderContext.Provider>
  );
}

// 🧩 Custom hook for easy access
export const useOrders = () => useContext(OrderContext);

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useSession } from "next-auth/react";
import { useProducts } from "@/contexts/ProductContext";

// ----------------- TYPES -----------------
type SellerStats = {
  totalSales: number;
  totalRevenue: number;
  totalViews: number;
  ratingAvg: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
};

type SellerOrderItem = {
  id: string;
  orderId: string;
  productId: string;
  sellerId: string;
  quantity: number;
  price: number;
  subtotal: number;
  status: string;
  imageUrl?: string | null;
  attributes?: Record<string, any> | null;
  order: any;
  product: any;
  variant?: any;
  rating: number;
  feedback: string;
};

type SellerOrderGroup = {
  orderId: string;
  createdAt: string;
  updatedAt: string;
  totalAmount: number;
  paymentMethod: string | null;
  user: any;
  address: any;
  items: SellerOrderItem[];
};

type SellerProduct = {
  id: string;
  sellerId: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category: string;
  tags: string[];
  imageUrl?: string;
  galleryUrls: string[];
  attributes?: Record<string, any>;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
  status: boolean;
};

type SellerContextType = {
  sellerId: string | null;
  storeName: string | null;
  storeLogo: string | null;
  storeDescription: string | null;
  stats: SellerStats | null;
  products: SellerProduct[];
  orderItems: SellerOrderItem[];
  orders: SellerOrderGroup[];
  isLoading: boolean;
  refetchSellerData: () => void;
  refetchingSellerData: () => void;
  updateOrderItemStatus: (
    orderId: string,
    itemId: string,
    newStatus: string
  ) => void;
};

// ----------------- CONTEXT -----------------
const SellerContext = createContext<SellerContextType | undefined>(undefined);

// ----------------- PROVIDER -----------------
export function SellerProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { products: allProducts, refetchProducts } = useProducts();

  const [sellerId, setSellerId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string | null>(null);
  const [storeLogo, setStoreLogo] = useState<string | null>(null);
  const [storeDescription, setStoreDescription] = useState<string | null>(null);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [orderItems, setOrderItems] = useState<SellerOrderItem[]>([]);
  const [orders, setOrders] = useState<SellerOrderGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSellerData = useCallback(async () => {
    try {
      setIsLoading(true);
      if (status !== "authenticated" || !session?.user?.id) return;

      const res = await fetch("/api/seller/overview");
      if (!res.ok) throw new Error("Failed to load seller overview");

      const data = await res.json();
      const seller = data?.seller;
      const apiStats = data?.stats;

      // Seller Info
      setSellerId(seller?.id ?? null);
      setStoreName(seller?.store_name ?? null);
      setStoreLogo(seller?.store_logo ?? null);
      setStoreDescription(seller?.store_description ?? null);

      // Stats from API (now includes orders)
      setStats(apiStats);

      // New: Order Items + Grouped Orders
      setOrderItems(data.orderItems ?? []);
      setOrders(data.orders ?? []);

      // Refresh product context
      await refetchProducts();
    } catch (error) {
      console.error("❌ Failed to fetch seller data:", error);
      setStats(null);
      setOrderItems([]);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, status, refetchProducts]);

  const refetchingSellerData = useCallback(async () => {
    try {
      if (status !== "authenticated" || !session?.user?.id) return;

      const res = await fetch("/api/seller/overview");
      if (!res.ok) throw new Error("Failed to load seller overview");

      const data = await res.json();
      const seller = data?.seller;
      const apiStats = data?.stats;

      // Seller Info
      setSellerId(seller?.id ?? null);
      setStoreName(seller?.store_name ?? null);
      setStoreLogo(seller?.store_logo ?? null);
      setStoreDescription(seller?.store_description ?? null);

      // Stats from API (now includes orders)
      setStats(apiStats);

      // New: Order Items + Grouped Orders
      setOrderItems(data.orderItems ?? []);
      setOrders(data.orders ?? []);

      // Refresh product context
      await refetchProducts();
    } catch (error) {
      console.error("❌ Failed to fetch seller data:", error);
      setStats(null);
      setOrderItems([]);
      setOrders([]);
    }
  }, [session?.user?.id, status, refetchProducts]);

  useEffect(() => {
    fetchSellerData();
  }, [session?.user?.id]);

  // Filter seller products
  const sellerProducts = sellerId
    ? allProducts.filter((p: any) => p.sellerId === sellerId)
    : [];

  const updateOrderItemStatus = (
    orderId: string,
    itemId: string,
    newStatus: string
  ) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.orderId === orderId
          ? {
              ...order,
              items: order.items.map((i) =>
                i.id === itemId ? { ...i, status: newStatus } : i
              ),
            }
          : order
      )
    );
  };

  return (
    <SellerContext.Provider
      value={{
        sellerId,
        storeName,
        storeLogo,
        storeDescription,
        stats,
        products: sellerProducts,
        orderItems,
        orders,
        isLoading,
        refetchSellerData: fetchSellerData,
        refetchingSellerData,
        updateOrderItemStatus,
      }}
    >
      {children}
    </SellerContext.Provider>
  );
}

// ----------------- HOOK -----------------
export const useSeller = () => {
  const context = useContext(SellerContext);
  if (!context) {
    throw new Error("useSeller must be used within a SellerProvider");
  }
  return context;
};

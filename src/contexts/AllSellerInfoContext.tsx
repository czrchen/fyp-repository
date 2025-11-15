"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface SellerInfo {
  id: string;
  store_name: string;
  store_description?: string;
  store_logo?: string;
  performance?: any | null;
  products: any[];
}

interface AllSellerInfoContextType {
  sellers: SellerInfo[];
  loading: boolean;
  refreshSellers: () => Promise<void>;
}

const AllSellerInfoContext = createContext<AllSellerInfoContextType>({
  sellers: [],
  loading: true,
  refreshSellers: async () => {},
});

export const useAllSellerInfo = () => useContext(AllSellerInfoContext);

export const AllSellerInfoProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [sellers, setSellers] = useState<SellerInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/seller/all");
      const data = await res.json();
      setSellers(data);
    } catch (err) {
      console.error("Failed to load seller list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  return (
    <AllSellerInfoContext.Provider
      value={{ sellers, loading, refreshSellers: fetchSellers }}
    >
      {children}
    </AllSellerInfoContext.Provider>
  );
};

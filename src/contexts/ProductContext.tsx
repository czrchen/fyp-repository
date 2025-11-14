"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import axios from "axios";
import fuzzysort from "fuzzysort";

const ProductContext = createContext<any>(null);

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<any[]>([]);
  const [productLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔁 Fetch products from backend
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await axios.get("/api/products");
      if (!Array.isArray(res.data)) throw new Error("Invalid response");

      // 🔥 Attach analytics to each product (if exists)
      const enhancedProducts = res.data.map((p: any) => ({
        ...p,
        analytics: p.analytcis ||
          p.analytics || {
            views: 0,
            salesCount: 0,
            ratingAvg: 0,
            ratingCount: 0,
          },
      }));

      setProducts(enhancedProducts);
    } catch (err: any) {
      console.error("❌ Failed to fetch products:", err);
      setError(err.message || "Failed to load products");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 🪄 Load cached → then fetch from server
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const refetchProducts = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  // 🔍 Super Smart Fuzzy Search (name + variant + tags + description + category)
  const searchProducts = useCallback(
    (query: string) => {
      if (!query.trim()) return [];

      const q = query.toLowerCase();

      console.log("Searched Product: ", products);
      // Prepare searchable string per product
      const prepared = products.map((p) => ({
        ...p,
        searchable: [
          p.name,
          p.description,
          p.category?.name, // ✅ Main category name
          p.subcategory?.name, // ✅ Subcategory name
          p.brand?.name,
          ...(p.tags || []),
          ...(p.variants?.map((v: any) => v.name) || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
      }));

      // Run fuzzy matching
      const results = fuzzysort.go(q, prepared, {
        key: "searchable",
        threshold: -10000, // allow wide fuzzy range
        limit: 50, // limit to top 50 results
      });

      return results.map((r: any) => r.obj);
    },
    [products]
  );

  return (
    <ProductContext.Provider
      value={{
        products,
        productLoading,
        error,
        refetchProducts,
        setProducts,
        searchProducts,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export const useProducts = () => useContext(ProductContext);

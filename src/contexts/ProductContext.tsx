"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import axios from "axios";
import stringSimilarity from "string-similarity";

const ProductContext = createContext<any>(null);

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<any[]>([]);
  const [productLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch products from backend
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await axios.get("/api/products");
      if (!Array.isArray(res.data)) throw new Error("Invalid response");

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
      console.error(" Failed to fetch products:", err);
      setError(err.message || "Failed to load products");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load cached → then fetch from server
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const refetchProducts = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  function normalize(str: string) {
    return str
      .toLowerCase()
      .replace(/[-_/\.]/g, " ") // convert punctuation to spaces
      .replace(/\s+/g, " ") // collapse multiple spaces
      .trim();
  }

  // Super Smart Fuzzy Search (name + variant + tags + description + category)
  function searchProducts(query: string) {
    const normalizedQuery = normalize(query);
    // console.log("SEARCH QUERY:", query, "→ normalized:", normalizedQuery);

    const terms = normalizedQuery.split(" ").filter((t) => t.length >= 4);
    if (terms.length === 0) {
      console.log(" No valid terms, aborting search");
      return [];
    }

    const productScoreMap = new Map<string, { product: any; score: number }>();

    products.forEach((product) => {
      const name = normalize(product.name);
      const desc = normalize(product.description ?? "");
      const cat = normalize(product.category?.name ?? "");

      const rawTags = product.tags ?? [];
      const tags = rawTags.map((t: string) => normalize(t));

      const variants = product.variants ?? [];

      let score = 0;

      // console.log("──────────────────────────────");
      // console.log(" PRODUCT:", product.name);
      // console.log("   category:", cat);
      // console.log("   raw tags:", rawTags);
      // console.log("   norm tags:", tags);

      /* ===============================
       1. EXACT / STRONG MATCHES
    =============================== */

      if (name.includes(normalizedQuery)) {
        score += 8;
        // console.log("   name match +8");
      }

      if (desc.includes(normalizedQuery)) {
        score += 5;
        // console.log("   desc match +5");
      }

      if (cat.includes(normalizedQuery)) {
        score += 5;
        // console.log("   category match +5");
      }

      // CRITICAL TAG CHECK
      if (tags.includes(normalizedQuery)) {
        score += 25;
        // console.log("   TAG MATCH +25");
      } else {
        // console.log("   tag does NOT match query");
      }

      variants.forEach((v: any) => {
        const vName = normalize(v.name);
        if (vName.includes(normalizedQuery)) {
          score += 6;
          // console.log("   variant match:", v.name, "+6");
        }
      });

      /* ===============================
       2. FUZZY MATCHING
    =============================== */

      terms.forEach((term) => {
        const nameSim = stringSimilarity.compareTwoStrings(term, name);
        const descSim = stringSimilarity.compareTwoStrings(term, desc);
        const catSim = stringSimilarity.compareTwoStrings(term, cat);

        // if (nameSim > 0.2) console.log("   name similarity:", nameSim);
        // if (descSim > 0.2) console.log("   desc similarity:", descSim);
        // if (catSim > 0.2) console.log("   cat similarity:", catSim);

        score += nameSim * 10;
        score += descSim * 5;
        score += catSim * 3;
      });

      /* ===============================
       3. NOISE PENALTY
    =============================== */

      const isTagMatch = tags.includes(normalizedQuery);

      if (!isTagMatch && name.includes(normalizedQuery)) {
        score -= 6;
        // console.log("   substring penalty -6");
      }

      /* ===============================
       4. SAVE IF RELEVANT
    =============================== */

      if (score > 0) {
        const existing = productScoreMap.get(product.id);
        if (!existing || score > existing.score) {
          productScoreMap.set(product.id, { product, score });
        }
      }
    });

    const results = Array.from(productScoreMap.values())
      .filter((x) => x.score > 5)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.product);

    // console.log("FINAL RESULT COUNT:", results.length);
    return results;
  }

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

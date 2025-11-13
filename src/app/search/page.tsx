// app/search/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useProducts } from "@/contexts/ProductContext";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { Search, Package } from "lucide-react";
import Link from "next/link";

export default function SearchResults() {
  const params = useSearchParams();
  const q = params.get("q")?.toLowerCase() ?? "";
  const { products } = useProducts();

  // Record the search (for users landing directly)
  useEffect(() => {
    if (!q) return;
    fetch("/api/search-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: q }),
    }).catch(() => {});
  }, [q]);

  const filtered = products.filter(
    (p: any) =>
      p.status === true && // 🟢 Only active
      (p.name.toLowerCase().includes(q) ||
        p.category?.name.toLowerCase().includes(q))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <Navbar />
      <div className="container py-12 px-18 mx-auto">
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-3xl font-bold text-slate-900">
              Search Results
            </h1>
          </div>

          <div className="flex items-center gap-2 text-slate-600">
            <span className="text-lg">Showing results for</span>
            <span className="px-3 py-1 bg-slate-100 rounded-full font-medium text-slate-900">
              "{q}"
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-sm text-slate-500">
              {filtered.length} {filtered.length === 1 ? "product" : "products"}{" "}
              found
            </span>
          </div>
        </div>

        {/* Results Section */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((p: any) => (
              <Link
                key={p.id}
                href={`/product/${p.id}`}
                onClick={() => {
                  fetch("/api/eventlog/view", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      productId: p.id,
                      brandId: p.brandId,
                      categoryId: p.categoryId,
                      price: p.price,
                      userSession: localStorage.getItem("sessionId") || "guest",
                    }),
                  }).catch(() => {});
                }}
                className="block"
              >
                <ProductCard {...p} mode="buyer" variants={p.variants} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <Package className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              No products found
            </h3>
            <p className="text-slate-500 text-center max-w-md">
              We couldn't find any products matching "{q}". Try searching with
              different keywords or browse our categories.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// components/SearchBar.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useProducts } from "@/contexts/ProductContext"; // 🧠 import context

export default function SearchBar() {
  const router = useRouter();
  const { searchProducts } = useProducts(); // ✅ access fuzzy search
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [liveResults, setLiveResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  // 🔁 Load recent searches (from your /api/search-history)
  useEffect(() => {
    fetch("/api/search-history")
      .then((r) => r.json())
      .then((rows) => setRecent(rows.map((r: any) => r.keyword)))
      .catch(() => {});
  }, []);

  // 🧠 Update live fuzzy matches as user types
  useEffect(() => {
    if (q.trim()) {
      const results = searchProducts(q);
      setLiveResults(results.slice(0, 5)); // only show top 5 suggestions
    } else {
      setLiveResults([]);
    }
  }, [q, searchProducts]);

  // ✅ Submit and save to history
  const submit = async (term?: string) => {
    const keyword = (term ?? q).trim();
    if (!keyword) return;

    // Save search history
    try {
      await fetch("/api/search-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword }),
      });
    } catch {}

    router.push(`/search?q=${encodeURIComponent(keyword)}`);
    setOpen(false);
  };

  return (
    <div className="relative w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="relative"
      >
        <div className="relative w-full flex items-center group">
          <Search className="absolute left-3 h-5 w-5 text-gray-500 pointer-events-none" />
          <Input
            type="search"
            placeholder="Search for products..."
            className="w-full pl-12 pr-4 py-2 rounded-full border border-gray-300 bg-gray-50 text-gray-800 focus-visible:ring-2 focus-visible:ring-blue-500"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 200)}
          />
        </div>
      </form>

      {/* 🔽 Dropdown for live results and recent searches */}
      {open && (liveResults.length > 0 || recent.length > 0) && (
        <div className="absolute z-20 mt-2 w-full rounded-xl border bg-white shadow-md p-2">
          {q.trim() ? (
            <>
              <div className="px-3 py-1 text-xs text-gray-500">Suggested</div>
              {liveResults.map((item, i) => (
                <div
                  key={i}
                  className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer rounded-lg flex justify-between"
                  onMouseDown={() => submit(item.name)}
                >
                  <span>{item.name}</span>
                  <span className="text-xs text-gray-400">
                    {item.category?.name || ""}
                  </span>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="px-3 py-1 text-xs text-gray-500">
                Recent searches
              </div>
              {recent.length > 0 ? (
                recent.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 rounded-lg"
                  >
                    <span
                      className="cursor-pointer flex-1"
                      onMouseDown={() => submit(item)}
                    >
                      {item}
                    </span>

                    {/* ❌ delete button */}
                    <button
                      className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                      onMouseDown={async (e) => {
                        e.stopPropagation();
                        try {
                          await fetch(
                            `/api/search-history/${encodeURIComponent(item)}`,
                            { method: "DELETE" }
                          );
                          setRecent((prev) => prev.filter((r) => r !== item)); // update UI instantly
                        } catch {
                          console.error("Failed to delete search term");
                        }
                      }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="px-3 py-2 text-xs text-gray-400">
                  No recent searches yet
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useProducts } from "@/contexts/ProductContext";
import { useCategories } from "@/contexts/CategoryContext";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Filter, ArrowLeft, ChevronRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";

export default function CategoryPage() {
  const { categoryName } = useParams() as { categoryName: string };
  const { products } = useProducts();
  const { categories } = useCategories();

  const [filtered, setFiltered] = useState<any[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(
    []
  );
  const [showSidebar, setShowSidebar] = useState(false);
  const [priceRange, setPriceRange] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // 💰 Price options (radio buttons)
  const priceOptions = [
    { id: "all", label: "All Prices", range: [0, Infinity] },
    { id: "below200", label: "Below RM200", range: [0, 200] },
    { id: "200to400", label: "RM200 – RM400", range: [200, 400] },
    { id: "400to600", label: "RM400 – RM600", range: [400, 600] },
    { id: "above600", label: "Above RM600", range: [600, Infinity] },
  ];

  // ✅ Find main category
  const selectedCategory = useMemo(
    () =>
      categories.find(
        (cat: any) => cat.name.toLowerCase() === categoryName.toLowerCase()
      ),
    [categoryName, categories]
  );

  // ✅ Memoize subcategories and counts
  const subCategories = useMemo(() => {
    if (!selectedCategory) return [];
    return (
      selectedCategory.children?.map((sub: any) => {
        const count = products.filter(
          (p: any) => p.categoryId === sub.id || p.subcategoryId === sub.id
        ).length;
        return { id: sub.id, name: sub.name, count };
      }) || []
    );
  }, [selectedCategory?.id, products]); // <-- depends only on stable identifiers

  // ✅ Memoize the selected price range array (stable reference)
  const selectedPriceRange = useMemo(() => {
    return (
      priceOptions.find((p) => p.id === priceRange)?.range || [0, Infinity]
    );
  }, [priceRange]);

  // ✅ Stable filtering effect
  useEffect(() => {
    if (!selectedCategory || products.length === 0) return;

    const [minPrice, maxPrice] = selectedPriceRange;
    const baseIds = [selectedCategory.id, ...subCategories.map((s) => s.id)];
    const targetIds =
      selectedSubcategories.length > 0 ? selectedSubcategories : baseIds;

    const filteredProducts = products.filter((p: any) => {
      const matchesCategory =
        targetIds.includes(p.categoryId) || targetIds.includes(p.subcategoryId);
      const matchesPrice = p.price >= minPrice && p.price <= maxPrice;
      return matchesCategory && matchesPrice;
    });

    setFiltered(filteredProducts);
  }, [
    products,
    selectedCategory?.id, // stable identifier
    selectedSubcategories.join(","), // join ensures dependency is string, not array ref
    selectedPriceRange.toString(), // stable dependency
    subCategories.map((s) => s.id).join(","), // stable dependency from array
  ]);

  // ✅ Toggle subcategory checkbox
  const toggleSubcategory = (id: string) => {
    setSelectedSubcategories((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // 4 rows × 4 columns = 16 products per page
  const productsPerPage = 18;
  const totalPages = Math.ceil(products.length / productsPerPage);

  // Calculate products for current page
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filtered.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // ✅ Sidebar Component (Subcategory + Price Filter)
  const Sidebar = () => (
    <div className="border border-border rounded-lg p-4 bg-card space-y-6">
      {/* 🧩 Subcategory Filter */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Subcategories
        </h3>
        <div className="space-y-2">
          {subCategories.length > 0 ? (
            subCategories.map((s) => (
              <div key={s.id} className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedSubcategories.includes(s.id)}
                  onCheckedChange={() => toggleSubcategory(s.id)}
                />
                <label className="text-sm text-foreground cursor-pointer flex-1">
                  {s.name}
                  {s.count > 0 && (
                    <span className="text-muted-foreground ml-1">
                      ({s.count})
                    </span>
                  )}
                </label>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No subcategories available.
            </p>
          )}
        </div>
      </div>

      {/* 💰 Price Range Filter */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Price Range
        </h3>
        <div className="space-y-2">
          {priceOptions.map((option) => (
            <label
              key={option.id}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <input
                type="radio"
                name="priceRange"
                value={option.id}
                checked={priceRange === option.id}
                onChange={() => setPriceRange(option.id)}
                className="text-primary focus:ring-primary"
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-10 py-10">
        {/* 🏠 Back to Home */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-primary hover:underline mb-6"
        >
          <ArrowLeft size={18} />
          Back to Home
        </Link>

        {/* 🔖 Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold capitalize">
            {categoryName} Products
          </h1>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 lg:hidden"
            onClick={() => setShowSidebar(true)}
          >
            <Filter size={16} />
            Filters
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* 🧱 Desktop Sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <Sidebar />
          </aside>

          {/* 🛍 Product Grid */}
          <main className="flex-1">
            {currentProducts.length > 0 ? (
              <>
                {/* 🧩 Product Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {currentProducts.map((p: any) => (
                    <Link
                      key={p.id}
                      href={`/product/${p.id}`}
                      className="block transition-transform hover:scale-[1.02] duration-200"
                    >
                      <ProductCard {...p} mode="buyer" />
                    </Link>
                  ))}
                </div>

                {/* 🧭 Pagination (move OUTSIDE the grid) */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-12 mx-auto w-fit">
                    {/* Previous */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="h-9 w-9 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {/* Page Numbers */}
                    {getPageNumbers().map((page, index) =>
                      page === "..." ? (
                        <span
                          key={`ellipsis-${index}`}
                          className="px-2 text-muted-foreground"
                        >
                          ...
                        </span>
                      ) : (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page as number)}
                          className="h-9 w-9 p-0"
                        >
                          {page}
                        </Button>
                      )
                    )}

                    {/* Next */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="h-9 w-9 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-center text-lg">
                No products found in {categoryName}.
              </p>
            )}
          </main>
        </div>

        {/* 📱 Mobile Sidebar Overlay */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              key="filterSidebar"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 80, damping: 15 }}
              className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm p-6 lg:hidden overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg text-foreground">
                  Filters
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSidebar(false)}
                >
                  ✕
                </Button>
              </div>
              <Sidebar />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

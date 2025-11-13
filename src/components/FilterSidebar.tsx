"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Filter, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FilterSidebar({
  brands = [],
  onApply,
}: {
  brands?: { id: string; name: string; count: number }[];
  onApply?: (filters: any) => void;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);

  // ✅ Only render after hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null; // Prevent server/client mismatch

  const toggleBrand = (id: string) => {
    setSelectedBrands((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const toggleRating = (rating: number) => {
    setSelectedRatings((prev) =>
      prev.includes(rating)
        ? prev.filter((r) => r !== rating)
        : [...prev, rating]
    );
  };

  const handleApply = () => {
    const filters = { priceRange, selectedBrands, selectedRatings };
    onApply?.(filters);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setPriceRange([0, 2000]);
    setSelectedBrands([]);
    setSelectedRatings([]);
  };

  return (
    <>
      {/* Mobile toggle */}
      <div className="flex justify-end lg:hidden px-4 mt-4">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={() => setShowFilters((prev) => !prev)}
        >
          {showFilters ? <X size={16} /> : <Filter size={16} />}
          {showFilters ? "Close" : "Filters"}
        </Button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <Card className="p-6 sticky top-4 shadow-sm">
          <FilterContent
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            selectedBrands={selectedBrands}
            toggleBrand={toggleBrand}
            selectedRatings={selectedRatings}
            toggleRating={toggleRating}
            brands={brands}
            onApply={handleApply}
            onClear={clearFilters}
          />
        </Card>
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            key="filterSidebar"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 80, damping: 15 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm lg:hidden"
          >
            <div className="p-6 h-full overflow-y-auto shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg text-foreground">
                  Filters
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFilters(false)}
                >
                  <X size={20} />
                </Button>
              </div>

              <FilterContent
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                selectedBrands={selectedBrands}
                toggleBrand={toggleBrand}
                selectedRatings={selectedRatings}
                toggleRating={toggleRating}
                brands={brands}
                onApply={handleApply}
                onClear={clearFilters}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ✅ Shared content subcomponent
function FilterContent({
  priceRange,
  setPriceRange,
  selectedBrands,
  toggleBrand,
  selectedRatings,
  toggleRating,
  brands,
  onApply,
  onClear,
}: any) {
  return (
    <>
      <h4 className="font-medium text-sm text-foreground mb-3">Price Range</h4>
      <Slider
        min={0}
        max={2000}
        step={50}
        value={priceRange}
        onValueChange={(val) => setPriceRange(val as [number, number])}
        className="my-4"
      />
      <div className="flex justify-between text-sm text-muted-foreground mb-4">
        <span>${priceRange[0]}</span>
        <span>${priceRange[1]}</span>
      </div>

      <Separator className="my-4" />
      <h4 className="font-medium text-sm text-foreground mb-3">Brands</h4>
      {brands.map((brand: any) => (
        <div key={brand.id} className="flex items-center gap-2">
          <Checkbox
            id={brand.id}
            checked={selectedBrands.includes(brand.id)}
            onCheckedChange={() => toggleBrand(brand.id)}
          />
          <label
            htmlFor={brand.id}
            className="text-sm text-muted-foreground cursor-pointer flex-1"
          >
            {brand.name}
            <span className="text-xs ml-1">({brand.count})</span>
          </label>
        </div>
      ))}

      <Separator className="my-4" />
      <h4 className="font-medium text-sm text-foreground mb-3">Rating</h4>
      {[5, 4, 3, 2, 1].map((rating) => (
        <div key={rating} className="flex items-center gap-2">
          <Checkbox
            id={`rating-${rating}`}
            checked={selectedRatings.includes(rating)}
            onCheckedChange={() => toggleRating(rating)}
          />
          <label
            htmlFor={`rating-${rating}`}
            className="text-sm text-muted-foreground cursor-pointer flex-1"
          >
            {rating} Stars & Up
          </label>
        </div>
      ))}

      <Separator className="my-4" />
      <div className="flex gap-3">
        <Button variant="default" className="flex-1" onClick={onApply}>
          Apply
        </Button>
        <Button variant="outline" className="flex-1" onClick={onClear}>
          Clear
        </Button>
      </div>
    </>
  );
}

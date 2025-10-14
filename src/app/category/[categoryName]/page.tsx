"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
// import ChatbotWidget from "@/components/ChatbotWidget";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, SlidersHorizontal } from "lucide-react";
import productHeadphones from "@/assets/product-headphone.webp";
import productWatch from "@/assets/product-watch.webp";
import productSneakers from "@/assets/product-sneakers.webp";
import productPhone from "@/assets/product-phone.png";
import productBackpack from "@/assets/product-backpack.jpg";
import productCamera from "@/assets/product-camera.webp";

const mockProducts = [
  {
    id: "1",
    name: "Premium Wireless Headphones",
    price: 299.99,
    image: productHeadphones,
    rating: 4.8,
    reviews: 1234,
    category: "Electronics",
    isNew: true,
  },
  {
    id: "2",
    name: "Luxury Smart Watch",
    price: 449.99,
    image: productWatch,
    rating: 4.6,
    reviews: 856,
    category: "Electronics",
    discount: 15,
  },
  {
    id: "3",
    name: "Running Sneakers Pro",
    price: 129.99,
    image: productSneakers,
    rating: 4.9,
    reviews: 2103,
    category: "Sports",
  },
  {
    id: "4",
    name: "Latest Smartphone",
    price: 899.99,
    image: productPhone,
    rating: 4.7,
    reviews: 3421,
    category: "Electronics",
    isNew: true,
  },
  {
    id: "5",
    name: "Travel Backpack",
    price: 79.99,
    image: productBackpack,
    rating: 4.5,
    reviews: 678,
    category: "Fashion",
  },
  {
    id: "6",
    name: "Professional Camera",
    price: 1299.99,
    image: productCamera,
    rating: 4.9,
    reviews: 892,
    category: "Electronics",
    discount: 20,
  },
];

const brands = [
  { id: "sony", name: "Sony", count: 45 },
  { id: "apple", name: "Apple", count: 32 },
  { id: "samsung", name: "Samsung", count: 28 },
  { id: "nike", name: "Nike", count: 52 },
];

export default function CategoryPage() {
  // ✅ Hooks must be declared at top
  const params = useParams();
  const categoryName = params?.categoryName as string | undefined;

  const [mounted, setMounted] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => setMounted(true), []);

  // ✅ Guard only renders UI after hydration
  if (!mounted) return null;

  const categoryTitle = categoryName
    ? categoryName.charAt(0).toUpperCase() + categoryName.slice(1)
    : "All Products";

  const filteredProducts = mockProducts.filter(
    (product) =>
      !categoryName ||
      product.category.toLowerCase() === categoryName.toLowerCase()
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-smooth">
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">{categoryTitle}</span>
        </div>
      </div>
      {/* Page Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {categoryTitle}
            </h1>
            <p className="text-muted-foreground">
              {filteredProducts.length} products found
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {showFilters ? "Hide" : "Show"} Filters
          </Button>
        </div>
      </div>
      {/* Main Content */}
      <div className="container mx-auto px-4 pb-12">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <aside className="w-64 flex-shrink-0 hidden lg:block">
              <Card className="p-6 sticky top-4">
                <h3 className="font-semibold text-lg mb-4 text-foreground">
                  Filters
                </h3>

                <Separator className="my-4" />

                {/* Price Range */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-foreground">
                    Price Range
                  </h4>
                  <Slider
                    min={0}
                    max={2000}
                    step={50}
                    value={priceRange}
                    onValueChange={setPriceRange}
                    className="my-4"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Brands */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-foreground">
                    Brands
                  </h4>
                  {brands.map((brand) => (
                    <div key={brand.id} className="flex items-center gap-2">
                      <Checkbox id={brand.id} />
                      <label
                        htmlFor={brand.id}
                        className="text-sm text-muted-foreground cursor-pointer flex-1"
                      >
                        {brand.name}
                        <span className="text-xs ml-1">({brand.count})</span>
                      </label>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                {/* Rating */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-foreground">
                    Rating
                  </h4>
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center gap-2">
                      <Checkbox id={`rating-${rating}`} />
                      <label
                        htmlFor={`rating-${rating}`}
                        className="text-sm text-muted-foreground cursor-pointer flex-1"
                      >
                        {rating} Stars & Up
                      </label>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <Button variant="outline" className="w-full">
                  Apply Filters
                </Button>
              </Card>
            </aside>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  No products found in this category
                </p>
                <Button asChild className="mt-4">
                  <Link href="/">Back to Home</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* <ChatbotWidget /> */}
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import FilterModal from "@/components/FilterModal";
// import ChatbotWidget from "@/components/ChatbotWidget";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, TrendingUp, MapPin } from "lucide-react";

import heroBanner from "@/assets/hero-banner.jpg";
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

const categories = [
  { name: "Electronics", icon: "📱" },
  { name: "Fashion", icon: "👕" },
  { name: "Home", icon: "🏠" },
  { name: "Sports", icon: "⚽" },
  { name: "Beauty", icon: "💄" },
  { name: "Books", icon: "📚" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Hero Section */}
      <section className="relative h-[525px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <Image
          src={heroBanner}
          alt="Shop the latest trends"
          className="w-full h-full object-cover opacity-90"
          priority
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4 px-4">
            <h1
              className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 
             bg-clip-text text-transparent animate-shimmer"
            >
              Discover Amazing Products
            </h1>
            <p className="text-lg md:text-xl font-medium text-white">
              Shop from thousands of products with AI-powered recommendations
            </p>
          </div>
        </div>
      </section>
      {/* Categories */}
      <section className="container mx-auto px-6 md:px-25 py-8">
        <h2 className="text-2xl font-bold mb-6 text-foreground">
          Shop by Category
        </h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={`/category/${category.name.toLowerCase()}`}
            >
              <div
                className="group bg-card border border-border rounded-lg p-6 text-center 
          hover:shadow-xl hover:border-primary hover:-translate-y-1 
          transition-all duration-300 ease-in-out cursor-pointer"
              >
                <div
                  className="text-4xl mb-2 transform group-hover:scale-110 
            transition-transform duration-300 ease-in-out"
                >
                  {category.icon}
                </div>
                <p
                  className="text-sm font-medium text-foreground 
            group-hover:text-primary transition-colors duration-300"
                >
                  {category.name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-6 md:px-28 py-12">
        <div className="space-y-8">
          {/* Filter Button */}
          <div className="flex items-center gap-4">
            <FilterModal />
            <span className="text-sm text-muted-foreground">
              Filter products by category and preferences
            </span>
          </div>

          {/* Tabbed Recommendations */}
          <Tabs defaultValue="recommended" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger
                value="recommended"
                className="flex items-center gap-2 transition-all duration-200
      data-[state=inactive]:hover:bg-muted/60 data-[state=inactive]:hover:shadow-sm 
      data-[state=inactive]:hover:rounded-md data-[state=inactive]:hover:cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">For You</span>
              </TabsTrigger>

              <TabsTrigger
                value="location"
                className="flex items-center gap-2 transition-all duration-200
      data-[state=inactive]:hover:bg-muted/60 data-[state=inactive]:hover:shadow-sm 
      data-[state=inactive]:hover:rounded-md data-[state=inactive]:hover:cursor-pointer"
              >
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">Near You</span>
              </TabsTrigger>

              <TabsTrigger
                value="trending"
                className="flex items-center gap-2 transition-all duration-200
      data-[state=inactive]:hover:bg-muted/60 data-[state=inactive]:hover:shadow-sm 
      data-[state=inactive]:hover:rounded-md data-[state=inactive]:hover:cursor-pointer"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Trending</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recommended" className="mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {mockProducts.slice(0, 3).map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="location" className="mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {mockProducts.slice(2, 5).map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="trending" className="mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {mockProducts.slice(3, 6).map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
      {/* <ChatbotWidget /> */}
    </div>
  );
}

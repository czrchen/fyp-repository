"use client";

import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react"; // if you're using NextAuth
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { useCategories } from "@/contexts/CategoryContext";
import FilterModal from "@/components/FilterModal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useEffect, useState, useRef } from "react";
import {
  Sparkles,
  TrendingUp,
  MapPin,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Package,
  Loader2,
} from "lucide-react";
import { useProducts } from "@/contexts/ProductContext";
import { useProfile } from "@/contexts/ProfileContext"; //  add this
import ProfileCompletionModal from "@/components/ProfileCompletion";
import { useRecommenders } from "@/contexts/RecommenderContext";
import heroBanner from "@/assets/hero-banner.jpg";
import { toast } from "sonner";

export default function HomePage() {
  const {
    recommendedProducts,
    locationProducts,
    trendingProducts,
    loadingRecommended,
    loadingLocation,
    loadingTrending,
    refetchRecommended,
    refetchLocation,
    refetchTrending,
  } = useRecommenders();
  const { products, refetchProducts, productLoading } = useProducts();
  const { categories, isLoading } = useCategories();
  const [userLoading, setUserLoading] = useState(false);
  const { data: userSession } = useSession();
  const [user, setUser] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showLoadingModal, setShowLoadingModal] = useState(true);
  const load = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [recommendedPage, setRecommendedPage] = useState(1);
  const recommendedPerPage = 8;
  const recommendedTotalPages = Math.ceil(
    recommendedProducts.length / recommendedPerPage
  );
  const recommendedPageSlice = recommendedProducts.slice(
    (recommendedPage - 1) * recommendedPerPage,
    recommendedPage * recommendedPerPage
  );

  const [locationPage, setLocationPage] = useState(1);
  const locationPerPage = 8;
  const locationTotalPages = Math.ceil(
    locationProducts.length / locationPerPage
  );
  const locationPageSlice = locationProducts.slice(
    (locationPage - 1) * locationPerPage,
    locationPage * locationPerPage
  );

  const [trendingPage, setTrendingPage] = useState(1);
  const trendingPerPage = 8;
  const trendingTotalPages = Math.ceil(
    trendingProducts.length / locationPerPage
  );
  const trendingPageSlice = trendingProducts.slice(
    (trendingPage - 1) * trendingPerPage,
    trendingPage * trendingPerPage
  );

  useEffect(() => {
    if (load.current > 0) return;
    const allLoaded =
      productLoading === false && isLoading === false && userLoading === false;

    if (allLoaded == true) {
      setShowLoadingModal(!allLoaded);
      load.current += 1;
    }
  }, [productLoading, isLoading, userLoading]);

  const checkPosition = () => {
    const el = scrollRef.current;
    if (!el) return;

    setAtStart(el.scrollLeft === 0);
    setAtEnd(el.scrollWidth - el.clientWidth - el.scrollLeft < 5);
  };

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;

    const amount = el.clientWidth * 0.8; // scroll 80% width
    el.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    checkPosition();
  }, []);

  useEffect(() => {
    // Check if session ID already exists
    let sessionId = localStorage.getItem("sessionId");
    if (!sessionId) {
      // Generate one if missing
      sessionId = crypto.randomUUID(); // built-in browser UUID generator
      localStorage.setItem("sessionId", sessionId);
    }
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      setUserLoading(true);
      const res = await fetch("/api/user/current");
      if (!res.ok) return toast.error("Failed to fetch current user");

      const data = await res.json();
      setUser(data);
      setUserLoading(false);

      // Auto-open profile completion modal if incomplete
      if (!data.profile_completed) {
        setShowProfileModal(true);
      }
    };

    // Only run if user session exists
    if (userSession?.user?.email) {
      fetchUser();
    }
  }, [userSession]);

  if (showLoadingModal)
    return (
      <Dialog open={showLoadingModal}>
        <DialogContent
          className="
      sm:max-w-[400px] w-[90%] max-h-[90vh] overflow-y-auto
      fixed !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2
      p-12 rounded-2xl shadow-2xl bg-white dark:bg-background
      border border-border/30
    "
        >
          {/* Hidden but required title */}
          <VisuallyHidden>
            <DialogTitle>Loading</DialogTitle>
          </VisuallyHidden>

          <div className="flex flex-col items-center justify-center gap-6">
            {/* Animated loader with glow effect */}
            <div className="relative">
              <div className="absolute inset-0 blur-xl bg-primary/30 rounded-full animate-pulse" />
              <Loader2 className="relative h-12 w-12 animate-spin text-green-600" />
            </div>

            {/* Text content */}
            <div className="text-center space-y-2">
              <p className="text-xl font-semibold tracking-tight">
                Loading your information
              </p>
              <p className="text-sm text-muted-foreground">
                This will only take a moment
              </p>
            </div>

            {/* Optional: Loading progress dots */}
            <div className="flex gap-1.5">
              <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
              <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
              <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );

  return (
    <div className="min-h-screen bg-background">
      {user && <ProfileCompletionModal />}
      <Navbar />

      {/* Hero */}
      <section className="relative h-[525px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <Image
          src={heroBanner}
          alt="Shop the latest trends"
          className="w-full h-full object-cover opacity-90"
          priority
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-4 px-4">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 bg-clip-text text-transparent animate-shimmer">
            Discover Amazing Products
          </h1>
          <p className="text-lg md:text-xl font-medium text-white">
            Shop from thousands of products with AI-powered recommendations
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-6 md:px-20 py-8">
        <h2 className="text-2xl font-bold mb-6 text-foreground">
          Shop by Category
        </h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {categories.map((category: any) => (
            <Link
              key={category.id}
              href={`/category/${category.name.toLowerCase()}`}
            >
              <div className="group bg-card border border-border rounded-lg p-6 text-center hover:shadow-xl hover:border-primary hover:-translate-y-1 transition-all duration-300 ease-in-out cursor-pointer">
                <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">
                  <Package className="mx-auto h-10 w-10 text-muted-foreground group-hover:text-primary" />
                </div>
                <p className="text-sm font-medium group-hover:text-primary transition-colors duration-300">
                  {category.name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Product Section */}
      <section className="container mx-auto px-6 md:px-18 py-12">
        <div className="space-y-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* <FilterModal /> */}
              <h2 className="text-2xl font-bold mb-6 text-foreground pl-2">
                Products You Like
              </h2>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                refetchRecommended();
                refetchLocation();
              }}
              className="flex items-center gap-2"
            >
              <RotateCcw size={16} /> Refresh
            </Button>
          </div>

          <Tabs defaultValue="recommended" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="recommended">
                <Sparkles className="w-4 h-4" /> For You
              </TabsTrigger>
              <TabsTrigger value="location">
                <MapPin className="w-4 h-4" /> Near You
              </TabsTrigger>
              <TabsTrigger value="trending">
                <TrendingUp className="w-4 h-4" /> Trending
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recommended" className="mt-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {recommendedPageSlice
                  .filter((p: any) => p.status === true)
                  .map((p: any) => (
                    <Link
                      key={`recommended-${p.id}`}
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
                            userSession:
                              localStorage.getItem("sessionId") || "guest",
                          }),
                        }).catch(() => {});
                      }}
                      className="block"
                    >
                      <ProductCard {...p} mode="buyer" variants={p.variants} />
                    </Link>
                  ))}
              </div>

              {/* Pagination */}
              {recommendedTotalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setRecommendedPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={recommendedPage === 1}
                    className="h-9 w-9 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {Array.from(
                    { length: recommendedTotalPages },
                    (_, i) => i + 1
                  ).map((page) => (
                    <Button
                      key={page}
                      variant={recommendedPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRecommendedPage(page)}
                      className="h-9 w-9 p-0"
                    >
                      {page}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setRecommendedPage((prev) =>
                        Math.min(prev + 1, recommendedTotalPages)
                      )
                    }
                    disabled={recommendedPage === recommendedTotalPages}
                    className="h-9 w-9 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </TabsContent>
            <TabsContent value="location" className="mt-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {locationPageSlice
                  .filter((p: any) => p.status === true)
                  .map((p: any) => (
                    <Link
                      key={`location-${p.id}`}
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
                            userSession:
                              localStorage.getItem("sessionId") || "guest",
                          }),
                        }).catch(() => {});
                      }}
                      className="block"
                    >
                      <ProductCard {...p} mode="buyer" variants={p.variants} />
                    </Link>
                  ))}
              </div>
              {/* Pagination */}
              {locationTotalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setLocationPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={locationPage === 1}
                    className="h-9 w-9 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {Array.from(
                    { length: locationTotalPages },
                    (_, i) => i + 1
                  ).map((page) => (
                    <Button
                      key={page}
                      variant={locationPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setLocationPage(page)}
                      className="h-9 w-9 p-0"
                    >
                      {page}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setLocationPage((prev) =>
                        Math.min(prev + 1, locationTotalPages)
                      )
                    }
                    disabled={locationPage === locationTotalPages}
                    className="h-9 w-9 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </TabsContent>
            <TabsContent value="trending" className="mt-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {trendingPageSlice
                  .filter((p: any) => p.status === true)
                  .map((p: any) => (
                    <Link
                      key={`trending-${p.id}`}
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
                            userSession:
                              localStorage.getItem("sessionId") || "guest",
                          }),
                        }).catch(() => {});
                      }}
                      className="block"
                    >
                      <ProductCard {...p} mode="buyer" variants={p.variants} />
                    </Link>
                  ))}
              </div>
              {/* Pagination */}
              {trendingTotalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setTrendingPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={trendingPage === 1}
                    className="h-9 w-9 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {Array.from(
                    { length: trendingTotalPages },
                    (_, i) => i + 1
                  ).map((page) => (
                    <Button
                      key={page}
                      variant={trendingPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTrendingPage(page)}
                      className="h-9 w-9 p-0"
                    >
                      {page}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setTrendingPage((prev) =>
                        Math.min(prev + 1, trendingTotalPages)
                      )
                    }
                    disabled={trendingPage === trendingTotalPages}
                    className="h-9 w-9 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}

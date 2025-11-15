"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Star,
  Store,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { useAllSellerInfo } from "@/contexts/AllSellerInfoContext";
import { useBuyerMessages } from "@/contexts/BuyerMessageContext";

export default function SellerStorePage() {
  const { id } = useParams();
  const router = useRouter();
  const { sellers, loading } = useAllSellerInfo();
  const { refetchSessions } = useBuyerMessages();
  const [currentPage, setCurrentPage] = useState(1);

  const seller = useMemo(() => sellers.find((s) => s.id === id), [sellers, id]);

  const productsPerPage = 12;
  const products = seller?.products || [];
  const totalPages = Math.ceil(products.length / productsPerPage);

  // Calculate products for current page
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(
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

  const handleChatSeller = async () => {
    if (!seller) return;

    const res = await fetch("/api/messages/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellerId: seller.id }),
    });

    const data = await res.json();

    if (data.sessionId) {
      await refetchSessions();
      router.push(`/messages?seller=${encodeURIComponent(seller.store_name)}`);
    }
  };

  // Reset to page 1 when seller changes
  useEffect(() => {
    setCurrentPage(1);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="p-10 text-center">Loading store...</div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="p-10 text-center text-red-500">Store not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 md:px-6 lg:px-18 py-12 max-w-8xl">
        {/* Store Header */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-sm p-8 mb-12">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Store Logo */}
            <div className="h-24 w-24 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 shadow-md">
              {seller.store_logo ? (
                <img
                  src={seller.store_logo}
                  alt={seller.store_name}
                  className="h-full w-full object-cover rounded-2xl"
                />
              ) : (
                <Store className="h-12 w-12 text-primary" />
              )}
            </div>

            {/* Store Info */}
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold text-foreground">
                  {seller.store_name}
                </h1>
                {seller.store_description && (
                  <p className="text-muted-foreground leading-relaxed">
                    {seller.store_description}
                  </p>
                )}
              </div>

              {/* Rating & Stats */}
              <div className="flex items-center gap-6 flex-wrap">
                {/* Rating */}
                {seller.performance && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < Math.round(seller.performance?.ratingAvg ?? 0)
                              ? "fill-amber-400 text-amber-400"
                              : "fill-gray-200 text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">
                      {(seller.performance?.ratingAvg ?? 0).toFixed(1)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({seller.performance?.ratingCount ?? 0} ratings)
                    </span>
                  </div>
                )}

                {/* Products Count */}
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {products.length} Products
                </Badge>
              </div>
            </div>

            {/* Chat Button */}
            <Button
              size="lg"
              className="h-12 px-6 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
              onClick={handleChatSeller}
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Chat with Seller
            </Button>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Products Section */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-foreground">
              Store Products
            </h2>
            <p className="text-sm text-muted-foreground">
              Showing {indexOfFirstProduct + 1}-
              {Math.min(indexOfLastProduct, products.length)} of{" "}
              {products.length} products
            </p>
          </div>

          {/* Products Grid */}
          {currentProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {currentProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    className="block transition-transform hover:scale-105 duration-200"
                  >
                    <ProductCard {...product} />
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                  {/* Previous button */}
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

                  {/* Page numbers */}
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

                  {/* Next button */}
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
            <div className="text-center py-16">
              <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No Products Available
              </h3>
              <p className="text-muted-foreground">
                This store doesn't have any products listed yet.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

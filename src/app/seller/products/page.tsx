"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSeller } from "@/contexts/SellerContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProductCard from "@/components/ProductCard";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Eye,
  Package,
  Pencil,
  Plus,
  Star,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";

export default function SellerProductsPage() {
  const { sellerId, products, storeName, isLoading } = useSeller();
  const [localProducts, setLocalProducts] = useState(products);
  useEffect(() => {
    setLocalProducts(products);
  }, [products]);
  const [currentPage, setCurrentPage] = useState(1);

  // 4 rows × 4 columns = 16 products per page
  const productsPerPage = 16;
  const totalPages = Math.ceil(products.length / productsPerPage);

  // Calculate products for current page
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = localProducts.slice(
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

  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading products...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-14">
          <div className="flex items-center h-16">
            <Link href="/seller">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-18 py-6 lg:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {storeName || "My Store"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage and organize all your product listings
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="lg" className="cursor-pointer">
                  <Plus className="mr-2 h-5 w-5" />
                  Add Product
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <Link href="/seller/addProduct?type=single" passHref>
                  <DropdownMenuItem className="cursor-pointer">
                    ➕ Add Single Product
                  </DropdownMenuItem>
                </Link>
                <Link href="/seller/addProduct?type=variant" passHref>
                  <DropdownMenuItem className="cursor-pointer">
                    Add Product with Variants
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-18 py-8 lg:py-12">
        {/* Empty state */}
        {localProducts.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="border-dashed border-2 max-w-md w-full">
              <CardContent className="p-12 text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">No products yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Get started by adding your first product to your store
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="lg" className="cursor-pointer">
                      <Plus className="mr-2 h-5 w-5" />
                      Add Your First Product Here
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-56">
                    <Link href="/seller/addProduct?type=single" passHref>
                      <DropdownMenuItem className="cursor-pointer">
                        ➕ Add Single Product
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/seller/addProduct?type=variant" passHref>
                      <DropdownMenuItem className="cursor-pointer">
                        Add Product with Variants
                      </DropdownMenuItem>
                    </Link>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {/* Products count */}
            <div className="mb-6 flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Showing {indexOfFirstProduct + 1}-
                {Math.min(indexOfLastProduct, localProducts.length)} of{" "}
                {localProducts.length}{" "}
                {localProducts.length === 1 ? "product" : "products"}
              </p>
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  {...p}
                  imageUrl={p.imageUrl ?? undefined}
                  sellerName={storeName || ""} //  FIX ADDED
                  sellerId={sellerId || ""} //  ensures ProductCard gets sellerId
                  mode="seller"
                  onUpdated={(updated) => {
                    setLocalProducts((prev) =>
                      prev.map((prod) =>
                        prod.id === p.id ? { ...prod, ...updated } : prod
                      )
                    );
                  }}
                />
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
        )}
      </div>
    </div>
  );
}

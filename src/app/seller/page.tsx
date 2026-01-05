"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSeller } from "@/contexts/SellerContext"; //  import the context
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Store,
  Package,
  TrendingUp,
  DollarSign,
  Eye,
  MessageCircle,
  Settings,
  Plus,
  BarChart3,
  Star,
  ShoppingCart,
} from "lucide-react";
import ProductCard from "@/components/ProductCard";

export default function SellerDashboard() {
  const {
    sellerId,
    storeName,
    storeLogo,
    storeDescription,
    stats,
    products,
    isLoading,
    refetchSellerData: fetchSellerData,
  } = useSeller();
  const [localProducts, setLocalProducts] = useState(products);

  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center gap-1 text-lg text-muted-foreground">
          <span className="animate-bounce [animation-delay:-0.3s]">
            Loading
          </span>
          <span className="animate-bounce [animation-delay:-0.2s]">seller</span>
          <span className="animate-bounce [animation-delay:-0.1s]">
            dashboard
          </span>
          <span className="inline-flex gap-1 ml-0.5">
            <span className="animate-bounce [animation-delay:-0.3s]">.</span>
            <span className="animate-bounce [animation-delay:-0.15s]">.</span>
            <span className="animate-bounce">.</span>
          </span>
        </div>
      </div>
    );

  const formattedStats = [
    {
      label: "Total Sales",
      value: `${stats?.totalSales.toLocaleString() ?? "0"}`,
      icon: ShoppingCart,
    },
    {
      label: "Total Views",
      value: `${(stats?.totalViews ?? 0).toLocaleString()}`,
      icon: Eye,
    },
    {
      label: "Revenue",
      value: `RM${(stats?.totalRevenue?.toFixed(2) ?? 0).toLocaleString()}`,
      icon: TrendingUp,
    },
    {
      label: "Average Rating",
      value: `${stats?.ratingAvg?.toFixed(2) ?? 0}`,
      icon: Star,
    },
  ];


  return (
    <div className="min-h-screen bg-background">
      {/* Seller Navigation */}
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-18">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {storeLogo ? (
                <img
                  src={storeLogo}
                  alt={storeName ?? "Unknown"}
                  className="h-9 w-9 rounded-full object-cover border"
                />
              ) : (
                <Store className="h-8 w-8 text-primary" />
              )}

              <div>
                <h1 className="font-bold text-foreground">{storeName}</h1>
                <p className="text-xs text-muted-foreground">Seller Hub</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/" passHref>
                <Button variant="ghost" size="sm">
                  View Storefront
                </Button>
              </Link>
              {/* <Button variant="ghost" size="sm" onClick={handleImport}>
                handleImport
              </Button> */}
              {/* <Link href="/" passHref>
                <Button
                  variant="secondary"
                  className="bg-black text-white font-medium hover:bg-gray-800 hover:scale-105 transition-all duration-300 ease-in-out cursor-pointer"
                  size="sm"
                >
                  ShopHub
                </Button>
              </Link> */}
              {/* <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button> */}
            </div>
          </div>
        </div>
      </nav>

      {/* Page Body */}
      <div className="container mx-auto px-18 py-8">
        {/* Quick Actions */}
        <div className="mb-8 flex gap-3 flex-wrap">
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

          <Link href="/seller/chatbot" passHref>
            <Button variant="secondary" size="lg" className="cursor-pointer">
              <MessageCircle className="mr-2 h-5 w-5" />
              Manage Chatbot
            </Button>
          </Link>

          <Link href="/seller/message" passHref>
            <Button variant="outline" size="lg" className="cursor-pointer">
              💬 Reply Messages
            </Button>
          </Link>

          <Link href="/seller/analytics" passHref>
            <Button variant="outline" size="lg" className="cursor-pointer">
              <BarChart3 className="mr-2 h-5 w-5" />
              Analytics
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {formattedStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Real Products Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Products</CardTitle>
                <CardDescription>Manage your product listings</CardDescription>
              </div>
              <Link href="/seller/products" passHref>
                <Button variant="outline">View All</Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent>
            {localProducts.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No products found. Add your first product to get started!
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {localProducts.slice(0, 6).map((p) => (
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Search, ShoppingCart, User, MessageCircle, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCart } from "../contexts/CartContext";

const Navbar = () => {
  const { totalItems } = useCart();

  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-border shadow-md">
      <div className="container mx-auto px-4 md:px-14">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Store className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">ShopHub</span>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <div className="relative w-full flex items-center">
              <Search className="absolute left-3 h-5 w-5 text-gray-500 pointer-events-none" />
              <Input
                type="search"
                placeholder="Search for products..."
                className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 bg-gray-50 text-gray-800 focus-visible:ring-2 focus-visible:ring-blue-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link href="/messages">
              <Button variant="ghost" size="icon">
                <MessageCircle className="h-5 w-5" />
              </Button>
            </Link>

            <Link href="/cart" className="relative">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </Link>

            <Link href="/auth">
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </Link>

            <Link href="/seller">
              <Button
                variant="secondary"
                size="sm"
                className="bg-black text-white font-medium hover:bg-gray-800 hover:scale-105 
             transition-all duration-300 ease-in-out cursor-pointer"
              >
                Seller Hub
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full pl-10 pr-4"
            />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

"use client";

import Link from "next/link";
import {
  Search,
  ShoppingCart,
  User,
  MessageCircle,
  Store,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import SearchBar from "@/components/SearchBar";
import { useCart } from "../contexts/CartContext";
import { useSession, signOut } from "next-auth/react"; //  use NextAuth session
import { useProfile } from "@/contexts/ProfileContext"; //  add this

const Navbar = () => {
  const { totalItems } = useCart();
  const { data: session, status } = useSession(); //  NextAuth session

  const users = session?.user;
  const { user } = useProfile(); //  get full user info (includes isSeller)

  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-border shadow-md">
      <div className="container mx-auto px-4 md:px-18">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Store className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">ShopHub</span>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <SearchBar />
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

            {/* User Icon / Profile / Logout */}
            {users ? (
              <>
                <Link href="/profile">
                  <Button
                    variant="ghost"
                    size="icon"
                    title={users.name ?? "Profile"}
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Logout"
                  onClick={() => {
                    localStorage.removeItem("sessionId");

                    signOut({ callbackUrl: "/auth" });
                  }}
                >
                  <LogOut className="h-5 w-5 text-red-600" />
                </Button>
              </>
            ) : (
              <Link href="/auth">
                <Button variant="ghost" size="icon" title="Login">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}

            {/* Only show if user is a seller */}
            {user?.isSeller && (
              <Link href="/seller">
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-black text-white font-medium hover:bg-gray-800 hover:scale-105 transition-all duration-300 ease-in-out cursor-pointer"
                >
                  Seller Hub
                </Button>
              </Link>
            )}
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

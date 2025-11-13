"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useCart } from "@/contexts/CartContext";
import { useProducts } from "@/contexts/ProductContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import CheckoutModal from "@/components/CheckoutModal";
import { toast } from "sonner";

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, totalItems, fetchCart } =
    useCart();
  const { refetchProducts } = useProducts();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // 🧠 Group items by store name
  const groupedItems = items.reduce((groups, item) => {
    const key = item.sellerName || "Unknown Store";
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {} as Record<string, typeof items>);

  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // ✅ Toggle individual product
  const toggleItem = (key: string) => {
    setSelectedItems((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
    );
  };

  // ✅ Toggle an entire store group
  const toggleStore = (storeItems: typeof items) => {
    const allSelected = storeItems.every((item) =>
      selectedItems.includes(item.id)
    );

    if (allSelected) {
      // unselect all from that store
      setSelectedItems((prev) =>
        prev.filter((id) => !storeItems.some((x) => id === x.id))
      );
    } else {
      // select all from that store
      setSelectedItems((prev) => [
        ...prev,
        ...storeItems.map((x) => x.id).filter((id) => !prev.includes(id)),
      ]);
    }
  };

  // 🧮 Selected subtotal
  const selectedTotal = items
    .filter((item) => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  // 🗑️ Backend sync for item removal
  const handleRemoveItem = async (cartItemId: string) => {
    try {
      const res = await fetch(`/api/cart/delete?id=${cartItemId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      removeFromCart(cartItemId);
      await fetchCart(); // ✅ re-sync after successful deletion
    } catch (err) {
      toast.error("Failed to remove item from server");
      console.error("❌ /api/cart/delete error:", err);
    }
  };

  const handleUpdateQuantity = async (cartItemId: string, newQty: number) => {
    if (newQty < 1) return;

    try {
      const res = await fetch("/api/cart/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cartItemId, quantity: newQty }),
      });

      if (!res.ok) throw new Error("Failed to update cart");

      updateQuantity(cartItemId, newQty);
      await fetchCart(); // ✅ optional re-sync
    } catch (err) {
      toast.error("Failed to update cart on server");
      console.error("❌ PATCH /api/cart/update error:", err);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center space-y-4">
            <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground" />
            <h2 className="text-2xl font-bold text-foreground">
              Your cart is empty
            </h2>
            <p className="text-muted-foreground">
              Add some products to get started!
            </p>
            <Link href="/">
              <Button size="lg" className="mt-4">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-8 text-foreground">
          Shopping Cart ({totalItems} items)
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 🏪 Cart Items (Grouped by store) */}
          <div className="lg:col-span-2 space-y-8">
            {Object.entries(groupedItems).map(([sellerName, storeItems]) => {
              const storeSubtotal = storeItems.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0
              );

              const allSelected = storeItems.every((item) =>
                selectedItems.includes(item.id)
              );

              return (
                <div key={sellerName} className="space-y-3">
                  {/* 🏪 Store header */}
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() => toggleStore(storeItems)}
                      className="h-4 w-4 accent-primary cursor-pointer"
                    />
                    <h2 className="text-lg font-semibold text-foreground">
                      {sellerName}
                    </h2>
                  </div>

                  {/* 🛍 Items under this store */}
                  {storeItems.map((item) => {
                    const uniqueKey = item.id;
                    const isSelected = selectedItems.includes(uniqueKey);

                    return (
                      <Card key={item.id}>
                        <CardContent className="p-4">
                          <div className="flex gap-4 items-center">
                            {/* ✅ Checkbox per item */}
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleItem(item.id)}
                              className="h-4 w-4 accent-primary cursor-pointer"
                            />

                            {/* Product image */}
                            <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                              <img
                                src={
                                  item.variant?.image ??
                                  item.image ??
                                  "/placeholder.png"
                                }
                                alt={
                                  item.variant?.name ??
                                  item.product?.name ??
                                  item.name
                                }
                                className="h-40 w-full object-cover rounded-lg"
                              />
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground mb-1">
                                {item.variant?.name ?? item.product.name}
                              </h3>

                              {item.attributes && (
                                <p className="text-sm text-muted-foreground mb-1">
                                  {Object.entries(item.attributes)
                                    .map(([k, v]) => `${k}: ${v}`)
                                    .join(", ")}
                                </p>
                              )}

                              <p className="text-lg font-bold text-primary mb-3">
                                ${item.price.toFixed(2)}
                              </p>

                              {/* Quantity controls */}
                              <div className="flex items-center gap-3">
                                <div className="flex items-center border border-border rounded-lg">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() =>
                                      handleUpdateQuantity(
                                        item.id,
                                        item.quantity - 1
                                      )
                                    }
                                    disabled={item.quantity <= 1}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="px-4 text-sm font-medium">
                                    {item.quantity}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() =>
                                      handleUpdateQuantity(
                                        item.id,
                                        item.quantity + 1
                                      )
                                    }
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveItem(item.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>

                            {/* Subtotal */}
                            <div className="text-right">
                              <p className="font-bold text-foreground">
                                ${(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {/* Store subtotal */}
                  <div className="flex justify-end pr-2 mt-2 text-sm text-muted-foreground">
                    Subtotal for{" "}
                    <span className="mx-1 font-medium">{sellerName}</span>:
                    <span className="ml-2 font-semibold text-foreground">
                      ${storeSubtotal.toFixed(2)}
                    </span>
                  </div>

                  <Separator className="my-4" />
                </div>
              );
            })}
          </div>

          {/* 🧾 Order Summary */}
          <div>
            <Card className="sticky top-20">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xl font-bold text-foreground">
                  Order Summary
                </h3>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Selected Subtotal
                    </span>
                    <span className="font-medium text-foreground">
                      ${selectedTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium text-success">Free</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    ${selectedTotal.toFixed(2)}
                  </span>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  disabled={selectedItems.length === 0}
                  onClick={() => setCheckoutOpen(true)} // ✅ must exist
                >
                  Proceed to Checkout
                </Button>
                <Link href="/">
                  <Button variant="outline" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <CheckoutModal
              open={checkoutOpen}
              onClose={() => setCheckoutOpen(false)}
              selectedItems={items.filter((item) =>
                selectedItems.includes(item.id)
              )}
              onSuccess={async () => {
                await fetchCart();
                await refetchProducts();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

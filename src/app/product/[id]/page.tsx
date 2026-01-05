"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Star,
  Heart,
  ShoppingCart,
  Truck,
  Shield,
  RefreshCw,
  Package,
  Eye,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useProducts } from "@/contexts/ProductContext";
import { useBuyerMessages } from "@/contexts/BuyerMessageContext";
import { toast } from "sonner";

export default function ProductDetail() {
  const { id } = useParams();
  const { products, productLoading } = useProducts();
  const { addToCart, fetchCart } = useCart();
  const { refetchSessions } = useBuyerMessages();
  const router = useRouter();

  const product = useMemo(
    () => products.find((p: any) => p.id === id),
    [products, id]
  );

  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});

  // When product loads, pick default variant (if exists)
  useEffect(() => {
    if (product?.variants?.length) setSelectedVariant(product.variants[0]);
  }, [product]);

  // Compute price, image, stock dynamically
  const displayPrice = selectedVariant?.price ?? product?.price;
  const displayStock = selectedVariant?.stock ?? product?.stock;
  const displayImage = selectedVariant?.imageUrl ?? product?.imageUrl;

  const similarProducts = useMemo(() => {
    if (!product) return [];
    console.log(products);
    return products
      .filter(
        (p: any) => p.categoryId === product.categoryId && p.id !== product.id
      )
      .slice(0, 4);
  }, [products, product]);

  const handleAddToCart = async () => {
    if (!product) return;

    /* -------------------- BASIC STOCK GUARD -------------------- */
    if (product.stock < 1 || (selectedVariant && selectedVariant.stock < 1)) {
      toast.error("This product is out of stock.");
      return;
    }

    /* -------------------- ATTRIBUTES -------------------- */
    const selectedAttributes =
      selectedOptions && Object.keys(selectedOptions).length > 0
        ? selectedOptions
        : null;

    /* -------------------- VALIDATE VARIANT -------------------- */
    if (product.variants?.length > 0) {
      if (!selectedVariant) {
        toast.error("Please select a variant before adding to cart.");
        return;
      }

      const requiredOptions = Object.keys(selectedVariant.attributes || {});

      if (Object.keys(selectedOptions).length < requiredOptions.length) {
        toast.error("Please select all options before adding to cart.");
        return;
      }
    }

    try {
      /* -------------------- BACKEND FIRST -------------------- */
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          variantId: selectedVariant?.id ?? null,
          attributes: selectedAttributes,
          price: selectedVariant?.price ?? product.price,
          quantity: 1,
          image: selectedVariant?.imageUrl ?? product.imageUrl,
          sellerId: product.seller?.id ?? product.sellerId,
          sellerName: product.seller?.store_name ?? "",
        }),
      });

      const data = await res.json();

      /* -------------------- HANDLE STOCK ERROR -------------------- */
      if (!res.ok) {
        if (res.status === 400 && data?.availableStock !== undefined) {
          toast.error(`Only ${data.availableStock} item(s) left in stock`);
        } else {
          toast.error("Failed to add item to cart.");
        }
        return;
      }

      /* -------------------- LOCAL CART SYNC -------------------- */
      addToCart({
        id: crypto.randomUUID(),
        productId: product.id,
        variantId: selectedVariant?.id ?? null,
        name: selectedVariant?.name ?? product.name,
        price: selectedVariant?.price ?? product.price,
        image: selectedVariant?.imageUrl ?? product.imageUrl,
        sellerId: product.seller?.id ?? product.sellerId,
        sellerName: product.seller?.store_name ?? "",
        product,
      });

      /* -------------------- EVENT LOG -------------------- */
      await fetch("/api/eventlog/addCart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          brandId: product.brandId,
          categoryId: product.categoryId,
          price: selectedVariant?.price ?? product.price,
          userSession: localStorage.getItem("sessionId") || "guest",
        }),
      });

      await fetchCart?.();
      toast.success("Added to cart successfully.");
    } catch (err) {
      toast.error("Network error. Please try again.");
    }
  };

  const activeAttributes = useMemo(() => {
    // Case: If variant selected → show variant attributes
    if (
      selectedVariant?.attributes &&
      Object.keys(selectedVariant.attributes).length > 0
    ) {
      return selectedVariant.attributes;
    }

    // Case: No variant → show product attributes
    if (product?.attributes && Object.keys(product.attributes).length > 0) {
      return product.attributes;
    }

    // Case: Nothing available
    return null;
  }, [selectedVariant, product]);

  if (productLoading)
    return <div className="p-10 text-center">Loading products...</div>;
  if (!product)
    return (
      <div className="p-10 text-center text-red-500">Product not found.</div>
    );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 md:px-6 lg:px-18 py-12 max-w-8xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm">
              <img
                src={displayImage || "/placeholder.png"}
                alt={product.name}
                className="object-contain w-full h-full p-8"
                width={600}
                height={600}
              />
            </div>

            {product.galleryUrls?.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                {product.galleryUrls.map((url: string, i: number) => (
                  <div
                    key={i}
                    className="aspect-square rounded-xl overflow-hidden bg-gray-50 cursor-pointer border-2 border-transparent hover:border-primary/50 transition-all duration-200"
                  >
                    <img
                      src={url}
                      alt={`Gallery ${i}`}
                      className="object-cover w-full h-full"
                      width={150}
                      height={150}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge
                variant="secondary"
                className="mb-1 capitalize text-xs font-medium px-3 py-1"
              >
                {product.category?.name}
              </Badge>

              <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                {product.name}
              </h1>

              <div className="flex items-center gap-5 flex-wrap mt-2">
                {/* Star Rating */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.round(product.analytics?.ratingAvg ?? 0)
                            ? "fill-amber-400 text-amber-400"
                            : "fill-gray-200 text-gray-200"
                        }`}
                      />
                    ))}
                  </div>

                  <span className="text-sm font-medium">
                    {(product.analytics?.ratingAvg ?? 0).toFixed(2)}
                  </span>

                  <span className="text-sm text-muted-foreground">
                    ({product.analytics?.ratingCount ?? 0} reviews)
                  </span>
                </div>

                {/* Stock */}
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>Stock: {product.stock ?? 0}</span>
                </div>

                {/* Sales */}
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <ShoppingCart className="h-4 w-4" />
                  <span>Sold: {product.analytics?.salesCount ?? 0}</span>
                </div>

                {/* Views */}
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span>{product.analytics?.views ?? 0} views</span>
                </div>
              </div>

              {/* Seller Box */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    <img
                      src={product.seller?.store_logo}
                      alt={product.seller?.store_name}
                      className="h-9 w-9 rounded-full object-cover border"
                    />
                  </div>

                  <div>
                    <p className="font-semibold text-foreground">
                      {product.seller?.store_name ?? "Unknown Seller"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {/* Visit Store */}
                  <Link href={`/sellers/${product.seller?.id}`}>
                    <Button variant="outline" size="sm">
                      Visit Store
                    </Button>
                  </Link>

                  {/* Chat Seller */}
                  <Button
                    size="sm"
                    onClick={async () => {
                      const res = await fetch("/api/messages/start", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ sellerId: product.seller?.id }),
                      });

                      const data = await res.json();

                      if (data.sessionId) {
                        await refetchSessions();
                        router.push(
                          `/messages?seller=${encodeURIComponent(
                            product.seller?.store_name
                          )}`
                        );
                      }
                    }}
                  >
                    Chat
                  </Button>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Select Variant Name */}
            {product.variants?.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  Choose Variant
                </h4>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v: any) => {
                    const isSelected = selectedVariant?.id === v.id;
                    return (
                      <Button
                        key={v.id}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setSelectedVariant(v);
                          setSelectedOptions({}); // reset options when switching variant
                        }}
                      >
                        {v.name}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/*  Variant or Normal Product Options */}
            {(selectedVariant?.attributes || product?.attributes) && (
              <div className="space-y-3 mt-6">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  Choose Options
                </h4>

                {Object.entries(
                  selectedVariant?.attributes || product?.attributes
                ).map(([attrKey, values]) => (
                  <div key={attrKey} className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      {attrKey}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(values) &&
                        values.map((value: string) => {
                          const isSelected = selectedOptions[attrKey] === value;
                          return (
                            <Button
                              key={value}
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              onClick={() =>
                                setSelectedOptions((prev) => ({
                                  ...prev,
                                  [attrKey]: value,
                                }))
                              }
                            >
                              {value}
                            </Button>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-5xl font-bold text-foreground">
                  RM {displayPrice.toFixed(2)}
                </span>
                <Badge
                  variant={displayStock > 0 ? "default" : "destructive"}
                  className="text-xs px-3 py-1"
                >
                  {displayStock > 0 ? "In Stock" : "Out of Stock"}
                </Badge>
              </div>
              <p className="text-sm text-green-600 font-medium">
                ✓ Free shipping on orders over RM500
              </p>
            </div>

            <Separator className="my-6" />

            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-foreground">
                Description
              </h3>

              <p className="text-muted-foreground leading-relaxed text-base">
                {product.description || "No description available."}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* BRAND */}
                {product.brands?.name && (
                  <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                    <h4 className="font-semibold text-sm text-foreground uppercase tracking-wide">
                      Brand
                    </h4>

                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                      <span className="font-medium text-foreground">
                        {product.brands.name}
                      </span>
                    </div>
                  </div>
                )}

                {/* SPECIFICATIONS */}
                {product.attributes &&
                  Object.keys(product.attributes).length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                      <h4 className="font-semibold text-sm text-foreground uppercase tracking-wide">
                        Specifications
                      </h4>

                      <ul className="space-y-2.5">
                        {Object.entries(product.attributes).map(
                          ([key, value]) => (
                            <li
                              key={key}
                              className="flex items-start gap-3 text-sm"
                            >
                              <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />

                              <span className="text-muted-foreground">
                                <span className="font-medium text-foreground capitalize">
                                  {key}:
                                </span>{" "}
                                {Array.isArray(value)
                                  ? value.join(", ")
                                  : String(value)}
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                {activeAttributes && (
                  <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                    <h4 className="font-semibold text-sm text-foreground uppercase tracking-wide">
                      Specifications
                    </h4>

                    <ul className="space-y-2.5">
                      {Object.entries(activeAttributes).map(([key, value]) => (
                        <li
                          key={key}
                          className="flex items-start gap-3 text-sm"
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />

                          <span className="text-muted-foreground">
                            <span className="font-medium text-foreground capitalize">
                              {key}:
                            </span>{" "}
                            {Array.isArray(value)
                              ? value.join(", ")
                              : String(value)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                size="lg"
                disabled={
                  product?.variants?.length > 0
                    ? // Case: Product has variants → must select variant + all its options
                      !selectedVariant ||
                      Object.keys(selectedOptions).length <
                        Object.keys(selectedVariant?.attributes || {}).length
                    : // Case: Product has no variants → must select all product-level options if exist
                      Object.keys(product?.attributes || {}).length > 0 &&
                      Object.keys(selectedOptions).length <
                        Object.keys(product?.attributes || {}).length
                }
                className="flex-1 h-14 text-base font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 w-14 rounded-xl hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"
              >
                <Heart className="h-5 w-5" />
              </Button>
            </div>

            {/* <div className="grid grid-cols-3 gap-6 pt-6">
              <Feature
                icon={<Truck className="h-6 w-6" />}
                text="Free Shipping"
              />
              <Feature
                icon={<Shield className="h-6 w-6" />}
                text="2 Year Warranty"
              />
              <Feature
                icon={<RefreshCw className="h-6 w-6" />}
                text="30 Day Returns"
              />
            </div> */}
          </div>
        </div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <section className="px-18 py-12">
            <h2 className="text-3xl font-bold mb-8 text-foreground">
              Similar Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProducts.map((prod: any, index: number) => (
                <Link
                  key={prod.id ?? index}
                  href={`/product/${prod.id}`}
                  onClick={() => {
                    fetch("/api/eventlog/view", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        productId: prod.id,
                        brandId: prod.brandId,
                        categoryId: prod.categoryId,
                        price: prod.price,
                        userSession:
                          localStorage.getItem("sessionId") || "guest",
                      }),
                    }).catch(() => {});
                  }}
                  className="block transition-transform hover:scale-105 duration-200"
                >
                  <ProductCard {...prod} />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-3 p-4 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
      <div className="text-primary">{icon}</div>
      <span className="text-xs font-medium text-foreground">{text}</span>
    </div>
  );
}

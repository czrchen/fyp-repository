"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Package, Star, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import EditSimpleProductModal from "@/components/EditSimpleProductModal";
import EditVariantProductModal from "@/components/EditVariantProductModal";

interface ProductCardProps {
  id: string;
  name: string;
  sellerId: string;
  sellerName: string;
  price: number;
  imageUrl?: string | null;
  category: any; // now full category object
  subcategory?: any | null;
  stock?: number;
  status: boolean;
  mode?: "buyer" | "seller";
  variants?: any[];
  tags?: string[];
  description?: string;
  attributes?: Record<string, any>;
  galleryUrls?: string[];

  analytics?: {
    views: number;
    salesCount: number;
    ratingAvg: number;
    ratingCount: number;
  };

  onUpdated?: (updated: {
    price: number;
    stock: number;
    status: boolean;
  }) => void;
}

export default function ProductCard({
  id,
  name,
  sellerId,
  sellerName,
  price,
  imageUrl,
  category,
  subcategory,
  stock = 0,
  status,
  mode = "buyer",
  variants = [],
  tags = [],
  description = "",
  attributes = {},
  galleryUrls = [],
  analytics = {
    views: 0,
    salesCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
  },
  onUpdated,
}: ProductCardProps) {
  const { addToCart } = useCart();

  //  Construct full product object for modals
  const product = {
    id,
    name,
    sellerId,
    sellerName,
    price,
    imageUrl,
    category,
    subcategory,
    stock,
    status,
    variants,
    tags,
    description,
    attributes,
    galleryUrls,
    analytics,
  };

  //  Determine displayed image (fallbacks)
  const displayImage =
    imageUrl ||
    (variants.length > 0 && variants[0].imageUrl) ||
    "/placeholder.png";

  //  Determine displayed price text
  const displayPrice =
    variants.length > 0
      ? `From RM ${Math.min(...variants.map((v) => v.price)).toFixed(2)}`
      : `RM ${price.toFixed(2)}`;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 border border-border group flex flex-col">
      {/* Product Image */}
      <CardHeader className="p-0 relative">
        {displayImage ? (
          <div className="relative h-48 w-full bg-muted">
            <img
              src={displayImage}
              alt={name}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="h-48 w-full bg-muted flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}

        <Badge
          variant="secondary"
          className="absolute top-3 left-3 capitalize bg-white/95 text-black shadow-sm"
        >
          {category?.name}
        </Badge>
      </CardHeader>

      {/* Product Details */}
      <CardContent className="p-4 flex-1 flex flex-col space-y-3">
        {/* Product Name & Subcategory */}
        <div className="space-y-1">
          <h3 className="font-semibold text-base leading-tight line-clamp-2 min-h-[2.5rem]">
            {name}
          </h3>
          {subcategory && (
            <p className="text-xs text-muted-foreground">{subcategory}</p>
          )}
        </div>

        {/* Price */}
        <div className="text-xl font-bold text-primary">{displayPrice}</div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground py-2 border-t border-border">
          {/* Views */}
          <div className="flex items-center gap-1.5" title="Views">
            <Eye className="h-3.5 w-3.5" />
            <span>{product.analytics?.views ?? 0}</span>
          </div>

          {/* Stock */}
          <div className="flex items-center gap-1.5" title="Sales">
            <Package className="h-3.5 w-3.5" />
            <span>{product.stock ?? 0}</span>
          </div>

          {/* Sales */}
          <div className="flex items-center gap-1.5" title="Sales">
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>{product.analytics?.salesCount ?? 0}</span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1.5" title="Rating">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span>{(product.analytics?.ratingAvg ?? 0).toFixed(2)}</span>
            <span className="text-muted-foreground/60">
              ({product.analytics?.ratingCount ?? 0})
            </span>
          </div>
        </div>

        {/*  Variants count */}
        <div className="text-xs text-muted-foreground min-h-[1rem]">
          {variants.length > 0 ? (
            <p>
              {variants.length} variant{variants.length > 1 ? "s" : ""}
            </p>
          ) : (
            <p className="opacity-0">placeholder</p>
          )}
        </div>
      </CardContent>

      {/* Seller mode footer */}
      {mode === "seller" && (
        <CardFooter className="p-4 pt-0 mt-auto flex justify-between items-center">
          <Badge
            variant={status ? "default" : "secondary"}
            className="capitalize"
          >
            {status ? "Active" : "Inactive"}
          </Badge>

          {/* Detect if product has variants */}
          {variants?.length > 0 ? (
            <EditVariantProductModal
              product={product}
              onUpdated={(updated) => onUpdated?.(updated)}
            />
          ) : (
            <EditSimpleProductModal
              product={product}
              onUpdated={(updated) => onUpdated?.(updated)}
            />
          )}
        </CardFooter>
      )}
    </Card>
  );
}

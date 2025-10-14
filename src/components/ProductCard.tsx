"use client";

import Link from "next/link";
import Image from "next/image";
import type { StaticImageData } from "next/image";
import { Heart, Star, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string | StaticImageData; // ✅ accept both types
  rating: number;
  reviews: number;
  category: string;
  isNew?: boolean;
  discount?: number;
}

const ProductCard = ({
  id,
  name,
  price,
  image,
  rating,
  reviews,
  category,
  isNew,
  discount,
}: ProductCardProps) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({ id, name, price, image });
  };

  return (
    <Card className="group overflow-hidden border-border hover:shadow-lg transition-all">
      <Link href={`/product/${id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={image}
            alt={name}
            width={500}
            height={500}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Labels */}
          {discount ? (
            <Badge className="absolute top-2 left-2 bg-destructive text-white px-3 py-1.5 text-sm">
              -{discount}%
            </Badge>
          ) : isNew ? (
            <Badge className="absolute top-2 left-2 bg-green-500 text-white px-3 py-1.5 text-sm">
              New
            </Badge>
          ) : null}

          {/* Favorite Button */}
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="bg-background/80 hover:bg-background"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Link>

      {/* Card Content */}
      <CardContent className="p-4">
        <Link href={`/product/${id}`} className="block space-y-1">
          <p className="text-xs text-muted-foreground">{category}</p>
          <h3 className="font-medium text-foreground line-clamp-2">{name}</h3>

          <div className="flex items-center gap-1">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(rating)
                      ? "fill-primary text-primary"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">({reviews})</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-primary">${price}</span>
            {discount && (
              <span className="text-sm text-muted-foreground line-through">
                ${(price / (1 - discount / 100)).toFixed(2)}
              </span>
            )}
          </div>
        </Link>
      </CardContent>

      {/* Add to Cart Button */}
      <CardFooter className="p-4 pt-0">
        <Button className="w-full" onClick={handleAddToCart}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;

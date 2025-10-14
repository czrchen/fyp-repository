"use client";

import Image, { StaticImageData } from "next/image";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
// import ChatbotWidget from "@/components/ChatbotWidget";

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
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";

import productHeadphones from "@/assets/product-headphone.webp";
import productWatch from "@/assets/product-watch.webp";
import productSneakers from "@/assets/product-sneakers.webp";

export default function ProductDetail() {
  const params = useParams();
  const { addToCart } = useCart();
  const id = params?.id?.toString() ?? "1";

  const currentProduct = {
    id,
    name: "Premium Wireless Headphones",
    price: 299.99,
    image: productHeadphones as string | StaticImageData,
  };

  const handleAddToCart = () => {
    addToCart(currentProduct);
  };

  const similarProducts = [
    {
      id: "2",
      name: "Luxury Smart Watch",
      price: 449.99,
      image: productWatch,
      rating: 4.6,
      reviews: 856,
      category: "Electronics",
      discount: 15,
    },
    {
      id: "3",
      name: "Running Sneakers Pro",
      price: 129.99,
      image: productSneakers,
      rating: 4.9,
      reviews: 2103,
      category: "Sports",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
              <Image
                src={productHeadphones}
                alt="Premium Wireless Headphones"
                className="object-cover w-full h-full"
                width={500}
                height={500}
                priority
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer border-2 border-transparent hover:border-primary transition-smooth"
                >
                  <Image
                    src={productHeadphones}
                    alt={`View ${i}`}
                    className="object-cover w-full h-full"
                    width={120}
                    height={120}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge className="mb-2">Electronics</Badge>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Premium Wireless Headphones
              </h1>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < 4
                          ? "fill-primary text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  4.8 (1,234 reviews)
                </span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-primary">$299.99</span>
                <Badge variant="destructive">In Stock</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Free shipping on orders over $50
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Description</h3>
              <p className="text-muted-foreground leading-relaxed">
                Experience premium audio quality with our state-of-the-art
                wireless headphones. Featuring advanced noise cancellation,
                40-hour battery life, and exceptional comfort for all-day wear.
                Perfect for music enthusiasts and professionals alike.
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Active Noise Cancellation (ANC)
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  40-hour battery life
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Premium leather ear cushions
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Bluetooth 5.0 connectivity
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button size="lg" className="flex-1" onClick={handleAddToCart}>
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
              <Button size="lg" variant="outline">
                <Heart className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="flex flex-col items-center text-center gap-2">
                <Truck className="h-6 w-6 text-primary" />
                <span className="text-xs text-muted-foreground">
                  Free Shipping
                </span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <span className="text-xs text-muted-foreground">
                  2 Year Warranty
                </span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <RefreshCw className="h-6 w-6 text-primary" />
                <span className="text-xs text-muted-foreground">
                  30 Day Returns
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Products */}
        <section className="py-8">
          <h2 className="text-2xl font-bold mb-6 text-foreground">
            Similar Products
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {similarProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </section>
      </div>
      {/* <ChatbotWidget /> */}
    </div>
  );
}

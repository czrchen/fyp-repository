"use client";

import Link from "next/link";
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
} from "lucide-react";

export default function SellerDashboard() {
  const stats = [
    {
      label: "Total Sales",
      value: "$12,345",
      icon: DollarSign,
      change: "+12.5%",
    },
    { label: "Products", value: "48", icon: Package, change: "+3" },
    { label: "Total Views", value: "34.5K", icon: Eye, change: "+8.2%" },
    { label: "Active Chats", value: "23", icon: MessageCircle, change: "+5" },
  ];

  const recentProducts = [
    {
      id: 1,
      name: "Wireless Headphones",
      views: 1234,
      sales: 45,
      status: "active",
    },
    { id: 2, name: "Smart Watch", views: 856, sales: 32, status: "active" },
    { id: 3, name: "Running Shoes", views: 2103, sales: 67, status: "active" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ✅ Seller Navigation */}
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Store className="h-8 w-8 text-primary" />
              <div>
                <h1 className="font-bold text-foreground">Seller Hub</h1>
                <p className="text-xs text-muted-foreground">My Store</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/" passHref>
                <Button variant="ghost" size="sm">
                  View Storefront
                </Button>
              </Link>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* ✅ Page Body */}
      <div className="container mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="mb-8 flex gap-3 flex-wrap">
          <Link href="/seller/addProduct" passHref>
            <Button size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Add Product
            </Button>
          </Link>
          <Link href="/seller/chatbot" passHref>
            <Button variant="secondary" size="lg">
              <MessageCircle className="mr-2 h-5 w-5" />
              Manage Chatbot
            </Button>
          </Link>
          <Link href="/seller/analytics" passHref>
            <Button variant="outline" size="lg">
              <BarChart3 className="mr-2 h-5 w-5" />
              Analytics
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
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
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span className="text-xs text-success font-medium">
                      {stat.change}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Products */}
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
            <div className="space-y-4">
              {recentProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent transition-smooth"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {product.views.toLocaleString()} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        {product.sales} sales
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        product.status === "active" ? "default" : "secondary"
                      }
                    >
                      {product.status}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

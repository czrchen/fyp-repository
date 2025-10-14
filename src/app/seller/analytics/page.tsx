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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Eye,
  Users,
} from "lucide-react";

export default function SellerAnalytics() {
  const stats = [
    {
      label: "Revenue",
      value: "$12,345",
      change: "+15.3%",
      isPositive: true,
      icon: DollarSign,
    },
    {
      label: "Orders",
      value: "234",
      change: "+8.2%",
      isPositive: true,
      icon: ShoppingCart,
    },
    {
      label: "Page Views",
      value: "45.2K",
      change: "+12.5%",
      isPositive: true,
      icon: Eye,
    },
    {
      label: "Conversion Rate",
      value: "3.2%",
      change: "-0.5%",
      isPositive: false,
      icon: Users,
    },
  ];

  const topProducts = [
    { name: "Wireless Headphones", sales: 145, revenue: "$4,350" },
    { name: "Smart Watch", sales: 98, revenue: "$3,920" },
    { name: "Running Shoes", sales: 87, revenue: "$2,610" },
    { name: "Phone Case", sales: 76, revenue: "$1,520" },
    { name: "Laptop Stand", sales: 54, revenue: "$1,620" },
  ];

  const recentOrders = [
    {
      id: "ORD-001",
      customer: "John Doe",
      amount: "$299.99",
      status: "completed",
    },
    {
      id: "ORD-002",
      customer: "Jane Smith",
      amount: "$449.99",
      status: "processing",
    },
    {
      id: "ORD-003",
      customer: "Bob Johnson",
      amount: "$129.99",
      status: "shipped",
    },
    {
      id: "ORD-004",
      customer: "Alice Brown",
      amount: "$79.99",
      status: "completed",
    },
  ];

  const trafficSources = [
    { source: "Direct", visitors: "12.5K", percentage: 45 },
    { source: "Search Engines", visitors: "8.3K", percentage: 30 },
    { source: "Social Media", visitors: "4.2K", percentage: 15 },
    { source: "Referrals", visitors: "2.8K", percentage: 10 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ✅ Navigation Bar */}
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-16">
            <Link href="/seller" passHref>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Track your store performance and insights
          </p>
        </div>

        {/* ✅ Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const TrendIcon = stat.isPositive ? TrendingUp : TrendingDown;
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
                    <TrendIcon
                      className={`h-3 w-3 ${
                        stat.isPositive ? "text-success" : "text-destructive"
                      }`}
                    />
                    <span
                      className={`text-xs font-medium ${
                        stat.isPositive ? "text-success" : "text-destructive"
                      }`}
                    >
                      {stat.change}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      vs last month
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ✅ Detailed Analytics Tabs */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList>
            <TabsTrigger value="products">Top Products</TabsTrigger>
            <TabsTrigger value="orders">Recent Orders</TabsTrigger>
            <TabsTrigger value="traffic">Traffic Sources</TabsTrigger>
          </TabsList>

          {/* 🏆 Top Products Tab */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Best Selling Products</CardTitle>
                <CardDescription>
                  Your top performing products this month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topProducts.map((product, index) => (
                    <div
                      key={product.name}
                      className="flex items-center justify-between p-4 rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">
                            {product.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {product.sales} sales
                          </p>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-foreground">
                        {product.revenue}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 📦 Recent Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>
                  Latest orders from your customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border"
                    >
                      <div>
                        <h3 className="font-medium text-foreground">
                          {order.id}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {order.customer}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-foreground">
                          {order.amount}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            order.status === "completed"
                              ? "bg-success/10 text-success"
                              : order.status === "processing"
                              ? "bg-primary/10 text-primary"
                              : "bg-secondary/10 text-secondary"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 🌍 Traffic Sources Tab */}
          <TabsContent value="traffic">
            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
                <CardDescription>
                  Where your visitors are coming from
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trafficSources.map((traffic) => (
                    <div key={traffic.source} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          {traffic.source}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {traffic.visitors} visits
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${traffic.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

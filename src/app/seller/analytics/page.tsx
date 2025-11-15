"use client";

import { useState, useEffect } from "react";
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
  Star,
} from "lucide-react";
import { useSeller } from "@/contexts/SellerContext";
import { useOrders } from "@/contexts/OrderContext";
import { toast } from "sonner";

export default function SellerAnalytics() {
  const {
    stats,
    products,
    isLoading,
    orders,
    updateOrderItemStatus,
    refetchingSellerData,
  } = useSeller();
  const { fetchOrders } = useOrders();
  const [openMap, setOpenMap] = useState<{ [id: string]: boolean }>({});
  const [localStatus, setLocalStatus] = useState<{ [id: string]: string }>({});
  const [buttonState, setButtonState] = useState<{ [id: string]: string }>({});
  const toggle = (id: string) =>
    setOpenMap((prev) => ({ ...prev, [id]: !prev[id] }));

  // 🟦 Loading Screen

  // 🟩 Key Stats
  const metrics = [
    {
      label: "Revenue",
      value: `RM ${stats?.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
    },
    {
      label: "Total Sales",
      value: `${stats?.totalSales.toLocaleString()}`,
      icon: ShoppingCart,
    },
    {
      label: "Total Views",
      value: `${stats?.totalViews.toLocaleString()}`,
      icon: Eye,
    },
    {
      label: "Avg Rating",
      value: `${stats?.ratingAvg.toFixed(2)}`,
      icon: Users,
    },
  ];

  const RatingStars = ({ rating = 0 }) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={`h-4 w-4 ${
              n <= rating ? "fill-yellow-500 text-yellow-500" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  // 🟦 Top Products (sorted by salesCount)
  const topProducts = [...products]
    .sort((a: any, b: any) => b.analytics?.salesCount - a.analytics?.salesCount)
    .slice(0, 5);

  const handleStatusChange = async (
    orderId: string,
    itemId: string,
    newStatus: string
  ) => {
    // Set button to loading
    setButtonState((prev) => ({ ...prev, [itemId]: "loading" }));

    try {
      await fetch("/api/seller/order/updateStatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, itemId, status: newStatus }),
      });

      updateOrderItemStatus(orderId, itemId, newStatus);
      await fetchOrders();

      toast.success("Status Updated");

      // Set button to success
      setButtonState((prev) => ({ ...prev, [itemId]: "success" }));

      // After 3 seconds, return to idle
      setTimeout(() => {
        setButtonState((prev) => ({ ...prev, [itemId]: "idle" }));
      }, 3000);
      await refetchingSellerData();
    } catch (err) {
      console.error(err);
      setButtonState((prev) => ({ ...prev, [itemId]: "idle" }));
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-14">
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

      <div className="container mx-auto px-18 py-8">
        <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Track your store’s real performance using live analytics
        </p>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-8">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <Card key={metric.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm text-muted-foreground">
                    {metric.label}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid grid-cols-3 lg:grid-cols-3 mb-8 px-2">
            <TabsTrigger value="products">Top Products</TabsTrigger>
            <TabsTrigger value="orders">Recent Orders</TabsTrigger>
            <TabsTrigger value="reviews">Reviewed Products</TabsTrigger>
          </TabsList>

          {/* Top Products */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Best Selling Products</CardTitle>
                <CardDescription>Your top 10 performers</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-4 max-h-[540px] min-h-[360px] overflow-y-auto pr-2">
                  {/* max-h ~5 items visible, others scroll */}

                  {topProducts.length === 0 ? (
                    <p className="text-muted-foreground">No sales yet.</p>
                  ) : (
                    topProducts
                      .slice(0, 10) // ⬅️ Only 10 items max
                      .map((p: any, index: number) => (
                        <div
                          key={p.id}
                          className="flex justify-between items-center p-4 border rounded-lg bg-white"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{p.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {p.analytics?.salesCount ?? 0} sales
                              </p>
                            </div>
                          </div>
                          <div className="font-bold text-foreground">
                            RM {(p.analytics?.salesCount * p.price).toFixed(2)}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Order */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Your latest customer orders</CardDescription>
              </CardHeader>

              <CardContent className="max-h-[540px] min-h-[360px] overflow-y-auto space-y-4 pr-2">
                {orders.length === 0 ? (
                  <p className="text-muted-foreground">No orders yet.</p>
                ) : (
                  orders.map((order) => {
                    const open = openMap[order.orderId] ?? false;
                    const isCompleted = order.items.every((i) =>
                      ["Received", "Cancelled"].includes(i.status)
                    );

                    return (
                      <div
                        key={order.orderId}
                        className="border rounded-lg p-4 bg-card"
                      >
                        {/* Header */}
                        <div
                          className="flex justify-between items-start cursor-pointer"
                          onClick={() => toggle(order.orderId)}
                        >
                          <div>
                            <h3 className="font-semibold">
                              Order #{order.orderId.slice(0, 8).toUpperCase()}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.createdAt).toLocaleString()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Total: RM {order.totalAmount.toFixed(2)}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                isCompleted
                                  ? "bg-green-100 text-green-600"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {isCompleted ? "Completed" : "In Progress"}
                            </span>

                            <span className="text-sm text-muted-foreground">
                              {open ? "▲" : "▼"}
                            </span>
                          </div>
                        </div>

                        {/* COLLAPSE CONTENT */}
                        <div
                          className={`transition-all duration-300 ease-in-out overflow-hidden ${
                            open
                              ? "max-h-[800px] opacity-100 mt-4"
                              : "max-h-0 opacity-0"
                          }`}
                        >
                          <div className="space-y-4">
                            {order.items.map((item) => (
                              <div
                                key={item.id}
                                className="group relative flex justify-between items-center border border-gray-200 rounded-xl p-4 bg-white hover:shadow-lg hover:border-gray-300 transition-all duration-200"
                              >
                                {/* LEFT SIDE */}
                                <div className="flex items-center gap-4 flex-1">
                                  <div className="relative flex-shrink-0">
                                    <img
                                      src={item.imageUrl || "/placeholder.png"}
                                      alt={item.product.name}
                                      className="w-20 h-20 object-cover rounded-lg shadow-sm"
                                    />
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-col">
                                      <p className="font-medium">
                                        {item.product.name}
                                      </p>
                                      <p className="font-medium">
                                        {/* 🏷️ Show selected attributes, if any */}
                                        {item.attributes &&
                                          Object.keys(item.attributes).length >
                                            0 && (
                                            <span className="text-sm text-muted-foreground">
                                              (
                                              {Object.entries(item.attributes)
                                                .map(
                                                  ([key, val]) =>
                                                    `${key}: ${val}`
                                                )
                                                .join(", ")}
                                              )
                                            </span>
                                          )}
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                      <span className="flex items-center gap-1">
                                        <span className="font-medium">
                                          Qty:
                                        </span>
                                        <span>{item.quantity}</span>
                                      </span>
                                      <span className="text-gray-300">•</span>
                                      <span className="flex items-center gap-1">
                                        <span>RM {item.price.toFixed(2)}</span>
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* RIGHT SIDE — PRICE + STATUS + BUTTON */}
                                <div className="flex items-center gap-6 ml-4">
                                  {/* TOTAL PRICE */}
                                  <div className="text-right">
                                    <div className="text-xs text-gray-500 mb-1">
                                      Total
                                    </div>
                                    <div className="text-xl font-bold text-gray-900">
                                      RM{" "}
                                      {(item.price * item.quantity).toFixed(2)}
                                    </div>
                                  </div>

                                  {/* STATUS SELECT + UPDATE BUTTON */}
                                  <div className="flex flex-col gap-2 w-40">
                                    <select
                                      value={
                                        localStatus[item.id] ?? item.status
                                      }
                                      onChange={(e) =>
                                        setLocalStatus((prev) => ({
                                          ...prev,
                                          [item.id]: e.target.value,
                                        }))
                                      }
                                      className="w-full px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-colors"
                                    >
                                      <option value="Pending">Pending</option>
                                      <option value="Delivered">
                                        Delivered
                                      </option>
                                      <option value="Received">Received</option>
                                      <option value="Cancelled">
                                        Cancelled
                                      </option>
                                    </select>

                                    <button
                                      onClick={() =>
                                        handleStatusChange(
                                          order.orderId,
                                          item.id,
                                          localStatus[item.id] ?? item.status
                                        )
                                      }
                                      disabled={
                                        buttonState[item.id] === "loading"
                                      }
                                      className="w-full text-sm font-medium px-4 py-2 bg-black text-white rounded-lg 
             hover:bg-gray-800 active:bg-gray-900 transition-colors shadow-sm 
             hover:shadow disabled:opacity-50 disabled:cursor-not-allowed 
             focus:outline-none focus:ring-2 focus:ring-black/20"
                                    >
                                      {buttonState[item.id] === "loading" &&
                                        "Updating..."}
                                      {buttonState[item.id] === "success" &&
                                        "Updated ✓"}
                                      {!buttonState[item.id] ||
                                      buttonState[item.id] === "idle"
                                        ? "Update Status"
                                        : ""}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews */}
          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Products With Reviews</CardTitle>
                <CardDescription>
                  All reviewed items grouped by order
                </CardDescription>
              </CardHeader>

              <CardContent className="max-h-[540px] min-h-[360px] overflow-y-auto space-y-4 pr-2">
                {orders.every((o) =>
                  o.items.every((i) => !i.rating && !i.feedback)
                ) ? (
                  <p className="text-muted-foreground">No reviews yet.</p>
                ) : (
                  orders
                    .filter((order) =>
                      order.items.some((i) => i.rating || i.feedback)
                    )
                    .map((order) => {
                      const open = openMap[`review-${order.orderId}`] ?? false;

                      return (
                        <div
                          key={order.orderId}
                          className="border rounded-lg p-4 bg-card"
                        >
                          {/* Header */}
                          <div
                            className="flex justify-between items-start cursor-pointer"
                            onClick={() => toggle(`review-${order.orderId}`)}
                          >
                            <div>
                              <h3 className="font-semibold">
                                Order #{order.orderId.slice(0, 8).toUpperCase()}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.createdAt).toLocaleString()}
                              </p>
                            </div>

                            <span className="text-sm text-muted-foreground">
                              {open ? "▲" : "▼"}
                            </span>
                          </div>

                          {/* COLLAPSE CONTENT */}
                          <div
                            className={`transition-all duration-300 ease-in-out overflow-hidden ${
                              open
                                ? "max-h-[800px] opacity-100 mt-4"
                                : "max-h-0 opacity-0"
                            }`}
                          >
                            <div className="space-y-4">
                              {order.items
                                .filter((i) => i.rating || i.feedback)
                                .map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex justify-between items-center border rounded-xl p-4 bg-white"
                                  >
                                    <div className="flex items-center gap-4">
                                      <img
                                        src={
                                          item.imageUrl || "/placeholder.png"
                                        }
                                        alt={item.product.name}
                                        className="w-16 h-16 object-cover rounded-lg"
                                      />

                                      <div className="flex flex-col gap-1">
                                        <div>
                                          <p className="font-medium">
                                            {item.product.name}
                                          </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <span className="text-sm text-muted-foreground">
                                            Rating:
                                          </span>
                                          <RatingStars rating={item.rating} />
                                        </div>

                                        <div>
                                          <p className="text-sm text-gray-700">
                                            Feedback:
                                            <span className="ml-2 inline-block bg-blue-100 text-black px-2 py-1 rounded-full text-xs font-medium">
                                              {item.feedback || "No comment"}
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

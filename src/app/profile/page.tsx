// app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useProfile } from "@/contexts/ProfileContext";
import { useBuyerMessages } from "@/contexts/BuyerMessageContext";
import { useOrders } from "@/contexts/OrderContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import RegisterSellerDialog from "@/components/seller/RegisterSellerDialog";
import EditProfileModal from "@/components/EditProfileModal";
import AddressModal from "@/components/AddressModal";
import type { AddressData } from "@/components/AddressModal";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"; //  Added
import {
  User,
  MapPin,
  Edit,
  Package,
  Heart,
  MessageSquare,
  Star,
  Settings,
  Store,
  ShoppingCart,
  Trash2,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

const Profile = () => {
  const [activeTab, setActiveTab] = useState("orders");
  const { orders, isloading, error, fetchOrders } = useOrders();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const router = useRouter();
  const { sessions, refetchSessions } = useBuyerMessages();
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const { user, loading, refreshProfile } = useProfile();
  const [localUser, setLocalUser] = useState(user);
  const [reviewedItems, setReviewedItems] = useState<Record<string, boolean>>(
    {}
  );
  const [orderFilter, setOrderFilter] = useState<string>("All");

  useEffect(() => {
    if (user) {
      setLocalUser(user);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleRegisterSeller = async (sellerData: any) => {
    // Optimistic update
    setLocalUser((prev) =>
      prev
        ? {
            ...prev,
            isSeller: true,
          }
        : prev
    );

    // Background re-fetch
    await refreshProfile();
  };

  const handleEdited = (updatedFields: { location: string; phone: string }) => {
    setLocalUser((prev) => (prev ? { ...prev, ...updatedFields } : prev));
  };

  // Add this function to handle optimistic updates
  const handleAddressAdded = (newAddress: AddressData) => {
    setLocalUser((prev) =>
      prev
        ? { ...prev, addresses: [...(prev.addresses ?? []), newAddress] }
        : prev
    );
  };

  function calculateAge(dob?: string | null) {
    if (!dob) return null;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  //  Optional: gender symbol mapping
  const genderSymbol = (gender?: string) => {
    switch (gender?.toLowerCase()) {
      case "male":
        return "♂️";
      case "female":
        return "♀️";
      case "non-binary":
        return "⚧️";
      default:
        return "•"; // neutral symbol
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<AddressData | null>(null);

  const handleAddNew = () => {
    setAddressToEdit(null); // clear any previous data
    setIsModalOpen(true);
  };

  const handleEditAddress = (addr: AddressData) => {
    setAddressToEdit(addr);
    setIsModalOpen(true);
  };

  const handleSetRating = (itemId: string, star: number) => {
    setRatings((prev) => ({ ...prev, [itemId]: star }));
  };

  const handleSubmitReview = async (item: any) => {
    try {
      setSubmittingId(item.id);

      // Instant UI feedback (optimistic)
      setReviewedItems((prev) => ({ ...prev, [item.id]: true }));

      const res = await fetch("/api/review/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderItemId: item.id,
          productId: item.productId,
          rating: ratings[item.id],
          comment: comments[item.id],
        }),
      });

      if (!res.ok) throw new Error("Failed to submit review");

      toast.success("Review submitted successfully!");

      //  Re-sync with backend
      await fetchOrders();
    } catch (err) {
      console.error(" Review submission failed:", err);
      toast.error("Failed to submit review.");

      //  Roll back optimistic UI if failed
      setReviewedItems((prev) => ({ ...prev, [item.id]: false }));
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center text-muted-foreground">
        Loading profile...
      </div>
    );
  }

  if (!localUser) {
    return (
      <div className="min-h-screen flex justify-center items-center text-muted-foreground">
        No user data found.
      </div>
    );
  }

  const age = calculateAge(localUser.dob);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-20 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar */}
              <Avatar className="h-24 w-24 shrink-0">
                <AvatarImage
                  src={
                    localUser.avatar_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${localUser.full_name}`
                  }
                  alt={localUser.full_name}
                />
                <AvatarFallback>
                  <User className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>

              {/* User Info + Edit */}
              <div className="flex-1 w-full">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  {/* Left: Details */}
                  <div className="space-y-1">
                    {/* Name + gender */}
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                      {localUser.full_name}
                      {localUser.gender && (
                        <span className="text-muted-foreground text-xl">
                          {genderSymbol(localUser.gender)}
                        </span>
                      )}
                    </h1>

                    {/* Email */}
                    <p className="text-muted-foreground">{localUser.email}</p>

                    {/* Phone */}
                    {localUser.phone && (
                      <p className="text-muted-foreground">{localUser.phone}</p>
                    )}

                    {/* Age + Location */}
                    <div className="text-muted-foreground flex flex-wrap items-center gap-2 mt-1">
                      {age && <span>{age} years old</span>}
                      {localUser.location && (
                        <>
                          <span>•</span>
                          <span>{localUser.location}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: Edit Profile Button */}
                  <div className="shrink-0">
                    <EditProfileModal
                      user={localUser}
                      onEdited={handleEdited}
                    />
                  </div>
                </div>

                {/* Divider */}
                <Separator className="my-6" />

                {/* Saved Addresses */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Saved Addresses
                  </h3>

                  {localUser.addresses?.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {localUser.addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className="p-3 border rounded-lg flex justify-between items-start"
                        >
                          <div>
                            {addr.label && (
                              <Badge variant="default" className="mb-1">
                                {addr.label}
                              </Badge>
                            )}
                            <p className="text-sm text-muted-foreground leading-snug">
                              {addr.street}, {addr.city}, {addr.state}{" "}
                              {addr.postcode ?? ""}{" "}
                              {addr.country ? `(${addr.country})` : ""}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAddress(addr)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No addresses found.
                    </p>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={handleAddNew}
                  >
                    + Add New Address
                  </Button>
                </div>

                {/* Address Modal */}
                <AddressModal
                  userId={localUser.id}
                  open={isModalOpen}
                  onClose={() => setIsModalOpen(false)}
                  addressToEdit={addressToEdit}
                  onAdded={handleAddressAdded}
                />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Only show seller registration if not seller */}
        {!localUser.isSeller && (
          <Card className="mb-8 bg-linear-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="p-3 bg-background rounded-lg shrink-0 shadow-sm">
                    <Store className="h-7 w-7 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold mb-1">
                      Want to become a seller?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Start selling your products today
                    </p>
                  </div>
                </div>
                {localUser && (
                  <RegisterSellerDialog
                    userId={localUser.id}
                    onRegistered={handleRegisterSeller}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 lg:grid-cols-3 mb-8 px-2">
            <TabsTrigger value="orders">
              <Package className="mr-2 h-4 w-4" /> Orders
            </TabsTrigger>
            <TabsTrigger value="chats">
              <MessageSquare className="mr-2 h-4 w-4" /> Chats
            </TabsTrigger>
            <TabsTrigger value="reviews">
              <Star className="mr-2 h-4 w-4" /> Reviews
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="orders"
            className="space-y-4 min-h-[400px] lg:min-h-[540px]"
          >
            <Card>
              <CardHeader className="flex items-start justify-between px-7">
                <div>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Your latest customer orders</CardDescription>
                </div>

                {/* Status Filter */}
                <select
                  value={orderFilter}
                  onChange={(e) => {
                    setOrderFilter(e.target.value);
                    setShowAll(false); // reset view when filter changes
                  }}
                  className="px-3 py-2 border rounded-lg text-sm bg-white shadow-sm hover:border-gray-400 transition-colors"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Received">Received</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </CardHeader>

              <CardContent className="space-y-4 max-h-[800px] overflow-y-auto">
                {error && <p className="text-red-600">{error}</p>}

                {isloading ? (
                  <p>Loading orders...</p>
                ) : orders.length === 0 ? (
                  <p className="text-muted-foreground">No orders found.</p>
                ) : (
                  <>
                    {/* ========================= */}
                    {/* FILTER FIRST, THEN SLICE */}
                    {/* ========================= */}
                    {(() => {
                      // 1. Filter orders based on item status
                      const filteredOrders = orders.filter((order) =>
                        order.items.some(
                          (item) =>
                            orderFilter === "All" || item.status === orderFilter
                        )
                      );

                      console.log("Orders : ", orders);

                      // 2. Apply "Recent 3" or "View All"
                      const visibleOrders = showAll
                        ? filteredOrders
                        : filteredOrders.slice(0, 3);

                      if (filteredOrders.length === 0) {
                        return (
                          <p className="text-muted-foreground">
                            No orders found for selected status.
                          </p>
                        );
                      }

                      return (
                        <>
                          {visibleOrders.map((order) => {
                            // Filter items inside the order (same status)
                            const filteredItems = order.items.filter(
                              (item) =>
                                orderFilter === "All" ||
                                item.status === orderFilter
                            );

                            if (filteredItems.length === 0) return null;

                            const isOpen = expanded === order.id;

                            const allCompleted = order.items.every((i) =>
                              ["Received", "Cancelled"].includes(i.status)
                            );

                            return (
                              <div
                                key={order.id}
                                className="border rounded-lg p-4 transition-all"
                              >
                                {/* Order Header */}
                                <div
                                  className="flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer gap-2"
                                  onClick={() =>
                                    setExpanded(isOpen ? null : order.id)
                                  }
                                >
                                  <div>
                                    <h3 className="font-semibold">
                                      Order #
                                      {order.id.slice(0, 8).toUpperCase()}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(
                                        order.createdAt
                                      ).toLocaleString()}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      Total: RM {order.totalAmount.toFixed(2)}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className={
                                        allCompleted
                                          ? "bg-green-100 text-green-600 border-green-200"
                                          : "bg-yellow-100 text-yellow-700 border-yellow-300"
                                      }
                                    >
                                      {allCompleted
                                        ? "Completed"
                                        : "In Progress"}
                                    </Badge>

                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="text-muted-foreground"
                                    >
                                      {isOpen ? "▲" : "▼"}
                                    </Button>
                                  </div>
                                </div>

                                {/* Collapsible Items */}
                                <div
                                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                                    isOpen
                                      ? "max-h-[800px] opacity-100 mt-4"
                                      : "max-h-0 opacity-0"
                                  }`}
                                >
                                  <div className="space-y-3">
                                    {filteredItems.map((item) => (
                                      <div
                                        key={item.id}
                                        className="flex items-center justify-between border rounded-md p-3 bg-muted/50"
                                      >
                                        {/* LEFT: Product info */}
                                        <div className="flex items-center gap-3">
                                          <img
                                            src={
                                              item.imageUrl ||
                                              "/placeholder.png"
                                            }
                                            alt={item.name}
                                            className="w-16 h-16 object-cover rounded"
                                          />

                                          <div>
                                            <p className="font-medium">
                                              {item.name}
                                            </p>

                                            {item.attributes &&
                                              Object.keys(item.attributes)
                                                .length > 0 && (
                                                <p className="text-sm text-muted-foreground">
                                                  (
                                                  {Object.entries(
                                                    item.attributes
                                                  )
                                                    .map(
                                                      ([key, val]) =>
                                                        `${key}: ${val}`
                                                    )
                                                    .join(", ")}
                                                  )
                                                </p>
                                              )}

                                            <p className="text-sm text-muted-foreground">
                                              Qty: {item.quantity} × RM{" "}
                                              {item.price.toFixed(2)}
                                            </p>

                                            <Badge
                                              variant={
                                                item.status === "Delivered"
                                                  ? "default"
                                                  : "outline"
                                              }
                                              className="mt-2"
                                            >
                                              {item.status}
                                            </Badge>
                                          </div>
                                        </div>

                                        {/* RIGHT: Price + Contact Seller */}
                                        <div className="flex flex-col items-end gap-2">
                                          <p className="font-semibold flex">
                                            RM{" "}
                                            {(
                                              item.price * item.quantity
                                            ).toFixed(2)}
                                          </p>

                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={async (e) => {
                                              e.stopPropagation(); // ⛔ prevent collapsing order

                                              const res = await fetch(
                                                "/api/messages/start",
                                                {
                                                  method: "POST",
                                                  headers: {
                                                    "Content-Type":
                                                      "application/json",
                                                  },
                                                  body: JSON.stringify({
                                                    sellerId: item.sellerId,
                                                  }),
                                                }
                                              );

                                              const data = await res.json();

                                              if (data.sessionId) {
                                                await refetchSessions();
                                                router.push(
                                                  `/messages?seller=${encodeURIComponent(
                                                    item.sellerName ?? "seller"
                                                  )}`
                                                );
                                              }
                                            }}
                                          >
                                            Contact Seller
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {/* View All / Show Less */}
                          {filteredOrders.length > 3 && (
                            <div className="flex justify-center">
                              <Button
                                variant="outline"
                                onClick={() => setShowAll((prev) => !prev)}
                              >
                                {showAll ? "Show Less" : "View All Orders"}
                              </Button>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chatbot Interaction History */}
          <TabsContent
            value="chats"
            className="space-y-4 min-h-[400px] lg:min-h-[540px]"
          >
            <Card>
              <CardHeader>
                <CardTitle>Chat History</CardTitle>
                <CardDescription>
                  Your conversations with sellers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {sessions.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No active conversations found.
                  </p>
                ) : (
                  sessions.map((chat) => (
                    <div
                      key={chat.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {chat.sellerName
                              ? chat.sellerName[0].toUpperCase()
                              : "S"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{chat.sellerName}</h4>
                          {/* Show latest message if available */}
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {chat.messages?.length
                              ? chat.messages[chat.messages.length - 1].content
                              : "No messages yet"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {chat.messages?.length
                              ? new Date(
                                  chat.messages[
                                    chat.messages.length - 1
                                  ].createdAt
                                ).toLocaleDateString()
                              : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {chat.unreadCount > 0 && (
                          <Badge variant="default">
                            {chat.unreadCount} new
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/messages?seller=${encodeURIComponent(
                                chat.sellerName
                              )}`
                            )
                          }
                        >
                          Continue Chat
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Review & Feedback Section */}
          <TabsContent
            value="reviews"
            className="space-y-4 min-h-[400px] lg:min-h-[540px]"
          >
            <Card>
              <CardHeader>
                <CardTitle>My Reviews</CardTitle>
                <CardDescription>
                  Rate products that you have received
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 max-h-[800px] overflow-y-auto">
                {isloading ? (
                  <p>Loading reviews...</p>
                ) : orders.length === 0 ? (
                  <p className="text-muted-foreground">No orders found.</p>
                ) : (
                  orders.map((order) => {
                    // Filter only items that are received
                    const receivedItems = order.items.filter(
                      (item) => item.status === "Received"
                    );

                    if (receivedItems.length === 0) return null; // Skip if none are received

                    const isOpen = expanded === order.id;

                    return (
                      <div
                        key={order.id}
                        className="border rounded-lg p-4 transition-all"
                      >
                        {/*  Order Header */}
                        <div
                          className="flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer gap-2"
                          onClick={() => setExpanded(isOpen ? null : order.id)}
                        >
                          <div>
                            <h3 className="font-semibold">
                              Order #{order.id.slice(0, 8).toUpperCase()}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="default">Received Items</Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-muted-foreground"
                            >
                              {isOpen ? "▲" : "▼"}
                            </Button>
                          </div>
                        </div>

                        {/*  Collapsible Review Items */}
                        <div
                          className={`transition-all overflow-hidden ${
                            isOpen ? "max-h-[600px] mt-4" : "max-h-0"
                          }`}
                        >
                          <div className="space-y-3">
                            {receivedItems.map((item) => (
                              <div
                                key={item.id}
                                className="flex flex-col md:flex-row justify-between border rounded-md p-3 bg-muted/50"
                              >
                                {/* Product Info */}
                                <div className="flex items-center gap-3 flex-1">
                                  <img
                                    src={item.imageUrl || "/placeholder.png"}
                                    alt={item.name}
                                    className="w-16 h-16 object-cover rounded"
                                  />
                                  <div>
                                    <p className="font-medium">
                                      {item.name}

                                      {/* Show selected attributes, if any */}
                                      {item.attributes &&
                                        Object.keys(item.attributes).length >
                                          0 && (
                                          <span className="text-sm text-muted-foreground ml-1">
                                            (
                                            {Object.entries(item.attributes)
                                              .map(
                                                ([key, val]) => `${key}: ${val}`
                                              )
                                              .join(", ")}
                                            )
                                          </span>
                                        )}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Received on:{" "}
                                      {item.receivedAt
                                        ? new Date(
                                            item.receivedAt
                                          ).toLocaleDateString()
                                        : "N/A"}
                                    </p>
                                  </div>
                                </div>

                                {/* Rating + Comment */}
                                <div className="flex-1 mt-3 md:mt-0 md:text-right">
                                  {/* CASE 1: No existing review → show editable form */}
                                  {!item.rating && !item.feedback ? (
                                    <>
                                      {/* Editable Stars */}
                                      <div className="flex justify-end gap-1 mb-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star
                                            key={star}
                                            onClick={() =>
                                              handleSetRating(item.id, star)
                                            }
                                            className={`h-5 w-5 cursor-pointer ${
                                              ratings[item.id] >= star
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-gray-300"
                                            }`}
                                          />
                                        ))}
                                      </div>

                                      {/* Textarea for feedback */}
                                      <textarea
                                        placeholder="Write a review..."
                                        className="w-full border rounded-md p-2 text-sm text-gray-700 resize-none mt-1"
                                        rows={3}
                                        value={comments[item.id] || ""}
                                        onChange={(e) =>
                                          setComments((prev) => ({
                                            ...prev,
                                            [item.id]: e.target.value,
                                          }))
                                        }
                                      />

                                      {/* Action Buttons */}
                                      <div className="flex justify-end gap-2 mt-3">
                                        <Button
                                          size="sm"
                                          onClick={() =>
                                            handleSubmitReview(item)
                                          }
                                          disabled={
                                            !ratings[item.id] ||
                                            submittingId === item.id
                                          }
                                        >
                                          {submittingId === item.id
                                            ? "Submitting..."
                                            : "Submit"}
                                        </Button>
                                      </div>
                                    </>
                                  ) : (
                                    /* CASE 2: Review already exists → show readonly view */
                                    <div className="bg-muted/40 border rounded-md p-3 text-left md:text-right">
                                      {/* Display saved stars */}
                                      <div className="flex justify-end gap-1 mb-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star
                                            key={star}
                                            className={`h-5 w-5 ${
                                              star <= (item.rating ?? 0)
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-gray-300"
                                            }`}
                                          />
                                        ))}
                                      </div>

                                      {/* Display saved feedback */}
                                      {item.feedback ? (
                                        <p className="text-sm text-gray-700 italic border-t pt-2">
                                          “{item.feedback}”
                                        </p>
                                      ) : (
                                        <p className="text-sm text-muted-foreground italic">
                                          No feedback given
                                        </p>
                                      )}
                                    </div>
                                  )}
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
};

export default Profile;

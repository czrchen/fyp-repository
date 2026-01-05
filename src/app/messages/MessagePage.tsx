"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Search } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { useBuyerMessages } from "@/contexts/BuyerMessageContext";
import { useOrders } from "@/contexts/OrderContext";
import ProductSelectionModal, {
  ProductSelectionResult,
} from "@/components/ProductSelectionModal";
import ConfirmChatbotActionModal from "@/components/ConfirmChatbotActionModal";
import { useCart } from "@/contexts/CartContext";
import CheckoutModal from "@/components/CheckoutModal";
import { send } from "process";
import { toast } from "sonner";

type ChatbotOrder = {
  orderId: string;
  productId: string;
  productName: string;
  imageUrl?: string | null;
  attributes?: Record<string, any> | null;
  status: string;
  deliveredAt?: string | null;
  estimatedDays?: number | null;
};

type RecommendedProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  tags: string[];
  attributes: any;
  ratingAvg: number;
  ratingCount: number;
  brand?: string;
  category?: string;
  stock: number;
  sellerId: string;
  sellerName: string;
  // optional variants field for TS
  variant?: any[];
};

type CartSelectableProduct = {
  id: string;
  productId: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl: string | null;
  tags?: string[];
  attributes: any;
  ratingAvg?: number;
  ratingCount?: number;
  brand?: string;
  category?: string;
  stock?: number;
  sellerId: string;
  sellerName: string;
  variant?: any[];
  quantity: number;
};

type BotMessageType =
  | "text"
  | "product_list"
  | "order_list"
  | "order_detail"
  | "cart_list"
  | "status_update";

// Small helper: group flat order items into orderId → items[]
function groupOrdersById(items: ChatbotOrder[]) {
  const grouped: Record<string, ChatbotOrder[]> = {};
  for (const item of items) {
    if (!grouped[item.orderId]) grouped[item.orderId] = [];
    grouped[item.orderId].push(item);
  }
  return grouped;
}

export default function MessagesPage() {
  const {
    sessions,
    activeSession,
    setActiveSession,
    sendMessage,
    markSessionAsRead,
  } = useBuyerMessages();

  const router = useRouter();
  const { orders } = useOrders();
  const { items, addToCart, fetchCart } = useCart();
  const [orderListPage, setOrderListPage] = useState<Record<string, number>>(
    {}
  );
  const [productListPage, setProductListPage] = useState<
    Record<string, number>
  >({});

  // messageId -> { productId -> selection }
  const [selectedProducts, setSelectedProducts] = useState<
    Record<string, Record<string, ProductSelectionResult>>
  >({});
  const [selectedCartProducts, setSelectedCartProducts] = useState<
    Record<string, Record<string, CartSelectableProduct>>
  >({});
  const [checkoutCart, setCheckoutCart] = useState(false);

  const [selectionModal, setSelectionModal] = useState<{
    open: boolean;
    messageId: string | null;
    product: RecommendedProduct | null;
  }>({
    open: false,
    messageId: null,
    product: null,
  });

  const [confirmAction, setConfirmAction] = useState<{
    open: boolean;
    type: "add" | "checkout" | null;
    messageId: string | null;
  }>({
    open: false,
    type: null,
    messageId: null,
  });
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFaqs, setShowFaqs] = useState(false);
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([]);
  const [isChatbotMode, setIsChatbotMode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingRef = useRef(false);

  const searchParams = useSearchParams();
  const sellerName = searchParams.get("seller");

  useEffect(() => {
    fetchCart();
  }, []);

  useEffect(() => {
    if (!sellerName) return;

    // ... use sellerName logic here ...

    // Remove ?seller=xxx
    const params = new URLSearchParams(window.location.search);
    params.delete("seller");

    if (params.toString()) {
      router.replace(`${window.location.pathname}?${params.toString()}`);
    } else {
      router.replace(window.location.pathname);
    }
  }, [sellerName]);

  // Scroll ref
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (!scrollRef.current) return;
    const viewport = scrollRef.current.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLDivElement | null;
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessions, activeSession?.id]);

  // Auto-select session from ?seller=name
  useEffect(() => {
    if (!sellerName || sessions.length === 0) return;

    const match = sessions.find(
      (s) => s.sellerName.toLowerCase() === sellerName.toLowerCase()
    );

    if (!match) return;

    if (activeSession?.id !== match.id) {
      setActiveSession(match.id);
    }

    if (match.unreadCount && match.unreadCount > 0) {
      markSessionAsRead(match.id);
    }

    setTimeout(scrollToBottom, 150);
  }, [
    sellerName,
    sessions,
    activeSession?.id,
    setActiveSession,
    markSessionAsRead,
  ]);

  // Orders for this seller (used by chatbot API)
  const sellerOrders = useMemo(() => {
    if (!activeSession) return [];
    return orders.flatMap((order) =>
      order.items
        .filter((i) => i.sellerId === activeSession.sellerId)
        .map((i) => ({
          orderId: order.id,
          productId: i.productId,
          productName: i.name,
          imageUrl: i.imageUrl,
          attributes: i.attributes,
          status: i.status,
          deliveredAt: i.deliveredAt,
          estimatedDays: i.estimatedDays,
        }))
    );
  }, [orders, activeSession?.sellerId]);

  // Messages for active session
  const currentMessages =
    sessions.find((s) => s.id === activeSession?.id)?.messages || [];

  // Group by date for day dividers
  const groupedMessages = currentMessages.reduce((groups, message: any) => {
    const date = format(new Date(message.createdAt), "yyyy-MM-dd");
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {} as Record<string, any[]>);

  // Filter sessions by seller name
  const filteredSessions = sessions.filter((session) =>
    session.sellerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /**
   * Core helper: send a question to chatbot, handle different response types,
   * and save bot messages (text / product_list / order_list / order_detail).
   */
  const askChatbot = async (content: string) => {
    if (!activeSession) return;

    if (!typingRef.current) {
      typingRef.current = true;
      setIsTyping(true);
    }

    try {
      const res = await fetch(`/api/chatbot/${activeSession.sellerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: content,
          orders: sellerOrders,
          cart: items,
        }),
      });

      const data = await res.json();

      const type: BotMessageType = data.type ?? "text";
      const payload = data.payload ?? null;
      const textContent: string =
        data.content ??
        data.answer ?? // backward compatibility
        "";

      if (type === "text") {
        if (textContent) {
          await sendMessage(
            activeSession.id,
            textContent,
            "chatbot",
            true,
            "text",
            null
          );
        }
      } else if (type === "product_list") {
        await sendMessage(
          activeSession.id,
          textContent || "Here are some products you might like:",
          "chatbot",
          true,
          "product_list",
          payload
        );
      } else if (type === "order_list") {
        await sendMessage(
          activeSession.id,
          textContent || "Here are your relevant orders:",
          "chatbot",
          true,
          "order_list",
          payload
        );
      } else if (type === "order_detail") {
        await sendMessage(
          activeSession.id,
          textContent || "Here are the details for this order:",
          "chatbot",
          true,
          "order_detail",
          payload
        );
      } else if (type === "cart_list") {
        await sendMessage(
          activeSession.id,
          textContent || "Here are the cart's items:",
          "chatbot",
          true,
          "cart_list",
          payload
        );
      }
    } catch (error) {
      toast.error(`AI reply failed: ${error}`);
      await sendMessage(
        activeSession.id,
        "Sorry, I'm having trouble answering right now. Please try again or contact the seller.",
        "chatbot",
        true,
        "text",
        null
      );
    } finally {
      typingRef.current = false;
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    if (!messageText.trim() || !activeSession) return;
    const content = messageText.trim();
    setMessageText("");

    if (isChatbotMode) {
      await sendMessage(activeSession.id, content, "buyer", true, "text", null);
      await askChatbot(content);
    } else {
      await sendMessage(
        activeSession.id,
        content,
        "buyer",
        false,
        "text",
        null
      );
    }
  };

  // When clicking an order card inside an "order_list" bubble
  const handleOrderClick = async (orderId: string) => {
    if (!activeSession) return;
    const question = `Order ${orderId}`;
    await sendMessage(activeSession.id, question, "buyer", true, "text", null);
    await askChatbot(question);
  };

  /** Product selection helpers **/

  const openSelectionModal = (
    messageId: string,
    product: RecommendedProduct
  ) => {
    setSelectionModal({
      open: true,
      messageId,
      product,
    });
  };

  const handleSelectionConfirm = (selection: ProductSelectionResult) => {
    if (!selectionModal.messageId) return;
    const messageId = selectionModal.messageId;

    setSelectedProducts((prev) => ({
      ...prev,
      [messageId]: {
        ...(prev[messageId] ?? {}),
        [selection.productId]: selection,
      },
    }));

    setSelectionModal({
      open: false,
      messageId: null,
      product: null,
    });
  };

  const handleSelectionClose = () => {
    setSelectionModal({
      open: false,
      messageId: null,
      product: null,
    });
  };

  // Toggle checkbox: if already selected → unselect, otherwise open modal
  const toggleProductSelection = (
    messageId: string,
    product: RecommendedProduct,
    isSelected: boolean
  ) => {
    if (isSelected) {
      // unselect
      setSelectedProducts((prev) => {
        const msgSelections = { ...(prev[messageId] ?? {}) };
        delete msgSelections[product.id];

        if (Object.keys(msgSelections).length === 0) {
          const copy = { ...prev };
          delete copy[messageId];
          return copy;
        }

        return {
          ...prev,
          [messageId]: msgSelections,
        };
      });
    } else {
      // need to choose variant/attributes first
      openSelectionModal(messageId, product);
    }
  };

  const toggleCartSelection = (
    messageId: string,
    item: CartSelectableProduct,
    isSelected: boolean
  ) => {
    setSelectedCartProducts((prev) => {
      const msgSelections = { ...(prev[messageId] ?? {}) };

      if (isSelected) {
        // Unselect
        delete msgSelections[item.id];

        // If empty, remove message entry
        if (Object.keys(msgSelections).length === 0) {
          const copy = { ...prev };
          delete copy[messageId];
          return copy;
        }

        return {
          ...prev,
          [messageId]: msgSelections,
        };
      }

      // Select directly (no modal)
      return {
        ...prev,
        [messageId]: {
          ...msgSelections,
          [item.id]: item,
        },
      };
    });
  };

  const isOutOfStock = (item: ProductSelectionResult) => {
    const availableStock = item.variantStock ?? (item as any)?.stock ?? 0;

    const qty = item.quantity ?? 1;

    return availableStock < qty;
  };

  const handleAddToCart = async (messageId: string) => {
    const selections = selectedProducts[messageId];
    if (!selections || !activeSession) return;

    const items = Object.values(selections);

    // Frontend stock guard
    const outOfStockItems = items.filter(isOutOfStock);
    if (outOfStockItems.length > 0) {
      await sendMessage(
        activeSession.id,
        "Some items exceed available stock. Please adjust quantity or selection.",
        "chatbot",
        true,
        "text",
        null
      );
      return;
    }

    for (const item of items) {
      try {
        /* ---------- BACKEND FIRST ---------- */
        const res = await fetch("/api/cart/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: item.productId,
            variantId: item.variantId,
            attributes: item.selectedAttributes ?? null,
            quantity: item.quantity ?? 1,
            price: item.price,
            image: item.imageUrl,
            sellerId: item.sellerId,
            sellerName: item.sellerName,
          }),
        });

        const data = await res.json();

        /* ---------- HANDLE STOCK ERROR ---------- */
        if (!res.ok) {
          if (res.status === 400 && data?.availableStock !== undefined) {
            await sendMessage(
              activeSession.id,
              `Only ${data.availableStock} item(s) left in stock for "${item.name}".`,
              "chatbot",
              true,
              "text",
              null
            );
          } else {
            await sendMessage(
              activeSession.id,
              "Failed to add item to cart. Please try again.",
              "chatbot",
              true,
              "text",
              null
            );
          }
          continue; // do NOT update local cart
        }

        /* ---------- LOCAL CART SYNC ---------- */
        addToCart({
          id: crypto.randomUUID(),
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          price: item.price,
          image: item.imageUrl,
          sellerId: item.sellerId,
          sellerName: item.sellerName,
          product: {
            id: item.productId,
            name: item.name,
            imageUrl: item.imageUrl,
            price: item.price,
            attributes: item.selectedAttributes ?? {},
          },
        });

        /* ---------- EVENT LOG ---------- */
        await fetch("/api/eventlog/addCart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: item.productId,
            brandId: item.brand,
            categoryId: item.category,
            price: item.price,
            userSession: localStorage.getItem("sessionId") || "guest",
          }),
        });

        await sendMessage(
          activeSession.id,
          `"${item.name}" added to your cart.`,
          "chatbot",
          false,
          "text",
          null
        );
      } catch (err) {
        toast.error(`Cart add failed: ${err}`);

        await sendMessage(
          activeSession.id,
          "Network error while adding to cart. Please try again.",
          "chatbot",
          true,
          "text",
          null
        );
      }
    }

    await fetchCart(); // final sync
  };

  const handleCheckout = async (messageId: string) => {
    const selections = selectedProducts[messageId];
    if (!selections) return;

    const items = Object.values(selections);

    // Transform items for CheckoutModal
    const prepared = items.map((item) => ({
      id: crypto.randomUUID(), // temporary cart item id
      productId: item.productId,
      variantId: item.variantId,
      name: item.variantName ?? item.name,
      price: item.finalPrice ?? item.price,
      imageUrl: item.variantImage ?? item.imageUrl,
      attributes: item.selectedAttributes ?? {},
      quantity: item.quantity ?? 1,
      sellerId: item.sellerId,
      sellerName: item.sellerName,
    }));

    setCheckoutItems(prepared);
    setCheckoutOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-18 py-4">
        <h1 className="text-3xl font-bold mb-4 text-foreground">Messages</h1>

        <Card className="p-0">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-3 h-[665px]">
              {/* LEFT: Seller list */}
              <div className="border-r border-border">
                <div className="p-4 border-b border-border">
                  <div className="relative flex items-center">
                    <Search
                      className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none"
                      style={{ top: "50%", transform: "translateY(-50%)" }}
                    />
                    <Input
                      placeholder="Search sellers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 py-2 text-sm"
                    />
                  </div>
                </div>

                <ScrollArea className="h-[540px]">
                  {filteredSessions.length > 0 ? (
                    filteredSessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={async () => {
                          setActiveSession(session.id);
                          setTimeout(scrollToBottom, 100);
                          if (session.unreadCount > 0) {
                            await markSessionAsRead(session.id);
                          }
                          setFaqs([]);
                          setShowFaqs(false);
                        }}
                        className={`p-4 border-b border-border cursor-pointer hover:bg-muted transition-smooth ${
                          activeSession?.id === session.id ? "bg-muted" : ""
                        }`}
                      >
                        <div className="flex gap-3 items-center justify-between">
                          <div className="flex gap-3 items-center">
                            <Avatar>
                              <AvatarImage
                                src={session.sellerLogo}
                                alt={session.sellerName}
                              />
                              <AvatarFallback>
                                {session.sellerName?.[0] ?? "B"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm truncate">
                                {session.sellerName ?? "Unknown Buyer"}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {session.isActive ? "Active" : "Offline"}
                              </p>
                            </div>
                          </div>

                          {session.unreadCount > 0 && (
                            <span className="bg-blue-500 text-white text-[10px] font-semibold px-2 py-1 rounded-full min-w-[20px] text-center">
                              {session.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-sm text-muted-foreground">
                      No buyers found.
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* RIGHT: Chat window */}
              <div className="md:col-span-2 flex flex-col h-[665px]">
                {activeSession ? (
                  <>
                    {/* Header */}
                    <div className="p-3 border-b border-border flex items-center gap-3 shrink-0">
                      <Avatar>
                        <AvatarImage
                          src={activeSession.sellerLogo}
                          alt={activeSession.sellerName}
                        />
                        <AvatarFallback>
                          {activeSession.sellerName?.[0] ?? "B"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">
                          {activeSession.sellerName ?? "Unknown Buyer"}
                        </h3>
                        <p className="text-xs text-success">Active now</p>
                      </div>
                    </div>

                    {/* Messages */}
                    <ScrollArea
                      ref={scrollRef}
                      className="flex-1 p-3 overflow-y-auto bg-cover"
                    >
                      <div className="space-y-6">
                        {Object.entries(groupedMessages).map(
                          ([date, messages]) => (
                            <div key={date}>
                              {/* Date divider */}
                              <div className="text-center text-xs text-muted-foreground mb-3">
                                {isToday(new Date(date))
                                  ? "Today"
                                  : isYesterday(new Date(date))
                                  ? "Yesterday"
                                  : format(new Date(date), "d MMM yyyy")}
                              </div>

                              {/* Message list */}
                              <div className="space-y-2">
                                {messages.map((m: any) => {
                                  const isBuyer = m.senderType === "buyer";
                                  const messageType: BotMessageType =
                                    m.messageType ?? "text";

                                  let bubbleContent: React.ReactNode = null;

                                  if (
                                    messageType === "product_list" &&
                                    Array.isArray(m.payload)
                                  ) {
                                    const products =
                                      m.payload as RecommendedProduct[];

                                    const PRODUCTS_PER_PAGE = 2;
                                    const totalPages = Math.ceil(
                                      products.length / PRODUCTS_PER_PAGE
                                    );

                                    const page = productListPage[m.id] ?? 0;

                                    const setPage = (newPage: number) => {
                                      setProductListPage((prev) => ({
                                        ...prev,
                                        [m.id]: newPage,
                                      }));
                                    };

                                    const start = page * PRODUCTS_PER_PAGE;
                                    const currentProducts = products.slice(
                                      start,
                                      start + PRODUCTS_PER_PAGE
                                    );

                                    const selectedInThisMessage =
                                      selectedProducts[m.id] ?? {};
                                    const hasSelection =
                                      Object.keys(selectedInThisMessage)
                                        .length > 0;

                                    bubbleContent = (
                                      <div className="space-y-3">
                                        {m.content && (
                                          <p className="text-[14px] mb-1">
                                            {m.content}
                                          </p>
                                        )}

                                        {/* Product Cards */}
                                        <div className="grid grid-cols-1 gap-3 mb-2 min-h-[290px] min-w-[550px] content-start">
                                          {currentProducts.map((product) => {
                                            // Selection data (comes from ProductSelectionModal)
                                            const selection =
                                              (selectedInThisMessage[
                                                product.id
                                              ] as
                                                | ProductSelectionResult
                                                | undefined) ?? undefined;

                                            const isSelected =
                                              Boolean(selection);

                                            // Decide what to show on the card, based on selection
                                            const displayImage =
                                              selection?.imageUrl ??
                                              product.imageUrl ??
                                              "";

                                            const displayPrice =
                                              typeof selection?.finalPrice ===
                                              "number"
                                                ? selection.finalPrice
                                                : product.price;

                                            const displayStock =
                                              (selection as any)
                                                ?.variantStock ??
                                              (selection as any)?.stock ??
                                              product.stock;

                                            const variantLabel =
                                              selection?.variantName ||
                                              (selection as any)?.variantLabel;

                                            const selectedAttrsRaw =
                                              selection?.selectedAttributes ||
                                              (selection as any)?.attributes ||
                                              (selection as any)?.selectedAttrs;

                                            const attrSummary =
                                              selectedAttrsRaw &&
                                              Object.keys(selectedAttrsRaw)
                                                .length > 0
                                                ? Object.entries(
                                                    selectedAttrsRaw
                                                  )
                                                    .map(
                                                      ([key, val]) =>
                                                        `${key}: ${
                                                          val as string
                                                        }`
                                                    )
                                                    .join(", ")
                                                : null;

                                            const quantity =
                                              typeof selection?.quantity ===
                                              "number"
                                                ? selection.quantity
                                                : undefined;

                                            return (
                                              <div
                                                key={product.id}
                                                className="flex gap-3 p-3 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                                              >
                                                {/* Checkbox */}
                                                <div className="flex items-start pt-1">
                                                  <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={(e) => {
                                                      e.stopPropagation();
                                                      toggleProductSelection(
                                                        m.id,
                                                        product,
                                                        isSelected
                                                      );
                                                    }}
                                                    className="h-4 w-4 cursor-pointer"
                                                  />
                                                </div>

                                                {/* Card body clickable to open product page */}
                                                <div
                                                  className="flex flex-1 gap-3 cursor-pointer"
                                                  onClick={() =>
                                                    window.open(
                                                      `/product/${product.id}`,
                                                      "_blank"
                                                    )
                                                  }
                                                >
                                                  <Avatar className="h-16 w-16 rounded-md shrink-0">
                                                    <AvatarImage
                                                      src={displayImage}
                                                      alt={product.name}
                                                    />
                                                    <AvatarFallback>
                                                      {product.name[0]}
                                                    </AvatarFallback>
                                                  </Avatar>

                                                  <div className="flex flex-col flex-1 min-w-0">
                                                    <h4 className="font-semibold text-sm line-clamp-2">
                                                      {product.name}
                                                    </h4>

                                                    {/*  Variant + attributes + qty line (only when selected) */}
                                                    {isSelected &&
                                                      (variantLabel ||
                                                        attrSummary ||
                                                        quantity) && (
                                                        <p className="mt-1 text-[11px] text-muted-foreground">
                                                          {variantLabel && (
                                                            <span className="font-medium">
                                                              {variantLabel}
                                                            </span>
                                                          )}

                                                          {variantLabel &&
                                                            (attrSummary ||
                                                              quantity) &&
                                                            " · "}

                                                          {attrSummary && (
                                                            <span>
                                                              {attrSummary}
                                                            </span>
                                                          )}

                                                          {quantity && (
                                                            <>
                                                              {(variantLabel ||
                                                                attrSummary) &&
                                                                " · "}
                                                              <span>
                                                                Qty: {quantity}
                                                              </span>
                                                            </>
                                                          )}
                                                        </p>
                                                      )}

                                                    {/* Description (when not selected or still useful) */}
                                                    {product.description && (
                                                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                                        {product.description}
                                                      </p>
                                                    )}

                                                    {/* Price + Stock (uses selection if exists) */}
                                                    <div className="mt-2 flex items-center justify-between">
                                                      <span className="text-sm font-bold text-primary">
                                                        RM{" "}
                                                        {displayPrice.toFixed(
                                                          2
                                                        )}
                                                      </span>

                                                      <span className="text-xs font-medium text-green-600">
                                                        {displayStock > 0
                                                          ? `In stock (${displayStock})`
                                                          : "Out of stock"}
                                                      </span>
                                                    </div>

                                                    {/* Tags */}
                                                    {product.tags?.length >
                                                      0 && (
                                                      <div className="mt-2 flex flex-wrap gap-1">
                                                        {product.tags
                                                          .slice(0, 3)
                                                          .map((tag, idx) => (
                                                            <span
                                                              key={idx}
                                                              className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-full text-gray-600"
                                                            >
                                                              {tag}
                                                            </span>
                                                          ))}
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>

                                        {/* Pagination Controls */}
                                        {totalPages > 1 && (
                                          <div className="flex items-center justify-center gap-3 pt-2">
                                            {/* Prev */}
                                            <button
                                              disabled={page === 0}
                                              onClick={() => setPage(page - 1)}
                                              className="flex items-center justify-center h-8 w-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
                                            >
                                              <svg
                                                className="h-4 w-4 text-gray-600"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M15 19l-7-7 7-7"
                                                />
                                              </svg>
                                            </button>

                                            {/* Page dots */}
                                            <div className="flex gap-1.5">
                                              {Array.from({
                                                length: totalPages,
                                              }).map((_, idx) => (
                                                <button
                                                  key={idx}
                                                  onClick={() => setPage(idx)}
                                                  className={`h-2 rounded-full transition-all ${
                                                    idx === page
                                                      ? "w-6 bg-primary"
                                                      : "w-2 bg-gray-300 hover:bg-gray-400"
                                                  }`}
                                                />
                                              ))}
                                            </div>

                                            {/* Next */}
                                            <button
                                              disabled={page >= totalPages - 1}
                                              onClick={() => setPage(page + 1)}
                                              className="flex items-center justify-center h-8 w-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
                                            >
                                              <svg
                                                className="h-4 w-4 text-gray-600"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M9 5l7 7-7 7"
                                                />
                                              </svg>
                                            </button>
                                          </div>
                                        )}

                                        {/* Action buttons if any product selected */}
                                        {hasSelection && (
                                          <div className="mt-2 flex flex-wrap gap-2">
                                            <Button
                                              size="sm"
                                              className="cursor-pointer"
                                              onClick={() =>
                                                setConfirmAction({
                                                  open: true,
                                                  type: "add",
                                                  messageId: m.id,
                                                })
                                              }
                                            >
                                              Add selected to cart
                                            </Button>
                                            <Button
                                              size="sm"
                                              className="cursor-pointer"
                                              variant="outline"
                                              onClick={() =>
                                                setConfirmAction({
                                                  open: true,
                                                  type: "checkout",
                                                  messageId: m.id,
                                                })
                                              }
                                            >
                                              Checkout selected
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  } else if (
                                    messageType === "order_list" &&
                                    Array.isArray(m.payload)
                                  ) {
                                    const flatOrders =
                                      m.payload as ChatbotOrder[];
                                    const grouped = groupOrdersById(flatOrders);

                                    const ORDERS_PER_PAGE = 4;
                                    const orderIds = Object.keys(grouped);
                                    const totalPages = Math.ceil(
                                      orderIds.length / ORDERS_PER_PAGE
                                    );

                                    const page = orderListPage[m.id] ?? 0;

                                    const setPage = (newPage: number) => {
                                      setOrderListPage((prev) => ({
                                        ...prev,
                                        [m.id]: newPage,
                                      }));
                                    };

                                    const start = page * ORDERS_PER_PAGE;
                                    const currentOrderIds = orderIds.slice(
                                      start,
                                      start + ORDERS_PER_PAGE
                                    );

                                    bubbleContent = (
                                      <div className="space-y-3 mb-2">
                                        {m.content && (
                                          <p className="text-[14px] mb-2">
                                            {m.content}
                                          </p>
                                        )}

                                        {/* Orders List - Paginated */}
                                        <div className="space-y-2 mb-2 min-h-[230px]">
                                          {currentOrderIds.map((orderId) => {
                                            const items = grouped[orderId];
                                            const remaining = items.length - 1;

                                            return (
                                              <button
                                                key={orderId}
                                                type="button"
                                                onClick={() =>
                                                  handleOrderClick(orderId)
                                                }
                                                className="w-full flex items-center justify-between px-3 py-2 border rounded-lg bg-white text-left hover:shadow-sm transition-shadow"
                                              >
                                                <div className="flex flex-col items-start">
                                                  <span className="text-xs font-semibold">
                                                    {orderId}
                                                  </span>
                                                  <span className="text-[11px] text-muted-foreground line-clamp-1">
                                                    {items
                                                      .map((i) => i.productName)
                                                      .join(", ")}
                                                  </span>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                  {items
                                                    .slice(0, 2)
                                                    .map((i, idx) => (
                                                      <Avatar
                                                        key={`${i.productId}-${idx}`}
                                                        className="h-6 w-6 border border-border"
                                                      >
                                                        <AvatarImage
                                                          src={i.imageUrl ?? ""}
                                                          alt={i.productName}
                                                        />
                                                        <AvatarFallback>
                                                          {i.productName?.[0] ??
                                                            "P"}
                                                        </AvatarFallback>
                                                      </Avatar>
                                                    ))}
                                                  {remaining > 1 && (
                                                    <span className="text-[10px] text-muted-foreground">
                                                      +{remaining - 1} more
                                                    </span>
                                                  )}
                                                </div>
                                              </button>
                                            );
                                          })}
                                        </div>

                                        {/* Pagination Controls */}
                                        {totalPages > 1 && (
                                          <div className="flex items-center justify-center gap-3 pt-3">
                                            <button
                                              disabled={page === 0}
                                              onClick={() => setPage(page - 1)}
                                              className="flex items-center justify-center h-8 w-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
                                            >
                                              <svg
                                                className="w-4 h-4 text-gray-600"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M15 19l-7-7 7-7"
                                                />
                                              </svg>
                                            </button>

                                            <div className="flex gap-1.5">
                                              {Array.from({
                                                length: totalPages,
                                              }).map((_, idx) => (
                                                <button
                                                  key={idx}
                                                  onClick={() => setPage(idx)}
                                                  className={`h-2 rounded-full transition-all ${
                                                    idx === page
                                                      ? "w-6 bg-primary"
                                                      : "w-2 bg-gray-300 hover:bg-gray-400"
                                                  }`}
                                                />
                                              ))}
                                            </div>

                                            <button
                                              disabled={page >= totalPages - 1}
                                              onClick={() => setPage(page + 1)}
                                              className="flex items-center justify-center h-8 w-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
                                            >
                                              <svg
                                                className="w-4 h-4 text-gray-600"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M9 5l7 7-7 7"
                                                />
                                              </svg>
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  } else if (
                                    messageType === "order_detail" &&
                                    Array.isArray(m.payload)
                                  ) {
                                    const items = m.payload as ChatbotOrder[];

                                    const DETAILS_PER_PAGE = 3;
                                    const totalPages = Math.ceil(
                                      items.length / DETAILS_PER_PAGE
                                    );

                                    const page = orderListPage[m.id] ?? 0;

                                    const setPage = (newPage: number) => {
                                      setOrderListPage((prev) => ({
                                        ...prev,
                                        [m.id]: newPage,
                                      }));
                                    };

                                    const start = page * DETAILS_PER_PAGE;
                                    const currentItems = items.slice(
                                      start,
                                      start + DETAILS_PER_PAGE
                                    );

                                    bubbleContent = (
                                      <div className="space-y-3 mb-2">
                                        {m.content && (
                                          <p className="text-[14px] mb-1">
                                            {m.content}
                                          </p>
                                        )}

                                        <div
                                          className={`space-y-2 mb-2 ${
                                            totalPages > 1
                                              ? "min-h-[240px]"
                                              : ""
                                          }`}
                                        >
                                          {currentItems.map((item, idx) => (
                                            <div
                                              key={idx}
                                              className="flex gap-3 p-3 border rounded-lg bg-white shadow-sm"
                                            >
                                              <Avatar className="h-12 w-12 rounded-md">
                                                <AvatarImage
                                                  src={item.imageUrl ?? ""}
                                                />
                                                <AvatarFallback>
                                                  P
                                                </AvatarFallback>
                                              </Avatar>

                                              <div className="flex flex-col justify-between text-sm">
                                                <p className="font-medium">
                                                  {item.productName}
                                                </p>

                                                {item.attributes && (
                                                  <p className="text-xs text-muted-foreground">
                                                    {Object.entries(
                                                      item.attributes
                                                    )
                                                      .map(
                                                        ([key, val]) =>
                                                          `${key}: ${val}`
                                                      )
                                                      .join(", ")}
                                                  </p>
                                                )}

                                                <p className="text-xs text-muted-foreground">
                                                  Status: {item.status}
                                                </p>

                                                {item.deliveredAt && (
                                                  <p className="text-xs text-muted-foreground">
                                                    Delivered:{" "}
                                                    {item.deliveredAt}
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>

                                        {totalPages > 1 && (
                                          <div className="flex items-center justify-center gap-3 pt-2">
                                            <button
                                              disabled={page === 0}
                                              onClick={() => setPage(page - 1)}
                                              className="flex items-center justify-center h-8 w-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
                                            >
                                              <svg
                                                className="w-4 h-4 text-gray-600"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M15 19l-7-7 7-7"
                                                />
                                              </svg>
                                            </button>

                                            <div className="flex gap-1.5">
                                              {Array.from({
                                                length: totalPages,
                                              }).map((_, idx) => (
                                                <button
                                                  key={idx}
                                                  onClick={() => setPage(idx)}
                                                  className={`h-2 rounded-full transition-all ${
                                                    idx === page
                                                      ? "w-6 bg-primary"
                                                      : "w-2 bg-gray-300 hover:bg-gray-400"
                                                  }`}
                                                />
                                              ))}
                                            </div>

                                            <button
                                              disabled={page >= totalPages - 1}
                                              onClick={() => setPage(page + 1)}
                                              className="flex items-center justify-center h-8 w-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
                                            >
                                              <svg
                                                className="w-4 h-4 text-gray-600"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M9 5l7 7-7 7"
                                                />
                                              </svg>
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  } else if (
                                    messageType === "cart_list" &&
                                    Array.isArray(m.payload)
                                  ) {
                                    const cartItems = m.payload;

                                    const ITEMS_PER_PAGE = 3;
                                    const totalPages = Math.ceil(
                                      cartItems.length / ITEMS_PER_PAGE
                                    );

                                    const page = productListPage[m.id] ?? 0;

                                    const setPage = (newPage: number) => {
                                      setProductListPage((prev) => ({
                                        ...prev,
                                        [m.id]: newPage,
                                      }));
                                    };

                                    const start = page * ITEMS_PER_PAGE;
                                    const currentItems = cartItems.slice(
                                      start,
                                      start + ITEMS_PER_PAGE
                                    );

                                    const selectedInCart =
                                      selectedCartProducts[m.id] ?? {};
                                    const hasSelected =
                                      Object.keys(selectedInCart).length > 0;

                                    bubbleContent = (
                                      <div className="space-y-3">
                                        {m.content && (
                                          <p className="text-[14px] mb-1">
                                            {m.content}
                                          </p>
                                        )}

                                        {/* Cart Item Cards */}
                                        <div className="grid grid-cols-1 gap-3 mb-2 min-h-[220px] min-w-[520px] content-start">
                                          {currentItems.map((item: any) => {
                                            const displayImage =
                                              item.variantImage ??
                                              item.image ??
                                              item.product?.imageUrl ??
                                              "";

                                            const displayName =
                                              item.variant?.name ||
                                              item.product?.name ||
                                              "Unnamed Product";

                                            const variantLabel =
                                              item.variantName ??
                                              item.product?.variantName ??
                                              null;

                                            const attrs =
                                              item.attributes ??
                                              item.selectedAttributes ??
                                              null;

                                            const attrSummary =
                                              attrs &&
                                              Object.keys(attrs).length > 0
                                                ? Object.entries(attrs)
                                                    .map(
                                                      ([k, v]) => `${k}: ${v}`
                                                    )
                                                    .join(", ")
                                                : null;

                                            const isSelected = Boolean(
                                              selectedInCart[item.id]
                                            );

                                            return (
                                              <div
                                                key={item.id}
                                                className="flex gap-3 p-3 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                                              >
                                                {/* Checkbox */}
                                                <div className="flex items-start pt-1">
                                                  <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => {
                                                      toggleCartSelection(
                                                        m.id,
                                                        {
                                                          id: item.id,
                                                          productId:
                                                            item.productId,
                                                          name: displayName,
                                                          price: item.price,
                                                          imageUrl:
                                                            displayImage,
                                                          sellerId:
                                                            item.sellerId,
                                                          sellerName:
                                                            item.sellerName,
                                                          attributes:
                                                            item.attributes,
                                                          quantity:
                                                            item.quantity,
                                                        },
                                                        isSelected
                                                      );
                                                    }}
                                                    className="h-4 w-4 cursor-pointer"
                                                  />
                                                </div>

                                                {/* Image */}
                                                <Avatar className="h-16 w-16 rounded-md shrink-0">
                                                  <AvatarImage
                                                    src={displayImage}
                                                    alt={item.name}
                                                  />
                                                  <AvatarFallback>
                                                    {item.name?.[0] ?? "P"}
                                                  </AvatarFallback>
                                                </Avatar>

                                                {/* Info */}
                                                <div className="flex flex-col flex-1 min-w-0">
                                                  <h4 className="font-semibold text-sm line-clamp-2">
                                                    {displayName}
                                                  </h4>

                                                  {(variantLabel ||
                                                    attrSummary) && (
                                                    <p className="mt-1 text-[11px] text-muted-foreground">
                                                      {variantLabel && (
                                                        <span className="font-medium">
                                                          {variantLabel}
                                                        </span>
                                                      )}
                                                      {variantLabel &&
                                                        attrSummary &&
                                                        " · "}
                                                      {attrSummary && (
                                                        <span>
                                                          {attrSummary}
                                                        </span>
                                                      )}
                                                    </p>
                                                  )}

                                                  <p className="mt-1 text-[12px] text-gray-700 font-medium">
                                                    Quantity: {item.quantity}
                                                  </p>

                                                  {/* Price */}
                                                  <div className="mt-2 flex items-center justify-between">
                                                    <span className="text-sm font-bold text-primary">
                                                      RM{" "}
                                                      {(
                                                        item.price *
                                                        item.quantity
                                                      ).toFixed(2)}
                                                    </span>

                                                    <span className="text-xs text-muted-foreground">
                                                      RM {item.price.toFixed(2)}{" "}
                                                      each
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>

                                        {/* Pagination */}
                                        {totalPages > 1 && (
                                          <div className="flex items-center justify-center gap-3 pt-2">
                                            <button
                                              disabled={page === 0}
                                              onClick={() => setPage(page - 1)}
                                              className="flex items-center justify-center h-8 w-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40"
                                            >
                                              <svg
                                                className="h-4 w-4 text-gray-600"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M15 19l-7-7 7-7"
                                                />
                                              </svg>
                                            </button>

                                            <div className="flex gap-1.5">
                                              {Array.from({
                                                length: totalPages,
                                              }).map((_, idx) => (
                                                <button
                                                  key={idx}
                                                  onClick={() => setPage(idx)}
                                                  className={`h-2 rounded-full transition-all ${
                                                    idx === page
                                                      ? "w-6 bg-primary"
                                                      : "w-2 bg-gray-300 hover:bg-gray-400"
                                                  }`}
                                                />
                                              ))}
                                            </div>

                                            <button
                                              disabled={page >= totalPages - 1}
                                              onClick={() => setPage(page + 1)}
                                              className="flex items-center justify-center h-8 w-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40"
                                            >
                                              <svg
                                                className="h-4 w-4 text-gray-600"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M9 5l7 7-7 7"
                                                />
                                              </svg>
                                            </button>
                                          </div>
                                        )}

                                        {/* Checkout Button */}
                                        {hasSelected && (
                                          <div className="pt-2">
                                            <Button
                                              size="sm"
                                              className="cursor-pointer"
                                              onClick={() => {
                                                const selected =
                                                  Object.values(selectedInCart);
                                                setCheckoutItems(selected);
                                                setCheckoutOpen(true);
                                                setCheckoutCart(true);
                                              }}
                                            >
                                              Checkout Selected
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  } else if (
                                    messageType === "status_update" &&
                                    Array.isArray(m.payload)
                                  ) {
                                    const items = m.payload as ChatbotOrder[];

                                    bubbleContent = (
                                      <div className="space-y-3 mb-2">
                                        {m.content && (
                                          <p className="text-[14px] mb-1">
                                            {m.content}
                                          </p>
                                        )}

                                        <div className="space-y-2">
                                          {items.map((item, idx) => (
                                            <div
                                              key={idx}
                                              className="flex gap-3 p-3 border rounded-lg bg-white shadow-sm"
                                            >
                                              {/* Product image */}
                                              <Avatar className="h-12 w-12 rounded-md">
                                                <AvatarImage
                                                  src={item.imageUrl ?? ""}
                                                />
                                                <AvatarFallback>
                                                  {item.productName?.[0] ?? "P"}
                                                </AvatarFallback>
                                              </Avatar>

                                              {/* Product + status info */}
                                              <div className="flex flex-col justify-between text-sm">
                                                <p className="font-medium">
                                                  {item.productName}
                                                </p>

                                                {item.attributes && (
                                                  <p className="text-xs text-muted-foreground">
                                                    {Object.entries(
                                                      item.attributes
                                                    )
                                                      .map(
                                                        ([key, val]) =>
                                                          `${key}: ${val}`
                                                      )
                                                      .join(", ")}
                                                  </p>
                                                )}

                                                <p className="text-xs text-muted-foreground">
                                                  Status: {item.status}
                                                </p>

                                                {typeof item.estimatedDays ===
                                                  "number" && (
                                                  <p className="text-xs text-muted-foreground">
                                                    Estimated delivery:{" "}
                                                    {item.estimatedDays} day
                                                    {item.estimatedDays > 1
                                                      ? "s"
                                                      : ""}
                                                  </p>
                                                )}

                                                {item.deliveredAt && (
                                                  <p className="text-xs text-muted-foreground">
                                                    Delivered:{" "}
                                                    {item.deliveredAt}
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  } else {
                                    bubbleContent = (
                                      <p className="text-[15px] wrap-break-words">
                                        {m.content}
                                      </p>
                                    );
                                  }

                                  return (
                                    <div
                                      key={m.id}
                                      className={`flex ${
                                        isBuyer
                                          ? "justify-end"
                                          : "justify-start"
                                      }`}
                                    >
                                      <div
                                        className={`relative rounded-2xl px-4 pt-2 pb-5 max-w-[75%] min-w-[70px] shadow-sm leading-relaxed ${
                                          isBuyer
                                            ? "bg-[#DCF8C6] text-black"
                                            : "bg-white text-black border border-gray-200"
                                        }`}
                                        style={{
                                          borderTopRightRadius: isBuyer
                                            ? "6px"
                                            : "1.25rem",
                                          borderTopLeftRadius: isBuyer
                                            ? "1.25rem"
                                            : "6px",
                                        }}
                                      >
                                        {bubbleContent}
                                        <span className="text-[11px] text-gray-500 absolute bottom-1.5 right-3">
                                          {format(
                                            new Date(m.createdAt),
                                            "h:mm a"
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {isTyping && (
                                <div className="flex justify-start items-center gap-2 mt-2 ml-2">
                                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2 shadow-sm">
                                    <div className="flex items-center space-x-1">
                                      <span
                                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                        style={{ animationDelay: "0ms" }}
                                      />
                                      <span
                                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                        style={{ animationDelay: "150ms" }}
                                      />
                                      <span
                                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                        style={{ animationDelay: "300ms" }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </ScrollArea>

                    {/* Input bar */}
                    <div className="p-4 border-t border-border flex items-center gap-2 shrink-0 bg-background">
                      <Button
                        variant="secondary"
                        onClick={async () => {
                          if (!activeSession) return;
                          setIsChatbotMode((prev) => !prev);
                        }}
                        className="cursor-pointer"
                      >
                        🤖
                        <span className="hidden sm:inline text-sm font-medium">
                          {isChatbotMode ? "Chat with Seller" : "Chat with AI"}
                        </span>
                      </Button>

                      <Input
                        placeholder="Type a message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        className="flex-1"
                      />

                      <Button
                        size="icon"
                        onClick={handleSend}
                        title="Send message"
                        className="cursor-pointer"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* FAQs */}
                    {isChatbotMode && (
                      <>
                        <div className="flex justify-center p-3 border-t border-border bg-background">
                          <Button
                            variant="outline"
                            onClick={async () => {
                              const next = !showFaqs;
                              setShowFaqs(next);
                              if (next && faqs.length === 0 && activeSession) {
                                try {
                                  const res = await fetch(
                                    `/api/chatbot/faqs/${activeSession.sellerId}`
                                  );
                                  if (!res.ok)
                                    throw new Error("Failed to fetch FAQs");
                                  const data = await res.json();
                                  setFaqs(data.faqs || []);
                                } catch (err) {
                                  toast.error(`Failed to load FAQs: ${err}`);
                                }
                              }
                            }}
                          >
                            📄 {showFaqs ? "Hide FAQs" : "View FAQs"}
                          </Button>
                        </div>

                        {showFaqs && faqs.length > 0 && (
                          <div className="flex flex-wrap gap-2 p-2 bg-background border-t border-border">
                            {faqs.map((faq, index) => (
                              <Button
                                className="cursor-pointer"
                                key={index}
                                variant="secondary"
                                size="sm"
                                onClick={async () => {
                                  if (!activeSession) return;
                                  setShowFaqs(false);
                                  await sendMessage(
                                    activeSession.id,
                                    faq.question,
                                    "buyer",
                                    true,
                                    "text",
                                    null
                                  );
                                  await sendMessage(
                                    activeSession.id,
                                    faq.answer,
                                    "chatbot",
                                    true,
                                    "text",
                                    null
                                  );
                                }}
                              >
                                {faq.question}
                              </Button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    Select a seller to start chatting.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product selection modal */}
      <ProductSelectionModal
        open={selectionModal.open}
        product={selectionModal.product}
        onClose={handleSelectionClose}
        onConfirm={handleSelectionConfirm}
      />

      <ConfirmChatbotActionModal
        open={confirmAction.open}
        title={
          confirmAction.type === "add"
            ? "Add Selected Products to Cart?"
            : "Proceed to Checkout?"
        }
        description={
          confirmAction.type === "add"
            ? "Are you sure you want to add these selected items to your cart?"
            : "You will be redirected to checkout with these items."
        }
        onCancel={() =>
          setConfirmAction({ open: false, type: null, messageId: null })
        }
        onConfirm={() => {
          if (!confirmAction.messageId) return;

          if (confirmAction.type === "add")
            handleAddToCart(confirmAction.messageId);
          else if (confirmAction.type === "checkout")
            handleCheckout(confirmAction.messageId);

          setConfirmAction({ open: false, type: null, messageId: null });
        }}
      />

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        selectedItems={checkoutItems}
        returnUrl={`/messages?seller=${activeSession?.sellerName}`}
        checkoutCart={checkoutCart}
        onSuccess={async () => {
          await fetchCart?.(); // refresh cart after FPX
        }}
      />
    </div>
  );
}

// src/components/chat/ProductSelectionModal.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type VariantAttributes = Record<string, string[]>;

type VariantOption = {
  id: string;
  name: string | null;
  price: number;
  stock: number;
  imageUrl?: string | null;
  attributes?: VariantAttributes | null;
};

type AttributesMap = Record<string, string[]>;

type ProductWithVariants = {
  id: string;
  name: string;
  price: number;
  stock?: number;
  imageUrl?: string | null;
  attributes?: AttributesMap | null;
  variant?: VariantOption[];
};

export type ProductSelectionResult = {
  productId: string;

  variantId: string | null;

  // These must never be null for CartContext
  name: string;
  imageUrl: string;
  sellerId: string;
  sellerName: string;

  // Display info
  variantName?: string | null;
  variantImage?: string | null;
  variantStock?: number;
  productStock?: number;

  selectedAttributes: Record<string, string>;

  finalPrice: number;
  price: number; // backward comp
  brand?: string; // backward comp
  category?: string; // backward comp
  attributes?: Record<string, string>;
  quantity: number;
};

type ProductSelectionModalProps = {
  open: boolean;
  product: ProductWithVariants | null;
  onClose: () => void;
  onConfirm: (selection: ProductSelectionResult) => void;
};

export default function ProductSelectionModal({
  open,
  product,
  onClose,
  onConfirm,
}: ProductSelectionModalProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null
  );
  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string>
  >({});
  const [error, setError] = useState<string | null>(null);

  // Reset modal when reopened
  useEffect(() => {
    if (!open || !product) {
      setSelectedVariantId(null);
      setSelectedAttributes({});
      setError(null);
      return;
    }

    const variants = product.variant ?? [];

    // Auto-select first variant
    if (variants.length > 0) {
      const first = variants[0];
      setSelectedVariantId(first.id);

      const defaults: Record<string, string> = {};
      Object.entries(first.attributes ?? {}).forEach(([key, values]) => {
        if (values.length > 0) defaults[key] = values[0];
      });
      setSelectedAttributes(defaults);
    } else {
      // No variants → use product-level attributes
      const defaults: Record<string, string> = {};
      Object.entries(product.attributes ?? {}).forEach(([key, values]) => {
        if (values.length > 0) defaults[key] = values[0];
      });
      setSelectedAttributes(defaults);
    }

    setError(null);
  }, [open, product]);

  if (!open || !product) return null;

  const variants: VariantOption[] = product.variant ?? [];
  const activeVariant =
    variants.find((v) => v.id === selectedVariantId) || null;

  const attributeSource: AttributesMap =
    (activeVariant?.attributes as AttributesMap) ??
    (product.attributes as AttributesMap) ??
    {};

  const handleAttributeChange = (key: string, val: string) => {
    setSelectedAttributes((prev) => ({ ...prev, [key]: val }));
  };

  const handleConfirm = () => {
    // Validation: variant must be chosen if exists
    if (variants.length > 0 && !selectedVariantId) {
      setError("Please choose a variant.");
      return;
    }

    // Validation: attributes all selected
    for (const [key, values] of Object.entries(attributeSource)) {
      if (values.length > 0 && !selectedAttributes[key]) {
        setError(`Please select ${key}.`);
        return;
      }
    }

    const finalPrice =
      activeVariant?.price != null ? activeVariant.price : product.price;

    onConfirm({
      productId: product.id,
      variantId: selectedVariantId,

      // REQUIRED non-null fields:
      name: activeVariant?.name ?? product.name ?? "Unknown Product",
      imageUrl: activeVariant?.imageUrl ?? product.imageUrl ?? "",
      sellerId: (product as any).sellerId ?? "",
      sellerName: (product as any).sellerName ?? "",
      category: (product as any).category ?? undefined,
      brand: (product as any).brand ?? undefined,
      // Optional detail fields:
      variantName: activeVariant?.name ?? null,
      variantImage: activeVariant?.imageUrl ?? null,
      variantStock: activeVariant?.stock,
      productStock: product.stock ?? undefined,
      selectedAttributes,
      attributes: selectedAttributes,

      finalPrice,
      price: finalPrice,

      quantity: 1,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white shadow-lg">
        {/* Header */}
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">
            Choose options for:{" "}
            <span className="font-bold text-primary">{product.name}</span>
          </h2>
        </div>

        {/* Body */}
        <div className="max-h-[420px] overflow-y-auto px-4 py-3 space-y-4 text-sm">
          {/* Variant List */}
          {variants.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-muted-foreground">
                Variant
              </p>

              <div className="space-y-2">
                {variants.map((variant) => (
                  <label
                    key={variant.id}
                    className={`flex items-center justify-between rounded-md border px-3 py-2 text-xs cursor-pointer ${
                      selectedVariantId === variant.id
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {/* Left side: radio and info */}
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        className="h-3 w-3"
                        value={variant.id}
                        checked={selectedVariantId === variant.id}
                        onChange={() => setSelectedVariantId(variant.id)}
                      />

                      <div className="flex flex-col">
                        <span className="font-semibold">
                          {variant.name ?? "Variant"}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          RM {variant.price.toFixed(2)} · Stock{" "}
                          {variant.stock ?? 0}
                        </span>
                      </div>
                    </div>

                    {/* Right side: image */}
                    {variant.imageUrl && (
                      <img
                        src={variant.imageUrl}
                        className="h-10 w-10 rounded-md object-cover ml-3"
                      />
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Attribute Selection */}
          {Object.keys(attributeSource).length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground">
                Options
              </p>

              {Object.entries(attributeSource).map(([key, values]) => (
                <div key={key} className="space-y-1">
                  <p className="text-xs font-medium">{key}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {values.map((val) => {
                      const active = selectedAttributes[key] === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleAttributeChange(key, val)}
                          className={`rounded-full px-2 py-0.5 text-[11px] border ${
                            active
                              ? "bg-primary text-white border-primary"
                              : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-xs font-medium text-red-500">{error}</p>}
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-3 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleConfirm}>
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}

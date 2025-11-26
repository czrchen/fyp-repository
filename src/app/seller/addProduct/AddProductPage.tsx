"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus } from "lucide-react";
import ImageUploader from "@/components/ImageUploader";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSeller } from "@/contexts/SellerContext";
import { useProducts } from "@/contexts/ProductContext";

export default function AddProduct() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type"); // "single" | "variant"

  const { sellerId, refetchSellerData } = useSeller();
  const { refetchProducts } = useProducts();

  // ------------------------
  // 🧠 State
  // ------------------------
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    tags: "",
    imageUrl: "",
    galleryUrls: "",
    attributes: "",
    categoryId: "",
    subcategoryId: "",
    brandId: "",
  });

  const [variants, setVariants] = useState<
    {
      name: string;
      sku?: string;
      attributes: Record<string, string | string[]>; // 👈 accepts both for safety
      price: string;
      stock: string;
      imageUrl: string;
    }[]
  >([]);

  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [brandSearch, setBrandSearch] = useState("");
  const [showBrandList, setShowBrandList] = useState(false);
  const [mainSearch, setMainSearch] = useState("");
  const [subSearch, setSubSearch] = useState("");
  const [showMainList, setShowMainList] = useState(false);
  const [showSubList, setShowSubList] = useState(false);

  // ------------------------
  // 🧩 Fetch categories
  // ------------------------
  useEffect(() => {
    const fetchMainCategories = async () => {
      try {
        const res = await fetch("/api/category?level=main");
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };
    fetchMainCategories();
  }, []);

  useEffect(() => {
    const fetchSubs = async () => {
      if (!formData.categoryId) {
        setSubcategories([]);
        return;
      }
      try {
        const res = await fetch(
          `/api/category?parentId=${formData.categoryId}`
        );
        const data = await res.json();
        setSubcategories(data);
      } catch (err) {
        console.error("Failed to load subcategories", err);
      }
    };
    fetchSubs();
  }, [formData.categoryId]);

  const handleAddCategory = async (name: string, parentId?: string) => {
    if (!name.trim()) return;
    try {
      const res = await fetch("/api/category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parentId: parentId || null }),
      });
      const newCat = await res.json();
      if (parentId) setSubcategories((prev) => [...prev, newCat]);
      else setCategories((prev) => [...prev, newCat]);
      toast.success(
        `${parentId ? "Subcategory" : "Category"} "${name}" created`
      );
    } catch {
      toast.error("Failed to create category");
    }
  };

  useEffect(() => {
    const loadBrands = async () => {
      try {
        const res = await fetch("/api/brand");
        const data = await res.json();
        setBrands(data);
      } catch (err) {
        console.error("Failed to load brands", err);
      }
    };
    loadBrands();
  }, []);

  const handleAddBrand = async (name: string) => {
    if (!name.trim()) return;
    try {
      const res = await fetch("/api/brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const newBrand = await res.json();

      setBrands((prev) => [...prev, newBrand]);
      toast.success(`Brand "${name}" created`);
    } catch {
      toast.error("Failed to create brand");
    }
  };

  // ------------------------
  // 🧩 Submit handler
  // ------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/products/addProduct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock) || 0,
          tags: formData.tags.split(",").map((t) => t.trim()),
          galleryUrls: formData.galleryUrls
            ? formData.galleryUrls.split(",").map((u) => u.trim())
            : [],
          attributes: formData.attributes
            ? JSON.parse(formData.attributes)
            : {},
          variants: type === "variant" ? variants : [],
          sellerId: sellerId,
        }),
      });

      if (!res.ok) throw new Error("Failed to add product");

      toast.success("Product added successfully!");
      await refetchSellerData();
      await refetchProducts();
      router.push("/seller");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add product");
    }
  };

  // ------------------------
  // 🧩 Render
  // ------------------------
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-14">
          <div className="flex items-center h-16">
            <Link href="/seller">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Form */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>
              Add New {type === "variant" ? "Variant Product" : "Product"}
            </CardTitle>
            <CardDescription>
              {type === "variant"
                ? "Create a product with multiple variants (e.g. sizes, colors)"
                : "Fill in details to list a single product"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  placeholder="Enter product name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              {/* Price & Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Base Price (RM)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Base Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2 relative">
                <Label>Main Category</Label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search or add category"
                    value={mainSearch}
                    onChange={(e) => {
                      setMainSearch(e.target.value);
                      setShowMainList(true);
                    }}
                    onFocus={() => setShowMainList(true)}
                  />
                  <Button
                    type="button"
                    size="icon"
                    onClick={() => handleAddCategory(mainSearch)}
                    disabled={!mainSearch.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {showMainList && (
                  <div className="absolute z-10 w-full bg-card border border-border rounded-md mt-1 shadow max-h-56 overflow-y-auto">
                    {categories
                      .filter((c) =>
                        c.name.toLowerCase().includes(mainSearch.toLowerCase())
                      )
                      .map((cat) => (
                        <div
                          key={cat.id}
                          className={cn(
                            "px-3 py-2 hover:bg-muted cursor-pointer",
                            formData.categoryId === cat.id &&
                              "bg-muted/60 font-medium"
                          )}
                          onClick={() => {
                            setFormData({
                              ...formData,
                              categoryId: cat.id,
                              subcategoryId: "",
                            });
                            setMainSearch(cat.name);
                            setShowMainList(false);
                          }}
                        >
                          {cat.name}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Subcategory */}
              {formData.categoryId && (
                <div className="space-y-2 relative">
                  <Label>Subcategory</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search or add subcategory"
                      value={subSearch}
                      onChange={(e) => {
                        setSubSearch(e.target.value);
                        setShowSubList(true);
                      }}
                      onFocus={() => setShowSubList(true)}
                    />
                    <Button
                      type="button"
                      size="icon"
                      onClick={() =>
                        handleAddCategory(subSearch, formData.categoryId)
                      }
                      disabled={!subSearch.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {showSubList && (
                    <div className="absolute z-10 w-full bg-card border border-border rounded-md mt-1 shadow max-h-56 overflow-y-auto">
                      {subcategories
                        .filter((s) =>
                          s.name.toLowerCase().includes(subSearch.toLowerCase())
                        )
                        .map((sub) => (
                          <div
                            key={sub.id}
                            className={cn(
                              "px-3 py-2 hover:bg-muted cursor-pointer",
                              formData.subcategoryId === sub.id &&
                                "bg-muted/60 font-medium"
                            )}
                            onClick={() => {
                              setFormData({
                                ...formData,
                                subcategoryId: sub.id,
                              });
                              setSubSearch(sub.name);
                              setShowSubList(false);
                            }}
                          >
                            {sub.name}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Brand */}
              <div className="space-y-2 relative">
                <Label>Brand</Label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search or add brand"
                    value={brandSearch}
                    onChange={(e) => {
                      setBrandSearch(e.target.value);
                      setShowBrandList(true);
                    }}
                    onFocus={() => setShowBrandList(true)}
                  />

                  <Button
                    type="button"
                    size="icon"
                    onClick={() => handleAddBrand(brandSearch)}
                    disabled={!brandSearch.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {showBrandList && (
                  <div className="absolute z-10 w-full bg-card border border-border rounded-md mt-1 shadow max-h-56 overflow-y-auto">
                    {brands
                      .filter((b) =>
                        b.name.toLowerCase().includes(brandSearch.toLowerCase())
                      )
                      .map((brand) => (
                        <div
                          key={brand.id}
                          className={cn(
                            "px-3 py-2 hover:bg-muted cursor-pointer",
                            formData.brandId === brand.id &&
                              "bg-muted/60 font-medium"
                          )}
                          onClick={() => {
                            setFormData({ ...formData, brandId: brand.id });
                            setBrandSearch(brand.name);
                            setShowBrandList(false);
                          }}
                        >
                          {brand.name}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Product Image */}
              <div className="space-y-2">
                <Label>Product Image</Label>
                <ImageUploader
                  onUploaded={(url) =>
                    setFormData({ ...formData, imageUrl: url })
                  }
                />
                {formData.imageUrl && (
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-md border border-border"
                  />
                )}
              </div>

              {/* CONDITIONAL FORM SECTION */}
              {type === "variant" ? (
                <>
                  {/* VARIANT BUILDER */}
                  <div className="space-y-3">
                    <Label className="font-medium">Product Variants</Label>
                    {variants.map((variant, index) => (
                      <div
                        key={index}
                        className="p-4 border rounded-md space-y-3 bg-muted/30"
                      >
                        <div className="space-y-2">
                          <Label>Variant Name</Label>
                          <Input
                            placeholder="e.g. 23/24 Home Jersey"
                            value={variant.name || ""}
                            onChange={(e) => {
                              const updated = [...variants];
                              updated[index].name = e.target.value;
                              setVariants(updated);
                            }}
                          />
                        </div>

                        <div className="space-y-3">
                          {Object.entries(variant.attributes || {}).map(
                            ([attrName, attrValues], attrIndex) => (
                              <div
                                key={attrIndex}
                                className="p-3 border rounded-md bg-card/50 space-y-2"
                              >
                                {/* 🏷️ Attribute Name */}
                                <div className="flex items-center gap-2">
                                  <Input
                                    placeholder="Attribute name (e.g. Color)"
                                    value={
                                      attrName.startsWith("attribute")
                                        ? ""
                                        : attrName
                                    }
                                    onChange={(e) => {
                                      const updatedVariants = [...variants];
                                      const variantCopy = { ...variant };
                                      const attrs = {
                                        ...variantCopy.attributes,
                                      };
                                      const val = attrs[attrName];
                                      delete attrs[attrName];
                                      attrs[e.target.value] = val;
                                      variantCopy.attributes = attrs;
                                      updatedVariants[index] = variantCopy;
                                      setVariants(updatedVariants);
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => {
                                      const updatedVariants = [...variants];
                                      const variantCopy = { ...variant };
                                      const attrs = {
                                        ...variantCopy.attributes,
                                      };
                                      delete attrs[attrName];
                                      variantCopy.attributes = attrs;
                                      updatedVariants[index] = variantCopy;
                                      setVariants(updatedVariants);
                                    }}
                                  >
                                    ✕
                                  </Button>
                                </div>

                                {/* 🎨 Attribute Options */}
                                <div className="flex flex-wrap gap-2">
                                  {Array.isArray(attrValues)
                                    ? attrValues.map((val, optionIndex) => (
                                        <div
                                          key={optionIndex}
                                          className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md"
                                        >
                                          <span className="text-sm">{val}</span>
                                          <button
                                            type="button"
                                            className="text-xs text-destructive"
                                            onClick={() => {
                                              const updatedVariants = [
                                                ...variants,
                                              ];
                                              const variantCopy = {
                                                ...variant,
                                              };
                                              const attrs = {
                                                ...variantCopy.attributes,
                                              };
                                              const updatedValues =
                                                attrValues.filter(
                                                  (_, i) => i !== optionIndex
                                                );
                                              attrs[attrName] = updatedValues;
                                              variantCopy.attributes = attrs;
                                              updatedVariants[index] =
                                                variantCopy;
                                              setVariants(updatedVariants);
                                            }}
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      ))
                                    : null}
                                </div>

                                {/* ➕ Add New Option */}
                                <div className="flex gap-2">
                                  <Input
                                    placeholder={`Add option for ${
                                      attrName || "attribute"
                                    } (e.g. Red)`}
                                    onKeyDown={(e) => {
                                      if (
                                        e.key === "Enter" &&
                                        e.currentTarget.value.trim()
                                      ) {
                                        e.preventDefault();
                                        const newValue =
                                          e.currentTarget.value.trim();
                                        const updatedVariants = [...variants];
                                        const variantCopy = { ...variant };
                                        const attrs = {
                                          ...variantCopy.attributes,
                                        };
                                        const existingValues = Array.isArray(
                                          attrs[attrName]
                                        )
                                          ? attrs[attrName]
                                          : [];
                                        attrs[attrName] = [
                                          ...existingValues,
                                          newValue,
                                        ];
                                        variantCopy.attributes = attrs;
                                        updatedVariants[index] = variantCopy;
                                        setVariants(updatedVariants);
                                        e.currentTarget.value = "";
                                      }
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      const input =
                                        e.currentTarget.parentElement?.querySelector(
                                          "input"
                                        );
                                      if (input && input.value.trim()) {
                                        const newValue = input.value.trim();
                                        const updatedVariants = [...variants];
                                        const variantCopy = { ...variant };
                                        const attrs = {
                                          ...variantCopy.attributes,
                                        };
                                        const existingValues = Array.isArray(
                                          attrs[attrName]
                                        )
                                          ? attrs[attrName]
                                          : [];
                                        attrs[attrName] = [
                                          ...existingValues,
                                          newValue,
                                        ];
                                        variantCopy.attributes = attrs;
                                        updatedVariants[index] = variantCopy;
                                        setVariants(updatedVariants);
                                        input.value = "";
                                      }
                                    }}
                                  >
                                    + Add
                                  </Button>
                                </div>
                              </div>
                            )
                          )}

                          {/* ➕ Add New Attribute */}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const updatedVariants = [...variants];
                              updatedVariants[index].attributes = {
                                ...updatedVariants[index].attributes,
                                [`attribute${
                                  Object.keys(updatedVariants[index].attributes)
                                    .length + 1
                                }`]: [],
                              };
                              setVariants(updatedVariants);
                            }}
                          >
                            + Add Attribute
                          </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <Input
                            type="number"
                            placeholder="Price"
                            value={variant.price}
                            onChange={(e) => {
                              const updated = [...variants];
                              updated[index].price = e.target.value;
                              setVariants(updated);
                            }}
                          />
                          <Input
                            type="number"
                            placeholder="Stock"
                            value={variant.stock}
                            onChange={(e) => {
                              const updated = [...variants];
                              updated[index].stock = e.target.value;
                              setVariants(updated);
                            }}
                          />
                          <ImageUploader
                            onUploaded={(url) => {
                              const updated = [...variants];
                              updated[index].imageUrl = url;
                              setVariants(updated);
                            }}
                          />
                        </div>

                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            setVariants(variants.filter((_, i) => i !== index))
                          }
                        >
                          Remove Variant
                        </Button>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setVariants([
                          ...variants,
                          {
                            name: "",
                            attributes: {},
                            price: "",
                            stock: "",
                            imageUrl: "",
                          },
                        ])
                      }
                    >
                      + Add Variant
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-3">
                    <Label className="font-medium text-foreground">
                      Gallery Images (max 5)
                    </Label>

                    <div className="flex flex-wrap gap-3">
                      {/* Preview Thumbnails */}
                      {formData.galleryUrls
                        .split(",")
                        .filter((u) => u.trim())
                        .map((url, i) => (
                          <div
                            key={i}
                            className="relative h-28 w-28 rounded-xl overflow-hidden border border-border shadow-sm group"
                          >
                            <img
                              src={url}
                              alt={`Gallery ${i}`}
                              className="h-full w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = formData.galleryUrls
                                  .split(",")
                                  .filter((_, idx) => idx !== i)
                                  .join(",");
                                setFormData({
                                  ...formData,
                                  galleryUrls: updated,
                                });
                              }}
                              className="absolute top-1 right-1 bg-black/60 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                    </div>

                    <ImageUploader
                      onUploaded={(url) => {
                        const urls = formData.galleryUrls
                          ? formData.galleryUrls
                              .split(",")
                              .filter((u) => u.trim())
                          : [];
                        if (urls.length >= 5) return;
                        urls.push(url);
                        setFormData({
                          ...formData,
                          galleryUrls: urls.join(","),
                        });
                      }}
                    />

                    <p className="text-xs text-muted-foreground">
                      Upload up to <span className="font-medium">5 images</span>
                      . Click on any image to remove it.
                    </p>
                  </div>
                  {/* SINGLE PRODUCT ATTRIBUTES */}
                  <div className="space-y-3">
                    <Label className="font-medium">Attributes</Label>

                    {Object.entries(
                      JSON.parse(formData.attributes || "{}")
                    ).map(([attrName, attrValues], index) => (
                      <div
                        key={index}
                        className="p-4 border rounded-md space-y-3 bg-muted/30"
                      >
                        {/* 🏷️ Attribute Label */}
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Attribute name (e.g. Color)"
                            value={
                              attrName.startsWith("attribute") ? "" : attrName
                            }
                            onChange={(e) => {
                              const attrs = JSON.parse(
                                formData.attributes || "{}"
                              );
                              const currentValues = attrs[attrName];
                              delete attrs[attrName];
                              attrs[e.target.value] = currentValues;
                              setFormData({
                                ...formData,
                                attributes: JSON.stringify(attrs),
                              });
                            }}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              const attrs = JSON.parse(
                                formData.attributes || "{}"
                              );
                              delete attrs[attrName];
                              setFormData({
                                ...formData,
                                attributes: JSON.stringify(attrs),
                              });
                            }}
                          >
                            ✕
                          </Button>
                        </div>

                        {/* 🎨 Attribute Options */}
                        <div className="flex flex-wrap gap-2">
                          {Array.isArray(attrValues)
                            ? attrValues.map((val, valIndex) => (
                                <div
                                  key={valIndex}
                                  className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md"
                                >
                                  <span className="text-sm">{val}</span>
                                  <button
                                    type="button"
                                    className="text-xs text-destructive"
                                    onClick={() => {
                                      const attrs = JSON.parse(
                                        formData.attributes || "{}"
                                      );
                                      const updatedValues = attrValues.filter(
                                        (_, i) => i !== valIndex
                                      );
                                      attrs[attrName] = updatedValues;
                                      setFormData({
                                        ...formData,
                                        attributes: JSON.stringify(attrs),
                                      });
                                    }}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))
                            : null}
                        </div>

                        {/* ➕ Add New Option */}
                        <div className="flex gap-2">
                          <Input
                            placeholder={`Add option for ${
                              attrName || "attribute"
                            } (e.g. Red)`}
                            onKeyDown={(e) => {
                              if (
                                e.key === "Enter" &&
                                e.currentTarget.value.trim()
                              ) {
                                e.preventDefault();
                                const newValue = e.currentTarget.value.trim();
                                const attrs = JSON.parse(
                                  formData.attributes || "{}"
                                );
                                const existingValues = Array.isArray(
                                  attrs[attrName]
                                )
                                  ? attrs[attrName]
                                  : [];
                                attrs[attrName] = [...existingValues, newValue];
                                setFormData({
                                  ...formData,
                                  attributes: JSON.stringify(attrs),
                                });
                                e.currentTarget.value = "";
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              const input =
                                e.currentTarget.parentElement?.querySelector(
                                  "input"
                                );
                              if (input && input.value.trim()) {
                                const newValue = input.value.trim();
                                const attrs = JSON.parse(
                                  formData.attributes || "{}"
                                );
                                const existingValues = Array.isArray(
                                  attrs[attrName]
                                )
                                  ? attrs[attrName]
                                  : [];
                                attrs[attrName] = [...existingValues, newValue];
                                setFormData({
                                  ...formData,
                                  attributes: JSON.stringify(attrs),
                                });
                                input.value = "";
                              }
                            }}
                          >
                            + Add
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* ➕ Add New Attribute */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const attrs = JSON.parse(formData.attributes || "{}");
                        let counter = 1;
                        let newKey = `attribute${counter}`;
                        while (attrs[newKey]) {
                          counter++;
                          newKey = `attribute${counter}`;
                        }
                        attrs[newKey] = [];
                        setFormData({
                          ...formData,
                          attributes: JSON.stringify(attrs),
                        });
                      }}
                    >
                      + Add Attribute
                    </Button>
                  </div>
                </>
              )}

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={5}
                  placeholder="Describe your product"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3">
                <Button type="submit" className="flex-1">
                  Add Product
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/seller")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

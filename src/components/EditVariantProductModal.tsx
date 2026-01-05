"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import ImageUploader from "@/components/ImageUploader";
import { useProducts } from "@/contexts/ProductContext";
import { toast } from "sonner";

interface EditVariantProductModalProps {
  product: any;
  onUpdated: (updated: any) => void;
}

export default function EditVariantProductModal({
  product,
  onUpdated,
}: EditVariantProductModalProps) {
  const { refetchProducts } = useProducts();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(product.variants[0]?.id ?? "main");

  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description || "",
    status: product.status,
    tags: product.tags || [],
    variants: product.variants || [],
  });

  //  Add Tag
  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag))
      setFormData({ ...formData, tags: [...formData.tags, tag] });
  };
  const removeTag = (t: string) =>
    setFormData({
      ...formData,
      tags: formData.tags.filter((x: any) => x !== t),
    });

  //  Add Variant
  const addVariant = () => {
    const newVariant = {
      id: crypto.randomUUID(),
      name: "",
      price: 0,
      stock: 0,
      sku: "",
      imageUrl: "",
      attributes: {},
    };
    setFormData({ ...formData, variants: [...formData.variants, newVariant] });
    setActiveTab(newVariant.id);
  };

  //  Remove Variant
  const removeVariant = (id: string) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((v: any) => v.id !== id),
    });
    if (activeTab === id && formData.variants.length > 1) {
      setActiveTab(formData.variants[0].id);
    }
  };

  //  Update Variant Field
  const updateVariant = (id: string, key: string, value: any) => {
    setFormData({
      ...formData,
      variants: formData.variants.map((v: any) =>
        v.id === id ? { ...v, [key]: value } : v
      ),
    });
  };

  //  Add Attribute
  const addAttribute = (id: string) => {
    const variant = formData.variants.find((v: any) => v.id === id);
    if (!variant) return;
    const attrs = { ...variant.attributes, "": "" };
    updateVariant(id, "attributes", attrs);
  };

  //  Remove Attribute
  const removeAttribute = (id: string, key: string) => {
    const variant = formData.variants.find((v: any) => v.id === id);
    if (!variant) return;
    const copy = { ...variant.attributes };
    delete copy[key];
    updateVariant(id, "attributes", copy);
  };

  //  Submit
  const handleSubmit = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/products/${product.id}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to update product");
      onUpdated(formData);
      toast.success("Product updated successfully!");
      await refetchProducts();
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger */}
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Edit Variants
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="
      sm:max-w-[700px] w-[90%] max-h-[90vh] overflow-y-auto
      fixed !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2
      p-10 sm:p-8 md:p-10 rounded-xl shadow-lg bg-background
      border border-border
    "
        >
          <DialogHeader>
            <DialogTitle>Edit Variant Product</DialogTitle>
          </DialogHeader>

          {/*  Product-Level Fields */}
          <div className="space-y-5 mb-6">
            <div>
              <Label className="mb-1">Product Name</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div>
              <Label className="mb-1">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div>
              <Label className="mb-1">Status</Label>
              <Select
                value={formData.status ? "active" : "inactive"}
                onValueChange={(val) =>
                  setFormData({ ...formData, status: val === "active" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div>
              <Label className="mb-1">Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag: any, i: any) => (
                  <span
                    key={i}
                    className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm"
                  >
                    {tag}
                    <X
                      className="ml-2 h-3 w-3 cursor-pointer"
                      onClick={() => removeTag(tag)}
                    />
                  </span>
                ))}
              </div>
              <Input
                placeholder="Press Enter to add tag"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(e.currentTarget.value.trim());
                    e.currentTarget.value = "";
                  }
                }}
              />
            </div>
          </div>

          {/*  Variant Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-4">
              <TabsList className="overflow-x-auto flex-1">
                {formData.variants.map((v: any) => (
                  <TabsTrigger
                    key={v.id}
                    value={v.id}
                    className="flex items-center gap-2 mb-1"
                  >
                    {v.name || "Untitled"}
                    <X
                      onClick={(e) => {
                        e.stopPropagation();
                        removeVariant(v.id);
                      }}
                      className="h-3 w-3 text-gray-400 hover:text-red-500 cursor-pointer"
                    />
                  </TabsTrigger>
                ))}
              </TabsList>

              <Button
                variant="outline"
                size="sm"
                className="ml-3 flex items-center gap-1"
                onClick={addVariant}
              >
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>

            {formData.variants.map((variant: any) => (
              <TabsContent key={variant.id} value={variant.id}>
                <div className="space-y-5 mt-2 border rounded-xl p-4 bg-gray-50/50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-1">Variant Name</Label>
                      <Input
                        value={variant.name}
                        onChange={(e) =>
                          updateVariant(variant.id, "name", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label className="mb-1">SKU</Label>
                      <Input
                        value={variant.sku}
                        onChange={(e) =>
                          updateVariant(variant.id, "sku", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-1">Price (RM)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={variant.price}
                        onChange={(e) =>
                          updateVariant(
                            variant.id,
                            "price",
                            parseFloat(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label className="mb-1">Stock</Label>
                      <Input
                        type="number"
                        value={variant.stock}
                        onChange={(e) =>
                          updateVariant(
                            variant.id,
                            "stock",
                            parseInt(e.target.value)
                          )
                        }
                      />
                    </div>
                  </div>

                  {/* Variant Image */}
                  <div>
                    <Label className="mb-1">Variant Image</Label>
                    <ImageUploader
                      onUploaded={(url) =>
                        updateVariant(variant.id, "imageUrl", url)
                      }
                    />
                    {variant.imageUrl && (
                      <img
                        src={variant.imageUrl}
                        alt="variant"
                        className="w-24 h-24 object-cover mt-2 rounded-md"
                      />
                    )}
                  </div>

                  {/* Attributes */}
                  <div>
                    <Label className="mb-1">Attributes</Label>
                    <div className="space-y-2 mt-2">
                      {Object.entries(variant.attributes || {}).map(
                        ([k, v], i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <Input
                              placeholder="Key"
                              value={k}
                              onChange={(e) => {
                                const attrs = { ...variant.attributes };
                                const val = attrs[k];
                                delete attrs[k];
                                attrs[e.target.value] = val;
                                updateVariant(variant.id, "attributes", attrs);
                              }}
                            />
                            <Input
                              placeholder="Value"
                              value={String(v)}
                              onChange={(e) => {
                                const attrs = {
                                  ...variant.attributes,
                                  [k]: e.target.value,
                                };
                                updateVariant(variant.id, "attributes", attrs);
                              }}
                            />
                            <X
                              className="h-4 w-4 text-gray-500 cursor-pointer"
                              onClick={() => removeAttribute(variant.id, k)}
                            />
                          </div>
                        )
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addAttribute(variant.id)}
                      >
                        + Add Attribute
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-6">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

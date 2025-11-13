"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import ImageUploader from "@/components/ImageUploader";
import { useProducts } from "@/contexts/ProductContext";
import { X } from "lucide-react";
import { toast } from "sonner";

interface EditSimpleProductModalProps {
  product: any;
  onUpdated: (updated: any) => void;
}

export default function EditSimpleProductModal({
  product,
  onUpdated,
}: EditSimpleProductModalProps) {
  const { refetchProducts } = useProducts();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description || "",
    price: product.price,
    stock: product.stock,
    status: product.status,
    tags: product.tags || [],
    attributes: product.attributes || {},
    imageUrl: product.imageUrl || "",
    galleryUrls: product.galleryUrls || [],
  });

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag))
      setFormData({ ...formData, tags: [...formData.tags, tag] });
  };
  const removeTag = (t: string) =>
    setFormData({
      ...formData,
      tags: formData.tags.filter((x: any) => x !== t),
    });

  const addAttribute = () =>
    setFormData({
      ...formData,
      attributes: { ...formData.attributes, "": "" },
    });

  const removeAttribute = (key: string) => {
    const copy = { ...formData.attributes };
    delete copy[key];
    setFormData({ ...formData, attributes: copy });
  };

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
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Edit Product
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
            <DialogTitle>Edit Product Details</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-2">
            {/* Basic Info */}
            <div className="space-y-3">
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            {/* Price & Stock */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price (RM)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label>Stock</Label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stock: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <Label>Status</Label>
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
              <Label>Tags</Label>
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

            {/* Attributes */}
            <div>
              <Label>Attributes</Label>
              <div className="space-y-2 mt-2">
                {Object.entries(formData.attributes).map(([k, v], i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input
                      placeholder="Key"
                      value={k}
                      onChange={(e) => {
                        const attrs = { ...formData.attributes };
                        const val = attrs[k];
                        delete attrs[k];
                        attrs[e.target.value] = val;
                        setFormData({ ...formData, attributes: attrs });
                      }}
                    />
                    <Input
                      placeholder="Value"
                      value={String(v)}
                      onChange={(e) => {
                        const attrs = {
                          ...formData.attributes,
                          [k]: e.target.value,
                        };
                        setFormData({ ...formData, attributes: attrs });
                      }}
                    />
                    <X
                      className="h-4 w-4 text-gray-500 cursor-pointer"
                      onClick={() => removeAttribute(k)}
                    />
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={addAttribute}>
                  + Add Attribute
                </Button>
              </div>
            </div>

            {/* Images */}
            <div className="space-y-3">
              <Label>Main Image</Label>
              <ImageUploader
                onUploaded={(url) =>
                  setFormData({ ...formData, imageUrl: url })
                }
              />
              {formData.imageUrl && (
                <img
                  src={formData.imageUrl}
                  alt="main"
                  className="w-32 h-32 object-cover rounded-md"
                />
              )}

              <Label>Gallery Images</Label>
              <ImageUploader
                onUploaded={(url) =>
                  setFormData({
                    ...formData,
                    galleryUrls: [...formData.galleryUrls, url],
                  })
                }
              />
              <div className="flex flex-wrap gap-3">
                {formData.galleryUrls.map((url: string, i: number) => (
                  <div key={i} className="relative">
                    <img
                      src={url}
                      alt="gallery"
                      className="w-20 h-20 object-cover rounded-md"
                    />
                    <X
                      className="absolute top-1 right-1 h-4 w-4 text-white bg-black/50 rounded-full p-0.5 cursor-pointer"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          galleryUrls: formData.galleryUrls.filter(
                            (_: any, idx: any) => idx !== i
                          ),
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

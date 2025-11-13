"use client";

import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function ImageUploader({
  onUploaded,
}: {
  onUploaded: (url: string) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.url) {
      setPreview(data.url);
      onUploaded(data.url);
    }
    setUploading(false);
  };

  const handleFile = (file: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    uploadImage(file);
  };

  return (
    <div className="space-y-2">
      <div
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer relative",
          uploading
            ? "border-primary/70 bg-primary/5"
            : "hover:border-primary border-border"
        )}
      >
        {uploading ? (
          <p className="text-sm text-muted-foreground">Uploading...</p>
        ) : (
          <>
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Click to upload or drag & drop
            </p>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
    </div>
  );
}

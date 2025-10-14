"use client";

import { useState } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const mainCategories = [
  { id: "sports", label: "Sports" },
  { id: "home", label: "Home" },
  { id: "fashion", label: "Fashion" },
];

const subCategories = {
  sports: [
    { id: "badminton", label: "Badminton" },
    { id: "basketball", label: "Basketball" },
    { id: "hockey", label: "Hockey" },
  ],
  home: [
    { id: "sofa", label: "Sofa" },
    { id: "bulb", label: "Bulb" },
    { id: "decor", label: "Decor" },
  ],
  fashion: [
    { id: "clothes", label: "Clothes" },
    { id: "shorts", label: "Shorts" },
    { id: "socks", label: "Socks" },
  ],
};

const brands = [
  { id: "brand1", label: "TechPro" },
  { id: "brand2", label: "StyleMax" },
  { id: "brand3", label: "HomeComfort" },
  { id: "brand4", label: "SportElite" },
];

export default function FilterModal() {
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>("");

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Open filters">
          <Filter className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[320px] overflow-y-auto p-6">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>
            Filter products by category, price, and more
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Main Categories */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-foreground">
              Main Category
            </h3>
            <RadioGroup
              value={selectedMainCategory}
              onValueChange={setSelectedMainCategory}
            >
              {mainCategories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={category.id} id={category.id} />
                  <Label
                    htmlFor={category.id}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {category.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Sub Categories */}
          {selectedMainCategory && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-foreground">
                  Sub Category
                </h3>
                {subCategories[
                  selectedMainCategory as keyof typeof subCategories
                ]?.map((sub) => (
                  <div key={sub.id} className="flex items-center space-x-2">
                    <Checkbox id={sub.id} />
                    <Label
                      htmlFor={sub.id}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {sub.label}
                    </Label>
                  </div>
                ))}
              </div>
            </>
          )}

          <Separator />

          {/* Price Range */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-foreground">Price Range</h3>
            <Slider defaultValue={[0, 1000]} max={1000} step={10} />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>$0</span>
              <span>$1000+</span>
            </div>
          </div>

          <Separator />

          {/* Brands */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-foreground">Brands</h3>
            {brands.map((brand) => (
              <div key={brand.id} className="flex items-center space-x-2">
                <Checkbox id={brand.id} />
                <Label
                  htmlFor={brand.id}
                  className="text-sm font-normal cursor-pointer"
                >
                  {brand.label}
                </Label>
              </div>
            ))}
          </div>

          <Separator />

          {/* Features */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-foreground">Features</h3>
            <div className="flex items-center space-x-2">
              <Checkbox id="eco" />
              <Label
                htmlFor="eco"
                className="text-sm font-normal cursor-pointer"
              >
                Eco-Friendly
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="free-shipping" />
              <Label
                htmlFor="free-shipping"
                className="text-sm font-normal cursor-pointer"
              >
                Free Shipping
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="in-stock" />
              <Label
                htmlFor="in-stock"
                className="text-sm font-normal cursor-pointer"
              >
                In Stock
              </Label>
            </div>
          </div>

          <Button className="w-full mt-4">Apply Filters</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

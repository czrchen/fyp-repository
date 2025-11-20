"use client";

import { useState, useEffect } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sparkles,
  MapPin,
  DollarSign,
  User,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { toast } from "sonner";

const interestOptions = [
  "Electronics",
  "Fashion",
  "Home & Garden",
  "Sports & Outdoors",
  "Beauty & Personal Care",
  "Books & Media",
  "Toys & Games",
  "Automotive",
  "Health & Wellness",
  "Food & Beverages",
];

const incomeLevels = [
  "Under RM25,000",
  "RM25,000 - RM50,000",
  "RM50,000 - RM75,000",
  "RM75,000 - RM100,000",
  "RM100,000 - RM150,000",
  "Over RM150,000",
];

export default function ProfileCompletionModal() {
  const { refreshProfile } = useProfile();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    gender: string;
    dob: string | null;
    location: string;
    phone: string;
    income_level: string;
    interests: string[];
    address: {
      street: string;
      city: string;
      state: string;
      postcode: string;
      country: string;
    };
  }>({
    gender: "",
    dob: null, // ✅ initial null
    location: "",
    phone: "",
    income_level: "",
    interests: [],
    address: {
      street: "",
      city: "",
      state: "",
      postcode: "",
      country: "",
    },
  });

  // 🧩 Step validation
  const isStep1Valid =
    formData.gender && formData.dob && formData.location && formData.phone;
  const isStep2Valid = formData.income_level && formData.interests.length > 0;
  const isStep3Valid =
    formData.address.street &&
    formData.address.city &&
    formData.address.state &&
    formData.address.postcode &&
    formData.address.country;

  // 🔍 Fetch current user from /api/user/current
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user/current");
        if (!res.ok) throw new Error("Failed to fetch user");
        const data = await res.json();
        setUserId(data.id);
        if (!data.profile_completed) setOpen(true);
      } catch (err) {
        console.error("Error fetching current user:", err);
      }
    };
    fetchUser();
  }, []);

  // 🧠 Handle interest selection
  const handleInterestToggle = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  // 💾 Submit updated profile
  const handleSubmit = async () => {
    if (!userId) return toast.error("User not found.");

    try {
      const res = await fetch(`/api/user/${userId}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
          gender: formData.gender,
          dob: formData.dob,
          location: formData.location,
          phone: formData.phone,
          income_level: formData.income_level,
          interests: formData.interests,
          address: formData.address,
          profile_completed: true,
        }),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      await refreshProfile();

      toast.success("Profile completed successfully!");
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Error updating profile. Please try again.");
    } finally {
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="
      sm:max-w-[600px] w-[90%] max-h-[90vh] overflow-y-auto
      fixed !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2
      p-10 sm:p-8 md:p-10 rounded-xl shadow-lg bg-background
      border border-border
    "
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-primary" />
            Complete Your Profile
          </DialogTitle>
          <DialogDescription>
            Help us personalize your shopping experience with AI-powered
            recommendations
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 my-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  currentStep >= step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step}
              </div>
              {step < 3 && (
                <div
                  className={`w-16 h-1 mx-2 transition-all ${
                    currentStep > step ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* STEP 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gender" className="flex items-center gap-2">
                <User className="w-4 h-4" /> Gender
              </Label>
              <Select
                value={formData.gender}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, gender: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Non-binary">Non-binary</SelectItem>
                  <SelectItem value="Prefer not to say">
                    Prefer not to say
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob" className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" /> Date of Birth
              </Label>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      !formData.dob && "text-muted-foreground"
                    }`}
                  >
                    {formData.dob ? (
                      format(new Date(formData.dob), "PPP") // "Jan 25, 2025" format
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.dob ? new Date(formData.dob) : undefined}
                    onSelect={(date) =>
                      setFormData((prev) => ({
                        ...prev,
                        dob: date
                          ? `${date.getFullYear()}-${String(
                              date.getMonth() + 1
                            ).padStart(2, "0")}-${String(
                              date.getDate()
                            ).padStart(2, "0")}`
                          : null,
                      }))
                    }
                    captionLayout="dropdown"
                    fromYear={1900}
                    toYear={new Date().getFullYear()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Location (City, Country)
              </Label>
              <Input
                id="location"
                placeholder="e.g., Kuala Lumpur, Malaysia"
                value={formData.location}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, location: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Phone Number
              </Label>
              <Input
                id="phone"
                placeholder="e.g., +60176262550"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>

            <Button
              onClick={() => setCurrentStep(2)}
              disabled={!isStep1Valid}
              className="w-full mt-6"
            >
              Continue
            </Button>
          </div>
        )}

        {/* STEP 2: Preferences */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Income Level
              </Label>
              <Select
                value={formData.income_level}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, income_level: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select income range" />
                </SelectTrigger>
                <SelectContent>
                  {incomeLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Interests (Select at least one)
              </Label>
              <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-2 border rounded-lg">
                {interestOptions.map((interest) => (
                  <div key={interest} className="flex items-center space-x-2">
                    <Checkbox
                      id={interest}
                      checked={formData.interests.includes(interest)}
                      onCheckedChange={() => handleInterestToggle(interest)}
                    />
                    <label
                      htmlFor={interest}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {interest}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                onClick={() => setCurrentStep(1)}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep(3)}
                disabled={!isStep2Valid}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Address */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-base">
              <MapPin className="w-4 h-4" /> Delivery Address
            </Label>

            {["street", "city", "state", "postcode", "country"].map((field) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={field}>
                  {field
                    .replace("_", " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </Label>
                <Input
                  id={field}
                  placeholder={`Enter ${field}`}
                  value={(formData.address as any)[field]}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: { ...prev.address, [field]: e.target.value },
                    }))
                  }
                />
              </div>
            ))}

            <div className="flex gap-2 mt-6">
              <Button
                onClick={() => setCurrentStep(2)}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isStep3Valid || loading}
                className="flex-1"
              >
                {loading ? "Saving..." : "Complete Profile"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

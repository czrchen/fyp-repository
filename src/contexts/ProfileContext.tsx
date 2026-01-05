"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";

export type Address = {
  id: number;
  label?: string | null;
  street: string;
  city: string;
  state: string;
  postcode?: string | null;
  country?: string | null;
  userId: string;
};

type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  gender?: string | null;
  dob?: string | null;
  location?: string | null;
  income_level?: string | null;
  interests?: string[];
  avatar_url?: string | null;
  profile_completed: boolean;
  isGoogleSignIn?: boolean;
  isSeller?: boolean;
  password?: string | null;
  phone?: string | null;
  created_at?: string;
  updated_at?: string;
  addresses: Address[];
};

type ProfileContextType = {
  user: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

// Start with null context for safety
const ProfileContext = createContext<ProfileContextType | null>(null);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch both user and addresses in one go
  const fetchProfile = async (uid: string) => {
    try {
      setLoading(true);

      const [userRes, addrRes] = await Promise.all([
        fetch(`/api/user/${uid}/getProfile`, { cache: "no-store" }),
        fetch(`/api/user/${uid}/getAddress`, { cache: "no-store" }),
      ]);

      if (!userRes.ok || !addrRes.ok)
        throw new Error("Failed to fetch profile data");

      const userData = await userRes.json();
      const addressesData: Address[] = await addrRes.json();

      setUser({
        ...userData,
        addresses: addressesData ?? [],
      });
    } catch (err) {
      console.error("[ProfileContext] fetch error:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Refresh function (can be called manually)
  const refreshProfile = async () => {
    if (!session?.user?.id) return;
    const res = await fetch("/api/user/current");
    if (!res.ok) return console.error("Failed to fetch current user");

    const data = await res.json();
    await fetchProfile(data.id);
  };

  // Handle session changes
  useEffect(() => {
    if (status === "loading") return; // avoid firing early

    if (status === "unauthenticated") {
      // not logged in
      setUser(null);
      setLoading(false);
      return;
    }

    // when authenticated
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch("/api/user/current", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch current user");
        const data = await res.json();
        if (data?.id) await fetchProfile(data.id);
      } catch (err) {
        console.error("Error fetching current user:", err);
        setUser(null);
      }
    };

    fetchCurrentUser();
  }, [status]);

  return (
    <ProfileContext.Provider value={{ user, loading, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

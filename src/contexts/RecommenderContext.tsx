"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

const RecommenderContext = createContext<any>(null);

export function RecommenderProvider({ children }: any) {
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [locationProducts, setLocationProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const { data: userSession } = useSession();

  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingTrending, setLoadingTrending] = useState(false);

  // Only fetch once on first load
  useEffect(() => {
    fetchRecommended();
    fetchLocation();
    fetchTrending();
  }, [userSession]);

  const fetchRecommended = async () => {
    try {
      setLoadingRecommended(true);
      const res = await fetch("/api/recommend/for-you");
      const data = await res.json();
      console.log("For u: ", data);
      // Cold Start: No history → call cold-start API
      if (!data.recommended || data.recommended.length === 0) {
        const coldRes = await fetch("/api/recommend/cold-start");
        const coldData = await coldRes.json();
        console.log("Cold Data: ", coldData);
        setRecommendedProducts(coldData.recommended || []);
        return;
      }

      // Normal Recommendation
      setRecommendedProducts(data.recommended || []);
    } catch (e) {
      console.error("Failed to fetch recommended products:", e);
    } finally {
      setLoadingRecommended(false);
    }
  };

  const fetchLocation = async () => {
    try {
      setLoadingLocation(true);
      const res = await fetch("/api/recommend/location");
      const data = await res.json();
      setLocationProducts(data.recommended || []);
    } catch (e) {
      console.error("Failed to fetch location products:", e);
    } finally {
      setLoadingLocation(false);
    }
  };

  const fetchTrending = async () => {
    try {
      setLoadingTrending(true);
      const res = await fetch("/api/recommend/trending");
      const data = await res.json();
      console.log("Trending: ", data);
      setTrendingProducts(data.recommended || []);
    } catch (e) {
      console.error("Failed to fetch trending products:", e);
    } finally {
      setLoadingTrending(false);
    }
  };

  return (
    <RecommenderContext.Provider
      value={{
        recommendedProducts,
        locationProducts,
        trendingProducts,
        loadingRecommended,
        loadingLocation,
        loadingTrending,
        refetchRecommended: fetchRecommended,
        refetchLocation: fetchLocation,
        refetchTrending: fetchTrending,
      }}
    >
      {children}
    </RecommenderContext.Provider>
  );
}

export function useRecommenders() {
  return useContext(RecommenderContext);
}

"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Category = {
  id: string;
  name: string;
  parentId?: string | null;
  children?: { id: string; name: string; parentId?: string | null }[];
};

type CategoryContextType = {
  categories: Category[];
  isLoading: boolean;
  refreshCategories: () => Promise<void>;
};

const CategoryContext = createContext<CategoryContextType | undefined>(
  undefined
);

export const CategoryProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        "/api/category?level=main&includeChildren=true"
      );
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <CategoryContext.Provider
      value={{
        categories,
        isLoading,
        refreshCategories: fetchCategories,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context)
    throw new Error("useCategories must be used within a CategoryProvider");
  return context;
};

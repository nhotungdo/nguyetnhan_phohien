import { useState, useEffect } from "react";
import { productApi } from "@/services/api.service";
import type { ProductResponse } from "@/types/api.types";

export function useProducts() {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productApi.getAllPublic();
        setProducts(data);
      } catch (err) {
        console.warn("Failed to load products:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, isLoading };
}

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { productApi } from "@/services/api.service";
import { useCartStore } from "@/stores/useCartStore";

export function useProducts() {
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ["products", "public"],
    queryFn: () => productApi.getAllPublic(),
    // Luôn refetch khi chuyển tab hoặc vào lại landing page sau khi sửa CMS
    staleTime: 5 * 1000,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
  });

  const syncProductPrices = useCartStore((s) => s.syncProductPrices);

  useEffect(() => {
    if (products.length > 0) {
      syncProductPrices(products);
    }
  }, [products, syncProductPrices]);

  return { products, isLoading, error };
}


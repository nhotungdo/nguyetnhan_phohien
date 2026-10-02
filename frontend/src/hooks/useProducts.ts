import { useQuery } from "@tanstack/react-query";
import { productApi } from "@/services/api.service";

export function useProducts() {
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ["products", "public"],
    queryFn: () => productApi.getAllPublic(),
  });

  return { products, isLoading, error };
}


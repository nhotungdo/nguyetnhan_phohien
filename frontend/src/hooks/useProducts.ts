import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { productApi } from "@/services/api.service";
import { useCartStore } from "@/stores/useCartStore";

export function useProducts() {
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ["products", "public"],
    queryFn: () => productApi.getAllPublic(),
    // Cập nhật chính chủ đến qua SignalR (useRealtimeSync → invalidate). staleTime ngắn
    // hơn global (5 phút) chỉ là LƯỚI CHỐNG RƠI: nếu mạng chặn WebSocket/SignalR thì
    // quay lại trang sau 60 giây vẫn tự tải lại thay vì giữ bản cũ tới 5 phút.
    staleTime: 60 * 1000,
  });

  const syncProductPrices = useCartStore((s) => s.syncProductPrices);

  useEffect(() => {
    if (products.length > 0) {
      syncProductPrices(products);
    }
  }, [products, syncProductPrices]);

  return { products, isLoading, error };
}


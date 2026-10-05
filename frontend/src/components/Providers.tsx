
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

function RealtimeSync() {
  // Tách thành component con để dùng useQueryClient() đã có trong Provider.
  // Mỗi thay đổi sản phẩm/ảnh/nội dung từ backend sẽ invalidate query tương ứng
  // → trang đang mở tự cập nhật ngay, không cần refresh.
  useRealtimeSync();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeSync />
      {children}
    </QueryClientProvider>
  );
}

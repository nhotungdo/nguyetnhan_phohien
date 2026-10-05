"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as signalR from "@microsoft/signalr";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

/** Delay thử kết nối lại khi hub đóng (backend chưa chạy / reset). */
const RESTART_DELAY_MS = 10_000;

/**
 * Đồng bộ REALTIME danh sách sản phẩm / ảnh / nội dung CMS xuống mọi client.
 *
 * Backend phát "ProductsChanged" (ProductsController) và "ContentChanged"
 * (ContentController) ngay sau khi admin lưu/ upload/ xóa. Client không cần
 * refetch định kỳ hay F5: chỉ invalidate React Query → query đang hiển thị
 * tự tải lại bản mới nhất (hoặc lấy ngay từ cache khi quay lại trang).
 *
 * Kết nối 1 lần duy nhất cho cả app (mount trong Providers), tự nối lại khi
 * mất mạng và bù các sự kiện bỏ lỡ bằng invalidate sau khi reconnect.
 * Mọi lỗi (backend chưa chạy, mạng chặn WebSocket) đều im lặng — REST vẫn
 * hoạt động bình thường, chỉ mất phần realtime.
 */
export function useRealtimeSync() {
  // QueryClient do Providers tạo bằng useState nên ổn định suốt vòng đời app:
  // closure trong effect luôn dùng đúng client mà không cần ref ghi đè khi render.
  const queryClient = useQueryClient();

  useEffect(() => {
    let disposed = false;
    let restartTimer: ReturnType<typeof setTimeout> | null = null;

    const invalidateAll = () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["website", "content"] });
    };

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_URL}/hubs/products`, { withCredentials: true })
      // Không thử lại quá dày: nếu backend tắt thì cứ 10s mới start() 1 lần.
      .withAutomaticReconnect([0, 2_000, 5_000, 10_000, 30_000])
      .configureLogging(signalR.LogLevel.None)
      .build();

    connection.on("ProductsChanged", () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    });

    connection.on("ContentChanged", () => {
      queryClient.invalidateQueries({ queryKey: ["website", "content"] });
    });

    // Mất kết nối trong lúc đó có thể bỏ lỡ sự kiện → sau khi nối lại thì tải lại cả hai.
    connection.onreconnected(() => invalidateAll());

    const scheduleRestart = () => {
      if (disposed || restartTimer) return;
      restartTimer = setTimeout(() => {
        restartTimer = null;
        connection.start().catch(() => scheduleRestart());
      }, RESTART_DELAY_MS);
    };

    connection.onclose(() => {
      if (!disposed) scheduleRestart();
    });

    connection.start().catch(() => {
      // Backend chưa lên / CORS / WS bị chặn → thử lại sau, không báo lỗi ra UI.
      if (!disposed) scheduleRestart();
    });

    return () => {
      disposed = true;
      if (restartTimer) clearTimeout(restartTimer);
      // Nuốt lỗi "connection was stopped during negotiation" khi unmount giữa chừng.
      connection.stop().catch(() => {});
    };
  }, [queryClient]);
}

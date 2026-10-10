"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import * as signalR from "@microsoft/signalr";
import { adminAuth } from "@/services/api.service";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

/** Delay thử kết nối lại khi hub đóng (backend chưa chạy / reset). */
const RESTART_DELAY_MS = 10_000;

/**
 * Đồng bộ REALTIME danh sách sản phẩm / ảnh / nội dung CMS / đơn hàng / phiên chat
 * xuống mọi client.
 *
 * Backend phát:
 *   - ProductsChanged (ProductsController) — sản phẩm/ảnh
 *   - ContentChanged  (ContentController)  — nội dung CMS
 *   - OrdersChanged   (OrdersController)   — đơn mới / đổi trạng thái
 *   - SessionsChanged (ChatController, ChatHub) — phiên chat mới / tin nhắn mới
 *
 * Trước đây chỉ có 2 sự kiện đầu: trang Đơn hàng (["orders","admin"]) và Tổng quan
 * (["dashboard","stats"]) không có sự kiện nào nên chỉ tải MỘT LẦN lúc mount
 * (staleTime toàn cục 5 phút + refetchOnWindowFocus=false) → phải F5 mới thấy đơn mới.
 *
 * OrdersChanged/SessionsChanged là thông tin vận hành nội bộ nên backend chỉ phát
 * vào group "Admins"; tab Admin phải JoinAsAdmin (JWT role Admin) mới nhận được.
 * Việc join lỗi (chưa đăng nhập) được bỏ qua im lặng — khách vẫn nhận products/content.
 */
export function useRealtimeSync() {
  // QueryClient do Providers tạo bằng useState nên ổn định suốt vòng đời app:
  // closure trong effect luôn dùng đúng client mà không cần ref ghi đè khi render.
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    let disposed = false;
    let restartTimer: ReturnType<typeof setTimeout> | null = null;

    const invalidateAll = () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["website", "content"] });
      queryClient.invalidateQueries({ queryKey: ["orders", "admin"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    };

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_URL}/hubs/products`, {
        withCredentials: true,
        // Token admin để JoinAsAdmin nhận sự kiện đơn hàng/phiên chat.
        accessTokenFactory: () => adminAuth.getToken() || "",
      })
      // Không thử lại quá dày: nếu backend tắt thì cứ 10s mới start() 1 lần.
      .withAutomaticReconnect([0, 2_000, 5_000, 10_000, 30_000])
      .configureLogging(signalR.LogLevel.None)
      .build();

    /**
     * Vào group Admins nếu đang có JWT. Lỗi (chưa đăng nhập / token hết hạn) không
     * phải sự cố: khách vẫn nhận products/content bình thường.
     */
    const joinAdminIfLoggedIn = async () => {
      if (!adminAuth.isLoggedIn()) return;
      try {
        await connection.invoke("JoinAsAdmin");
      } catch {
        /* không có quyền admin — bỏ qua */
      }
    };

    connection.on("ProductsChanged", () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    });

    connection.on("ContentChanged", () => {
      queryClient.invalidateQueries({ queryKey: ["website", "content"] });
    });

    // Đơn mới / đổi trạng thái đơn → cả trang Đơn hàng lẫn Tổng quan tải lại ngay
    connection.on("OrdersChanged", () => {
      queryClient.invalidateQueries({ queryKey: ["orders", "admin"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    });

    // Phiên chat mới / có tin nhắn / đổi trạng thái → Tổng quan cập nhật số liệu
    connection.on("SessionsChanged", () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    });

    // Mất kết nối trong lúc đó có thể bỏ lỡ sự kiện → sau khi nối lại thì tải lại cả.
    connection.onreconnected(async () => {
      invalidateAll();
      // Connection id mới => mất membership group cũ, phải join lại.
      await joinAdminIfLoggedIn();
    });

    const scheduleRestart = () => {
      if (disposed || restartTimer) return;
      restartTimer = setTimeout(() => {
        restartTimer = null;
        connection
          .start()
          .then(() => {
            connectionRef.current = connection;
            return joinAdminIfLoggedIn();
          })
          .catch(() => scheduleRestart());
      }, RESTART_DELAY_MS);
    };

    connection.onclose(() => {
      if (!disposed) scheduleRestart();
    });

    connection
      .start()
      .then(async () => {
        connectionRef.current = connection;
        await joinAdminIfLoggedIn();
      })
      .catch(() => {
        // Backend chưa lên / CORS / WS bị chặn → thử lại sau, không báo lỗi ra UI.
        if (!disposed) scheduleRestart();
      });

    return () => {
      disposed = true;
      if (restartTimer) clearTimeout(restartTimer);
      connectionRef.current = null;
      // Nuốt lỗi "connection was stopped during negotiation" khi unmount giữa chừng.
      connection.stop().catch(() => {});
    };
  }, [queryClient]);

  // Đăng nhập admin xong app điều hướng nội bộ (router.push), KHÔNG reload trang →
  // kết nối SignalR đã mở từ trước vẫn không có token nên chưa vào group Admins.
  // Join lại mỗi khi đổi route để tab admin nhận được sự kiện đơn hàng/phiên chat.
  useEffect(() => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) return;
    if (!adminAuth.isLoggedIn()) return;
    connection.invoke("JoinAsAdmin").catch(() => {});
  }, [pathname]);
}

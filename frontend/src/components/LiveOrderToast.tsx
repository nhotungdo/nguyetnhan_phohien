"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, ShoppingBag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { FastImage } from "@/components/FastImage";
import { orderApi } from "@/services/api.service";
import type { RecentOrderActivity } from "@/types/api.types";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050").replace(/\/+$/, "");

const resolveImageUrl = (path?: string) => {
  if (!path) return "/images/setqua.jpg";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  if (path.startsWith("/images/")) {
    return path;
  }
  return `${API_URL}/${path.replace(/^\/+/, "")}`;
};

// Dữ liệu dự phòng mẫu chuẩn khi DB hoàn toàn chưa có đơn nào
const FALLBACK_ORDERS: RecentOrderActivity[] = [
  {
    id: "ord-fb-1",
    customerName: "Chị Thu H*",
    location: "Cầu Giấy, Hà Nội",
    productName: "Set Quà Hoàng Kim Nguyệt Nhãn",
    productImage: "/images/setqua.jpg",
    quantity: 1,
    timeAgo: "2 phút trước",
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: "ord-fb-2",
    customerName: "Anh Minh Đ*",
    location: "Quận 1, TP. Hồ Chí Minh",
    productName: "Tự Phối Hũ Quà Độc Bản 500g",
    productImage: "/images/setqua3.jpg",
    quantity: 2,
    timeAgo: "5 phút trước",
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: "ord-fb-3",
    customerName: "Cô Mai T*",
    location: "TP. Hưng Yên",
    productName: "Long Nhãn Ôm Sen Tiến Vua",
    productImage: "/images/hopnhua.jpg",
    quantity: 3,
    timeAgo: "12 phút trước",
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
];

interface LiveOrderToastProps {
  isChatOpen?: boolean;
}

export function LiveOrderToast({ isChatOpen = false }: LiveOrderToastProps) {
  // 1. Tải danh sách đơn hàng thực tế từ cơ sở dữ liệu
  const { data: dbOrders } = useQuery<RecentOrderActivity[]>({
    queryKey: ["orders", "recent-activities"],
    queryFn: () => orderApi.getRecentActivities(12),
    staleTime: 60 * 1000,
    retry: 1,
  });

  const [realtimeOrder, setRealtimeOrder] = useState<RecentOrderActivity | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const isFirstMountRef = useRef(true);

  // Tổng hợp danh sách đơn: ưu tiên đơn từ DB, nếu DB trống dùng fallback
  const activeOrders = useMemo(() => {
    const list: RecentOrderActivity[] = [];
    if (realtimeOrder) {
      list.push(realtimeOrder);
    }
    if (dbOrders && dbOrders.length > 0) {
      list.push(...dbOrders.filter((o) => o.id !== realtimeOrder?.id));
    } else if (list.length === 0) {
      list.push(...FALLBACK_ORDERS);
    }
    return list;
  }, [dbOrders, realtimeOrder]);

  // 2. Lắng nghe đơn hàng mới đặt realtime (từ SignalR hoặc form đặt hàng)
  useEffect(() => {
    const handleNewOrder = (e: Event) => {
      const customEvt = e as CustomEvent<RecentOrderActivity>;
      if (customEvt.detail) {
        setRealtimeOrder(customEvt.detail);
        setCurrentIndex(0);
        setIsVisible(true);
      }
    };

    window.addEventListener("nn_public_order_placed", handleNewOrder);
    return () => {
      window.removeEventListener("nn_public_order_placed", handleNewOrder);
    };
  }, []);

  // 3. Chu kỳ luân phiên hiển thị: Hiện 6.5 giây, ẩn nghỉ 14 giây rồi đổi sang đơn kế tiếp
  useEffect(() => {
    if (isDismissed || isChatOpen || activeOrders.length === 0) {
      setIsVisible(false);
      return;
    }

    let timer: ReturnType<typeof setTimeout>;

    if (isVisible) {
      // Đang hiển thị: giữ 6.5 giây rồi ẩn
      timer = setTimeout(() => {
        setIsVisible(false);
      }, 6500);
    } else {
      // Đang ẩn: lần đầu chờ 4 giây, các lần sau chờ 14 giây rồi đổi sang đơn kế tiếp và hiện
      const delay = isFirstMountRef.current ? 4000 : 14000;
      timer = setTimeout(() => {
        isFirstMountRef.current = false;
        setCurrentIndex((prev) => (prev + 1) % activeOrders.length);
        setIsVisible(true);
      }, delay);
    }

    return () => clearTimeout(timer);
  }, [isVisible, isDismissed, isChatOpen, activeOrders.length]);

  if (isDismissed || isChatOpen || activeOrders.length === 0) return null;

  const currentOrder = activeOrders[currentIndex % activeOrders.length];
  if (!currentOrder) return null;

  return (
    <div className="fixed bottom-24 sm:bottom-6 left-3 sm:left-6 z-40 pointer-events-none">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 shadow-xl border border-amber-300/80 max-w-[310px] sm:max-w-xs flex items-center gap-3 relative select-none"
          >
            {/* Ảnh sản phẩm thật từ đơn hàng */}
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-amber-50 border border-amber-200/60 shrink-0">
              <FastImage
                src={resolveImageUrl(currentOrder.productImage)}
                alt={currentOrder.productName}
                fill
                sizes="48px"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                <CheckCircle2 className="w-2.5 h-2.5 text-white" />
              </span>
            </div>

            {/* Chi tiết khách hàng & sản phẩm từ Database */}
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                <span className="font-bold text-stone-900 truncate">{currentOrder.customerName}</span>
                <span>•</span>
                <span className="truncate">{currentOrder.location}</span>
              </div>
              <div className="text-xs font-bold text-amber-950 truncate mt-0.5">
                {currentOrder.quantity > 1 ? `${currentOrder.quantity}x ` : ""}
                {currentOrder.productName}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-amber-700 font-medium mt-0.5">
                <ShoppingBag className="w-3 h-3 text-amber-600 shrink-0" />
                <span className="truncate">Vừa đặt mua · {currentOrder.timeAgo || "Gần đây"}</span>
              </div>
            </div>

            {/* Nút đóng thông báo */}
            <button
              onClick={() => setIsDismissed(true)}
              className="absolute top-2 right-2 text-stone-400 hover:text-stone-700 p-1 rounded-full transition-colors"
              aria-label="Đóng thông báo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

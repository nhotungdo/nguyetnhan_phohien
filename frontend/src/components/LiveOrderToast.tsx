"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, ShoppingBag } from "lucide-react";
import { FastImage } from "@/components/FastImage";

interface OrderNotification {
  id: string;
  customer: string;
  location: string;
  product: string;
  timeAgo: string;
  image: string;
}

const SAMPLE_ORDERS: OrderNotification[] = [
  {
    id: "ord-1",
    customer: "Chị Thu Hà",
    location: "Cầu Giấy, Hà Nội",
    product: "Set Quà Hoàng Kim Nguyệt Nhãn",
    timeAgo: "2 phút trước",
    image: "/images/setqua.jpg",
  },
  {
    id: "ord-2",
    customer: "Anh Minh Đức",
    location: "Quận 1, TP. Hồ Chí Minh",
    product: "Tự Phối Hũ Quà Độc Bản 500g",
    timeAgo: "5 phút trước",
    image: "/images/setqua3.jpg",
  },
  {
    id: "ord-3",
    customer: "Cô Thanh Mai",
    location: "TP. Hưng Yên",
    product: "2 Hộp Long Nhãn Ôm Sen Tiến Vua",
    timeAgo: "8 phút trước",
    image: "/images/hopnhua.jpg",
  },
  {
    id: "ord-4",
    customer: "Bác Quốc Tuấn",
    location: "Hải Châu, Đà Nẵng",
    product: "Lễ Hộp Tri Kỷ Thượng Hạng",
    timeAgo: "12 phút trước",
    image: "/images/setqua.jpg",
  },
];

interface LiveOrderToastProps {
  isChatOpen?: boolean;
}

export function LiveOrderToast({ isChatOpen = false }: LiveOrderToastProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (isDismissed || isChatOpen) {
      setIsVisible(false);
      return;
    }

    // Lần đầu hiện sau 7 giây
    const initialTimer = setTimeout(() => {
      setIsVisible(true);
    }, 7000);

    // Chu kỳ xuất hiện sau mỗi 22 giây, tự ẩn sau 6 giây
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % SAMPLE_ORDERS.length);
        setIsVisible(true);
      }, 1000);
    }, 22000);

    // Tự động ẩn sau 6 giây mỗi lần hiện
    const autoHide = setInterval(() => {
      setIsVisible(false);
    }, 22000 + 6000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      clearInterval(autoHide);
    };
  }, [isDismissed, isChatOpen]);

  if (isDismissed || isChatOpen) return null;

  const currentOrder = SAMPLE_ORDERS[currentIndex];

  return (
    <div className="fixed bottom-24 sm:bottom-6 left-3 sm:left-6 z-40 pointer-events-none">
      <AnimatePresence>
        {isVisible && currentOrder && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 shadow-xl border border-amber-300/80 max-w-[310px] sm:max-w-xs flex items-center gap-3 relative select-none"
          >
            {/* Ảnh sản phẩm vừa đặt */}
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-amber-50 border border-amber-200/60 shrink-0">
              <FastImage
                src={currentOrder.image}
                alt={currentOrder.product}
                fill
                sizes="48px"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                <CheckCircle2 className="w-2.5 h-2.5 text-white" />
              </span>
            </div>

            {/* Chi tiết người mua & sản phẩm */}
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                <span className="font-bold text-stone-900 truncate">{currentOrder.customer}</span>
                <span>•</span>
                <span className="truncate">{currentOrder.location}</span>
              </div>
              <div className="text-xs font-bold text-amber-950 truncate mt-0.5">
                {currentOrder.product}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-amber-700/90 font-medium mt-0.5">
                <ShoppingBag className="w-3 h-3 text-amber-600" />
                <span>Vừa đặt mua · {currentOrder.timeAgo}</span>
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

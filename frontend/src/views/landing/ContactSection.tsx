"use client";

import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  MessageCircle,
  Phone,
  ShoppingCart,
  ShoppingBag,
  Send,
  Loader2,
  AlertCircle,
  Leaf,
  Headphones,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { EASE_OUT_EXPO, Reveal } from "@/components/LandingMotion";
import { FastImage } from "@/components/FastImage";
import { CartButton } from "@/components/cart";
import { NutritionAiWidget } from "@/components/NutritionAiWidget";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { useLiveChat } from "@/hooks/useLiveChat";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useWebsiteContent } from "@/hooks/useWebsiteContent";
import { useCartStore } from "@/stores/useCartStore";
import { scrollToSection } from "@/lib/scrollToSection";
import { resolveCmsImage } from "@/lib/cmsImage";

export function ContactSection() {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const [isScrolled, setIsScrolled] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMode, setChatMode] = useState<"ai" | "human">("ai");
  const [chatInput, setChatInput] = useState("");
  const [chatSendError, setChatSendError] = useState(false);
  const [visualHeight, setVisualHeight] = useState<number | null>(null);
  const [visualTop, setVisualTop] = useState<number>(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const [guestName, setGuestName] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return localStorage.getItem("chatGuestName") || sessionStorage.getItem("chatGuestName") || "";
    } catch {
      return "";
    }
  });

  const [guestPhone, setGuestPhone] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return localStorage.getItem("chatGuestPhone") || sessionStorage.getItem("chatGuestPhone") || "";
    } catch {
      return "";
    }
  });

  const [chatStarted, setChatStarted] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return !!(
        (localStorage.getItem("chatSessionId") && localStorage.getItem("chatSessionToken")) ||
        (sessionStorage.getItem("chatSessionId") && sessionStorage.getItem("chatSessionToken"))
      );
    } catch {
      return false;
    }
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { t, language } = useLanguageStore();
  const { content: cmsContent } = useWebsiteContent();

  const {
    messages,
    connectionStatus,
    retryConnect,
    isSending,
    isAdminTyping,
    unreadCount,
    isSessionTerminated,
    connect,
    notifyTyping,
    markMessagesRead,
    sendMessage,
  } = useLiveChat();

  const { openCart, closeCart, getTotalItems } = useCartStore();
  const totalCartItems = isMounted ? getTotalItems() : 0;
  const isCartDrawerOpen = useCartStore((s) => s.isOpen);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const next = window.scrollY > 50;
          setIsScrolled((prev) => (prev !== next ? next : prev));
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isChatOpen]);

  useEffect(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    const shouldLock = isChatOpen && isMobile;
    if (!shouldLock) return;

    const scrollY = window.scrollY;
    const prevPosition = document.body.style.position;
    const prevTop = document.body.style.top;
    const prevWidth = document.body.style.width;
    const prevOverflow = document.body.style.overflow;

    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.position = prevPosition;
      document.body.style.top = prevTop;
      document.body.style.width = prevWidth;
      document.body.style.overflow = prevOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [isChatOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const vv = window.visualViewport;
    const updateViewport = () => {
      const isMobile = window.innerWidth < 640;
      if (!isMobile || !isChatOpen) {
        setVisualHeight(null);
        setVisualTop(0);
        setIsKeyboardOpen(false);
        return;
      }

      if (vv) {
        setVisualHeight(vv.height);
        setVisualTop(vv.offsetTop);
        const keyboardActive = vv.height < window.innerHeight * 0.85;
        setIsKeyboardOpen(keyboardActive);
      } else {
        setVisualHeight(window.innerHeight);
        setVisualTop(0);
        setIsKeyboardOpen(false);
      }
    };

    updateViewport();

    if (vv) {
      vv.addEventListener("resize", updateViewport);
      vv.addEventListener("scroll", updateViewport);
    }
    window.addEventListener("resize", updateViewport);

    return () => {
      if (vv) {
        vv.removeEventListener("resize", updateViewport);
        vv.removeEventListener("scroll", updateViewport);
      }
      window.removeEventListener("resize", updateViewport);
    };
  }, [isChatOpen]);

  useEffect(() => {
    if (!isChatOpen || !chatStarted) return;
    markMessagesRead();
  }, [isChatOpen, chatStarted, messages, markMessagesRead]);

  useEffect(() => {
    try {
      const storedId = localStorage.getItem("chatSessionId") || sessionStorage.getItem("chatSessionId");
      const storedToken =
        localStorage.getItem("chatSessionToken") || sessionStorage.getItem("chatSessionToken");
      if (storedId && storedToken) {
        const storedName =
          localStorage.getItem("chatGuestName") || sessionStorage.getItem("chatGuestName");
        const storedPhone =
          localStorage.getItem("chatGuestPhone") || sessionStorage.getItem("chatGuestPhone");
        connect(storedName || undefined, storedPhone || undefined);
      }
    } catch {
      // storage unavailable
    }
  }, [connect]);

  const handleOpenCart = () => {
    setIsChatOpen(false);
    openCart();
  };

  const handleOpenChat = () => {
    closeCart();
    setIsChatOpen(true);
    if (chatStarted) {
      connect(guestName || undefined, guestPhone || undefined);
    }
  };

  const handleToggleChat = () => {
    const next = !isChatOpen;
    if (next) {
      closeCart();
    }
    setIsChatOpen(next);
    if (next && chatStarted) {
      connect(guestName || undefined, guestPhone || undefined);
    }
  };

  const handleStartChat = async () => {
    if (!guestName.trim()) return;
    try {
      localStorage.setItem("chatGuestName", guestName.trim());
      sessionStorage.setItem("chatGuestName", guestName.trim());
      if (guestPhone.trim()) {
        localStorage.setItem("chatGuestPhone", guestPhone.trim());
        sessionStorage.setItem("chatGuestPhone", guestPhone.trim());
      }
    } catch {
      // ignore
    }
    setChatStarted(true);
    await connect(guestName, guestPhone);
  };

  const handleSendChatMessage = async () => {
    const text = chatInput.trim();
    if (!text || isSending) return;
    setChatSendError(false);
    setChatInput("");
    const ok = await sendMessage(text, guestName, guestPhone);
    if (!ok) {
      setChatInput(text);
      setChatSendError(true);
    }
  };

  const lastGuestMessageIndex = messages.reduce(
    (acc, msg, idx) => (msg.senderType === "Guest" ? idx : acc),
    -1
  );

  return (
    <>
      {/* 14. Footer — Xanh Ngọc Bích Đêm & Vàng Kim */}
      <footer
        id="lien-he"
        className="bg-[#09231B] text-[#FAF8F5] py-16 border-t border-[#1D4D3E] overflow-hidden w-full max-w-full [contain:paint]"
      >
        <div className="container mx-auto px-4 md:px-6 w-full max-w-full">
          <Reveal y={30}>
            <div className="grid md:grid-cols-4 gap-8 md:gap-12">
              <div className="space-y-4 md:col-span-1">
                <h3
                  style={{ fontFamily: "var(--font-dancing), cursive" }}
                  className="text-[32px] sm:text-[38px] font-bold text-[#F3D498] flex items-center gap-3"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white flex items-center justify-center text-accent font-sans font-bold text-xs overflow-hidden border border-[#F3D498]/40 shadow-md relative shrink-0">
                    <span className="absolute">NN</span>
                    <FastImage
                      src={resolveCmsImage(cmsContent.SiteLogo) || "/images/logo_emblem_circle.png"}
                      fallbackSrc="/logo.jpg"
                      alt="Nguyệt Nhãn Phố Hiến"
                      fill
                      sizes="64px"
                      className="w-full h-full object-contain p-0.5 z-10"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                  <span className="leading-tight">Nguyệt Nhãn Phố Hiến</span>
                </h3>
                <p className="text-[#B5C4BC] text-sm leading-relaxed">
                  {language === "en"
                    ? "The brand providing authentic Pho Hien Dried Longan specialty. 100% natural, no preservatives, preserving traditional flavors."
                    : "Thương hiệu cung cấp đặc sản Long Nhãn Phố Hiến chính gốc. Cam kết 100% tự nhiên, không chất bảo quản, giữ trọn hương vị truyền thống."}
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-bold text-[#F3D498]">{t.nav.contact}</h4>
                <ul className="space-y-2 text-[#B5C4BC] text-sm">
                  <li>Hotline/Zalo: {cmsContent.FooterHotline || "034 897 3285"}</li>
                  <li>Email: {cmsContent.ContactEmail || "nguyetnhanphohien@gmail.com"}</li>
                  <li>
                    {language === "en" ? "Address" : "Địa chỉ"}:{" "}
                    {cmsContent.FooterAddress ||
                      (language === "en"
                        ? "123 Pho Hien, Hong Chau Ward, Hung Yen City"
                        : "123 Phố Hiến, Phường Hồng Châu, Tp. Hưng Yên")}
                  </li>
                  <li>
                    {language === "en" ? "Opening hours" : "Giờ mở cửa"}:{" "}
                    {cmsContent.ContactHours ||
                      (language === "en" ? "08:00 - 20:00 (Mon-Sun)" : "08:00 - 20:00 (T2-CN)")}
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-bold text-[#F3D498]">
                  {language === "en" ? "Navigation" : "Điều Hướng"}
                </h4>
                <ul className="space-y-2 text-[#B5C4BC] text-sm flex flex-col items-start">
                  <li>
                    <button
                      onClick={() => scrollToSection("san-pham")}
                      className="hover:text-[#F3D498] transition-colors text-left cursor-pointer"
                    >
                      {t.nav.products}
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => scrollToSection("cau-chuyen")}
                      className="hover:text-[#F3D498] transition-colors text-left cursor-pointer"
                    >
                      {t.nav.story}
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => scrollToSection("lich-su")}
                      className="hover:text-[#F3D498] transition-colors text-left cursor-pointer"
                    >
                      {t.history.title}
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => scrollToSection("am-thuc")}
                      className="hover:text-[#F3D498] transition-colors text-left cursor-pointer"
                    >
                      {t.nav.cuisine || (language === "en" ? "Pho Hien Cuisine" : "Ẩm Thực Phố Hiến")}
                    </button>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-bold text-[#F3D498]">
                  {language === "en" ? "Policies" : "Chính Sách"}
                </h4>
                <ul className="space-y-2 text-[#B5C4BC] text-sm flex flex-col items-start">
                  <li>
                    <Link
                      href="/chinh-sach/giao-hang"
                      prefetch={true}
                      className="hover:text-[#F3D498] transition-colors text-left"
                    >
                      {language === "en" ? "Shipping Policy" : "Chính sách giao hàng"}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/chinh-sach/doi-tra"
                      prefetch={true}
                      className="hover:text-[#F3D498] transition-colors text-left"
                    >
                      {language === "en" ? "Return Policy" : "Chính sách đổi trả"}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/chinh-sach/bao-mat"
                      prefetch={true}
                      className="hover:text-[#F3D498] transition-colors text-left"
                    >
                      {language === "en" ? "Privacy Policy" : "Bảo mật thông tin"}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/chinh-sach/kiem-dinh"
                      prefetch={true}
                      className="hover:text-[#F3D498] transition-colors text-left"
                    >
                      {language === "en" ? "Quality Inspection" : "Kiểm định chất lượng"}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </Reveal>

          <div className="border-t border-[#1D4D3E] mt-12 pt-8 text-center text-[#B5C4BC] text-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-4 items-center">
              <a
                href="https://www.facebook.com/NguyetNhanPhoHien"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#0E2E24] border border-[#1D4D3E] flex items-center justify-center hover:bg-accent hover:border-accent hover:-translate-y-1 transition-all text-white group"
                title="Facebook"
              >
                <svg
                  className="w-5 h-5 fill-current group-hover:scale-110 transition-transform"
                  viewBox="0 0 24 24"
                >
                  <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
                </svg>
              </a>
              <a
                href="https://zalo.me/0982072601"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#0E2E24] border border-[#1D4D3E] flex items-center justify-center hover:bg-accent hover:border-accent hover:-translate-y-1 transition-all text-white group"
                title="Zalo"
              >
                <svg
                  className="w-5 h-5 fill-none stroke-current group-hover:scale-110 transition-transform"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 11.5C21 16.19 16.97 20 12 20C10.87 20 9.8 19.8 8.8 19.45C8.42 19.32 8.02 19.29 7.63 19.36L4.7 19.92C4.16 20.02 3.65 19.51 3.75 18.97L4.31 16.04C4.38 15.65 4.35 15.25 4.22 14.87C3.87 13.87 3.67 12.8 3.67 11.67C3.67 6.98 7.7 3.17 12.67 3.17C17.64 3.17 21 6.98 21 11.5Z" />
                  <text
                    x="12"
                    y="15"
                    fontFamily="Arial"
                    fontSize="7"
                    fontWeight="bold"
                    fill="currentColor"
                    stroke="none"
                    textAnchor="middle"
                  >
                    Zalo
                  </text>
                </svg>
              </a>
              <a
                href="https://www.instagram.com/Nguy%E1%BB%87t%20Nh%C3%A3n%20Ph%E1%BB%91%20Hi%E1%BA%BFn"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#0E2E24] border border-[#1D4D3E] flex items-center justify-center hover:bg-accent hover:border-accent hover:-translate-y-1 transition-all text-white group"
                title="Instagram"
              >
                <svg
                  className="w-5 h-5 fill-none stroke-current group-hover:scale-110 transition-transform"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a
                href="https://www.tiktok.com/@nguyetnhan888?_r=1&_t=ZS-99nuoBxZRau"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#0E2E24] border border-[#1D4D3E] flex items-center justify-center hover:bg-accent hover:border-accent hover:-translate-y-1 transition-all text-white group"
                title="Tiktok"
              >
                <svg
                  className="w-5 h-5 fill-current group-hover:scale-110 transition-transform"
                  viewBox="0 0 24 24"
                >
                  <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.24-2.61.94-5.26 3.15-6.81 1.76-1.23 4-1.67 6.13-1.25V9.41c-1.31-.22-2.64-.17-3.92.2-1.57.46-2.94 1.48-3.79 2.85-.92 1.45-1.13 3.32-.61 4.96.48 1.48 1.54 2.82 2.93 3.48 1.63.76 3.63.76 5.25-.13 1.99-1.07 3.2-3.23 3.19-5.49-.04-4.84-.01-9.68-.01-14.52H12.53z" />
                </svg>
              </a>
            </div>
            <p className="text-center md:text-right">
              {language !== "en" && cmsContent.FooterText
                ? cmsContent.FooterText
                : `© 2026 Nguyệt Nhãn Phố Hiến. ${t.footer.rights}`}
            </p>
          </div>
        </div>
      </footer>

      {/* 14.5. Nút Chat Trực Tuyến & Chuyên Gia AI Dinh Dưỡng */}
      {!isChatOpen && (
        <div
          className={`fixed z-50 flex flex-col items-end transition-all ${
            isScrolled
              ? "bottom-20 right-3.5 sm:bottom-6 sm:right-6"
              : "bottom-5 right-3.5 sm:bottom-6 sm:right-6"
          } flex`}
        >
          <motion.button
            id="chat-floating-button"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleToggleChat}
            className="relative w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#B45309] to-[#D97706] text-white rounded-full shadow-2xl flex items-center justify-center hover:opacity-95 focus:outline-none focus:ring-4 focus:ring-[#B45309]/30"
            aria-label={language === "en" ? "Open customer support live chat" : "Mở chat tư vấn trực tuyến"}
          >
            <span
              aria-hidden
              className="absolute inset-0 rounded-full border-2 border-amber-500 animate-pulse-ring"
            />
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white shadow-lg border-2 border-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </motion.button>
        </div>
      )}

      {/* Cửa sổ chat */}
      <AnimatePresence>
        {isChatOpen && !isCartDrawerOpen && (
          <>
            <motion.div
              key="chat-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[99] sm:hidden"
            />

            <motion.div
              key="chat-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="chat-panel-title"
              initial={{
                opacity: 0,
                y: typeof window !== "undefined" && window.innerWidth < 640 ? "100%" : 24,
                scale: typeof window !== "undefined" && window.innerWidth < 640 ? 1 : 0.92,
              }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{
                opacity: 0,
                y: typeof window !== "undefined" && window.innerWidth < 640 ? "100%" : 20,
                scale: typeof window !== "undefined" && window.innerWidth < 640 ? 1 : 0.94,
              }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              style={
                visualHeight !== null
                  ? {
                      height: `${visualHeight}px`,
                      top: `${visualTop}px`,
                      bottom: "auto",
                      position: "fixed",
                      left: 0,
                      right: 0,
                    }
                  : undefined
              }
              className="fixed inset-0 z-[100] sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[410px] sm:h-[620px] sm:max-h-[calc(100dvh-2.5rem)] w-full h-[100dvh] bg-white sm:rounded-2xl sm:shadow-2xl sm:border sm:border-amber-200/70 overflow-hidden flex flex-col sm:origin-bottom-right"
            >
              <div className="bg-gradient-to-r from-[#78350F] via-[#92400E] to-[#B45309] text-white p-3.5 sm:p-4 pt-[max(0.875rem,env(safe-area-inset-top))] shrink-0 shadow-md">
                <div className="flex justify-between items-center mb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-white/20 border border-white/30 flex items-center justify-center font-bold text-xs shadow-inner shrink-0">
                      {chatMode === "ai" ? (
                        <Leaf className="w-5 h-5 text-amber-200" />
                      ) : (
                        <Headphones className="w-5 h-5 text-emerald-200" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p
                        id="chat-panel-title"
                        className="font-bold text-sm sm:text-base leading-tight truncate"
                      >
                        {chatMode === "ai"
                          ? language === "en"
                            ? "Nutrition Advisor"
                            : "Tư Vấn Dinh Dưỡng"
                          : language === "en"
                            ? "Live Customer Advisor"
                            : "Tư Vấn Viên Trực Tuyến"}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] opacity-90 leading-tight">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            chatMode === "ai"
                              ? "bg-amber-300 animate-pulse"
                              : connectionStatus === "connected"
                                ? "bg-emerald-400"
                                : connectionStatus === "failed"
                                  ? "bg-rose-400"
                                  : "bg-amber-400 animate-pulse"
                          }`}
                        />
                        <span className="truncate">
                          {chatMode === "ai"
                            ? language === "en"
                              ? "Gemini AI Nutrition"
                              : "Trí tuệ nhân tạo Gemini AI"
                            : connectionStatus === "connected"
                              ? language === "en"
                                ? "Online & Ready"
                                : "Đang trực tuyến sẵn sàng"
                              : connectionStatus === "failed"
                                ? language === "en"
                                  ? "Connection Offline"
                                  : "Mất kết nối máy chủ"
                                : connectionStatus === "reconnecting"
                                  ? language === "en"
                                    ? "Reconnecting..."
                                    : "Đang kết nối lại..."
                                  : language === "en"
                                    ? "Connecting..."
                                    : "Đang kết nối..."}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {totalCartItems > 0 && (
                      <button
                        onClick={() => {
                          setIsChatOpen(false);
                          openCart();
                        }}
                        className="hover:bg-white/20 p-2 rounded-full transition-colors relative active:scale-95 touch-manipulation"
                        aria-label={language === "en" ? "View Cart" : "Xem giỏ hàng"}
                        title={language === "en" ? "View Cart" : "Xem giỏ hàng"}
                      >
                        <ShoppingBag className="w-5 h-5 text-white" />
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white shadow-xs">
                          {totalCartItems > 99 ? "99+" : totalCartItems}
                        </span>
                      </button>
                    )}
                    <button
                      id="chat-close-button"
                      onClick={() => setIsChatOpen(false)}
                      className="hover:bg-white/20 p-2 rounded-full transition-all active:scale-95 touch-manipulation"
                      aria-label={language === "en" ? "Close chat" : "Đóng chat"}
                    >
                      <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/25 backdrop-blur-xs rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setChatMode("ai")}
                    className={`min-h-[34px] py-1 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all touch-manipulation ${
                      chatMode === "ai"
                        ? "bg-white text-[#92400E] shadow-sm font-bold"
                        : "text-white/80 hover:text-white"
                    }`}
                  >
                    <Leaf className="w-3.5 h-3.5 text-amber-600" />
                    <span>{language === "en" ? "Nutrition Guide" : "Tư Vấn Dinh Dưỡng"}</span>
                  </button>
                  <button
                    onClick={() => {
                      setChatMode("human");
                      if (chatStarted) connect(guestName || undefined, guestPhone || undefined);
                    }}
                    className={`min-h-[34px] py-1 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all touch-manipulation ${
                      chatMode === "human"
                        ? "bg-white text-[#92400E] shadow-sm font-bold"
                        : "text-white/80 hover:text-white"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        connectionStatus === "connected"
                          ? "bg-emerald-400"
                          : connectionStatus === "failed"
                            ? "bg-rose-400"
                            : "bg-amber-400 animate-pulse"
                      }`}
                    />
                    <span>{language === "en" ? "Live Advisor" : "Tư Vấn Viên"}</span>
                  </button>
                </div>
              </div>

              {/* Tab 1: AI Dinh Dưỡng */}
              <div className={`flex-1 flex flex-col min-h-0 w-full ${chatMode === "ai" ? "flex" : "hidden"}`}>
                <SectionErrorBoundary sectionName="Trợ lý AI Dinh dưỡng">
                  <NutritionAiWidget
                    language={language as "vi" | "en"}
                    isKeyboardOpen={isKeyboardOpen}
                    onSwitchToLiveChat={() => {
                      setChatMode("human");
                      if (chatStarted) connect(guestName || undefined, guestPhone || undefined);
                    }}
                  />
                </SectionErrorBoundary>
              </div>

              {/* Tab 2: Tư Vấn Viên */}
              <div className={`flex-1 flex flex-col min-h-0 w-full ${chatMode === "human" ? "flex" : "hidden"}`}>
                {!chatStarted ? (
                  <div className="flex-1 min-h-0 p-5 sm:p-6 overflow-y-auto flex flex-col justify-center max-w-sm mx-auto w-full space-y-4 custom-chat-scrollbar">
                    <div className="text-center space-y-1 mb-1">
                      <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 text-[#B45309] flex items-center justify-center mb-2 shadow-inner">
                        <Headphones className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                        {language === "en" ? "Live Customer Support" : "Tư Vấn Viên Trực Tuyến"}
                      </h3>
                      <p className="text-xs text-stone-600">
                        {language === "en"
                          ? "Please leave your contact info so our team can assist you best."
                          : "Vui lòng cho biết thông tin để đội ngũ tư vấn hỗ trợ quý khách chu đáo nhất."}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          {language === "en" ? "Your name *" : "Họ tên của bạn *"}
                        </label>
                        <input
                          type="text"
                          placeholder={language === "en" ? "e.g. Nguyen Van A" : "Ví dụ: Nguyễn Văn A"}
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          className="w-full border border-amber-200 bg-stone-50/80 focus:border-[#B45309] focus:ring-2 focus:ring-[#B45309]/20 rounded-xl px-3.5 py-2.5 text-base sm:text-sm outline-none transition-all placeholder:text-stone-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          {language === "en" ? "Phone number (optional)" : "Số điện thoại (để gửi báo giá)"}
                        </label>
                        <input
                          type="tel"
                          placeholder={language === "en" ? "e.g. 0912345678" : "Ví dụ: 0912345678"}
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          className="w-full border border-amber-200 bg-stone-50/80 focus:border-[#B45309] focus:ring-2 focus:ring-[#B45309]/20 rounded-xl px-3.5 py-2.5 text-base sm:text-sm outline-none transition-all placeholder:text-stone-400"
                        />
                      </div>

                      <button
                        onClick={handleStartChat}
                        disabled={!guestName.trim()}
                        className="w-full bg-gradient-to-r from-[#B45309] to-[#D97706] text-white font-bold py-3 rounded-xl hover:opacity-95 transition-all disabled:opacity-50 text-sm shadow-md active:scale-98 min-h-[46px]"
                      >
                        {t.chat.start}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-h-0 bg-stone-50/40 p-3.5 sm:p-4 overflow-y-auto flex flex-col gap-3 custom-chat-scrollbar overscroll-contain">
                      {isSessionTerminated && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs text-center shadow-2xs">
                          {language === "en"
                            ? "This conversation was ended by the advisor. You can send a new message to restart."
                            : "Cuộc trò chuyện đã kết thúc bởi tư vấn viên. Bạn có thể gửi tin nhắn mới để bắt đầu lại."}
                        </div>
                      )}
                      {messages.length === 0 && !isSessionTerminated && (
                        <div className="bg-white border border-amber-100 p-3.5 rounded-2xl rounded-tl-xs text-xs sm:text-sm text-stone-900 max-w-[85%] self-start shadow-xs">
                          {language === "en"
                            ? `Hello ${guestName}! How can we assist you with our Longan specialties today?`
                            : `Chào ${guestName}! Chúng tôi có thể hỗ trợ quý khách về loại Long Nhãn hay món quà biếu nào hôm nay ạ?`}
                        </div>
                      )}
                      {messages.map((msg, idx) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          className={`p-3 sm:p-3.5 rounded-2xl text-[13.5px] sm:text-sm max-w-[88%] sm:max-w-[82%] shadow-xs leading-relaxed ${
                            msg.senderType === "Guest"
                              ? "bg-gradient-to-br from-[#B45309] to-[#92400E] text-white self-end rounded-br-xs"
                              : "bg-white border border-amber-100 text-stone-900 self-start rounded-tl-xs"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          <span
                            className={`text-[10px] block mt-1.5 opacity-70 ${
                              msg.senderType === "Guest" ? "text-right" : ""
                            }`}
                          >
                            {new Date(msg.sentAt).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {idx === lastGuestMessageIndex && msg.isRead && (
                              <span className="ml-1">· {language === "en" ? "Seen" : "Đã xem"}</span>
                            )}
                          </span>
                        </motion.div>
                      ))}
                      {isAdminTyping && (
                        <div
                          className="bg-white border border-amber-100 p-2.5 sm:p-3 rounded-2xl rounded-tl-xs shadow-xs self-start flex items-center gap-1.5"
                          aria-label={language === "en" ? "Advisor is typing" : "Tư vấn viên đang gõ"}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#B45309] animate-pulse [animation-delay:0ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#B45309] animate-pulse [animation-delay:200ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#B45309] animate-pulse [animation-delay:400ms]" />
                          <span className="ml-2 text-xs text-stone-600 font-medium">
                            {language === "en" ? "Advisor is typing..." : "Tư vấn viên đang gõ..."}
                          </span>
                        </div>
                      )}
                      {connectionStatus === "failed" && (
                        <div className="mx-1 my-2 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-center justify-between gap-2 shadow-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span className="text-[11.5px] leading-tight">
                              {language === "en"
                                ? "Live chat server is temporarily offline."
                                : "Máy chủ tư vấn gián đoạn kết nối."}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => retryConnect()}
                            className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold text-[11px] shrink-0 active:scale-95 transition-all shadow-xs"
                          >
                            {language === "en" ? "Retry" : "Thử lại"}
                          </button>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    <div
                      className={`p-2.5 sm:p-3.5 bg-white border-t border-amber-200/70 shrink-0 transition-all ${
                        isKeyboardOpen ? "pb-2 pt-2" : "pb-[max(0.75rem,env(safe-area-inset-bottom))]"
                      }`}
                    >
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={chatInput}
                          onFocus={() => {
                            setIsKeyboardOpen(true);
                            setTimeout(() => {
                              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                            }, 200);
                          }}
                          onBlur={() => {
                            setTimeout(() => {
                              setIsKeyboardOpen(false);
                            }, 150);
                          }}
                          onChange={(e) => {
                            setChatInput(e.target.value);
                            if (chatSendError) setChatSendError(false);
                            if (e.target.value.trim()) notifyTyping();
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                              e.preventDefault();
                              handleSendChatMessage();
                            }
                          }}
                          placeholder={t.chat.placeholder}
                          className="w-full bg-stone-50/80 border border-amber-200/90 focus:border-[#B45309] focus:ring-2 focus:ring-[#B45309]/20 rounded-full pl-4 pr-12 py-2.5 sm:py-2 text-base sm:text-sm outline-none transition-all placeholder:text-stone-400 leading-normal"
                        />
                        <button
                          onClick={handleSendChatMessage}
                          disabled={isSending || !chatInput.trim()}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-8 sm:h-8 bg-gradient-to-r from-[#B45309] to-[#D97706] text-white rounded-full flex items-center justify-center hover:opacity-95 transition-all active:scale-90 disabled:opacity-40 shadow-xs shrink-0"
                          aria-label={language === "en" ? "Send message" : "Gửi tin nhắn"}
                        >
                          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                      </div>
                      {chatSendError && (
                        <p className="text-xs text-red-500 mt-1.5 px-2">
                          {language === "en"
                            ? "Failed to send message. Please check your connection and retry!"
                            : "Không gửi được tin nhắn. Kiểm tra kết nối và thử lại!"}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 15. Thanh thao tác nhanh cố định trên Mobile (Sticky Bottom Bar) */}
      <AnimatePresence>
        {isScrolled && !isChatOpen && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#FDE68A]/70 px-4 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] flex items-center justify-between gap-3 safe-area-bottom pb-[max(0.625rem,env(safe-area-inset-bottom))]"
          >
            <a
              href={`tel:${cmsContent.Hotline || "0982072601"}`}
              className="flex flex-col items-center justify-center py-1 px-2 text-primary hover:text-accent transition-colors shrink-0"
              aria-label={language === "en" ? "Call hotline" : "Gọi hotline"}
            >
              <Phone className="w-4 h-4 text-accent mb-0.5" />
              <span className="text-xs font-bold">Hotline</span>
            </a>

            <button
              onClick={() => handleOpenCart()}
              className="flex flex-col items-center justify-center py-1 px-2 text-primary hover:text-accent transition-colors shrink-0 relative"
              aria-label={language === "en" ? "Shopping cart" : "Giỏ hàng"}
            >
              <div className="relative">
                <ShoppingCart className="w-4 h-4 text-accent mb-0.5" />
                {totalCartItems > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center border border-white">
                    {totalCartItems > 99 ? "99+" : totalCartItems}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold">{language === "en" ? "Cart" : "Giỏ Hàng"}</span>
            </button>

            <button
              id="mobile-sticky-chat-button"
              onClick={handleOpenChat}
              className="flex flex-col items-center justify-center py-1 px-2 text-primary hover:text-accent transition-colors shrink-0"
              aria-label={language === "en" ? "Customer advice" : "Tư vấn"}
            >
              <MessageCircle className="w-4 h-4 text-accent mb-0.5" />
              <span className="text-xs font-bold">{language === "en" ? "Advisor" : "Tư Vấn"}</span>
            </button>

            <button
              onClick={() => {
                scrollToSection("dat-hang");
              }}
              className="flex-1 bg-gradient-to-r from-[#B45309] to-[#D97706] text-white font-bold py-2.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-xs transition-all active:scale-95"
            >
              <ShoppingCart className="w-4 h-4 shrink-0" />
              <span>{t.nav.buyNow}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Cart Button */}
      <CartButton isChatOpen={isChatOpen} />
    </>
  );
}

export default ContactSection;

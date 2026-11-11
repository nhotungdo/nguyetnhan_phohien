"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight, ShoppingCart, ShoppingBag, MessageCircle, Phone, MapPin, ChevronRight, CheckCircle, AlertCircle, Loader2, Send, Plus, Trash2, LayoutDashboard, KeyRound, Bot, Leaf, Flame, ShieldCheck, Award, Headphones } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { EASE_OUT_EXPO, fadeUp, Reveal, staggerContainer } from "@/components/LandingMotion";
import { adminAuth } from "@/services/api.service";
import { triggerPageNavigation } from "@/components/layout/RouteProgressBar";
import { useOrderForm } from "@/hooks/useOrderForm";
import { useVnProvinces } from "@/hooks/useVnProvinces";
import { wardsOf } from "@/lib/vnAddress";
import { composeAddress, MAX_ADDRESS_DETAIL_LENGTH, MAX_EMAIL_LENGTH, MAX_NAME_LENGTH, normalizePhone, type OrderFieldErrorCode } from "@/lib/validation";
import { useLiveChat } from "@/hooks/useLiveChat";
import { useWebsiteContent } from "@/hooks/useWebsiteContent";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useProducts } from "@/hooks/useProducts";
import { ProductGalleryModal } from "@/components/ProductGalleryModal";
import { FastImage } from "@/components/FastImage";
import { ProductInteractiveShowcase } from "@/components/ProductInteractiveShowcase";
import { ProductHeroShowcase } from "@/components/ProductHeroShowcase";
import { ProductScrollytelling } from "@/components/ProductScrollytelling";
import { ProductPairingSection } from "@/components/ProductPairingSection";
import { ProductComparisonSection } from "@/components/ProductComparisonSection";
import { CartButton, CartDrawer } from "@/components/cart";
import { useCartStore } from "@/stores/useCartStore";
import type { ProductResponse } from "@/types/api.types";
import { DEFAULT_FALLBACK_PRODUCTS } from "@/data/defaultProducts";
import { NutritionAiWidget } from "@/components/NutritionAiWidget";
import { FireworksCelebration } from "@/components/FireworksCelebration";
import { HeritageVideoSection } from "@/components/HeritageVideoSection";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050").replace(/\/+$/, "");

const inputClass = (error?: unknown) =>
  `w-full bg-background border rounded-xl px-4 py-3 outline-none transition-all text-base sm:text-sm ${error}`
    ? "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
    : "border-[#FDE68A] focus:border-[#B45309] focus:ring-1 focus:ring-[#B45309]";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs text-red-500 flex items-start gap-1 pt-0.5">
      <AlertCircle className="w-3.5 h-3.5 mt-[1px] shrink-0" />
      <span>{message}</span>
    </p>
  );
}

const resolveCmsImage = (url?: string) =>
  !url
    ? ""
    : url.startsWith("/images/") || /^(https?:)?\/\//i.test(url) || url.startsWith("data:")
      ? url
      : url.startsWith("/uploads/") || url.startsWith("uploads/")
        ? (url.startsWith("/") ? url : `/${url}`)
        : `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;

const subscribeAuth = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener("adminAuthChange", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("adminAuthChange", callback);
  };
};

const getAuthSnapshot = () => adminAuth.isLoggedIn();
const getAuthServerSnapshot = () => false;

export default function ContactSection() {
  const isAdmin = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthServerSnapshot);

  useEffect(() => {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      if (
        args.length > 0 &&
        typeof args[0] === "string" &&
        args[0].includes("Failed to start the HttpConnection before stop() was called")
      ) {
        return;
      }
      originalConsoleError.apply(console, args);
    };
    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  const timelineRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress: timelineScroll } = useScroll({
    target: timelineRef,
    offset: ["start 80%", "end 65%"],
  });
  const timelineScaleY = useSpring(timelineScroll, { stiffness: 90, damping: 30, restDelta: 0.001 });

  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const { t, language, setLanguage } = useLanguageStore();
  const { products: apiProducts, isLoading: isProductsLoading, error: productsError } = useProducts();
  const cartStoreItems = useCartStore((s) => s.items);

  const isOfflineCatalog = isMounted && !isProductsLoading && (!!productsError || !apiProducts || apiProducts.length === 0);

  const effectiveProducts = useMemo(() => {
    const baseList: ProductResponse[] = [
      ...(apiProducts && apiProducts.length > 0 ? apiProducts : DEFAULT_FALLBACK_PRODUCTS),
    ];
    if (isMounted) {
      for (const item of cartStoreItems) {
        if (item.isCustomMix) continue;
        if (!baseList.some((p) => p.id === item.productId)) {
          baseList.push({
            id: item.productId,
            name: item.productName || (language === "en" ? "Product" : "Sản phẩm"),
            price: item.price || 0,
            size: item.size || "",
            description: "",
            isActive: true,
            displayOrder: 99,
            images: item.imageUrl ? [{ id: "c-" + item.productId, imagePath: item.imageUrl, displayOrder: 1 }] : [],
          });
        }
      }
    }
    if (language === "en") {
      return baseList.map((prod) => {
        let name = prod.name;
        let size = prod.size;
        let description = prod.description;

        if (prod.id === "default-dac-biet" || prod.name.includes("Đặc Biệt")) {
          name = "Special Reserve Dried Longan";
          description = "Thick-fleshed Huong Chi longan, hot-air convection dried, uniform golden amber fruit, delightfully chewy and delicately sweet.";
        } else if (prod.id === "default-tui-zip" || prod.name.includes("Túi Zip")) {
          name = "Airtight Zipper Pouch Dried Longan";
          description = "Convenient resealable zipper pouch for daily storage, airtight seal keeping natural chewiness and fragrance, perfect for tea, sweet soup, or restorative infusions.";
        } else if (prod.id === "default-set-qua" || prod.name.includes("Set Quà") || prod.name.includes("Hoàng Gia")) {
          name = "Royal Heritage Gift Set";
          description = "Elegantly designed gift box honoring centuries of Pho Hien cultural heritage, paired with a luxury tote bag, the perfect wellness gift for loved ones and partners.";
        }

        if (size) {
          size = size
            .replace(/Hộp\s*(\d+[a-zA-Z]+)/gi, "$1 Box")
            .replace(/Túi\s*(\d+[a-zA-Z]+)/gi, "$1 Pouch")
            .replace(/Set\s*(\d+[a-zA-Z]+)\s*(\((.*?)\))/gi, (_, weight, note) => {
              const translatedNote = String(note).replace(/Hộp/gi, "Boxes").replace(/Túi/gi, "Pouches");
              return `${weight} Set (${translatedNote})`;
            })
            .replace(/Hộp/gi, "Box")
            .replace(/Túi/gi, "Pouch");
        }

        return { ...prod, name, size, description };
      });
    }
    return baseList;
  }, [apiProducts, cartStoreItems, isMounted, language]);

  const [galleryProduct, setGalleryProduct] = useState<ProductResponse | null>(null);

  const { provinces: vnProvinces, isLoading: isLoadingProvinces, error: provinceLoadError, enable: enableProvincePicker } = useVnProvinces();
  const [manualAddress, setManualAddress] = useState(false);

  const isManualAddress = manualAddress || !!provinceLoadError;

  const { addItem: addCartItem, closeCart, openCart, getTotalItems } = useCartStore();
  const totalCartItems = isMounted ? getTotalItems() : 0;
  const isCartDrawerOpen = useCartStore((s) => s.isOpen);

  const handleOpenCart = () => {
    setIsChatOpen(false);
    openCart();
  };

  const [showFireworks, setShowFireworks] = useState(false);

  const {
    form, setField, errors, validateField, canAddItem, addItem, removeItem, updateItem, selectSingleProduct, setCartItems, discountResult, discountNotice, isSubmitting, isApplyingCode,
    submitStatus, errorMessage, lastSubmittedEmail, emailDeliveryStatus, hasFallbackProduct, applyDiscount, calculateTotal, handleSubmit
  } = useOrderForm(
    effectiveProducts,
    (orderedItems) => {
      setShowFireworks(true);
      if (!orderedItems || orderedItems.length === 0) {
        useCartStore.getState().clearCart();
        return;
      }
      const cartStore = useCartStore.getState();
      orderedItems.forEach((ordered) => {
        if (ordered.isCustomMix && ordered.customMixDetails) {
          const match = cartStore.items.find(
            (ci) =>
              ci.isCustomMix &&
              ci.productId === ordered.productId &&
              ci.productName === ordered.customMixDetails?.customProductName &&
              (ci.customMixDetails?.customLabelMessage || "") === (ordered.customMixDetails?.customLabelMessage || "")
          );
          if (match && match.id) {
            cartStore.removeItem(match.id);
          }
        } else if (ordered.productId) {
          const match = cartStore.items.find((ci) => ci.productId === ordered.productId);
          if (match && match.id) {
            cartStore.removeItem(match.id);
          } else {
            cartStore.removeItem(ordered.productId);
          }
        }
      });
    },
    { requireAdministrativeUnits: !isManualAddress, language: language as "vi" | "en" }
  );

  const hasSyncedCartToFormRef = useRef(false);
  useEffect(() => {
    if (!hasSyncedCartToFormRef.current && cartStoreItems.length > 0 && form.items.length === 1 && !form.items[0].productId && !form.items[0].isCustomMix) {
      hasSyncedCartToFormRef.current = true;
      setCartItems(
        cartStoreItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          isCustomMix: i.isCustomMix,
          customMixDetails: i.customMixDetails,
        }))
      );
    }
  }, [cartStoreItems, form.items, setCartItems]);

  const wardOptions = wardsOf(vnProvinces, form.province);
  const hasFieldErrors = Object.values(errors).some(Boolean);

  const toggleManualAddress = () => {
    const next = !isManualAddress;
    setManualAddress(next);
    if (next) {
      setField("province", "");
      setField("ward", "");
    }
  };

  const errorText = (code?: OrderFieldErrorCode) => (code ? t.order.errors[code] : undefined);

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
  const { content: cmsContent } = useWebsiteContent();

  const brandCommitments = [
    {
      id: "natural",
      label: t.about.natural_title,
      icon: Leaf,
    },
    {
      id: "traditional",
      label: t.about.traditional_title,
      icon: Flame,
    },
    {
      id: "safe",
      label: t.about.safe_title,
      icon: ShieldCheck,
    },
    {
      id: "quality",
      label: t.hero.quality,
      icon: Award,
    },
    {
      id: "support",
      label: t.nav.support,
      icon: Headphones,
    },
  ];

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
    const shouldLock = isMobileMenuOpen || (isChatOpen && isMobile);
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
  }, [isMobileMenuOpen, isChatOpen]);

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
      const storedToken = localStorage.getItem("chatSessionToken") || sessionStorage.getItem("chatSessionToken");
      if (storedId && storedToken) {
        const storedName = localStorage.getItem("chatGuestName") || sessionStorage.getItem("chatGuestName");
        const storedPhone = localStorage.getItem("chatGuestPhone") || sessionStorage.getItem("chatGuestPhone");
        connect(storedName || undefined, storedPhone || undefined);
      }
    } catch {
      // Storage không khả dụng trên môi trường SSR / sandbox
    }
  }, [connect]);

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 76;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const handleCartCheckout = () => {
    const cartItems = useCartStore.getState().items;
    if (cartItems.length > 0) {
      setCartItems(
        cartItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          isCustomMix: i.isCustomMix,
          customMixDetails: i.customMixDetails,
        }))
      );
    }
    closeCart();
    scrollToSection("dat-hang");
  };

  const handleQuickBuy = (product: ProductResponse) => {
    addCartItem(product);
    const updatedCartItems = useCartStore.getState().items;
    setCartItems(
      updatedCartItems.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        isCustomMix: i.isCustomMix,
        customMixDetails: i.customMixDetails,
      }))
    );
    closeCart();
    scrollToSection("dat-hang");
  };

  const handleOpenChat = async () => {
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
      // Bỏ qua lỗi storage
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

  const { base, discount, final } = calculateTotal();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className="storefront min-h-screen bg-background text-foreground font-sans selection:bg-accent selection:text-accent-foreground w-full max-w-full overflow-x-clip"
    >
      <main className="w-full max-w-full overflow-x-clip pb-20 md:pb-0">
        {/* Dải bảo chứng cam kết chất lượng thương hiệu - Tối ưu hoàn hảo cho cả Mobile & Desktop */}
        <div className="border-y border-[#DED6C8] bg-[#FBF9F4] relative overflow-hidden">
          {/* 1. Màn hình máy tính & máy tính bảng (md trở lên): Dàn ngang cân đối, icon huy hiệu sang trọng */}
          <div className="hidden md:block container mx-auto px-4 md:px-6 py-4">
            <ul className="flex flex-wrap items-center justify-center lg:justify-between gap-y-3 gap-x-6 lg:gap-x-8 text-[#584A3C]">
              {brandCommitments.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-2.5 text-xs lg:text-[13px] xl:text-sm font-semibold tracking-tight text-[#4A3B2C] hover:text-primary transition-colors group cursor-default"
                >
                  <span className="w-7 h-7 rounded-full bg-amber-100/80 border border-amber-300/50 text-amber-900 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 group-hover:bg-amber-200/80 transition-all">
                    <item.icon aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
                  </span>
                  <span className="whitespace-nowrap">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 2. Màn hình điện thoại (dưới md): Băng chuyền chữ chạy mượt mà vô tận (Infinite Marquee Ticker) viền mờ 2 bên, chạm để tạm dừng */}
          <div className="md:hidden relative w-full overflow-hidden marquee-mask py-3 select-none">
            <div className="animate-marquee-track hover:[animation-play-state:paused] active:[animation-play-state:paused]">
              {[...brandCommitments, ...brandCommitments].map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  aria-hidden={index >= brandCommitments.length}
                  className="flex items-center gap-2 px-3.5 whitespace-nowrap text-xs font-semibold text-[#4A3B2C]"
                >
                  <span className="w-6 h-6 rounded-full bg-amber-100/90 border border-amber-300/60 text-amber-900 flex items-center justify-center shrink-0 shadow-2xs">
                    <item.icon aria-hidden="true" className="w-3 h-3 shrink-0" />
                  </span>
                  <span>{item.label}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 ml-2.5 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Khu vực sản phẩm tương tác cao cấp */}
        <SectionErrorBoundary sectionName="Sản phẩm tương tác">
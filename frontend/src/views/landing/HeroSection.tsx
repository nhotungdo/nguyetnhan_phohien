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

// Ghép URL ảnh từ CMS: link tuyệt đối (http/https/protocol-relative/data) dùng nguyên,
// còn lại (vd /uploads/content/...) là đường dẫn tương đối trên server API.
// null-safe: key chưa có trong CMS (API lỗi, trang prerender) → chuỗi rỗng, caller tự fallback.
// Ô nhập đang lỗi: viền + vòng focus chuyển đỏ để khách thấy ngay ô nào cần sửa.
const inputClass = (error?: unknown) =>
  `w-full bg-background border rounded-xl px-4 py-3 outline-none transition-all text-base sm:text-sm ${error}`
    ? "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
    : "border-[#FDE68A] focus:border-[#B45309] focus:ring-1 focus:ring-[#B45309]";

/** Câu báo lỗi ngay dưới ô nhập (role="alert" để trình đọc màn hình đọc lên). */
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

export default function HeroSection() {
  const isAdmin = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthServerSnapshot);

  // Bỏ qua lỗi ngắt kết nối unmount vô hại của SignalR trong quá trình chuyển trang
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

  // Mục Lịch sử: đường trục được "vẽ" dần theo tiến độ cuộn qua khối timeline.
  const { scrollYProgress: timelineScroll } = useScroll({
    target: timelineRef,
    offset: ["start 80%", "end 65%"],
  });
  const timelineScaleY = useSpring(timelineScroll, { stiffness: 90, damping: 30, restDelta: 0.001 });

  // Dùng useSyncExternalStore để kiểm tra đã mount ở client mà không gây lỗi hydration mismatch hay cascading render
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const { t, language, setLanguage } = useLanguageStore();
  const { products: apiProducts, isLoading: isProductsLoading, error: productsError } = useProducts();
  const cartStoreItems = useCartStore((s) => s.items);

  // Cờ báo hiệu máy chủ không phản hồi danh mục sản phẩm thật (chế độ bảo trì danh mục)
  const isOfflineCatalog = isMounted && !isProductsLoading && (!!productsError || !apiProducts || apiProducts.length === 0);

  // Danh sách sản phẩm đầy đủ: gồm các sản phẩm từ API hoặc fallback, đồng thời
  // luôn chứa toàn bộ các sản phẩm hiện có trong giỏ hàng để form đặt hàng luôn
  // hiển thị đầy đủ và chính xác tên, phân loại, giá bán của giỏ hàng.
  // CHỈ bổ sung các sản phẩm từ giỏ hàng sau khi đã mount ở client để tránh lệch hydration SSR.
  const effectiveProducts = useMemo(() => {
    const baseList: ProductResponse[] = [
      ...(apiProducts && apiProducts.length > 0 ? apiProducts : DEFAULT_FALLBACK_PRODUCTS),
    ];
    if (isMounted) {
      for (const item of cartStoreItems) {
        // Sản phẩm tự chọn hạt dùng Id bao bì làm productId nên không phải sản phẩm
        // thật: đưa vào danh sách sẽ tạo option trùng tên trong ô chọn sản phẩm và
        // khi khách chọn phải thì backend trả 400. Dòng của nó tự hiển thị công thức.
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

  // Danh sách Tỉnh/Thành phố → Phường/Xã chỉ được tải khi khách thật sự chạm
  // vào ô chọn địa điểm (xem useVnProvinces).
  const { provinces: vnProvinces, isLoading: isLoadingProvinces, error: provinceLoadError, enable: enableProvincePicker } = useVnProvinces();
  const [manualAddress, setManualAddress] = useState(false);

  // Chế độ nhập thủ công: khách tự bật, HOẶC tự động khi danh sách địa chỉ không
  // tải được — lúc đó bỏ yêu cầu chọn Tỉnh/Phường để khách vẫn đặt được hàng.
  const isManualAddress = manualAddress || !!provinceLoadError;

  const { addItem: addCartItem, closeCart, openCart, getTotalItems } = useCartStore();
  const totalCartItems = isMounted ? getTotalItems() : 0;
  const isCartDrawerOpen = useCartStore((s) => s.isOpen);

  const handleOpenCart = () => {
    setIsChatOpen(false);
    openCart();
  };

  // Hiệu ứng bắn pháo hoa khi đặt hàng và gửi email thành công
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

  // Tự động đồng bộ các sản phẩm từ giỏ hàng vào form nếu form đang ở trạng thái rỗng ban đầu (chỉ đồng bộ 1 lần)
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
    // Bật nhập thủ công → bỏ tỉnh/phường đang chọn để địa chỉ gửi đi không bị lẫn.
    if (next) {
      setField("province", "");
      setField("ward", "");
    }
  };

  /** Mã lỗi → câu chữ theo ngôn ngữ đang chọn (lib validation không chứa i18n). */
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

  // Dải cam kết thương hiệu danh giá — các bảo chứng nguồn gốc và chất lượng tiến vua
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

  // Tiêu đề Hero lấy từ CMS (key HeroTitle), chia 2 dòng để giữ bố cục gradient.
  // Tiếng Việt lấy từ CMS như HeroSubtitle; tiếng Anh vẫn dùng locale.
  // Chỉ có MỘT từ thì KHÔNG tách dòng: `slice(1)` của mảng 1 phần tử là mảng rỗng,
  // nên trước đây dòng 2 rỗng mà <br/> vẫn render → thừa một dòng trống giữa tiêu đề.
  // Tiêu đề Hero lấy từ CMS (key HeroTitle), chia 2 dòng để giữ bố cục gradient.
  // Tiếng Việt lấy từ CMS như HeroSubtitle; tiếng Anh vẫn dùng locale.
  // Tách dòng thông minh, tôn trọng các từ ghép có nghĩa trong tiếng Việt (Long Nhãn, Phố Hiến, Tiến Vua...)
  const heroLines = (() => {
    if (language === "en") {
      const parts = t.hero.title.split(" ").filter(Boolean);
      return [parts[0] ?? "", parts.slice(1).join(" ")].filter(Boolean);
    }
    const words = (cmsContent.HeroTitle || "").trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return ["Hương Vị", "Truyền Thống"];
    if (words.length === 1) return [words[0]];

    let split = Math.ceil(words.length / 2);
    // Tránh cắt đôi các cụm từ ghép quan trọng của thương hiệu
    if (split > 0 && split < words.length) {
      const prevWord = words[split - 1].toLowerCase();
      const nextWord = words[split].toLowerCase();
      if (prevWord === "long" && nextWord.startsWith("nhãn")) {
        split += 1; // giữ "Long Nhãn" trọn vẹn ở dòng 1
      } else if (prevWord === "phố" && nextWord.startsWith("hiến")) {
        split -= 1; // giữ "Phố Hiến" trọn vẹn ở dòng 2
      } else if (prevWord === "hưng" && nextWord.startsWith("yên")) {
        split -= 1; // giữ "Hưng Yên" trọn vẹn ở dòng 2
      } else if (prevWord === "tiến" && nextWord.startsWith("vua")) {
        split -= 1; // giữ "Tiến Vua" trọn vẹn ở dòng 2
      }
    }

    const line1 = words.slice(0, split).join(" ");
    const line2 = words.slice(split).join(" ");
    return [line1, line2].filter(Boolean);
  })();
  const heroLine1 = heroLines[0];
  const heroLine2 = heroLines[1] ?? "";

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

  // Auto-scroll chat khi có tin nhắn mới hoặc khi mở cửa sổ chat
  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isChatOpen]);

  // Khóa cuộn trang khi menu mobile hoặc chat widget trên mobile đang mở để tránh giật lag layout
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

  // Theo dõi chính xác kích thước khung nhìn thực (Visual Viewport) khi bàn phím ảo bật/tắt trên mobile (iOS Safari / Android)
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

  // Xác nhận đã xem tin của Admin (read receipt) khi widget đang mở —
  // backend sẽ broadcast "GuestReadMessages" để admin hiện "Đã xem" realtime.
  useEffect(() => {
    if (!isChatOpen || !chatStarted) return;
    markMessagesRead();
  }, [isChatOpen, chatStarted, messages, markMessagesRead]);

  // Tự động kết nối ngầm phiên chat nếu khách đã từng trò chuyện trước đó
  useEffect(() => {
    try {
      const storedId = localStorage.getItem("chatSessionId") || sessionStorage.getItem("chatSessionId");
      const storedToken = localStorage.getItem("chatSessionToken") || sessionStorage.getItem("chatSessionToken");
      if (storedId && storedToken) {
        const storedName = localStorage.getItem("chatGuestName") || sessionStorage.getItem("chatGuestName");
        const storedPhone = localStorage.getItem("chatGuestPhone") || sessionStorage.getItem("chatGuestPhone");
        // Pre-connect trong nền để WebSocket bắt tay xong từ trước, khi gửi tin không bị trễ
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

  // Khi bấm "Mua sản phẩm" trong giỏ hàng: nạp toàn bộ sản phẩm từ giỏ hàng vào form
  // và chuyển màn hình mượt mà đến khu vực điền thông tin đặt hàng.
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

  // Xử lý "Đặt Mua Ngay" trên các thẻ sản phẩm thường:
  // Thêm sản phẩm vào giỏ hàng và đồng bộ toàn bộ giỏ (bao gồm cả các món Custom Mix đang có)
  // vào form thanh toán để không bao giờ làm mất sản phẩm tự chọn hạt của khách.
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
    // Xoá ô nhập ngay lập tức để trải nghiệm mượt mà (0ms delay)
    setChatInput("");
    const ok = await sendMessage(text, guestName, guestPhone);
    // Nếu gửi thất bại, hoàn nguyên lại nội dung để khách không phải gõ lại
    if (!ok) {
      setChatInput(text);
      setChatSendError(true);
    }
  };

  // Index của tin nhắn khách cuối cùng (chỉ hiện "Đã xem" ở tin đó)
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
        {/* 2. Hero Banner với phông nền di sản Chùa Chuông Phố Hiến */}
        <section id="hero" className="relative bg-[#F7F3EB] pt-28 pb-12 sm:pt-36 sm:pb-16 w-full overflow-hidden">
          {/* Lớp nền Chùa Chuông cổ kính với overlay mềm mại */}
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
            <FastImage
              src={resolveCmsImage(cmsContent.HeroBgImage) || "/images/chuachuong_hero_bg.jpg"}
              fallbackSrc="/images/chuachuong.jpg"
              alt="Chùa Chuông Phố Hiến"
              fill
              priority
              sizes="100vw"
              className="w-full h-full object-cover object-center scale-105"
            />
            {/* Lớp phủ bảo vệ tương phản chữ (WCAG AAA) & hòa hợp màu ấm thương hiệu */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F5]/96 via-[#FAF8F5]/85 to-[#FAF8F5]/55 md:from-[#FAF8F5]/96 md:via-[#FAF8F5]/80 md:to-[#FAF8F5]/45" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8F5]/80 via-transparent to-[#FBF9F4]" />
          </div>

          <div className="container mx-auto px-4 md:px-6 relative z-10 grid md:grid-cols-2 gap-12 items-center w-full max-w-full">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-8 max-w-xl"
            >
              <h1 className="text-4xl sm:text-[40px] md:text-5xl lg:text-[52px] xl:text-[60px] font-semibold text-primary leading-[1.18] tracking-tight [text-wrap:balance]">
                <motion.span
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.85, delay: 0.25, ease: EASE_OUT_EXPO }}
                  className="block text-primary"
                >
                  {heroLine1}
                </motion.span>
                {heroLine2 && (
                  <motion.span
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.85, delay: 0.45, ease: EASE_OUT_EXPO }}
                    className="block mt-1 sm:mt-2 text-accent"
                  >
                    {heroLine2}
                  </motion.span>
                )}
              </h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.85, delay: 0.55, ease: EASE_OUT_EXPO }}
                className="text-base sm:text-lg md:text-xl text-foreground/85 leading-relaxed [text-wrap:pretty] max-w-xl font-normal"
              >
                {language === "en" ? t.hero.subtitle : cmsContent.HeroSubtitle || "Long nhãn sấy khô tự nhiên, giữ trọn vị ngọt thanh tao và hương thơm đặc trưng của nhãn lồng Phố Hiến - Hưng Yên. Một món quà sức khỏe từ ngàn xưa."}
              </motion.p>

              <div className="flex flex-wrap items-center gap-4 sm:gap-5 pt-2">
                <button
                  onClick={() => scrollToSection("cau-chuyen")}
                  className="bg-accent hover:bg-[#9A3412] text-white font-bold px-7 py-3.5 rounded-xl inline-flex items-center gap-2 shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <span>{language === "en" ? "Browse products" : "Xem sản phẩm"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollToSection("gioi-thieu")}
                  className="text-primary font-bold hover:text-accent underline underline-offset-4 py-3 transition-colors cursor-pointer"
                >
                  {t.nav.story}
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative flex items-center justify-center"
            >
              <ProductHeroShowcase
                language={language as "vi" | "en"}
                bannerUrl={
                  cmsContent.HeroBannerUrl
                    ? resolveCmsImage(cmsContent.HeroBannerUrl)
                    : effectiveProducts[0]?.images && effectiveProducts[0].images.length > 0
                      ? resolveCmsImage(
                          [...effectiveProducts[0].images].sort(
                            (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
                          )[0]?.imagePath
                        )
                      : "/images/combo3sp.jpg"
                }
                onExploreClick={() => scrollToSection("cau-chuyen")}
              />
            </motion.div>
          </div>
        </section>

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
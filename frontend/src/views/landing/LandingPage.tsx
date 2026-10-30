"use client";

if (typeof window !== "undefined") {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (
      args.length > 0 &&
      typeof args[0] === "string" &&
      args[0].includes("Failed to start the HttpConnection before stop() was called")
    ) {
      return; // Ignore this specific harmless SignalR unmount error
    }
    originalConsoleError.apply(console, args);
  };
}
import { useState, useEffect, useRef, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, ArrowRight, ShoppingCart, ShoppingBag, MessageCircle, Phone, MapPin, ChevronRight, CheckCircle, AlertCircle, Loader2, Send, Plus, Trash2, LayoutDashboard, KeyRound, Lock, Sparkles, Leaf, Flame, ShieldCheck, Award, Headphones } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { EASE_OUT_EXPO, fadeUp, Reveal, ScrollProgressBar, staggerContainer } from "@/components/LandingMotion";
import { adminAuth, discountApi } from "@/services/api.service";
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
import { AnimatedWaveBackground } from "@/components/AnimatedWaveBackground";
import { FireworksCelebration } from "@/components/FireworksCelebration";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050").replace(/\/+$/, "");

// Ghép URL ảnh từ CMS: link tuyệt đối (http/https/protocol-relative/data) dùng nguyên,
// còn lại (vd /uploads/content/...) là đường dẫn tương đối trên server API.
// null-safe: key chưa có trong CMS (API lỗi, trang prerender) → chuỗi rỗng, caller tự fallback.
// Ô nhập đang lỗi: viền + vòng focus chuyển đỏ để khách thấy ngay ô nào cần sửa.
const inputClass = (error?: unknown) =>
  `w-full bg-background border rounded-xl px-4 py-3 outline-none transition-all ${error
    ? "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
    : "border-[#FDE68A] focus:border-[#B45309] focus:ring-1 focus:ring-[#B45309]"
  }`;

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

export default function LandingPage() {
  const router = useRouter();
  const isAdmin = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthServerSnapshot);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [adminCodeInput, setAdminCodeInput] = useState("");
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState("");

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminCodeInput.trim() || adminLoginLoading) return;
    setAdminLoginLoading(true);
    setAdminLoginError("");
    try {
      const result = await discountApi.apply({ code: adminCodeInput.trim() });
      if (result.adminToken) {
        adminAuth.login(result.adminToken);
        setIsAdminLoginModalOpen(false);
        setIsMobileMenuOpen(false);
        triggerPageNavigation();
        router.push("/dashboard");
      } else {
        setAdminLoginError("Mã quản trị không hợp lệ.");
      }
    } catch {
      setAdminLoginError("Mã quản trị không đúng hoặc hệ thống bận.");
    } finally {
      setAdminLoginLoading(false);
    }
  };

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMode, setChatMode] = useState<"ai" | "human">("ai");
  const [chatInput, setChatInput] = useState("");
  const [chatSendError, setChatSendError] = useState(false);
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

  // Parallax: khối chữ và khối ảnh hero trôi chậm hơn nhịp cuộn → tạo chiều sâu.
  // Tắt hẳn khi người dùng bật "giảm chuyển động" trong hệ điều hành.
  const heroRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroImageY = useTransform(heroScroll, [0, 1], [0, prefersReducedMotion ? 0 : 90]);
  const heroContentY = useTransform(heroScroll, [0, 1], [0, prefersReducedMotion ? 0 : 45]);

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

  const { products: apiProducts } = useProducts();
  const cartStoreItems = useCartStore((s) => s.items);

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
            name: item.productName || "Sản phẩm",
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
    return baseList;
  }, [apiProducts, cartStoreItems, isMounted]);

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
    submitStatus, errorMessage, lastSubmittedEmail, applyDiscount, calculateTotal, handleSubmit
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
          cartStore.removeItem(ordered.productId);
        }
      });
    },
    { requireAdministrativeUnits: !isManualAddress }
  );

  // Tự động đồng bộ các sản phẩm từ giỏ hàng vào form nếu form đang ở trạng thái rỗng ban đầu
  useEffect(() => {
    if (cartStoreItems.length > 0 && form.items.length === 1 && !form.items[0].productId && !form.items[0].isCustomMix) {
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
    isConnected,
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
  const { t, language, setLanguage } = useLanguageStore();

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
  //
  // Chỉ có MỘT từ thì KHÔNG tách dòng: `slice(1)` của mảng 1 phần tử là mảng rỗng,
  // nên trước đây dòng 2 rỗng mà <br/> vẫn render → thừa một dòng trống giữa tiêu đề.
  const heroLines = (() => {
    if (language === "en") {
      const parts = t.hero.title.split(" ").filter(Boolean);
      return [parts[0] ?? "", parts.slice(1).join(" ")].filter(Boolean);
    }
    const words = (cmsContent.HeroTitle || "").trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return ["Hương Vị", "Truyền Thống"];
    if (words.length === 1) return [words[0]];
    const split = Math.ceil(words.length / 2);
    return [words.slice(0, split).join(" "), words.slice(split).join(" ")];
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

  // Khóa cuộn trang khi menu mobile đang mở để tránh giật lag layout
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

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
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
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
      className="min-h-screen bg-background text-foreground font-sans selection:bg-accent selection:text-accent-foreground w-full max-w-full overflow-x-clip"
    >
      {/* Thanh tiến trình cuộn — phản hồi tức thì vị trí đang đọc */}
      <ScrollProgressBar />

      {/* Gallery Modal */}
      {galleryProduct && (
        <ProductGalleryModal
          product={galleryProduct}
          language={language as "vi" | "en"}
          onClose={() => setGalleryProduct(null)}
          onOrder={() => {
            handleQuickBuy(galleryProduct);
            setGalleryProduct(null);
          }}
          onAddToCart={(prod) => addCartItem(prod)}
        />
      )}

      {/* Admin Quick Login Modal */}
      <AnimatePresence>
        {isAdminLoginModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => {
              if (!adminLoginLoading) setIsAdminLoginModalOpen(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-border relative text-foreground"
            >
              <button
                onClick={() => setIsAdminLoginModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Đăng nhập Quản trị</h3>
                  <p className="text-xs text-muted-foreground">Truy cập bảng điều khiển quản trị viên</p>
                </div>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                    Mã xác thực Quản trị
                  </label>
                  <input
                    type="password"
                    autoFocus
                    autoComplete="current-password"
                    value={adminCodeInput}
                    onChange={(e) => {
                      setAdminCodeInput(e.target.value);
                      setAdminLoginError("");
                    }}
                    placeholder="Nhập mã truy cập quản trị..."
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>

                {adminLoginError && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 text-xs px-3.5 py-2.5 rounded-xl">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                    <span>{adminLoginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!adminCodeInput.trim() || adminLoginLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
                >
                  {adminLoginLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang xác thực...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" /> Đăng nhập
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* 1. Header */}
      <motion.header
        initial={{ y: -90, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 w-full max-w-full ${isScrolled ? "bg-white/95 backdrop-blur-md shadow-sm py-2.5 sm:py-3" : "bg-transparent py-3 sm:py-5"
          }`}
      >
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between w-full max-w-full">
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none" onClick={() => scrollToSection("hero")}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white flex items-center justify-center overflow-hidden border border-border shadow-sm relative shrink-0">
              <span className="absolute text-accent font-bold text-xs">NN</span>
              <FastImage
                src={resolveCmsImage(cmsContent.SiteLogo) || "/logo.jpg"}
                alt="Nguyệt Nhãn Phố Hiến"
                fill
                sizes="48px"
                className="w-full h-full object-cover z-10"
                onError={(e) => e.currentTarget.style.display = 'none'}
              />
            </div>
            <span style={{ fontFamily: 'var(--font-dancing)' }} className={`font-bold text-xl sm:text-2xl md:text-[28px] tracking-wide transition-colors text-primary truncate max-w-[150px] xs:max-w-[220px] sm:max-w-none`}>
              Nguyệt Nhãn Phố Hiến
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {[
              { label: t.nav.products, id: "san-pham" },
              { label: t.nav.story, id: "cau-chuyen" },
              { label: t.nav.history, id: "lich-su" },
              { label: t.nav.process, id: "quy-trinh" },
              { label: t.nav.culture, id: "van-hoa" },
              { label: t.nav.contact, id: "lien-he" }
            ].map((item, index) => (
              <button
                key={index}
                onClick={() => scrollToSection(item.id)}
                className="text-base font-semibold text-foreground/80 hover:text-accent transition-all duration-300 ease-in-out relative group cursor-pointer"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent transition-all duration-300 ease-in-out group-hover:w-full"></span>
              </button>
            ))}
            <Link
              href="/tu-chon-hat"
              className="text-xs lg:text-sm font-bold text-amber-900 bg-gradient-to-r from-amber-100 via-amber-200 to-amber-100 border border-amber-300 px-3.5 py-1.5 rounded-full shadow-sm hover:shadow-md hover:scale-105 transition-all flex items-center gap-1.5"
            >
              <span>Tự Chọn Hạt</span>
              <span className="bg-[#B45309] text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Mới
              </span>
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
              className="text-sm font-bold text-foreground/80 border px-3 py-1.5 rounded-full hover:bg-muted transition-colors flex items-center gap-2"
            >
              {language === "vi" ? "🇻🇳 VI" : "🇬🇧 EN"}
            </button>
            <button
              onClick={() => handleOpenCart()}
              className="text-base font-semibold text-foreground/80 hover:text-accent transition-all duration-300 ease-in-out flex items-center gap-2 relative p-1.5"
              aria-label="Giỏ hàng"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalCartItems > 0 && (
                <span className="absolute -top-1.5 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {totalCartItems > 99 ? "99+" : totalCartItems}
                </span>
              )}
            </button>
            <button
              onClick={handleOpenChat}
              className="text-base font-semibold text-foreground/80 hover:text-accent transition-all duration-300 ease-in-out flex items-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => scrollToSection("dat-hang")}
              className="bg-accent hover:bg-accent/90 text-white text-base font-bold px-6 py-2.5 rounded-full shadow-lg shadow-[#B45309]/30 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" /> {t.nav.buyNow}
            </button>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex md:hidden items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
              className="text-xs font-bold text-foreground/85 border border-[#FDE68A] px-2.5 py-1 rounded-full bg-white/90 shadow-sm transition-colors"
              aria-label="Chuyển ngôn ngữ"
            >
              {language === "vi" ? "🇻🇳" : "🇬🇧"}
            </button>
            <button
              className="p-2 text-foreground/80 rounded-xl hover:bg-black/5 active:scale-95 transition-all"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6 text-primary" /> : <Menu className="w-6 h-6 text-primary" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay - Drawer cao cấp mang sắc thái hoàng gia */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
            className="fixed inset-0 z-40 bg-white/98 backdrop-blur-xl pt-20 px-6 pb-8 flex flex-col justify-between md:hidden overflow-y-auto"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Menu Điều Hướng</span>
                <button
                  onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
                  className="text-xs font-bold text-primary border border-[#FDE68A] px-3 py-1 rounded-full bg-secondary flex items-center gap-1.5"
                >
                  {language === "vi" ? "🇻🇳 Tiếng Việt" : "🇬🇧 English"}
                </button>
              </div>

              {[
                { label: t.nav.products, id: "san-pham" },
                { label: t.nav.story, id: "cau-chuyen" },
                { label: t.nav.history, id: "lich-su" },
                { label: t.nav.process, id: "quy-trinh" },
                { label: t.nav.culture, id: "van-hoa" },
                { label: t.nav.contact, id: "lien-he" }
              ].map((item, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.04 + index * 0.05, ease: EASE_OUT_EXPO }}
                  onClick={() => scrollToSection(item.id)}
                  className="w-full text-lg font-bold text-primary text-left py-2.5 flex items-center justify-between border-b border-border/40 hover:text-accent transition-colors"
                >
                  <span>{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-accent/70" />
                </motion.button>
              ))}

              {/* Lối tắt Tự Chọn Hạt trên Mobile */}
              <Link
                href="/tu-chon-hat"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-base font-bold text-amber-900 bg-gradient-to-r from-amber-100/90 via-amber-50 to-amber-100/60 p-3 rounded-2xl flex items-center justify-between border border-amber-300 shadow-sm active:scale-98 transition-all my-1"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-[#B45309] text-white flex items-center justify-center shadow-sm">
                    <ShoppingBag className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold">Tự Chọn Hạt Độc Bản</span>
                      <span className="bg-[#B45309] text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                        Mới
                      </span>
                    </div>
                    <p className="text-xs text-amber-900 font-normal">Tự phối 5 loại hạt & in tên riêng</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-700" />
              </Link>

              {/* Thông tin liên hệ nhanh trong Mobile Menu */}
              <div className="pt-2 flex flex-col gap-2">
                <a
                  href={`tel:${cmsContent.Hotline || "0982072601"}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-[#FDE68A]/60 text-xs font-semibold text-primary"
                >
                  <Phone className="w-4 h-4 text-accent shrink-0" />
                  <span>Hotline: {cmsContent.Hotline || "0982.072.601"}</span>
                </a>
              </div>

              {/* Lối vào Quản trị viên trên Mobile Menu */}
              <div className="pt-2">
                {isAdmin ? (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-sm flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                        <span className="text-sm">👑</span> Quản trị viên
                      </span>
                      <button
                        onClick={() => {
                          adminAuth.logout();
                        }}
                        className="text-[11px] font-semibold text-destructive hover:underline"
                      >
                        Đăng xuất
                      </button>
                    </div>
                    <Link
                      href="/dashboard"
                      prefetch={true}
                      onClick={() => {
                        triggerPageNavigation();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full text-center py-2.5 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform"
                    >
                      <LayoutDashboard className="w-4 h-4" /> Vào trang Quản trị
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsAdminLoginModalOpen(true);
                    }}
                    className="w-full text-left py-2.5 px-3 rounded-xl border border-border/80 bg-background/60 hover:bg-muted text-muted-foreground text-xs font-medium flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-accent" />
                      <span>Đăng nhập Quản trị</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>
                )}
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
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
                  scrollToSection("dat-hang");
                }}
                className="w-full bg-gradient-to-r from-[#B45309] to-[#D97706] text-white text-base font-bold px-6 py-3.5 rounded-xl shadow-lg flex justify-center items-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" /> {t.nav.buyNow}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="w-full max-w-full overflow-x-clip">
        {/* 2. Hero Banner */}
        <section ref={heroRef} id="hero" className="relative min-h-screen flex items-center pt-20 overflow-hidden w-full max-w-full">
          {/* Background Elements */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-[#FEF3C7]/40 to-[#FAFAF9] z-10"></div>
            <div className="absolute inset-0 bg-[#FDE68A]/20"></div>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.5 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/3 w-[800px] max-w-[150vw] h-[800px] bg-[radial-gradient(circle,rgba(247,238,221,0.85)_0%,transparent_70%)] rounded-full pointer-events-none"
            />
            {/* Hai vệt sáng trôi lơ lửng, lệch pha nhau → nền "thở" nhẹ mà không gây phân tán */}
            <div className="absolute -left-24 top-24 w-[420px] max-w-[100vw] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(253,230,138,0.4)_0%,transparent_70%)] animate-float-slow will-change-transform pointer-events-none" />
            <div className="absolute right-1/4 bottom-0 w-[320px] max-w-[100vw] h-[320px] rounded-full bg-[radial-gradient(circle,rgba(217,148,145,0.25)_0%,transparent_70%)] animate-float-slower will-change-transform pointer-events-none" />
          </div>

          <div className="container mx-auto px-4 md:px-6 relative z-10 grid md:grid-cols-2 gap-12 items-center w-full max-w-full">
            <motion.div
              style={{ y: heroContentY }}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-8 max-w-xl"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-secondary text-accent text-xs sm:text-sm font-semibold border border-[#FDE68A] shadow-xs">
                <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
                <span>Tinh túy đất Phố Hiến</span>
              </div>
              <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold text-primary leading-[1.15] sm:leading-[1.1] tracking-tight">
                <motion.span
                  initial={{ opacity: 0, y: 26 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9, delay: 0.32, ease: EASE_OUT_EXPO }}
                  className="inline-block"
                >
                  {heroLine1}
                </motion.span>
                {heroLine2 && (
                  <>
                    {" "}
                    <motion.span
                      initial={{ opacity: 0, y: 26 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.9, delay: 0.52, ease: EASE_OUT_EXPO }}
                      className="inline-block text-[#92400E]"
                    >
                      {heroLine2}
                    </motion.span>
                  </>
                )}
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-foreground/80 leading-relaxed">
                {language === "en" ? t.hero.subtitle : cmsContent.HeroSubtitle || "Long nhãn sấy khô tự nhiên, giữ trọn vị ngọt thanh tao và hương thơm đặc trưng của nhãn lồng Phố Hiến - Hưng Yên. Một món quà sức khỏe từ ngàn xưa."}
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 pt-2 sm:pt-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => scrollToSection("san-pham")}
                  className="w-full sm:w-auto bg-accent text-white text-sm sm:text-base font-semibold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full shadow-xl shadow-[#B45309]/30 transition-shadow flex items-center justify-center gap-2 cursor-pointer"
                >
                  {t.hero.discover} <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.button>
                <Link
                  href="/tu-chon-hat"
                  className="w-full sm:w-auto bg-gradient-to-r from-amber-100 via-amber-200 to-amber-100 text-amber-900 border border-amber-300 text-sm sm:text-base font-bold px-6 sm:px-7 py-3.5 sm:py-4 rounded-full flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95"
                >
                  <span>Tự Chọn Hạt Độc Bản</span>
                </Link>
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: "#FEF3C7" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => scrollToSection("cau-chuyen")}
                  className="w-full sm:w-auto bg-white text-accent border border-[#FDE68A] text-sm sm:text-base font-semibold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full flex items-center justify-center cursor-pointer"
                >
                  {t.nav.story}
                </motion.button>
              </div>
            </motion.div>

            <motion.div
              style={{ y: heroImageY }}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative flex items-center justify-center"
            >
              <ProductHeroShowcase
                bannerUrl={
                  cmsContent.HeroBannerUrl
                    ? resolveCmsImage(cmsContent.HeroBannerUrl)
                    : effectiveProducts[0]?.images?.[0]
                      ? resolveCmsImage(effectiveProducts[0].images[0].imagePath)
                      : "/images/setqua.jpg"
                }
                onExploreClick={() => scrollToSection("san-pham")}
              />
            </motion.div>
          </div>
        </section>

        {/* 2b. Dải cam kết thương hiệu — Tinh tế, tương tác sống động chuẩn hoàng gia */}
        <div className="relative border-y border-amber-200/50 bg-gradient-to-r from-amber-50/40 via-[#FCFBF7] to-amber-50/40 py-3 sm:py-4 w-full max-w-full overflow-hidden shadow-[0_2px_12px_-4px_rgba(133,77,14,0.06)]">
          {/* Đường viền ánh kim hoàng gia lướt nhẹ trên đỉnh & đáy */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />

          {/* Tia sáng hoàng kim lướt nhẹ qua ribbon định kỳ (Shimmer ray) */}
          <motion.div
            aria-hidden="true"
            initial={{ x: "-100%" }}
            animate={prefersReducedMotion ? undefined : { x: "400%" }}
            transition={{
              repeat: Infinity,
              duration: 6.5,
              ease: "easeInOut",
              repeatDelay: 3,
            }}
            className="absolute inset-y-0 w-48 bg-gradient-to-r from-transparent via-amber-300/20 to-transparent -skew-x-12 pointer-events-none z-[1]"
          />

          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
              className="flex flex-wrap items-center justify-center lg:justify-between gap-x-4 sm:gap-x-6 gap-y-2.5 max-w-6xl mx-auto"
            >
              {brandCommitments.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <motion.div
                    key={item.id}
                    variants={fadeUp}
                    whileHover={prefersReducedMotion ? undefined : { y: -3, scale: 1.03 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                    transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
                    className="group flex items-center gap-2 sm:gap-2.5 px-3 py-1.5 rounded-full hover:bg-amber-100/60 transition-colors duration-200 cursor-default"
                  >
                    {/* Huy hiệu đồng tiền vàng kim với hiệu ứng nhấp nhô êm ả và sáng viền khi hover */}
                    <motion.div
                      animate={
                        prefersReducedMotion
                          ? undefined
                          : {
                              y: [0, -2.5, 0],
                            }
                      }
                      transition={{
                        repeat: Infinity,
                        duration: 3 + idx * 0.4,
                        ease: "easeInOut",
                      }}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-amber-100 to-amber-200/80 text-[#92400E] flex items-center justify-center shrink-0 ring-1 ring-amber-300/70 shadow-xs group-hover:ring-amber-500 group-hover:scale-110 group-hover:shadow-[0_4px_12px_rgba(217,119,6,0.25)] transition-all duration-300"
                    >
                      <IconComponent
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#92400E] transition-transform duration-300 group-hover:rotate-12"
                        strokeWidth={2.2}
                      />
                    </motion.div>
                    <span className="text-xs sm:text-[13px] md:text-sm font-semibold text-stone-800 tracking-tight whitespace-nowrap group-hover:text-[#92400E] transition-colors duration-200">
                      {item.label}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>

        {/* 3. Khu vực sản phẩm tương tác cao cấp */}
        <ProductInteractiveShowcase
          products={effectiveProducts}
          language={language as "vi" | "en"}
          cmsContent={cmsContent}
          onOrderProduct={(productId) => {
            const prod = effectiveProducts.find((p) => p.id === productId);
            if (prod) {
              handleQuickBuy(prod);
            } else {
              selectSingleProduct(productId);
              scrollToSection("dat-hang");
            }
          }}
          onOpenGallery={(prod) => setGalleryProduct(prod)}
          onAddToCart={(prod) => addCartItem(prod)}
        />

        {/* 4. So sánh minh bạch chất lượng */}
        <ProductComparisonSection language={language as "vi" | "en"} />

        {/* 5. BANNER GIỚI THIỆU: CUSTOM MIX STUDIO - TỰ CHỌN HẠT ĐỘC BẢN */}
        <section className="py-12 bg-gradient-to-b from-white via-amber-50/60 to-white overflow-hidden w-full">
          <div className="container mx-auto px-4 md:px-6 max-w-6xl">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#12100E] via-[#221B17] to-[#12100E] text-white p-6 sm:p-10 md:p-12 shadow-2xl border border-amber-500/30">
              {/* Nền sóng nước động hoàng kim & bụi vàng phát sáng lung linh */}
              <AnimatedWaveBackground />

              <div className="relative z-10 grid md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-7 space-y-4 text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
                    <span>Trải Nghiệm Độc Bản</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight">
                    Tự Tay Phối Hạt · <span className="text-amber-300">Khắc Tên Riêng</span>
                  </h2>
                  <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
                    Tự do lựa chọn tỉ lệ vàng từ 5 loại hạt đặc sản & dinh dưỡng (Long nhãn Phố Hiến, Macca Tây Nguyên, Hạt điều rang mộc, Hạnh nhân nướng, Hạt bí xanh). In tem nhãn mang tên bạn & lời chúc trang trọng.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="text-xs bg-white/10 px-3 py-1.5 rounded-full text-stone-200 border border-white/15">
                      Túi Zip 150g · <strong className="text-amber-300">69.000đ</strong>
                    </span>
                    <span className="text-xs bg-white/10 px-3 py-1.5 rounded-full text-stone-200 border border-white/15">
                      Hộp Mica 300g · <strong className="text-amber-300">153.000đ</strong>
                    </span>
                    <span className="text-xs bg-white/10 px-3 py-1.5 rounded-full text-stone-200 border border-white/15">
                      Lễ Hộp 900g · <strong className="text-amber-300">756.000đ</strong>
                    </span>
                  </div>
                  <div className="pt-3">
                    <Link
                      href="/tu-chon-hat"
                      className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-sm shadow-lg shadow-black/35 hover:scale-105 active:scale-95 transition-all"
                    >
                      <span>Vào Xưởng Chế Tác Hạt Riêng</span>
                      <ArrowRight className="w-4 h-4 text-stone-950" />
                    </Link>
                  </div>
                </div>

                <div className="md:col-span-5 relative flex justify-center">
                  <div className="relative w-60 h-60 sm:w-72 sm:h-72 rounded-3xl overflow-hidden border border-amber-500/30 group">
                    <FastImage
                      src="/images/setqua3.jpg"
                      alt="Tự Chọn Hạt Độc Bản"
                      fill
                      sizes="(max-width: 768px) 240px, 288px"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/20 to-transparent flex items-end p-4">
                      <div>
                        <span className="text-amber-300 font-bold text-xs block">Miễn phí thiết kế nhãn riêng</span>
                        <span className="text-stone-300 text-xs">Đóng gói chuẩn quy trình ATVSTP</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Giới thiệu thương hiệu — Tinh hoa ẩm thực Phố Hiến */}
        <section id="gioi-thieu" className="py-24 bg-gradient-to-b from-[#FCFBF7] via-white to-amber-50/20 relative overflow-hidden w-full max-w-full">
          {/* Hào quang nền dịu nhẹ tôn lên phong vị truyền thống */}
          <div aria-hidden="true" className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-amber-100/40 blur-3xl pointer-events-none" />
          <div aria-hidden="true" className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-amber-100/30 blur-3xl pointer-events-none" />

          <div className="container mx-auto px-4 md:px-6 relative z-10 w-full max-w-full">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl mx-auto text-center space-y-5"
            >
              {/* Huy hiệu di sản */}
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-amber-50/90 border border-amber-200/80 text-[#92400E] text-xs sm:text-sm font-semibold shadow-xs">
                <span>{language === "en" ? "Hung Yen Royal Delicacy" : "Di Sản Phẩm Vật Tiến Vua"}</span>
              </div>

              {/* Tiêu đề chính thức */}
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#173522] tracking-tight leading-tight">
                {language === "en" ? t.about.title : cmsContent.AboutTitle || t.about.title}
              </h2>

              {/* Vạch hoa văn phân cách hoàng gia đối xứng */}
              <div className="flex items-center justify-center gap-3 py-1" aria-hidden="true">
                <span className="h-px w-10 sm:w-16 bg-gradient-to-r from-transparent via-amber-400 to-amber-300" />
                <span className="w-2 h-2 rotate-45 bg-[#854D0E] rounded-xs shadow-xs" />
                <span className="h-px w-10 sm:w-16 bg-gradient-to-l from-transparent via-amber-400 to-amber-300" />
              </div>

              {/* Đoạn văn giới thiệu thương hiệu */}
              <p className="text-base sm:text-lg md:text-xl text-stone-700 leading-relaxed max-w-2xl mx-auto font-normal">
                {language === "en" ? t.about.desc : cmsContent.AboutDescription || t.about.desc}
              </p>

              {/* 3 Thẻ bảo chứng chất lượng & nguồn gốc */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 pt-3 text-xs sm:text-sm font-medium text-stone-700">
                <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-white border border-amber-200/60 shadow-xs">
                  <CheckCircle className="w-4 h-4 text-[#173522] shrink-0" />
                  <span>{language === "en" ? "100% Ancient Orchard" : "Nhãn Lồng Hương Chi Cổ Thụ"}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-white border border-amber-200/60 shadow-xs">
                  <CheckCircle className="w-4 h-4 text-[#173522] shrink-0" />
                  <span>{language === "en" ? "Convection Heat Drying" : "Sấy Đối Lưu Khép Kín"}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-white border border-amber-200/60 shadow-xs">
                  <CheckCircle className="w-4 h-4 text-[#173522] shrink-0" />
                  <span>{language === "en" ? "No Additives • Pure" : "Chuẩn Vị • Không Phụ Gia"}</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              className="grid md:grid-cols-3 gap-8 mt-16 sm:mt-20"
            >
              {[
                { title: t.about.natural_title, desc: t.about.natural_desc, icon: Leaf },
                { title: t.about.traditional_title, desc: t.about.traditional_desc, icon: Flame },
                { title: t.about.safe_title, desc: t.about.safe_desc, icon: ShieldCheck },
              ].map((val, i) => {
                const CardIcon = val.icon;
                return (
                  <motion.div
                    variants={fadeUp}
                    whileHover={prefersReducedMotion ? undefined : { y: -8 }}
                    key={i}
                    className="relative overflow-hidden bg-white p-8 rounded-3xl border border-amber-200/60 hover:border-amber-400/80 hover:shadow-xl transition-all duration-300 group"
                  >
                    {/* Hào quang nền dịu nhẹ khi hover */}
                    <div aria-hidden="true" className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-amber-100/40 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500 pointer-events-none" />

                    <div className="flex items-center justify-between mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200/70 text-[#92400E] flex items-center justify-center ring-1 ring-amber-300/60 shadow-xs group-hover:scale-110 group-hover:bg-amber-200 transition-all duration-300">
                        <CardIcon className="w-6 h-6 text-[#92400E]" strokeWidth={2.2} />
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100/90 text-[#854D0E] ring-1 ring-amber-300/60 shadow-2xs">
                        {language === "en" ? `Value 0${i + 1}` : `Giá Trị 0${i + 1}`}
                      </span>
                    </div>

                    <h3 className="relative text-xl font-bold text-[#173522] mb-3 group-hover:text-[#92400E] transition-colors">{val.title}</h3>
                    <p className="relative text-stone-600 leading-relaxed text-sm sm:text-base">{val.desc}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* 7. Khởi nguồn & Câu chuyện di sản */}
        <section id="cau-chuyen" className="py-24 bg-white overflow-hidden w-full max-w-full">
          <div className="container mx-auto px-4 md:px-6 w-full max-w-full">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1 relative">
                <div className="aspect-square rounded-full bg-[radial-gradient(circle,rgba(247,238,221,0.9)_0%,transparent_70%)] absolute -top-10 -left-10 w-full h-full -z-10 opacity-70 pointer-events-none"></div>
                <div className="w-full aspect-[4/5] rounded-[3rem] bg-[#FDE68A]/30 overflow-hidden relative border-8 border-white shadow-2xl">
                  {/* Placeholder phía dưới — admin chưa đặt ảnh (hoặc ảnh lỗi) vẫn thấy khung gợi ý */}
                  <div className="absolute inset-0 flex items-center justify-center text-accent font-medium">
                    [ Ảnh Người Nông Dân / Vườn Nhãn ]
                  </div>
                  {cmsContent.StoryImage && (
                    <FastImage
                      src={resolveCmsImage(cmsContent.StoryImage)}
                      alt="Câu chuyện Nguyệt Nhãn"
                      fill
                      sizes="(max-width: 768px) 92vw, 45vw"
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => e.currentTarget.style.display = 'none'}
                    />
                  )}
                </div>
              </div>
              <div className="flex-1 space-y-8">
                <h2 className="text-3xl md:text-5xl font-bold text-primary">{language === "en" ? "Famous Royal Tribute" : cmsContent.StoryTitle || "Thứ Quả Tiến Vua Trứ Danh"}</h2>
                <p className="text-lg text-foreground/80 leading-relaxed max-w-2xl">
                  {language === "en" ? "Legend has it that in the 16th century, a mandarin patrolling through Pho Hien exactly when the longans were ripe tasted the thick, juicy, sweet and fragrant flesh, and immediately brought it back to offer to the king. Since then, Hung Yen longan became an annual royal tribute." : cmsContent.StoryDescription || "Tương truyền, vào thế kỷ 16, một vị quan đi tuần qua vùng Phố Hiến đúng độ nhãn chín. Nếm thử thấy cùi dày, mọng nước, vị ngọt lịm thơm ngát, liền mang về dâng vua. Từ đó, nhãn lồng Hưng Yên trở thành sản vật tiến vua hàng năm."}
                </p>
                <div className="pl-6 border-l-4 border-[#B45309] space-y-4">
                  <p className="text-foreground/80 italic max-w-xl">
                    {language === "en" ? "\"Pho Hien longan, it is said that its sweetness permeates the alluvium of the Red River, blended with the sun and wind of the delta. For generations, the people here preserve the craft of making longan, as a way to preserve the homeland soul.\"" : "\"Nhãn lồng Phố Hiến, người ta nói vị ngọt của nó thấm cả cái chất phù sa sông Hồng, quyện với nắng gió của vùng châu thổ. Trăm năm nay, người dân nơi đây vẫn giữ cái nghề làm long nhãn, như một cách lưu giữ hồn quê hương.\""}
                  </p>
                </div>
                <button
                  onClick={() => scrollToSection("lich-su")}
                  className="inline-flex items-center gap-2 text-accent font-bold hover:gap-4 transition-all cursor-pointer"
                >
                  {language === "en" ? "Explore historical timeline" : "Khám phá dòng chảy lịch sử"} <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 8. Dòng chảy lịch sử Phố Hiến */}
        <section id="lich-su" className="py-24 bg-background border-t border-border/30 overflow-hidden w-full max-w-full">
          <div className="container mx-auto px-4 md:px-6 text-center max-w-4xl w-full max-w-full">
            <Reveal>
              <h2 className="text-3xl md:text-5xl font-bold text-primary mb-8">{t.history.title}</h2>
            </Reveal>
            <div ref={timelineRef} className="relative border-l-2 border-accent pl-6 sm:pl-8 ml-3 sm:ml-4 md:ml-0 md:pl-0 md:border-l-0 text-left md:text-center space-y-8 sm:space-y-12">
              {/* Trục thời gian được "vẽ" dần theo nhịp cuộn (chỉ hiện ở desktop, nơi các mốc nằm giữa) */}
              <div aria-hidden className="hidden md:block absolute left-1/2 -translate-x-1/2 top-0 h-full w-[2px] bg-[#FDE68A]/80 rounded-full overflow-hidden">
                <motion.div style={{ scaleY: timelineScaleY }} className="w-full h-full origin-top bg-gradient-to-b from-[#B45309] to-[#D97706]" />
              </div>
              <div className="relative md:flex items-center justify-between gap-8">
                <div className="md:w-1/2 text-right hidden md:block">
                  <h3 className="text-xl sm:text-2xl font-bold text-accent">{t.history.c16_title}</h3>
                  <p className="text-foreground/80">{t.history.c16_desc.split(". ")[0]}.</p>
                </div>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
                  className="absolute z-10 -left-[33px] sm:-left-[41px] top-1.5 md:top-1/2 md:-translate-y-1/2 md:left-1/2 md:-ml-[8px] w-4 h-4 rounded-full bg-accent ring-4 ring-background"
                />
                <div className="md:w-1/2 md:text-left">
                  <h3 className="text-lg sm:text-2xl font-bold text-accent md:hidden">{t.history.c16_title}</h3>
                  <p className="text-sm text-foreground/80 md:hidden mb-2">{t.history.c16_desc.split(". ")[0]}.</p>
                  <div className="bg-white/90 p-3.5 sm:p-4 rounded-xl border border-[#FDE68A]/60 text-xs sm:text-sm text-foreground/85">{t.history.c16_desc.split(". ")[1]}</div>
                </div>
              </div>
              <div className="relative md:flex items-center justify-between gap-8 flex-row-reverse">
                <div className="md:w-1/2 text-left hidden md:block">
                  <h3 className="text-xl sm:text-2xl font-bold text-accent">{t.history.tree_title}</h3>
                  <p className="text-foreground/80">{language === "en" ? "Historical monument at Hien Pagoda." : "Di tích lịch sử tại Chùa Hiến."}</p>
                </div>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
                  className="absolute z-10 -left-[33px] sm:-left-[41px] top-1.5 md:top-1/2 md:-translate-y-1/2 md:left-1/2 md:-ml-[8px] w-4 h-4 rounded-full bg-accent ring-4 ring-background"
                />
                <div className="md:w-1/2 md:text-right">
                  <h3 className="text-lg sm:text-2xl font-bold text-accent md:hidden">{t.history.tree_title}</h3>
                  <p className="text-sm text-foreground/80 md:hidden mb-2">{language === "en" ? "Historical monument at Hien Pagoda." : "Di tích lịch sử tại Chùa Hiến."}</p>
                  <div className="bg-white/90 p-3.5 sm:p-4 rounded-xl border border-[#FDE68A]/60 text-xs sm:text-sm text-foreground/85">{t.history.tree_desc}</div>
                </div>
              </div>
              <div className="relative md:flex items-center justify-between gap-8">
                <div className="md:w-1/2 text-right hidden md:block">
                  <h3 className="text-xl sm:text-2xl font-bold text-accent">{t.history.year2010_title}</h3>
                  <p className="text-foreground/80">{t.history.year2010_desc.split(". ")[0]}.</p>
                </div>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
                  className="absolute z-10 -left-[33px] sm:-left-[41px] top-1.5 md:top-1/2 md:-translate-y-1/2 md:left-1/2 md:-ml-[8px] w-4 h-4 rounded-full bg-accent ring-4 ring-background"
                />
                <div className="md:w-1/2 md:text-left">
                  <h3 className="text-lg sm:text-2xl font-bold text-accent md:hidden">{t.history.year2010_title}</h3>
                  <p className="text-sm text-foreground/80 md:hidden mb-2">{t.history.year2010_desc.split(". ")[0]}.</p>
                  <div className="bg-white/90 p-3.5 sm:p-4 rounded-xl border border-[#FDE68A]/60 text-xs sm:text-sm text-foreground/85">{t.history.year2010_desc.split(". ")[1]}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 9. Scrollytelling Hành trình nghệ nhân chế biến long nhãn */}
        <ProductScrollytelling language={language as "vi" | "en"} />

        {/* 10. Văn hóa ẩm thực Phố Hiến & Thưởng thức đúng điệu (Kết hợp Hồn Quê Trong Từng Thớ Nhãn & Cẩm nang pha chế) */}
        <ProductPairingSection
          language={language as "vi" | "en"}
          cultureImage={cmsContent.CultureImage ? resolveCmsImage(cmsContent.CultureImage) : undefined}
          onOrderClick={() => scrollToSection("dat-hang")}
        />

        {/* 11. Khu vực đặt hàng */}
        <section id="dat-hang" className="py-16 sm:py-24 bg-[#451A03] text-background relative overflow-hidden w-full max-w-full">
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/35 pointer-events-none -z-10" />

          <div className="container mx-auto px-4 md:px-6 relative z-10 w-full max-w-full">
            <div className="grid lg:grid-cols-2 gap-10 sm:gap-16 items-center">
              <div>
                <Reveal>
                  <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 text-white">
                    {(language === "en"
                      ? "Enjoy the Essence\nof Flavor"
                      : cmsContent.OrderTitle || "Thưởng Thức\nHương Vị Tinh Túy"
                    ).split("\n").filter(Boolean).map((line, i) => (
                      <span key={i}>{i > 0 && <br />}{line}</span>
                    ))}
                  </h2>
                </Reveal>
                <Reveal delay={0.08}>
                  <p className="text-sm sm:text-lg text-[#FDE68A] mb-6 sm:mb-8 leading-relaxed opacity-90 max-w-xl">
                    {language === "en" ? "Order today to receive the freshest batches of dried longan. We guarantee the highest quality delivered to your hands." : cmsContent.OrderDescription || "Đặt hàng ngay hôm nay để nhận được những mẻ long nhãn mới nhất. Chúng tôi cam kết chất lượng tuyệt hảo đến tay bạn."}
                  </p>
                </Reveal>

                <div className="space-y-4 sm:space-y-6">
                  <motion.div
                    whileHover={prefersReducedMotion ? undefined : { x: 8 }}
                    transition={{ type: "spring", stiffness: 300, damping: 24 }}
                    className="flex items-center gap-3.5 sm:gap-4 bg-[#78350F]/50 p-3.5 sm:p-4 rounded-2xl border border-[#92400E]"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent rounded-full flex items-center justify-center text-white shrink-0">
                      <Phone className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-[#FDE68A]">Hotline tư vấn (24/7)</p>
                      <p className="text-lg sm:text-xl font-bold text-white">{cmsContent.Hotline || "090 123 4567"}</p>
                    </div>
                  </motion.div>
                  <motion.div
                    whileHover={prefersReducedMotion ? undefined : { x: 8 }}
                    transition={{ type: "spring", stiffness: 300, damping: 24 }}
                    className="flex items-center gap-3.5 sm:gap-4 bg-[#78350F]/50 p-3.5 sm:p-4 rounded-2xl border border-[#92400E]"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent rounded-full flex items-center justify-center text-white shrink-0">
                      <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-[#FDE68A]">Địa chỉ xưởng sản xuất</p>
                      <p className="text-base sm:text-lg font-bold text-white">{cmsContent.Address || "Phố Hiến, Tp. Hưng Yên"}</p>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Form Đặt Hàng */}
              <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 shadow-xl shadow-black/20 text-foreground">
                <h3 className="text-xl sm:text-2xl font-bold text-primary mb-4 sm:mb-6">{t.order.title}</h3>

                {/* Kết quả gửi đơn trượt vào/ra mượt thay vì bật hiện đột ngột */}
                <AnimatePresence initial={false} mode="wait">
                  {submitStatus === "success" && (
                    <motion.div
                      key="order-success"
                      initial={{ opacity: 0, y: -14, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -14, scale: 0.98 }}
                      transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                      className="mb-6 bg-gradient-to-r from-emerald-50 via-amber-50/70 to-emerald-50 border-2 border-emerald-300 text-emerald-900 p-5 rounded-2xl relative overflow-hidden"
                    >
                      {/* Biểu tượng ánh sao lễ hội */}
                      <div className="absolute top-2 right-2 text-amber-500 opacity-70 pointer-events-none text-xl animate-pulse">
                        ✨
                      </div>

                      <div className="flex items-start sm:items-center gap-3.5 mb-2">
                        <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-base sm:text-lg font-bold text-emerald-950 flex items-center gap-2">
                            <span>🎉 {t.order.success}</span>
                          </p>
                          <p className="text-xs sm:text-sm text-emerald-800">
                            {language === "en"
                              ? "Thank you for choosing Nguyet Nhan Pho Hien!"
                              : "Cảm ơn bạn đã tin tưởng và đặt hàng tại Nguyệt Nhãn Phố Hiến!"}
                          </p>
                        </div>
                      </div>

                      {lastSubmittedEmail ? (
                        <div className="mt-3 ml-0 sm:ml-13 bg-white/90 backdrop-blur-xs border border-emerald-200 rounded-xl p-3.5 space-y-1">
                          <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                            <span className="text-base">📧</span>
                            <span>
                              {language === "en"
                                ? "Order confirmation & invoice sent successfully to:"
                                : "Đã gửi email xác nhận & hóa đơn thành công tới:"}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-emerald-950 pl-6 break-all">
                            {lastSubmittedEmail}
                          </p>
                          <p className="text-xs text-neutral-600 pl-6 italic">
                            {language === "en"
                              ? "(Please check your inbox or spam / junk folder)"
                              : "(Vui lòng kiểm tra hộp thư đến hoặc mục thư rác / spam)"}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs sm:text-sm text-emerald-800 mt-2 ml-0 sm:ml-13">
                          {language === "en"
                            ? "We will contact you shortly by phone to confirm your order."
                            : "Chúng tôi sẽ sớm liên hệ qua số điện thoại để xác nhận đơn hàng."}
                        </p>
                      )}

                      <div className="mt-3.5 ml-0 sm:ml-13 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowFireworks(true)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-full transition-all active:scale-95 cursor-pointer shadow-2xs"
                        >
                          <span>🎆</span>
                          <span>{language === "en" ? "Launch fireworks again" : "Bắn pháo hoa ăn mừng 🎆"}</span>
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Tổng hợp lỗi nhập liệu: hiện khi form có ô sai mà chưa gửi lên server */}
                  {submitStatus !== "error" && hasFieldErrors && (
                    <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <p className="font-medium">{t.order.check_fields}</p>
                    </div>
                  )}

                  {submitStatus === "error" && (
                    <motion.div
                      key="order-error"
                      initial={{ opacity: 0, y: -14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -14 }}
                      transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                      className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl"
                    >
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      {/* Hiện đúng nguyên nhân từ server (mã hết hạn, số lượng sai...)
                          thay vì câu chung chung — trước đây errorMessage bị ẩn đúng
                          lúc cần nhất vì khối dưới chỉ render khi KHÔNG có lỗi submit. */}
                      <p className="font-medium">{errorMessage || t.order.error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground/80">{t.order.name} *</label>
                      <input
                        type="text" required
                        maxLength={MAX_NAME_LENGTH}
                        autoComplete="name"
                        aria-invalid={!!errors.customerName}
                        value={form.customerName}
                        onChange={(e) => setField("customerName", e.target.value)}
                        onBlur={() => validateField("customerName")}
                        className={inputClass(errors.customerName)}
                      />
                      {errors.customerName && <FieldError message={errorText(errors.customerName)} />}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground/80">{t.order.phone} *</label>
                      <input
                        type="tel" required
                        inputMode="tel"
                        autoComplete="tel"
                        maxLength={20}
                        aria-invalid={!!errors.customerPhone}
                        value={form.customerPhone}
                        onChange={(e) => setField("customerPhone", e.target.value)}
                        // Rời ô SĐT thì chuẩn hoá về dạng 0xxxxxxxxx (bỏ khoảng trắng,
                        // đổi +84 → 0) để khách thấy đúng số sẽ được liên hệ.
                        onBlur={() => {
                          const normalized = normalizePhone(form.customerPhone);
                          if (normalized !== form.customerPhone) setField("customerPhone", normalized);
                          validateField("customerPhone");
                        }}
                        className={inputClass(errors.customerPhone)}
                      />
                      {errors.customerPhone && <FieldError message={errorText(errors.customerPhone)} />}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground/80">{language === "en" ? "Email (For invoice)" : "Email (Để nhận hóa đơn)"}</label>
                    <input
                      type="email"
                      autoComplete="email"
                      maxLength={MAX_EMAIL_LENGTH}
                      aria-invalid={!!errors.customerEmail}
                      value={form.customerEmail}
                      onChange={(e) => setField("customerEmail", e.target.value)}
                      onBlur={() => validateField("customerEmail")}
                      placeholder={language === "en" ? "example@email.com" : "vi_du@email.com"}
                      className={inputClass(errors.customerEmail)}
                    />
                    {errors.customerEmail && <FieldError message={errorText(errors.customerEmail)} />}
                  </div>

                  {/* Địa điểm giao hàng: khách tự chọn Tỉnh/Thành phố → Phường/Xã,
                      rồi điền số nhà. Danh sách nằm trong /data, chỉ tải khi khách
                      chạm vào ô chọn (xem useVnProvinces). */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground/80">{t.order.address} *</label>

                    {isManualAddress ? (
                      <input
                        type="text"
                        required
                        maxLength={MAX_ADDRESS_DETAIL_LENGTH}
                        autoComplete="street-address"
                        aria-invalid={!!errors.addressDetail}
                        aria-label={t.order.address_full}
                        placeholder={t.order.address_full}
                        value={form.addressDetail}
                        onChange={(e) => setField("addressDetail", e.target.value)}
                        onBlur={() => validateField("addressDetail")}
                        className={inputClass(errors.addressDetail)}
                      />
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <select
                            aria-label={t.order.province}
                            aria-invalid={!!errors.province}
                            value={form.province}
                            // Tải dữ liệu ngay khi khách chạm vào ô chọn
                            onFocus={enableProvincePicker}
                            onMouseDown={enableProvincePicker}
                            onChange={(e) => setField("province", e.target.value)}
                            onBlur={() => validateField("province")}
                            className={inputClass(errors.province)}
                          >
                            <option value="">
                              {isLoadingProvinces ? t.order.loading_locations : t.order.select_province}
                            </option>
                            {vnProvinces.map((p) => (
                              <option key={p.code} value={p.name}>{p.name}</option>
                            ))}
                          </select>

                          <select
                            aria-label={t.order.ward}
                            aria-invalid={!!errors.ward}
                            value={form.ward}
                            disabled={!form.province || wardOptions.length === 0}
                            onChange={(e) => setField("ward", e.target.value)}
                            onBlur={() => validateField("ward")}
                            className={`${inputClass(errors.ward)} disabled:opacity-60 disabled:cursor-not-allowed`}
                          >
                            <option value="">
                              {form.province ? t.order.select_ward : t.order.select_ward_first}
                            </option>
                            {wardOptions.map((w) => (
                              <option key={w} value={w}>{w}</option>
                            ))}
                          </select>
                        </div>
                        {(errors.province || errors.ward) && (
                          <FieldError message={errorText(errors.province || errors.ward)} />
                        )}

                        <input
                          type="text"
                          required
                          maxLength={MAX_ADDRESS_DETAIL_LENGTH}
                          autoComplete="address-line1"
                          aria-label={t.order.address_detail}
                          aria-invalid={!!errors.addressDetail}
                          placeholder={`${t.order.address_detail} (${language === "en" ? "e.g. 123 Pho Hien street" : "ví dụ: 123 đường Phố Hiến"})`}
                          value={form.addressDetail}
                          onChange={(e) => setField("addressDetail", e.target.value)}
                          onBlur={() => validateField("addressDetail")}
                          className={`${inputClass(errors.addressDetail)} mt-3`}
                        />
                        {errors.addressDetail && <FieldError message={errorText(errors.addressDetail)} />}
                      </>
                    )}

                    {/* Xem trước đúng chuỗi địa chỉ sẽ in trên hoá đơn / gửi đi */}
                    {!isManualAddress && composeAddress(form) && (
                      <p className="text-xs text-foreground/60 pt-1">
                        📍 {composeAddress(form)}
                      </p>
                    )}

                    {provinceLoadError && (
                      <p className="text-xs text-amber-700">{t.order.location_load_error}</p>
                    )}

                    <button
                      type="button"
                      onClick={toggleManualAddress}
                      className="text-xs font-medium text-accent hover:text-accent/80 underline underline-offset-2 pt-1"
                    >
                      {isManualAddress ? t.order.manual_address_back : t.order.manual_address}
                    </button>
                  </div>

                  {/* Danh sách sản phẩm mua */}
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-foreground/80">
                        {language === "en" ? "Selected Products *" : "Sản phẩm chọn mua *"}
                      </label>
                      <button
                        type="button"
                        onClick={addItem}
                        disabled={!canAddItem}
                        title={canAddItem ? undefined : "Đã chọn hết sản phẩm đang bán"}
                        className="text-xs font-semibold text-accent hover:text-accent/80 flex items-center gap-1 bg-accent/10 px-3 py-1.5 rounded-lg border border-accent/20 transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {language === "en" ? "Add Product" : "Thêm sản phẩm khác"}
                      </button>
                    </div>

                    {form.items.map((item, idx) => {
                      const custom = item.isCustomMix ? item.customMixDetails : undefined;
                      return (
                      <div key={idx} className="flex flex-col sm:flex-row gap-2.5 p-3 rounded-xl bg-amber-50/70">
                        <div className="flex-1 min-w-0">
                          {custom ? (
                            // Sản phẩm tự chọn hạt: công thức do khách chốt trong Custom Mix
                            // Studio nên hiển thị cố định, không cho đổi sang sản phẩm khác
                            // (đổi ô chọn cũng không làm thay đổi đơn vì backend dùng công thức).
                            <div className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {custom.customProductName}
                              </p>
                              <p className="text-xs text-foreground/60 truncate">
                                {custom.packagingName} ({custom.targetWeightGrams}g)
                                {custom.ingredients?.length
                                  ? ` · ${custom.ingredients.map((ing) => `${ing.name} ${ing.weightGrams}g`).join(", ")}`
                                  : ""}
                              </p>
                            </div>
                          ) : (
                            <select
                              required
                              aria-label={`${t.order.select_product} ${idx + 1}`}
                              value={item.productId}
                              onChange={(e) => updateItem(idx, "productId", e.target.value)}
                              className="w-full bg-white border border-gray-200 focus:border-[#B45309] focus:ring-1 focus:ring-[#B45309] rounded-xl px-3 py-2 text-sm outline-none transition-all truncate"
                            >
                              <option value="">{t.order.select_default}</option>
                              {effectiveProducts.map((prod) => (
                                <option key={prod.id} value={prod.id}>
                                  {prod.name} - {language === "en" ? `$${(prod.price / 25000).toFixed(2).replace(',', '.')}` : `${prod.price.toLocaleString("vi-VN").replace(/,/g, '.')}đ`}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0">
                          <div className="w-24 shrink-0">
                            <input
                              type="number"
                              min="1"
                              max="999"
                              required
                              value={item.quantity}
                              onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                              className="w-full bg-white border border-gray-200 focus:border-[#B45309] focus:ring-1 focus:ring-[#B45309] rounded-xl px-3 py-2 text-sm text-center outline-none transition-all"
                            />
                          </div>
                          {form.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                              title="Xóa sản phẩm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      );
                    })}
                  </div>

                  {/* Mã giảm giá */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground/80">{t.order.discount}</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={form.discountCode}
                        onChange={(e) => setField("discountCode", e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyDiscount())}
                        className="flex-1 bg-background border border-[#FDE68A] focus:border-[#B45309] focus:ring-1 focus:ring-[#B45309] rounded-xl px-4 py-3 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={applyDiscount}
                        disabled={isApplyingCode || !form.discountCode.trim()}
                        className="bg-primary text-white px-5 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {isApplyingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {t.order.apply}
                      </button>
                    </div>
                    {discountResult?.isValid && (
                      <p className="text-green-600 text-sm flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        {discountResult.percentOff
                          ? `Giảm ${discountResult.percentOff}%`
                          : `Giảm ${discountResult.amountOff?.toLocaleString()}đ`
                        }
                      </p>
                    )}
                    {discountNotice && (
                      <div className="text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                        <span>{discountNotice}</span>
                      </div>
                    )}
                    {errorMessage && !submitStatus.includes("error") && (
                      <p className="text-red-500 text-sm">{errorMessage}</p>
                    )}
                  </div>

                  {/* Tổng tiền */}
                  {form.items.some((i) => i.productId) && (
                    <div className="bg-secondary/50 rounded-xl px-5 py-4 space-y-2">
                      <div className="space-y-1 pb-2 border-b border-gray-200/60 text-xs text-foreground/80">
                        {form.items.map((item, idx) => {
                          const custom = item.isCustomMix ? item.customMixDetails : undefined;
                          const prod = effectiveProducts.find((p) => p.id === item.productId);
                          if (!custom && !prod) return null;
                          const unitPrice = custom?.fixedPrice ?? prod!.price;
                          const name = custom?.customProductName ?? prod!.name;
                          const size = custom
                            ? `${custom.packagingName} (${custom.targetWeightGrams}g)`
                            : prod!.size;
                          const itemTotal = unitPrice * (item.quantity || 1);
                          return (
                            <div key={idx} className="flex justify-between items-start gap-2">
                              <span className="flex-1 min-w-0 break-words">{name} ({size}) x{item.quantity}</span>
                              <span className="font-medium shrink-0">
                                {language === "en"
                                  ? `$${(itemTotal / 25000).toFixed(2).replace(',', '.')}`
                                  : `${itemTotal.toLocaleString("vi-VN").replace(/,/g, '.')}đ`}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-between text-sm text-foreground/70 pt-1">
                        <span>{t.order.base_price}</span>
                        <span>
                          {language === "en"
                            ? `$${(base / 25000).toFixed(2).replace(',', '.')}`
                            : `${base.toLocaleString("vi-VN").replace(/,/g, '.')}đ`}
                        </span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>{t.order.discount_amount}</span>
                          <span>
                            -{language === "en"
                              ? `$${(discount / 25000).toFixed(2).replace(',', '.')}`
                              : `${discount.toLocaleString("vi-VN").replace(/,/g, '.')}đ`}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-primary border-t pt-2">
                        <span>{t.order.total_bill}</span>
                        <span className="text-accent text-lg">
                          {language === "en"
                            ? `$${(final / 25000).toFixed(2).replace(',', '.')}`
                            : `${final.toLocaleString("vi-VN").replace(/,/g, '.')}đ`}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground/80">{t.order.add_note}</label>
                    <textarea
                      rows={3}
                      value={form.note}
                      onChange={(e) => setField("note", e.target.value)}
                      className="w-full bg-background border border-[#FDE68A] focus:border-[#B45309] focus:ring-1 focus:ring-[#B45309] rounded-xl px-4 py-3 outline-none transition-all resize-none"
                      placeholder={t.order.note_placeholder}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !form.items.some((i) => i.productId)}
                    className="w-full bg-gradient-to-r from-[#92400E] to-[#B45309] hover:from-[#78350F] hover:to-[#92400E] text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-black/25 transition-all hover:-translate-y-0.5 active:scale-95 flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> {t.order.submitting}</>
                    ) : (
                      <>{t.order.send_order} <ChevronRight className="w-5 h-5" /></>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* 14. Footer */}
      <footer id="lien-he" className="bg-foreground text-background py-16 border-t border-primary overflow-hidden w-full max-w-full">
        <div className="container mx-auto px-4 md:px-6 w-full max-w-full">
          <Reveal y={30}>
            <div className="grid md:grid-cols-4 gap-8 md:gap-12">
              <div className="space-y-4 md:col-span-1">
                <h3 style={{ fontFamily: 'var(--font-dancing)' }} className="text-[34px] font-bold text-white flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-accent font-sans font-bold text-xs overflow-hidden relative shrink-0">
                    <span className="absolute">NN</span>
                    <FastImage
                      src={resolveCmsImage(cmsContent.SiteLogo) || "/logo.jpg"}
                      alt="Nguyệt Nhãn Phố Hiến"
                      fill
                      sizes="48px"
                      className="w-full h-full object-cover z-10"
                      onError={(e) => e.currentTarget.style.display = 'none'}
                    />
                  </div>
                  <span className="leading-tight">Nguyệt Nhãn Phố Hiến</span>
                </h3>
                <p className="text-stone-300 text-sm leading-relaxed">
                  {language === "en" ? "The brand providing authentic Pho Hien Dried Longan specialty. 100% natural, no preservatives, preserving traditional flavors." : "Thương hiệu cung cấp đặc sản Long Nhãn Phố Hiến chính gốc. Cam kết 100% tự nhiên, không chất bảo quản, giữ trọn hương vị truyền thống."}
                </p>
              </div>
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-white">{t.nav.contact}</h4>
                <ul className="space-y-2 text-stone-300 text-sm">
                  <li>Hotline/Zalo: {cmsContent.FooterHotline || "034 897 3285"}</li>
                  <li>Email: {cmsContent.ContactEmail || "nguyetnhanphohien@gmail.com"}</li>
                  <li>Địa chỉ: {cmsContent.FooterAddress || "123 Phố Hiến, Phường Hồng Châu, Tp. Hưng Yên"}</li>
                  <li>Giờ mở cửa: {cmsContent.ContactHours || "08:00 - 20:00 (T2-CN)"}</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-white">{language === "en" ? "Navigation" : "Điều Hướng"}</h4>
                <ul className="space-y-2 text-stone-300 text-sm flex flex-col items-start">
                  <li><button onClick={() => scrollToSection("san-pham")} className="hover:text-white transition-colors text-left">{t.nav.products}</button></li>
                  <li><button onClick={() => scrollToSection("cau-chuyen")} className="hover:text-white transition-colors text-left">{t.nav.story}</button></li>
                  <li><button onClick={() => scrollToSection("lich-su")} className="hover:text-white transition-colors text-left">{t.history.title}</button></li>
                  <li><button onClick={() => scrollToSection("van-hoa")} className="hover:text-white transition-colors text-left">{t.culture.title}</button></li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-white">{language === "en" ? "Policies" : "Chính Sách"}</h4>
                <ul className="space-y-2 text-stone-300 text-sm flex flex-col items-start">
                  <li><Link href="/chinh-sach/giao-hang" prefetch={true} className="hover:text-white transition-colors text-left">{language === "en" ? "Shipping Policy" : "Chính sách giao hàng"}</Link></li>
                  <li><Link href="/chinh-sach/doi-tra" prefetch={true} className="hover:text-white transition-colors text-left">{language === "en" ? "Return Policy" : "Chính sách đổi trả"}</Link></li>
                  <li><Link href="/chinh-sach/bao-mat" prefetch={true} className="hover:text-white transition-colors text-left">{language === "en" ? "Privacy Policy" : "Bảo mật thông tin"}</Link></li>
                  <li><Link href="/chinh-sach/kiem-dinh" prefetch={true} className="hover:text-white transition-colors text-left">{language === "en" ? "Quality Inspection" : "Kiểm định chất lượng"}</Link></li>
                </ul>
              </div>
            </div>
          </Reveal>
          <div className="border-t border-primary mt-12 pt-8 text-center text-stone-300 text-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-4 items-center">
              {/* Social Icons */}
              <a href="https://www.facebook.com/NguyetNhanPhoHien" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-accent hover:-translate-y-1 transition-all text-white group" title="Facebook">
                <svg className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24"><path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" /></svg>
              </a>
              <a href="https://zalo.me/0982072601" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-accent hover:-translate-y-1 transition-all text-white group" title="Zalo">
                <svg className="w-5 h-5 fill-none stroke-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5C21 16.19 16.97 20 12 20C10.87 20 9.8 19.8 8.8 19.45C8.42 19.32 8.02 19.29 7.63 19.36L4.7 19.92C4.16 20.02 3.65 19.51 3.75 18.97L4.31 16.04C4.38 15.65 4.35 15.25 4.22 14.87C3.87 13.87 3.67 12.8 3.67 11.67C3.67 6.98 7.7 3.17 12.67 3.17C17.64 3.17 21 6.98 21 11.5Z" /><text x="12" y="15" fontFamily="Arial" fontSize="7" fontWeight="bold" fill="currentColor" stroke="none" textAnchor="middle">Zalo</text></svg>
              </a>
              <a href="https://www.instagram.com/Nguy%E1%BB%87t%20Nh%C3%A3n%20Ph%E1%BB%91%20Hi%E1%BA%BFn" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-accent hover:-translate-y-1 transition-all text-white group" title="Instagram">
                <svg className="w-5 h-5 fill-none stroke-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
              </a>
              <a href="https://www.tiktok.com/@nguyetnhan888?_r=1&_t=ZS-99nuoBxZRau" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-accent hover:-translate-y-1 transition-all text-white group" title="Tiktok">
                <svg className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24"><path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.24-2.61.94-5.26 3.15-6.81 1.76-1.23 4-1.67 6.13-1.25V9.41c-1.31-.22-2.64-.17-3.92.2-1.57.46-2.94 1.48-3.79 2.85-.92 1.45-1.13 3.32-.61 4.96.48 1.48 1.54 2.82 2.93 3.48 1.63.76 3.63.76 5.25-.13 1.99-1.07 3.2-3.23 3.19-5.49-.04-4.84-.01-9.68-.01-14.52H12.53z" /></svg>
              </a>
            </div>
            <p className="text-center md:text-right">{language !== "en" && cmsContent.FooterText ? cmsContent.FooterText : `© 2026 Nguyệt Nhãn Phố Hiến. ${t.footer.rights}`}</p>
          </div>
        </div>
      </footer>

      {/* Floating Chat Widget — Kết nối SignalR thực */}
      <div className="fixed bottom-20 right-3.5 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end">
        <AnimatePresence>
          {isChatOpen && !isCartDrawerOpen && (
            <motion.div
              key="chat-panel"
              initial={{ opacity: 0, y: 28, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.94 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-[calc(100vw-2rem)] sm:w-[350px] max-w-[360px] mb-3 sm:mb-4 overflow-hidden flex flex-col origin-bottom-right"
            >
              {/* Header điều hướng giữa Chuyên gia AI và Tư vấn viên người thật */}
              <div className="bg-gradient-to-r from-[#92400E] via-[#B45309] to-[#D97706] p-3 text-white">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs shadow-inner">
                      {chatMode === "ai" ? <Sparkles className="w-4 h-4 text-amber-200" /> : "NV"}
                    </div>
                    <div>
                      <p className="font-bold text-xs sm:text-sm">
                        {chatMode === "ai" ? "Chuyên Gia AI Dinh Dưỡng" : "Tư vấn viên"}
                      </p>
                      <p className="text-[10px] sm:text-[11px] opacity-85">
                        {chatMode === "ai" ? "Trí tuệ nhân tạo Gemini 3.5" : (isConnected ? "Đang trực tuyến" : "Đang kết nối...")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {totalCartItems > 0 && (
                      <button
                        onClick={() => {
                          setIsChatOpen(false);
                          openCart();
                        }}
                        className="hover:bg-white/20 p-1.5 rounded-full transition-colors relative"
                        aria-label={language === "en" ? "View Cart" : "Xem giỏ hàng"}
                        title={language === "en" ? "View Cart" : "Xem giỏ hàng"}
                      >
                        <ShoppingBag className="w-4.5 h-4.5 text-white" />
                        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center border border-white">
                          {totalCartItems > 99 ? "99+" : totalCartItems}
                        </span>
                      </button>
                    )}
                    <button onClick={() => setIsChatOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors" aria-label="Đóng chat">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* 2 Tabs chuyển đổi chế độ */}
                <div className="grid grid-cols-2 gap-1 p-0.5 bg-black/20 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setChatMode("ai")}
                    className={`py-1 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      chatMode === "ai"
                        ? "bg-white text-[#92400E] shadow-sm font-bold"
                        : "text-white/80 hover:text-white"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>AI Dinh Dưỡng</span>
                  </button>
                  <button
                    onClick={() => {
                      setChatMode("human");
                      if (chatStarted) connect(guestName || undefined, guestPhone || undefined);
                    }}
                    className={`py-1 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      chatMode === "human"
                        ? "bg-white text-[#92400E] shadow-sm font-bold"
                        : "text-white/80 hover:text-white"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-amber-400"}`}></span>
                    <span>Tư Vấn Viên</span>
                  </button>
                </div>
              </div>

              {/* Tab 1: AI Dinh Dưỡng (giữ nguyên DOM để không mất lịch sử) */}
              <div className={chatMode === "ai" ? "block" : "hidden"}>
                <NutritionAiWidget
                  language={language as "vi" | "en"}
                  onSwitchToLiveChat={() => {
                    setChatMode("human");
                    if (chatStarted) connect(guestName || undefined, guestPhone || undefined);
                  }}
                />
              </div>

              {/* Tab 2: Tư Vấn Viên (giữ nguyên kết nối SignalR) */}
              <div className={chatMode === "human" ? "block" : "hidden"}>
                {!chatStarted ? (
                  /* Nhập tên trước khi chat */
                  <div className="p-4 sm:p-5 space-y-3">
                    <p className="text-xs sm:text-sm text-foreground/70">{language === "en" ? "To serve you better, please provide:" : "Để chúng tôi hỗ trợ tốt hơn, vui lòng cho biết:"}</p>
                    <input
                      type="text"
                      placeholder={language === "en" ? "Your name *" : "Họ tên của bạn *"}
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full border border-gray-200 focus:border-[#B45309] focus:ring-1 focus:ring-[#B45309] rounded-lg px-3 py-2 text-xs sm:text-sm outline-none"
                    />
                    <input
                      type="tel"
                      placeholder={language === "en" ? "Phone number (optional)" : "Số điện thoại (không bắt buộc)"}
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className="w-full border border-gray-200 focus:border-[#B45309] focus:ring-1 focus:ring-[#B45309] rounded-lg px-3 py-2 text-xs sm:text-sm outline-none"
                    />
                    <button
                      onClick={handleStartChat}
                      disabled={!guestName.trim()}
                      className="w-full bg-accent text-white font-bold py-2.5 rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 text-xs sm:text-sm"
                    >
                      {t.chat.start}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="h-[250px] sm:h-[280px] bg-background p-3.5 sm:p-4 overflow-y-auto flex flex-col gap-2.5 sm:gap-3">
                      {isSessionTerminated && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2.5 rounded-xl text-xs text-center">
                          Cuộc trò chuyện đã kết thúc bởi tư vấn viên. Bạn có thể gửi tin nhắn mới để bắt đầu lại.
                        </div>
                      )}
                      {messages.length === 0 && !isSessionTerminated && (
                        <div className="bg-white border p-3 rounded-2xl rounded-tl-sm text-xs sm:text-sm text-primary max-w-[85%] self-start shadow-sm">
                          Chào {guestName}! Bạn cần tư vấn về loại Long Nhãn nào ạ?
                        </div>
                      )}
                      {messages.map((msg, idx) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 12, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          className={`p-2.5 sm:p-3 rounded-2xl text-xs sm:text-sm max-w-[85%] shadow-sm ${msg.senderType === 'Guest'
                            ? 'bg-accent text-white self-end rounded-br-sm'
                            : 'bg-white border text-primary self-start rounded-tl-sm'
                            }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          <span className={`text-[9px] sm:text-[10px] block mt-1 opacity-70 ${msg.senderType === 'Guest' ? 'text-right' : ''}`}>
                            {new Date(msg.sentAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                            {idx === lastGuestMessageIndex && msg.isRead && (
                              <span className="ml-1">· {language === "en" ? "Seen" : "Đã xem"}</span>
                            )}
                          </span>
                        </motion.div>
                      ))}
                      {isAdminTyping && (
                        <div className="bg-white border p-2.5 sm:p-3 rounded-2xl rounded-tl-sm shadow-sm self-start flex items-center gap-1.5" aria-label={language === "en" ? "Advisor is typing" : "Tư vấn viên đang gõ"}>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#B45309] animate-pulse [animation-delay:0ms]"></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#B45309] animate-pulse [animation-delay:200ms]"></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#B45309] animate-pulse [animation-delay:400ms]"></span>
                          <span className="ml-2 text-xs text-foreground/75 font-medium">
                            {language === "en" ? "Advisor is typing..." : "Tư vấn viên đang gõ..."}
                          </span>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    <div className="p-2.5 sm:p-3 bg-white border-t">
                      <div className="relative">
                        <input
                          type="text"
                          value={chatInput}
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
                          className="w-full bg-background border border-gray-200 focus:border-[#B45309] focus:ring-1 focus:ring-[#B45309] rounded-full pl-3.5 pr-11 py-2 text-xs sm:text-sm outline-none transition-all"
                        />
                        <button
                          onClick={handleSendChatMessage}
                          disabled={isSending || !chatInput.trim()}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 bg-accent text-white rounded-full flex items-center justify-center hover:bg-accent/90 transition-colors disabled:opacity-50"
                          aria-label="Gửi tin nhắn"
                        >
                          {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {chatSendError && (
                        <p className="text-xs text-red-500 mt-1.5 px-2">
                          Không gửi được tin nhắn. Kiểm tra kết nối và thử lại!
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
        </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={handleToggleChat}
          className="relative w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#B45309] to-[#D97706] text-white rounded-full shadow-2xl flex items-center justify-center hover:opacity-95 focus:outline-none focus:ring-4 focus:ring-[#B45309]/30"
          aria-label={isChatOpen ? "Đóng chat" : "Mở chat tư vấn AI & Chuyên viên"}
        >
          {/* Badge Chuyên gia AI nhấp nháy nổi bật */}
          {!isChatOpen && (
            <>
              <span aria-hidden className="absolute inset-0 rounded-full border-2 border-amber-500 animate-pulse-ring" />
              <span className="absolute -top-2 -left-2 bg-emerald-800 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-0.5 border border-white">
                <Sparkles className="w-2.5 h-2.5" /> AI
              </span>
            </>
          )}
          {isChatOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />}
          {!isChatOpen && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white shadow-lg border-2 border-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </motion.button>
      </div>

      {/* 15. Thanh thao tác nhanh cố định trên Mobile (Sticky Bottom Bar) */}
      <AnimatePresence>
        {isScrolled && !isMobileMenuOpen && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#FDE68A]/70 px-4 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] flex items-center justify-between gap-3 safe-area-bottom"
          >
            <a
              href={`tel:${cmsContent.Hotline || "0982072601"}`}
              className="flex flex-col items-center justify-center py-1 px-2 text-primary hover:text-accent transition-colors shrink-0"
              aria-label="Gọi hotline"
            >
              <Phone className="w-4 h-4 text-accent mb-0.5" />
              <span className="text-[10px] font-bold">Hotline</span>
            </a>

            <button
              onClick={() => handleOpenCart()}
              className="flex flex-col items-center justify-center py-1 px-2 text-primary hover:text-accent transition-colors shrink-0 relative"
              aria-label="Giỏ hàng"
            >
              <div className="relative">
                <ShoppingCart className="w-4 h-4 text-accent mb-0.5" />
                {totalCartItems > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center border border-white">
                    {totalCartItems > 99 ? "99+" : totalCartItems}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-bold">Giỏ Hàng</span>
            </button>

            <button
              onClick={handleOpenChat}
              className="flex flex-col items-center justify-center py-1 px-2 text-primary hover:text-accent transition-colors shrink-0"
              aria-label="Tư vấn"
            >
              <MessageCircle className="w-4 h-4 text-accent mb-0.5" />
              <span className="text-[11px] font-bold">Tư Vấn</span>
            </button>

            <button
              onClick={() => {
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



      {/* Floating Cart Button & Slide-in Cart Drawer */}
      <CartButton isChatOpen={isChatOpen} />
      <CartDrawer
        language={language as "vi" | "en"}
        onCheckout={handleCartCheckout}
        onBrowseProducts={() => scrollToSection("san-pham")}
      />

      {/* Hiệu ứng bắn pháo hoa khi đặt hàng thành công */}
      <FireworksCelebration
        isActive={showFireworks}
        onClose={() => setShowFireworks(false)}
      />

    </motion.div>
  );
}

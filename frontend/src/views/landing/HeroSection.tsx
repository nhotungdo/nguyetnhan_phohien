"use client";

import { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  ArrowRight,
  ShoppingCart,
  ShoppingBag,
  MessageCircle,
  Phone,
  ChevronRight,
  LayoutDashboard,
  KeyRound,
  Leaf,
  Flame,
  ShieldCheck,
  Award,
  Headphones,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { EASE_OUT_EXPO } from "@/components/LandingMotion";
import { adminAuth } from "@/services/api.service";
import { triggerPageNavigation } from "@/components/layout/RouteProgressBar";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useProducts } from "@/hooks/useProducts";
import { useWebsiteContent } from "@/hooks/useWebsiteContent";
import { useCartStore } from "@/stores/useCartStore";
import { ProductGalleryModal } from "@/components/ProductGalleryModal";
import { FastImage } from "@/components/FastImage";
import { ProductInteractiveShowcase } from "@/components/ProductInteractiveShowcase";
import { ProductHeroShowcase } from "@/components/ProductHeroShowcase";
import { ProductComparisonSection } from "@/components/ProductComparisonSection";
import { CartDrawer } from "@/components/cart";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { DEFAULT_FALLBACK_PRODUCTS } from "@/data/defaultProducts";
import type { ProductResponse } from "@/types/api.types";
import { scrollToSection } from "@/lib/scrollToSection";
import { resolveCmsImage } from "@/lib/cmsImage";

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

export function HeroSection() {
  const isAdmin = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthServerSnapshot);
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [galleryProduct, setGalleryProduct] = useState<ProductResponse | null>(null);

  const { t, language, setLanguage } = useLanguageStore();
  const { products: apiProducts } = useProducts();
  const { content: cmsContent } = useWebsiteContent();

  const { addItem: addCartItem, closeCart, openCart, getTotalItems } = useCartStore();
  const cartStoreItems = useCartStore((s) => s.items);
  const totalCartItems = isMounted ? getTotalItems() : 0;

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
            .replace(/Set\s*(\d+[a-zA-Z]+)\s*\((.*?)\)/gi, (_, weight, note) => {
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

  const brandCommitments = [
    { id: "natural", label: t.about.natural_title, icon: Leaf },
    { id: "traditional", label: t.about.traditional_title, icon: Flame },
    { id: "safe", label: t.about.safe_title, icon: ShieldCheck },
    { id: "quality", label: t.hero.quality, icon: Award },
    { id: "support", label: t.nav.support, icon: Headphones },
  ];

  const heroLines = (() => {
    if (language === "en") {
      const parts = t.hero.title.split(" ").filter(Boolean);
      return [parts[0] ?? "", parts.slice(1).join(" ")].filter(Boolean);
    }
    const words = (cmsContent.HeroTitle || "").trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return ["Hương Vị", "Truyền Thống"];
    if (words.length === 1) return [words[0]];

    let split = Math.ceil(words.length / 2);
    if (split > 0 && split < words.length) {
      const prevWord = words[split - 1].toLowerCase();
      const nextWord = words[split].toLowerCase();
      if (prevWord === "long" && nextWord.startsWith("nhãn")) {
        split += 1;
      } else if (prevWord === "phố" && nextWord.startsWith("hiến")) {
        split -= 1;
      } else if (prevWord === "hưng" && nextWord.startsWith("yên")) {
        split -= 1;
      } else if (prevWord === "tiến" && nextWord.startsWith("vua")) {
        split -= 1;
      }
    }

    const line1 = words.slice(0, split).join(" ");
    const line2 = words.slice(split).join(" ");
    return [line1, line2].filter(Boolean);
  })();
  const heroLine1 = heroLines[0];
  const heroLine2 = heroLines[1] ?? "";

  const handleOpenCart = () => {
    openCart();
  };

  const handleQuickBuy = (product: ProductResponse) => {
    addCartItem(product);
    closeCart();
    scrollToSection("dat-hang");
  };

  const handleCartCheckout = () => {
    closeCart();
    scrollToSection("dat-hang");
  };

  return (
    <>
      {/* 1. Header */}
      <motion.header
        initial={{ y: -90, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
        className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,padding,box-shadow] duration-300 w-full max-w-full ${
          isScrolled ? "bg-white/95 backdrop-blur-md shadow-sm py-2.5 sm:py-3" : "bg-transparent py-3 sm:py-5"
        }`}
      >
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between w-full max-w-full">
          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none"
            onClick={() => scrollToSection("hero")}
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white flex items-center justify-center overflow-hidden border border-[#E8DFC8] shadow-sm relative shrink-0">
              <span className="absolute text-accent font-bold text-xs">NN</span>
              <FastImage
                src={resolveCmsImage(cmsContent.SiteLogo) || "/images/logo_emblem_circle.png"}
                fallbackSrc="/logo.jpg"
                alt="Nguyệt Nhãn Phố Hiến"
                fill
                sizes="56px"
                className="w-full h-full object-contain p-0.5 z-10"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
            <span
              style={{ fontFamily: "var(--font-dancing), cursive" }}
              className="font-bold text-2xl min-[360px]:text-[26px] sm:text-3xl md:text-[34px] tracking-wide transition-colors text-primary whitespace-nowrap"
            >
              Nguyệt Nhãn Phố Hiến
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-2 lg:gap-3 xl:gap-4.5 2xl:gap-6 shrink-0">
            {[
              { label: t.nav.products, id: "san-pham" },
              { label: t.nav.story, id: "cau-chuyen" },
              { label: t.nav.cuisine || (language === "en" ? "Pho Hien Cuisine" : "Ẩm Thực Phố Hiến"), id: "am-thuc" },
              { label: t.nav.process, id: "quy-trinh" },
              { label: t.nav.contact, id: "lien-he" },
            ].map((item, index) => (
              <button
                key={index}
                onClick={() => scrollToSection(item.id)}
                className="text-xs lg:text-sm xl:text-[15px] font-semibold text-foreground/80 hover:text-accent transition-all duration-300 ease-in-out relative group cursor-pointer whitespace-nowrap shrink-0 py-1"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent transition-all duration-300 ease-in-out group-hover:w-full" />
              </button>
            ))}
            <Link
              href="/tu-chon-hat"
              className="text-xs xl:text-sm font-bold text-primary bg-[#F4EFE6] border border-[#E8DFC8] px-2.5 lg:px-3.5 py-1.5 rounded-full shadow-xs hover:shadow-md hover:scale-105 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <span>{t.nav.custom_mix || "Tự Chọn Hạt"}</span>
              <span className="bg-[#A61C45] text-white text-[10px] xl:text-[11px] font-extrabold px-1.5 xl:px-2 py-0.5 rounded-full uppercase tracking-wider">
                {language === "en" ? "New" : "Mới"}
              </span>
            </Link>
          </nav>

          <div className="hidden xl:flex items-center gap-2 lg:gap-3 xl:gap-4 shrink-0">
            <button
              onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
              className="text-xs lg:text-sm font-bold text-foreground/80 border px-2.5 lg:px-3 py-1.5 rounded-full hover:bg-muted transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              {language === "vi" ? "🇻🇳 VI" : "🇬🇧 EN"}
            </button>
            <button
              onClick={() => handleOpenCart()}
              className="text-base font-semibold text-foreground/80 hover:text-accent transition-all duration-300 ease-in-out flex items-center gap-2 relative p-1.5 shrink-0"
              aria-label={language === "en" ? "Shopping Cart" : "Giỏ hàng"}
            >
              <ShoppingCart className="w-5 h-5" />
              {totalCartItems > 0 && (
                <span className="absolute -top-1.5 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {totalCartItems > 99 ? "99+" : totalCartItems}
                </span>
              )}
            </button>
            <button
              onClick={() => scrollToSection("lien-he")}
              className="text-base font-semibold text-foreground/80 hover:text-accent transition-all duration-300 ease-in-out flex items-center gap-2 p-1.5 shrink-0"
              aria-label={language === "en" ? "Live Chat" : "Trò chuyện trực tuyến"}
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => scrollToSection("dat-hang")}
              className="bg-accent hover:bg-accent/90 text-white text-xs lg:text-sm xl:text-base font-bold px-3.5 lg:px-5 xl:px-6 py-2 lg:py-2.5 rounded-full shadow-lg shadow-[#B45309]/30 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-1.5 lg:gap-2 whitespace-nowrap shrink-0"
            >
              <ShoppingCart className="w-4 h-4" /> <span>{t.nav.buyNow}</span>
            </button>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex xl:hidden items-center gap-1">
            {!isMobileMenuOpen && (
              <>
                <button
                  onClick={() => handleOpenCart()}
                  className="p-2 text-foreground/80 hover:text-accent rounded-xl hover:bg-black/5 active:scale-95 transition-all relative"
                  aria-label={language === "en" ? "Shopping Cart" : "Giỏ hàng"}
                >
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  {totalCartItems > 0 && (
                    <span className="absolute top-1 right-0.5 min-w-[17px] h-[17px] px-1 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border border-white shadow-xs">
                      {totalCartItems > 99 ? "99+" : totalCartItems}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
                  className="text-xs font-bold text-foreground/85 border border-[#FDE68A] px-2 py-1 rounded-full bg-white/90 shadow-xs transition-colors"
                  aria-label={language === "en" ? "Switch language" : "Chuyển ngôn ngữ"}
                >
                  {language === "vi" ? "🇻🇳" : "🇬🇧"}
                </button>
              </>
            )}
            <button
              className="p-2 text-foreground/80 rounded-xl hover:bg-black/5 active:scale-95 transition-all"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6 text-primary" /> : <Menu className="w-6 h-6 text-primary" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            key="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label={language === "en" ? "Navigation Menu" : "Menu Điều Hướng"}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
            className="fixed inset-0 z-[60] bg-white/98 backdrop-blur-xl pt-20 px-6 pb-8 flex flex-col justify-between xl:hidden overflow-y-auto"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {language === "en" ? "Navigation Menu" : "Menu Điều Hướng"}
                </span>
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
                { label: t.nav.cuisine || (language === "en" ? "Pho Hien Cuisine" : "Ẩm Thực Phố Hiến"), id: "am-thuc" },
                { label: t.nav.film || "Thước phim", id: "thuoc-phim" },
                { label: t.nav.history, id: "lich-su" },
                { label: t.nav.process, id: "quy-trinh" },
                { label: t.nav.contact, id: "lien-he" },
              ].map((item, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.04 + index * 0.05, ease: EASE_OUT_EXPO }}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    scrollToSection(item.id);
                  }}
                  className="w-full text-lg font-bold text-primary text-left py-2.5 flex items-center justify-between border-b border-border/40 hover:text-accent transition-colors"
                >
                  <span>{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-accent/70" />
                </motion.button>
              ))}

              <Link
                href="/tu-chon-hat"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-base font-bold text-primary bg-[#F4EFE6] p-3 rounded-2xl flex items-center justify-between border border-[#E8DFC8] shadow-xs active:scale-98 transition-all my-1"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-accent text-white flex items-center justify-center shadow-xs">
                    <ShoppingBag className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold">
                        {language === "en" ? "Bespoke Custom Mix" : "Tự Chọn Hạt Độc Bản"}
                      </span>
                      <span className="bg-[#A61C45] text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                        {language === "en" ? "New" : "Mới"}
                      </span>
                    </div>
                    <p className="text-xs text-amber-900 font-normal">
                      {language === "en" ? "Blend 5 nuts & print custom label" : "Tự phối 5 loại hạt & in tên riêng"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-700" />
              </Link>

              <div className="pt-2 flex flex-col gap-2">
                <a
                  href={`tel:${cmsContent.Hotline || "0982072601"}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-[#FDE68A]/60 text-xs font-semibold text-primary"
                >
                  <Phone className="w-4 h-4 text-accent shrink-0" />
                  <span>Hotline: {cmsContent.Hotline || "0982.072.601"}</span>
                </a>
              </div>

              <div className="pt-2">
                {isAdmin ? (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-sm flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                        <span className="text-sm">👑</span> {language === "en" ? "Administrator" : "Quản trị viên"}
                      </span>
                      <button
                        onClick={() => {
                          adminAuth.logout();
                        }}
                        className="text-[11px] font-semibold text-destructive hover:underline"
                      >
                        {language === "en" ? "Log out" : "Đăng xuất"}
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
                      <LayoutDashboard className="w-4 h-4" /> {language === "en" ? "Admin Portal" : "Vào trang Quản trị"}
                    </Link>
                  </div>
                ) : (
                  <Link
                    href="/#dat-hang"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full text-left py-2.5 px-3 rounded-xl border border-border/80 bg-background/60 hover:bg-muted text-muted-foreground text-xs font-medium flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-accent" />
                      <span>{language === "en" ? "Admin Login" : "Đăng nhập Quản trị"}</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </Link>
                )}
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setIsMobileMenuOpen(false);
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

      {/* 2. Hero Banner với phông nền di sản Chùa Chuông Phố Hiến */}
      <section id="hero" className="relative bg-[#F7F3EB] pt-28 pb-12 sm:pt-36 sm:pb-16 w-full overflow-hidden">
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
              {language === "en"
                ? t.hero.subtitle
                : cmsContent.HeroSubtitle ||
                  "Long nhãn sấy khô tự nhiên, giữ trọn vị ngọt thanh tao và hương thơm đặc trưng của nhãn lồng Phố Hiến - Hưng Yên. Một món quà sức khỏe từ ngàn xưa."}
            </motion.p>

            <div className="flex flex-wrap items-center gap-4 sm:gap-5 pt-2">
              <button
                onClick={() => scrollToSection("san-pham")}
                className="bg-accent hover:bg-[#9A3412] text-white font-bold px-7 py-3.5 rounded-xl inline-flex items-center gap-2 shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <span>{language === "en" ? "Browse products" : "Xem sản phẩm"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollToSection("cau-chuyen")}
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
              onExploreClick={() => scrollToSection("san-pham")}
            />
          </motion.div>
        </div>
      </section>

      {/* Dải bảo chứng cam kết chất lượng thương hiệu */}
      <div className="border-y border-[#DED6C8] bg-[#FBF9F4] relative overflow-hidden">
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

        <div className="md:hidden relative w-full overflow-hidden marquee-mask py-3 select-none">
          <div className="animate-marquee-track hover:[animation-play-state:paused] active:[animation-play-state:paused]">
            {[...brandCommitments, ...brandCommitments].map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                aria-hidden={index >= brandCommitments.length}
                className="flex items-center gap-2 px-3.5 whitespace-nowrap text-xs font-semibold text-[#4A3B2C]"
              >
                <span className="w-6 h-6 rounded-full bg-amber-100/90 border border-amber-300/60 text-amber-900 flex items-center justify-center shrink-0 shadow-2xs">
                  <item.icon aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
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
        <ProductInteractiveShowcase
          products={effectiveProducts}
          language={language as "vi" | "en"}
          cmsContent={cmsContent}
          onOrderProduct={(productId) => {
            const prod = effectiveProducts.find((p) => p.id === productId);
            if (prod) {
              handleQuickBuy(prod);
            } else {
              scrollToSection("dat-hang");
            }
          }}
          onOpenGallery={(prod) => setGalleryProduct(prod)}
          onAddToCart={(prod) => addCartItem(prod)}
        />
      </SectionErrorBoundary>

      {/* 4. So sánh minh bạch chất lượng */}
      <SectionErrorBoundary sectionName="So sánh chất lượng">
        <ProductComparisonSection language={language as "vi" | "en"} />
      </SectionErrorBoundary>

      <section className="bg-secondary/70 border-y border-border py-10 sm:py-14">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-semibold text-primary">
              {language === "en" ? "Choose your own mix" : "Phối một hộp hạt theo ý bạn"}
            </h2>
            <p className="mt-3 text-foreground/80 leading-relaxed">
              {language === "en"
                ? "Choose your nuts, packaging and a name for your label."
                : "Chọn loại hạt, bao bì và tên trên nhãn hộp."}
            </p>
          </div>
          <Link
            href="/tu-chon-hat"
            className="inline-flex items-center gap-2 bg-card border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-xl px-6 py-3 font-bold transition-all shadow-sm hover:shadow-md hover:scale-105 active:scale-95 shrink-0"
          >
            <span>{t.nav.custom_mix || "Tự chọn hạt"}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

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

      {/* Cart Drawer */}
      <CartDrawer
        language={language as "vi" | "en"}
        onCheckout={handleCartCheckout}
        onBrowseProducts={() => scrollToSection("san-pham")}
      />
    </>
  );
}

export default HeroSection;

"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ShoppingCart,
  ShoppingBag,
  MessageCircle,
  Phone,
  ChevronRight,
  LayoutDashboard,
  KeyRound,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { EASE_OUT_EXPO } from "@/components/LandingMotion";
import { adminAuth } from "@/services/api.service";
import { triggerPageNavigation } from "@/components/layout/RouteProgressBar";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useWebsiteContent } from "@/hooks/useWebsiteContent";
import { useCartStore } from "@/stores/useCartStore";
import { FastImage } from "@/components/FastImage";
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

interface NavigationHeaderProps {
  onOpenChat?: () => void;
}

export function NavigationHeader({ onOpenChat }: NavigationHeaderProps) {
  const pathname = usePathname();
  const isAdmin = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthServerSnapshot);
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { t, language, setLanguage } = useLanguageStore();
  const { content: cmsContent } = useWebsiteContent();
  const { openCart, getTotalItems } = useCartStore();
  const totalCartItems = isMounted ? getTotalItems() : 0;

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const next = window.scrollY > 30;
          setIsScrolled((prev) => (prev !== next ? next : prev));
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: language === "en" ? "Home" : "Trang Chủ", href: "/" },
    { label: t.nav.products, href: "/san-pham" },
    { label: t.nav.story, href: "/cau-chuyen" },
    { label: t.nav.cuisine || (language === "en" ? "Pho Hien Cuisine" : "Ẩm Thực Phố Hiến"), href: "/am-thuc" },
    { label: t.nav.contact, href: "/lien-he" },
  ];

  const isLinkActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      <motion.header
        initial={{ y: -90, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
        className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,padding,box-shadow] duration-300 w-full max-w-full ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md shadow-sm py-2.5 sm:py-3"
            : pathname === "/"
              ? "bg-white/80 md:bg-transparent backdrop-blur-xs md:backdrop-blur-none py-3 sm:py-4"
              : "bg-white/95 backdrop-blur-md border-b border-[#E8DFC8]/60 py-2.5 sm:py-3.5 shadow-xs"
        }`}
      >
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between w-full max-w-full">
          {/* Logo & Tên Thương Hiệu */}
          <Link
            href="/"
            prefetch={true}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none group"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white flex items-center justify-center overflow-hidden border border-[#E8DFC8] shadow-sm relative shrink-0 group-hover:scale-105 transition-transform">
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
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-2 lg:gap-3 xl:gap-4.5 2xl:gap-6 shrink-0">
            {navLinks.map((item) => {
              const active = isLinkActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className={`text-xs lg:text-sm xl:text-[15px] font-semibold transition-all duration-300 ease-in-out relative group whitespace-nowrap shrink-0 py-1 ${
                    active ? "text-accent font-bold" : "text-foreground/80 hover:text-accent"
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-accent transition-all duration-300 ease-in-out ${
                      active ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>
              );
            })}

            {/* Badge Tự Chọn Hạt Nổi Bật */}
            <Link
              href="/tu-chon-hat"
              prefetch={true}
              className={`text-xs xl:text-sm font-bold bg-[#F4EFE6] border border-[#E8DFC8] px-2.5 lg:px-3.5 py-1.5 rounded-full shadow-xs hover:shadow-md hover:scale-105 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                pathname === "/tu-chon-hat" ? "ring-2 ring-accent text-accent" : "text-primary"
              }`}
            >
              <span>{t.nav.custom_mix || "Tự Chọn Hạt"}</span>
              <span className="bg-[#A61C45] text-white text-[10px] xl:text-[11px] font-extrabold px-1.5 xl:px-2 py-0.5 rounded-full uppercase tracking-wider">
                {language === "en" ? "New" : "Mới"}
              </span>
            </Link>
          </nav>

          {/* Desktop Right Controls (Language, Cart, Chat, Buy CTA) */}
          <div className="hidden xl:flex items-center gap-2 lg:gap-3 xl:gap-4 shrink-0">
            <button
              onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
              className="text-xs lg:text-sm font-bold text-foreground/80 border px-2.5 lg:px-3 py-1.5 rounded-full hover:bg-muted transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              aria-label={language === "en" ? "Switch language" : "Chuyển đổi ngôn ngữ"}
            >
              {language === "vi" ? "🇻🇳 VI" : "🇬🇧 EN"}
            </button>
            <button
              onClick={() => openCart()}
              className="text-base font-semibold text-foreground/80 hover:text-accent transition-all duration-300 ease-in-out flex items-center gap-2 relative p-1.5 shrink-0 cursor-pointer"
              aria-label={language === "en" ? "Shopping Cart" : "Giỏ hàng"}
            >
              <ShoppingCart className="w-5 h-5" />
              {totalCartItems > 0 && (
                <span className="absolute -top-1.5 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {totalCartItems > 99 ? "99+" : totalCartItems}
                </span>
              )}
            </button>
            {onOpenChat && (
              <button
                onClick={onOpenChat}
                className="text-base font-semibold text-foreground/80 hover:text-accent transition-all duration-300 ease-in-out flex items-center gap-2 p-1.5 shrink-0 cursor-pointer"
                aria-label={language === "en" ? "Live Chat" : "Trò chuyện trực tuyến"}
              >
                <MessageCircle className="w-5 h-5" />
              </button>
            )}
            <Link
              href="/san-pham#dat-hang"
              prefetch={true}
              className="bg-accent hover:bg-accent/90 text-white text-xs lg:text-sm xl:text-base font-bold px-3.5 lg:px-5 xl:px-6 py-2 lg:py-2.5 rounded-full shadow-lg shadow-[#B45309]/30 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-1.5 lg:gap-2 whitespace-nowrap shrink-0"
            >
              <ShoppingCart className="w-4 h-4" /> <span>{t.nav.buyNow}</span>
            </Link>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex xl:hidden items-center gap-1">
            {!isMobileMenuOpen && (
              <>
                <button
                  onClick={() => openCart()}
                  className="p-2 text-foreground/80 hover:text-accent rounded-xl hover:bg-black/5 active:scale-95 transition-all relative cursor-pointer"
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
                  className="text-xs font-bold text-foreground/85 border border-[#FDE68A] px-2 py-1 rounded-full bg-white/90 shadow-xs transition-colors cursor-pointer"
                  aria-label={language === "en" ? "Switch language" : "Chuyển ngôn ngữ"}
                >
                  {language === "vi" ? "🇻🇳" : "🇬🇧"}
                </button>
              </>
            )}
            <button
              className="p-2 text-foreground/80 rounded-xl hover:bg-black/5 active:scale-95 transition-all cursor-pointer"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6 text-primary" /> : <Menu className="w-6 h-6 text-primary" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Drawer */}
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
                  className="text-xs font-bold text-primary border border-[#FDE68A] px-3 py-1 rounded-full bg-secondary flex items-center gap-1.5 cursor-pointer"
                >
                  {language === "vi" ? "🇻🇳 Tiếng Việt" : "🇬🇧 English"}
                </button>
              </div>

              {navLinks.map((item, index) => {
                const active = isLinkActive(item.href);
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: 0.04 + index * 0.05, ease: EASE_OUT_EXPO }}
                  >
                    <Link
                      href={item.href}
                      prefetch={true}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`w-full text-lg font-bold text-left py-2.5 flex items-center justify-between border-b border-border/40 transition-colors ${
                        active ? "text-accent" : "text-primary hover:text-accent"
                      }`}
                    >
                      <span>{item.label}</span>
                      <ChevronRight className="w-4 h-4 text-accent/70" />
                    </Link>
                  </motion.div>
                );
              })}

              {/* Lối tắt Tự Chọn Hạt trên Mobile */}
              <Link
                href="/tu-chon-hat"
                prefetch={true}
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

              {/* Lối vào Quản trị viên */}
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
                        className="text-[11px] font-semibold text-destructive hover:underline cursor-pointer"
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
                    href="/admin-login"
                    prefetch={true}
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
              <Link
                href="/san-pham#dat-hang"
                prefetch={true}
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full bg-gradient-to-r from-[#B45309] to-[#D97706] text-white text-base font-bold px-6 py-3.5 rounded-xl shadow-lg flex justify-center items-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" /> {t.nav.buyNow}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default NavigationHeader;

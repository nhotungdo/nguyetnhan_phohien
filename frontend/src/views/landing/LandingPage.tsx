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
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight, ShoppingCart, MessageCircle, Phone, MapPin, ChevronRight, Star, CheckCircle, AlertCircle, Loader2, Send, Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useOrderForm } from "@/hooks/useOrderForm";
import { useLiveChat } from "@/hooks/useLiveChat";
import { useWebsiteContent } from "@/hooks/useWebsiteContent";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useProducts } from "@/hooks/useProducts";
import { ProductGalleryModal } from "@/components/ProductGalleryModal";
import { FastImage } from "@/components/FastImage";
import type { ProductResponse } from "@/types/api.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

// Ghép URL ảnh từ CMS: link tuyệt đối (http/https/protocol-relative/data) dùng nguyên,
// còn lại (vd /uploads/content/...) là đường dẫn tương đối trên server API.
// null-safe: key chưa có trong CMS (API lỗi, trang prerender) → chuỗi rỗng, caller tự fallback.
const resolveCmsImage = (url?: string) =>
  !url
    ? ""
    : /^(https?:)?\/\//i.test(url) || url.startsWith("data:")
      ? url
      : `${API_URL}${url}`;

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<'tra' | 'che' | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [chatStarted, setChatStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { products, isLoading: isLoadingProducts } = useProducts();
  const [galleryProduct, setGalleryProduct] = useState<ProductResponse | null>(null);

  const {
    form, setField, addItem, removeItem, updateItem, selectSingleProduct, discountResult, isSubmitting, isApplyingCode,
    submitStatus, errorMessage, lastSubmittedEmail, applyDiscount, calculateTotal, handleSubmit
  } = useOrderForm(products);

  const { messages, isConnected, isSending, isAdminTyping, connect, notifyTyping, markMessagesRead, sendMessage } = useLiveChat();
  const { content: cmsContent } = useWebsiteContent();
  const { t, language, setLanguage } = useLanguageStore();

  // Tiêu đề Hero lấy từ CMS (key HeroTitle), chia 2 dòng để giữ bố cục gradient.
  // Tiếng Việt lấy từ CMS như HeroSubtitle; tiếng Anh vẫn dùng locale.
  const heroWords = (cmsContent.HeroTitle || "").trim().split(/\s+/).filter(Boolean);
  const heroSplit = Math.ceil(heroWords.length / 2);
  const heroLine1 = language === "en"
    ? t.hero.title.split(" ")[0]
    : heroWords.length > 0 ? heroWords.slice(0, heroSplit).join(" ") : "Hương Vị";
  const heroLine2 = language === "en"
    ? t.hero.title.split(" ").slice(1).join(" ")
    : heroWords.length > 0 ? heroWords.slice(heroSplit).join(" ") : "Truyền Thống";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Xác nhận đã xem tin của Admin (read receipt) khi widget đang mở —
  // backend sẽ broadcast "GuestReadMessages" để admin hiện "Đã xem" realtime.
  useEffect(() => {
    if (!isChatOpen || !chatStarted) return;
    markMessagesRead();
  }, [isChatOpen, chatStarted, messages, markMessagesRead]);

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleOpenChat = async () => {
    setIsChatOpen(true);
  };

  const handleStartChat = async () => {
    if (!guestName.trim()) return;
    setChatStarted(true);
    await connect(guestName, guestPhone);
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;
    const ok = await sendMessage(chatInput, guestName, guestPhone);
    // Chỉ xóa ô nhập khi tin đã gửi thành công — giữ lại nội dung nếu lỗi
    if (ok) setChatInput("");
  };

  // Index của tin nhắn khách cuối cùng (chỉ hiện "Đã xem" ở tin đó)
  const lastGuestMessageIndex = messages.reduce(
    (acc, msg, idx) => (msg.senderType === "Guest" ? idx : acc),
    -1
  );

  const { base, discount, final } = calculateTotal();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-accent selection:text-accent-foreground">
      {/* Gallery Modal */}
      {galleryProduct && (
        <ProductGalleryModal
          product={galleryProduct}
          language={language as "vi" | "en"}
          onClose={() => setGalleryProduct(null)}
          onOrder={() => {
            selectSingleProduct(galleryProduct.id);
            scrollToSection("dat-hang");
          }}
        />
      )}
      {/* 1. Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-white/90 backdrop-blur-md shadow-sm py-3" : "bg-transparent py-5"
          }`}
      >
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollToSection("hero")}>
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center overflow-hidden border border-border shadow-sm relative">
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
            <span style={{ fontFamily: 'var(--font-dancing)' }} className={`font-bold text-[28px] tracking-wide transition-colors ${isScrolled ? "text-primary" : "text-primary"}`}>
              Nguyệt Nhãn Phố Hiến
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: t.nav.products, id: "san-pham" },
              { label: t.nav.story, id: "cau-chuyen" },
              { label: t.nav.history, id: "lich-su" },
              { label: t.nav.culture, id: "van-hoa" },
              { label: t.nav.contact, id: "lien-he" }
            ].map((item, index) => (
              <button
                key={index}
                onClick={() => scrollToSection(item.id)}
                className="text-base font-semibold text-foreground/80 hover:text-accent transition-all duration-300 ease-in-out relative group"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent transition-all duration-300 ease-in-out group-hover:w-full"></span>
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
              className="text-sm font-bold text-foreground/80 border px-3 py-1.5 rounded-full hover:bg-muted transition-colors flex items-center gap-2"
            >
              {language === "vi" ? "🇻🇳 VI" : "🇬🇧 EN"}
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

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-foreground/80"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-24 px-6 flex flex-col gap-6 md:hidden">
          {[
            { label: "Sản phẩm", id: "san-pham" },
            { label: "Câu chuyện", id: "cau-chuyen" },
            { label: "Lịch sử", id: "lich-su" },
            { label: "Văn hóa", id: "van-hoa" },
            { label: "Liên hệ", id: "lien-he" }
          ].map((item, index) => (
            <button
              key={index}
              onClick={() => scrollToSection(item.id)}
              className="text-xl font-medium text-primary text-left border-b pb-4"
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => scrollToSection("dat-hang")}
            className="bg-accent text-white text-lg font-medium px-6 py-3 rounded-xl shadow-lg mt-4 flex justify-center items-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" /> {t.nav.buyNow}
          </button>
        </div>
      )}

      <main>
        {/* 2. Hero Banner */}
        <section id="hero" className="relative min-h-screen flex items-center pt-20 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-[#FEF3C7]/40 to-[#FAFAF9] z-10"></div>
            <div className="absolute inset-0 bg-[#FDE68A]/20"></div>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.5 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/3 w-[800px] h-[800px] bg-secondary rounded-full blur-3xl"
            />
          </div>

          <div className="container mx-auto px-4 md:px-6 relative z-10 grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-8 max-w-xl"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-accent text-sm font-medium border border-[#FDE68A]">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                Tinh túy đất Phố Hiến
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-primary leading-[1.1] tracking-tight">
                {heroLine1} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B45309] to-[#D97706]">
                  {heroLine2}
                </span>
              </h1>
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed">
                {language === "en" ? t.hero.subtitle : cmsContent.HeroSubtitle || "Long nhãn sấy khô tự nhiên, giữ trọn vị ngọt thanh tao và hương thơm đặc trưng của nhãn lồng Phố Hiến - Hưng Yên. Một món quà sức khỏe từ ngàn xưa."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => scrollToSection("san-pham")}
                  className="bg-accent text-white text-base font-medium px-8 py-4 rounded-full shadow-xl shadow-[#B45309]/30 transition-shadow flex items-center justify-center gap-2"
                >
                  {t.hero.discover} <ArrowRight className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: "#FEF3C7" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => scrollToSection("cau-chuyen")}
                  className="bg-white text-accent border border-[#FDE68A] text-base font-medium px-8 py-4 rounded-full flex items-center justify-center"
                >
                  {t.nav.story}
                </motion.button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative h-[500px] md:h-[700px] flex items-center justify-center"
            >
              {/* Product Hero Image Placeholder */}
              <div className="relative w-full max-w-md aspect-square rounded-full bg-gradient-to-tr from-[#FDE68A] to-[#FEF3C7] shadow-2xl flex items-center justify-center overflow-hidden animate-[spin_60s_linear_infinite]">
                {/* Decorative elements */}
                <div className="absolute inset-2 border border-[#B45309]/20 rounded-full border-dashed"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[80%] aspect-square bg-white rounded-2xl shadow-2xl -rotate-6 transition-transform hover:rotate-0 duration-500 overflow-hidden border-4 border-white flex items-center justify-center text-accent font-bold text-2xl relative">
                  {cmsContent.HeroBannerUrl ? (
                    <FastImage
                      src={/^(https?:)?\/\//i.test(cmsContent.HeroBannerUrl) || cmsContent.HeroBannerUrl.startsWith("data:") ? cmsContent.HeroBannerUrl : `${API_URL}${cmsContent.HeroBannerUrl}`}
                      alt="Nguyệt Nhãn Phố Hiến"
                      fill
                      priority
                      sizes="(max-width: 768px) 90vw, 400px"
                      className="w-full h-full object-cover"
                    />
                  ) : products[0]?.images?.[0] ? (
                    <FastImage
                      src={`${API_URL}${products[0].images[0].imagePath}`}
                      alt={products[0].name}
                      fill
                      priority
                      sizes="(max-width: 768px) 90vw, 400px"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-[#FDE68A]/30"></div>
                      <span className="relative z-10 text-xl font-bold text-primary">Nguyệt Nhãn Phố Hiến</span>
                    </>
                  )}
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute bottom-20 left-10 bg-white p-4 rounded-2xl shadow-xl border border-[#FDE68A] animate-bounce-slow">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-accent">
                    <Star className="w-6 h-6 fill-[#B45309]" />
                  </div>
                  <div>
                    <p className="font-bold text-primary">100%</p>
                    <p className="text-xs text-foreground/80">{t.hero.quality}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 3. Giới thiệu thương hiệu */}
        <section id="gioi-thieu" className="py-24 bg-white relative">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl mx-auto text-center space-y-6"
            >
              <h2 className="text-3xl md:text-5xl font-bold text-primary">{language === "en" ? t.about.title : cmsContent.AboutTitle || t.about.title}</h2>
              <p className="text-lg text-foreground/80 leading-relaxed">
                {language === "en" ? t.about.desc : cmsContent.AboutDescription || t.about.desc}
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 mt-20">
              {[
                { title: t.about.natural_title, desc: t.about.natural_desc },
                { title: t.about.traditional_title, desc: t.about.traditional_desc },
                { title: t.about.safe_title, desc: t.about.safe_desc }
              ].map((val, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: i * 0.2 }}
                  key={i}
                  className="bg-background p-8 rounded-3xl border border-[#FDE68A]/50 hover:shadow-xl hover:border-[#FDE68A] transition-all hover:-translate-y-2 group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-accent text-2xl font-bold mb-6 group-hover:scale-110 transition-transform">0{i + 1}</div>
                  <h3 className="text-xl font-bold text-primary mb-3">{val.title}</h3>
                  <p className="text-foreground/80">{val.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Khu vực sản phẩm */}
        <section id="san-pham" className="py-24 bg-secondary/30">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold text-primary mb-4">{language === "en" ? t.products.title : cmsContent.ProductsTitle || t.products.title}</h2>
              <p className="text-foreground/80">{language === "en" ? t.products.subtitle : cmsContent.ProductsSubtitle || t.products.subtitle}</p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {isLoadingProducts ? (
                <div className="col-span-full flex justify-center py-10">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
              ) : (
                products.map((prod, i) => {
                  const mainImage = prod.images?.[0];
                  const extraCount = (prod.images?.length ?? 0) - 1;
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.5, delay: i * 0.15 }}
                      key={prod.id}
                      className="bg-white rounded-3xl overflow-hidden shadow-lg border border-[#FDE68A]/30 group hover:shadow-2xl transition-all cursor-pointer"
                      onClick={() => setGalleryProduct(prod)}
                    >
                      <div className="aspect-[4/3] bg-[#FDE68A]/20 relative flex items-center justify-center overflow-hidden">
                        {mainImage ? (
                          // 3 ảnh đầu tải eager (nằm gần viewport), phần còn lại lazy
                          <FastImage
                            src={`${API_URL}${mainImage.imagePath}`}
                            alt={prod.name}
                            fill
                            sizes="(max-width: 768px) 92vw, (max-width: 1024px) 50vw, 360px"
                            loading={i < 3 ? "eager" : "lazy"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="text-accent font-medium flex flex-col items-center gap-2">
                            <span className="text-4xl">📷</span>
                            <span className="text-sm">{prod.name}</span>
                          </div>
                        )}
                        {extraCount > 0 && (
                          <span className="absolute top-3 right-3 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                            +{extraCount} ảnh
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                          <motion.span
                            className="bg-white text-accent font-bold px-6 py-3 rounded-full translate-y-4 group-hover:translate-y-0 transition-all text-sm"
                          >
                            {language === "en" ? "View Details" : "Xem Chi Tiết"}
                          </motion.span>
                        </div>
                      </div>
                      <div className="p-8 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4 gap-2">
                          <h3 className="text-xl font-bold text-primary">{prod.name}</h3>
                          <span className="bg-secondary text-accent text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shrink-0">{prod.size}</span>
                        </div>
                        <p className="text-foreground/80 text-sm mb-6 line-clamp-3">{prod.description}</p>
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                          <span className="text-2xl font-bold text-accent">
                            {language === "en" 
                              ? `$${(prod.price / 25000).toFixed(2).replace(',', '.')}` 
                              : `${prod.price.toLocaleString("vi-VN").replace(/,/g, '.')}đ`}
                          </span>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              selectSingleProduct(prod.id);
                              scrollToSection("dat-hang");
                            }}
                            className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent/90 transition-colors shrink-0 shadow-sm"
                          >
                            <ShoppingCart className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* 5. Câu chuyện & 6. Lịch sử (Combined Flow) */}
        <section id="cau-chuyen" className="py-24 bg-white overflow-hidden">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1 relative">
                <div className="aspect-square rounded-full bg-secondary absolute -top-10 -left-10 w-full h-full -z-10 blur-3xl opacity-50"></div>
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
                <p className="text-lg text-foreground/80 leading-relaxed">
                  {language === "en" ? "Legend has it that in the 16th century, a mandarin patrolling through Pho Hien exactly when the longans were ripe tasted the thick, juicy, sweet and fragrant flesh, and immediately brought it back to offer to the king. Since then, Hung Yen longan became an annual royal tribute." : cmsContent.StoryDescription || "Tương truyền, vào thế kỷ 16, một vị quan đi tuần qua vùng Phố Hiến đúng độ nhãn chín. Nếm thử thấy cùi dày, mọng nước, vị ngọt lịm thơm ngát, liền mang về dâng vua. Từ đó, nhãn lồng Hưng Yên trở thành sản vật tiến vua hàng năm."}
                </p>
                <div className="pl-6 border-l-4 border-[#B45309] space-y-4">
                  <p className="text-foreground/80 italic">
                    {language === "en" ? "\"Pho Hien longan, it is said that its sweetness permeates the alluvium of the Red River, blended with the sun and wind of the delta. For a hundred years, the people here still preserve the profession of firewood drying longan, as a way to preserve the homeland soul.\"" : "\"Nhãn lồng Phố Hiến, người ta nói vị ngọt của nó thấm cả cái chất phù sa sông Hồng, quyện với nắng gió của vùng châu thổ. Trăm năm nay, người dân nơi đây vẫn giữ cái nghề làm long nhãn sấy củi, như một cách lưu giữ hồn quê hương.\""}
                  </p>
                </div>
                <button
                  onClick={() => scrollToSection("van-hoa")}
                  className="inline-flex items-center gap-2 text-accent font-bold hover:gap-4 transition-all"
                >
                  {language === "en" ? "Learn about the land's culture" : "Tìm hiểu văn hóa vùng đất"} <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Lịch sử */}
        <section id="lich-su" className="py-24 bg-background border-t border-border/30">
          <div className="container mx-auto px-4 md:px-6 text-center max-w-4xl">
            <h2 className="text-3xl md:text-5xl font-bold text-primary mb-8">{t.history.title}</h2>
            <div className="relative border-l-2 border-accent pl-8 ml-4 md:ml-0 md:pl-0 md:border-l-0 text-left md:text-center space-y-12">
              <div className="md:flex items-center justify-between gap-8">
                <div className="md:w-1/2 text-right hidden md:block">
                  <h3 className="text-2xl font-bold text-accent">{t.history.c16_title}</h3>
                  <p className="text-foreground/80">{t.history.c16_desc.split(". ")[0]}.</p>
                </div>
                <div className="absolute left-[-9px] md:left-1/2 md:-ml-[9px] w-4 h-4 rounded-full bg-accent ring-4 ring-background"></div>
                <div className="md:w-1/2 md:text-left">
                  <h3 className="text-2xl font-bold text-accent md:hidden">{t.history.c16_title}</h3>
                  <p className="text-foreground/80 md:hidden mb-2">{t.history.c16_desc.split(". ")[0]}.</p>
                  <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">{t.history.c16_desc.split(". ")[1]}</div>
                </div>
              </div>
              <div className="md:flex items-center justify-between gap-8 flex-row-reverse">
                <div className="md:w-1/2 text-left hidden md:block">
                  <h3 className="text-2xl font-bold text-accent">{t.history.tree_title}</h3>
                  <p className="text-foreground/80">{language === "en" ? "Historical monument at Hien Pagoda." : "Di tích lịch sử tại Chùa Hiến."}</p>
                </div>
                <div className="absolute left-[-9px] md:left-1/2 md:-ml-[9px] w-4 h-4 rounded-full bg-accent ring-4 ring-background"></div>
                <div className="md:w-1/2 md:text-right">
                  <h3 className="text-2xl font-bold text-accent md:hidden">{t.history.tree_title}</h3>
                  <p className="text-foreground/80 md:hidden mb-2">{language === "en" ? "Historical monument at Hien Pagoda." : "Di tích lịch sử tại Chùa Hiến."}</p>
                  <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">{t.history.tree_desc}</div>
                </div>
              </div>
              <div className="md:flex items-center justify-between gap-8">
                <div className="md:w-1/2 text-right hidden md:block">
                  <h3 className="text-2xl font-bold text-accent">{t.history.year2010_title}</h3>
                  <p className="text-foreground/80">{t.history.year2010_desc.split(". ")[0]}.</p>
                </div>
                <div className="absolute left-[-9px] md:left-1/2 md:-ml-[9px] w-4 h-4 rounded-full bg-accent ring-4 ring-background"></div>
                <div className="md:w-1/2 md:text-left">
                  <h3 className="text-2xl font-bold text-accent md:hidden">{t.history.year2010_title}</h3>
                  <p className="text-foreground/80 md:hidden mb-2">{t.history.year2010_desc.split(". ")[0]}.</p>
                  <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">{t.history.year2010_desc.split(". ")[1]}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Văn hóa */}
        <section id="van-hoa" className="py-24 bg-card relative overflow-hidden border-t border-border/30">
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-5xl font-bold text-primary mb-6">{t.culture.title}</h2>
                <p className="text-lg text-foreground/80 leading-relaxed mb-6">
                  {t.culture.desc}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setSelectedRecipe('tra')} className="bg-background p-4 rounded-xl border border-border/50 text-center hover:border-accent hover:shadow-lg transition-all hover:-translate-y-1">
                    <div className="text-3xl mb-2">🍵</div>
                    <div className="font-bold text-primary">Trà Long Nhãn</div>
                  </button>
                  <button onClick={() => setSelectedRecipe('che')} className="bg-background p-4 rounded-xl border border-border/50 text-center hover:border-accent hover:shadow-lg transition-all hover:-translate-y-1">
                    <div className="text-3xl mb-2">🥣</div>
                    <div className="font-bold text-primary">Chè Hạt Sen</div>
                  </button>
                </div>
              </div>
              <div className="aspect-square bg-secondary rounded-full flex items-center justify-center p-8 relative">
                <div className="bg-background w-full h-full rounded-full shadow-2xl flex items-center justify-center text-accent font-bold relative overflow-hidden">
                  [ Ảnh Văn Hóa Thưởng Trà ]
                  {cmsContent.CultureImage && (
                    <FastImage
                      src={resolveCmsImage(cmsContent.CultureImage)}
                      alt="Văn hóa thưởng trà Phố Hiến"
                      fill
                      sizes="(max-width: 768px) 92vw, 560px"
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => e.currentTarget.style.display = 'none'}
                    />
                  )}
                </div>
                {/* Vòng trang trí quay — đặt SAU để luôn nổi lên trên ảnh */}
                <div className="absolute inset-4 border-2 border-accent border-dashed rounded-full animate-[spin_20s_linear_infinite]"></div>
              </div>
            </div>
          </div>
        </section>

        {/* 11. Khu vực đặt hàng */}
        <section id="dat-hang" className="py-24 bg-[#451A03] text-background relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#78350F] rounded-full blur-[100px] opacity-50 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white">
                  {(language === "en"
                    ? "Enjoy the Essence\nof Flavor"
                    : cmsContent.OrderTitle || "Thưởng Thức\nHương Vị Tinh Túy"
                  ).split("\n").filter(Boolean).map((line, i) => (
                    <span key={i}>{i > 0 && <br />}{line}</span>
                  ))}
                </h2>
                <p className="text-lg text-[#FDE68A] mb-8 leading-relaxed opacity-90">
                  {language === "en" ? "Order today to receive the freshest batches of dried longan. We guarantee the highest quality delivered to your hands." : cmsContent.OrderDescription || "Đặt hàng ngay hôm nay để nhận được những mẻ long nhãn mới nhất. Chúng tôi cam kết chất lượng tuyệt hảo đến tay bạn."}
                </p>

                <div className="space-y-6">
                  <div className="flex items-center gap-4 bg-[#78350F]/50 p-4 rounded-2xl border border-[#92400E]">
                    <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center text-white shrink-0">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-[#FDE68A]">Hotline tư vấn (24/7)</p>
                      <p className="text-xl font-bold text-white">{cmsContent.Hotline || "090 123 4567"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-[#78350F]/50 p-4 rounded-2xl border border-[#92400E]">
                    <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center text-white shrink-0">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-[#FDE68A]">Địa chỉ xưởng sản xuất</p>
                      <p className="text-lg font-bold text-white">{cmsContent.Address || "Phố Hiến, Tp. Hưng Yên"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Đặt Hàng */}
              <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-2xl text-foreground">
                <h3 className="text-2xl font-bold text-primary mb-6">{t.order.title}</h3>

                {submitStatus === "success" && (
                  <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-4 rounded-xl">
                    <div className="flex items-center gap-3 mb-1">
                      <CheckCircle className="w-5 h-5 shrink-0" />
                      <p className="font-medium">{t.order.success}</p>
                    </div>
                    {lastSubmittedEmail && (
                      <p className="text-sm text-green-700 ml-8">
                        {language === "en"
                          ? `📧 Invoice sent to ${lastSubmittedEmail}`
                          : `📧 Hóa đơn đã được gửi tới ${lastSubmittedEmail}`}
                      </p>
                    )}
                  </div>
                )}

                {submitStatus === "error" && (
                  <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="font-medium">{t.order.error}</p>
                  </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground/80">{t.order.name} *</label>
                      <input
                        type="text" required
                        value={form.customerName}
                        onChange={(e) => setField("customerName", e.target.value)}
                        className="w-full bg-background border border-[#FDE68A] focus:border-[#B45309] focus:ring-1 focus:ring-[#B45309] rounded-xl px-4 py-3 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground/80">{t.order.phone} *</label>
                      <input
                        type="tel" required
                        value={form.customerPhone}
                        onChange={(e) => setField("customerPhone", e.target.value)}
                        className="w-full bg-background border border-[#FDE68A] focus:border-[#B45309] focus:ring-1 focus:ring-[#B45309] rounded-xl px-4 py-3 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground/80">{language === "en" ? "Email (For invoice)" : "Email (Để nhận hóa đơn)"}</label>
                    <input
                      type="email"
                      value={form.customerEmail}
                      onChange={(e) => setField("customerEmail", e.target.value)}
                      placeholder={language === "en" ? "example@email.com" : "vi_du@email.com"}
                      className="w-full bg-background border border-[#FDE68A] focus:border-[#B45309] focus:ring-1 focus:ring-[#B45309] rounded-xl px-4 py-3 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground/80">{t.order.address} *</label>
                    <input
                      type="text" required
                      value={form.customerAddress}
                      onChange={(e) => setField("customerAddress", e.target.value)}
                      className="w-full bg-background border border-[#FDE68A] focus:border-[#B45309] focus:ring-1 focus:ring-[#B45309] rounded-xl px-4 py-3 outline-none transition-all"
                    />
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
                        className="text-xs font-semibold text-accent hover:text-accent/80 flex items-center gap-1 bg-accent/10 px-3 py-1.5 rounded-lg border border-accent/20 transition-all hover:scale-105"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {language === "en" ? "Add Product" : "Thêm sản phẩm khác"}
                      </button>
                    </div>

                    {form.items.map((item, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row gap-2.5 p-3 rounded-xl bg-background border border-[#FDE68A] shadow-sm">
                        <div className="flex-1">
                          <select
                            required
                            value={item.productId}
                            onChange={(e) => updateItem(idx, "productId", e.target.value)}
                            className="w-full bg-white border border-gray-200 focus:border-[#B45309] focus:ring-1 focus:ring-[#B45309] rounded-xl px-3 py-2 text-sm outline-none transition-all"
                          >
                            <option value="">{t.order.select_default}</option>
                            {products.map((prod) => (
                              <option key={prod.id} value={prod.id}>
                                {prod.name} - {language === "en" ? `$${(prod.price / 25000).toFixed(2).replace(',', '.')}` : `${prod.price.toLocaleString("vi-VN").replace(/,/g, '.')}đ`}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
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
                    ))}
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
                    {errorMessage && !submitStatus.includes("error") && (
                      <p className="text-red-500 text-sm">{errorMessage}</p>
                    )}
                  </div>

                  {/* Tổng tiền */}
                  {form.items.some((i) => i.productId) && (
                    <div className="bg-secondary/50 rounded-xl px-5 py-4 space-y-2">
                      <div className="space-y-1 pb-2 border-b border-gray-200/60 text-xs text-foreground/80">
                        {form.items.map((item, idx) => {
                          const prod = products.find((p) => p.id === item.productId);
                          if (!prod) return null;
                          const itemTotal = prod.price * (item.quantity || 1);
                          return (
                            <div key={idx} className="flex justify-between">
                              <span>{prod.name} ({prod.size}) x{item.quantity}</span>
                              <span className="font-medium">
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
                    className="w-full bg-accent hover:bg-accent/90 text-white font-bold text-lg py-4 rounded-xl shadow-lg transition-all hover:-translate-y-1 active:scale-95 flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
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
      <footer id="lien-he" className="bg-foreground text-background py-16 border-t border-primary">
        <div className="container mx-auto px-4 md:px-6">
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
              <p className="text-muted-foreground text-sm leading-relaxed">
                {language === "en" ? "The brand providing authentic Pho Hien Dried Longan specialty. 100% natural, no preservatives, preserving traditional flavors." : "Thương hiệu cung cấp đặc sản Long Nhãn Phố Hiến chính gốc. Cam kết 100% tự nhiên, không chất bảo quản, giữ trọn hương vị truyền thống."}
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-white">{t.nav.contact}</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>Hotline/Zalo: {cmsContent.FooterHotline || "0982.072.601"}</li>
                <li>Email: {cmsContent.ContactEmail || "hello@nguyetnhan.vn"}</li>
                <li>Địa chỉ: {cmsContent.FooterAddress || "123 Phố Hiến, Phường Hồng Châu, Tp. Hưng Yên"}</li>
                <li>Giờ mở cửa: {cmsContent.ContactHours || "08:00 - 20:00 (T2-CN)"}</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-white">{language === "en" ? "Navigation" : "Điều Hướng"}</h4>
              <ul className="space-y-2 text-muted-foreground text-sm flex flex-col items-start">
                <li><button onClick={() => scrollToSection("san-pham")} className="hover:text-white transition-colors text-left">{t.nav.products}</button></li>
                <li><button onClick={() => scrollToSection("cau-chuyen")} className="hover:text-white transition-colors text-left">{t.nav.story}</button></li>
                <li><button onClick={() => scrollToSection("lich-su")} className="hover:text-white transition-colors text-left">{t.history.title}</button></li>
                <li><button onClick={() => scrollToSection("van-hoa")} className="hover:text-white transition-colors text-left">{t.culture.title}</button></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-white">{language === "en" ? "Policies" : "Chính Sách"}</h4>
              <ul className="space-y-2 text-muted-foreground text-sm flex flex-col items-start">
                <li><Link href="/chinh-sach/giao-hang" className="hover:text-white transition-colors text-left">{language === "en" ? "Shipping Policy" : "Chính sách giao hàng"}</Link></li>
                <li><Link href="/chinh-sach/doi-tra" className="hover:text-white transition-colors text-left">{language === "en" ? "Return Policy" : "Chính sách đổi trả"}</Link></li>
                <li><Link href="/chinh-sach/bao-mat" className="hover:text-white transition-colors text-left">{language === "en" ? "Privacy Policy" : "Bảo mật thông tin"}</Link></li>
                <li><Link href="/chinh-sach/kiem-dinh" className="hover:text-white transition-colors text-left">{language === "en" ? "Quality Inspection" : "Kiểm định chất lượng"}</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-primary mt-12 pt-8 text-center text-muted-foreground text-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <p>{language !== "en" && cmsContent.FooterText ? cmsContent.FooterText : `© 2026 Nguyệt Nhãn Phố Hiến. ${t.footer.rights}`}</p>
            <div className="flex gap-4">
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
          </div>
        </div>
      </footer>

      {/* Floating Chat Widget — Kết nối SignalR thực */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {isChatOpen && (
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-[350px] mb-4 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-300 origin-bottom-right">
            <div className="bg-accent p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">NV</div>
                  <span className={`absolute bottom-0 right-0 w-3 h-3 ${isConnected ? 'bg-green-400' : 'bg-gray-400'} border-2 border-[#B45309] rounded-full`}></span>
                </div>
                <div>
                  <p className="font-bold">Tư vấn viên</p>
                  <p className="text-xs opacity-80">{isConnected ? 'Đang trực tuyến' : 'Đang kết nối...'}</p>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!chatStarted ? (
              /* Nhập tên trước khi chat */
              <div className="p-5 space-y-3">
                <p className="text-sm text-foreground/70">{language === "en" ? "To serve you better, please provide:" : "Để chúng tôi hỗ trợ tốt hơn, vui lòng cho biết:"}</p>
                <input
                  type="text"
                  placeholder={language === "en" ? "Your name *" : "Họ tên của bạn *"}
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full border border-gray-200 focus:border-[#B45309] focus:ring-1 focus:ring-[#B45309] rounded-lg px-3 py-2 text-sm outline-none"
                />
                <input
                  type="tel"
                  placeholder={language === "en" ? "Phone number (optional)" : "Số điện thoại (không bắt buộc)"}
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full border border-gray-200 focus:border-[#B45309] focus:ring-1 focus:ring-[#B45309] rounded-lg px-3 py-2 text-sm outline-none"
                />
                <button
                  onClick={handleStartChat}
                  disabled={!guestName.trim()}
                  className="w-full bg-accent text-white font-bold py-2.5 rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  {t.chat.start}
                </button>
              </div>
            ) : (
              <>
                <div className="h-[280px] bg-background p-4 overflow-y-auto flex flex-col gap-3">
                  {messages.length === 0 && (
                    <div className="bg-white border p-3 rounded-2xl rounded-tl-sm text-sm text-primary max-w-[80%] self-start shadow-sm">
                      Chào {guestName}! Bạn cần tư vấn về loại Long Nhãn nào ạ?
                    </div>
                  )}
                  {messages.map((msg, idx) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-2xl text-sm max-w-[80%] shadow-sm ${msg.senderType === 'Guest'
                        ? 'bg-accent text-white self-end rounded-br-sm'
                        : 'bg-white border text-primary self-start rounded-tl-sm'
                        }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      <span className={`text-[10px] block mt-1 opacity-70 ${msg.senderType === 'Guest' ? 'text-right' : ''}`}>
                        {new Date(msg.sentAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        {idx === lastGuestMessageIndex && msg.isRead && (
                          <span className="ml-1">· {language === "en" ? "Seen" : "Đã xem"}</span>
                        )}
                      </span>
                    </div>
                  ))}
                  {isAdminTyping && (
                    <div className="bg-white border p-3 rounded-2xl rounded-tl-sm shadow-sm self-start flex items-center gap-1" aria-label={language === "en" ? "Advisor is typing" : "Tư vấn viên đang gõ"}>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B45309] animate-bounce [animation-delay:0ms]"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B45309] animate-bounce [animation-delay:150ms]"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B45309] animate-bounce [animation-delay:300ms]"></span>
                      <span className="ml-2 text-xs text-foreground/60">
                        {language === "en" ? "Advisor is typing..." : "Tư vấn viên đang gõ..."}
                      </span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-3 bg-white border-t">
                  <div className="relative">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => {
                        setChatInput(e.target.value);
                        if (e.target.value.trim()) notifyTyping();
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleSendChatMessage()}
                      placeholder={t.chat.placeholder}
                      className="w-full bg-background border border-gray-200 focus:border-[#B45309] focus:ring-1 focus:ring-[#B45309] rounded-full pl-4 pr-12 py-2.5 text-sm outline-none transition-all"
                    />
                    <button
                      onClick={handleSendChatMessage}
                      disabled={isSending || !chatInput.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center hover:bg-accent/90 transition-colors disabled:opacity-50"
                    >
                      {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-14 h-14 bg-accent text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-accent/90 hover:scale-110 transition-all focus:outline-none focus:ring-4 focus:ring-[#B45309]/30"
        >
          {isChatOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </button>
      </div>

      {/* Recipe Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedRecipe(null)}>
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedRecipe(null)} className="absolute top-4 right-4 p-2 bg-background hover:bg-secondary rounded-full transition-colors text-primary">
              <X className="w-6 h-6" />
            </button>
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">{selectedRecipe === 'tra' ? '🍵' : '🥣'}</div>
              <h3 className="text-3xl font-bold text-primary">
                {selectedRecipe === 'tra' ? 'Cách pha Trà Long Nhãn' : 'Cách nấu Chè Hạt Sen Long Nhãn'}
              </h3>
            </div>
            {selectedRecipe === 'tra' ? (
              <div className="space-y-4 text-foreground/80">
                <p><strong>Nguyên liệu:</strong> 10g Trà khô (trà xanh, ô long, hoa cúc...), 15-20g Long nhãn Nguyệt Nhãn Phố Hiến, 3-5 quả táo đỏ, Kỷ tử, Nước sôi.</p>
                <p><strong>Cách thực hiện:</strong></p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Tráng trà qua một lần nước sôi để làm sạch và đánh thức trà.</li>
                  <li>Cho trà, long nhãn, táo đỏ, kỷ tử vào ấm.</li>
                  <li>Châm nước sôi và ủ trong khoảng 10-15 phút để long nhãn nở bung và tiết ra vị ngọt thanh tự nhiên.</li>
                  <li>Rót ra chén và thưởng thức khi còn ấm. Không cần thêm đường vì long nhãn đã đủ độ ngọt dịu mát.</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-4 text-foreground/80">
                <p><strong>Nguyên liệu:</strong> 100g Long nhãn Nguyệt Nhãn, 100g Hạt sen tươi (hoặc khô), Đường phèn.</p>
                <p><strong>Cách thực hiện:</strong></p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Hầm hạt sen với nước cho đến khi hạt sen chín mềm, bở tơi. Thêm đường phèn vừa khẩu vị và đun cho tan.</li>
                  <li>Tắt bếp, vớt hạt sen ra để nguội bớt. Khéo léo nhồi từng hạt sen vào bên trong cùi long nhãn.</li>
                  <li>Bật bếp đun sôi lại nồi nước đường, thả phần long nhãn lồng hạt sen vào.</li>
                  <li>Đun sôi nhẹ khoảng 2-3 phút thì tắt bếp ngay (nếu đun lâu long nhãn sẽ mất độ giòn). Thưởng thức nóng hoặc thêm đá tùy thích.</li>
                </ol>
              </div>
            )}
            <div className="mt-8 pt-6 border-t flex justify-center">
              <button onClick={() => setSelectedRecipe(null)} className="bg-accent hover:bg-accent/90 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95">
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

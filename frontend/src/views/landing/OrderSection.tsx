"use client";

import { useState, useRef, useEffect, useMemo, useSyncExternalStore } from "react";
import {
  Phone,
  MapPin,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EASE_OUT_EXPO, Reveal } from "@/components/LandingMotion";
import { useOrderForm } from "@/hooks/useOrderForm";
import { useVnProvinces } from "@/hooks/useVnProvinces";
import { wardsOf } from "@/lib/vnAddress";
import {
  composeAddress,
  MAX_ADDRESS_DETAIL_LENGTH,
  MAX_EMAIL_LENGTH,
  MAX_NAME_LENGTH,
  normalizePhone,
  type OrderFieldErrorCode,
} from "@/lib/validation";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { useWebsiteContent } from "@/hooks/useWebsiteContent";
import { useProducts } from "@/hooks/useProducts";
import { useCartStore } from "@/stores/useCartStore";
import { FireworksCelebration } from "@/components/FireworksCelebration";
import { DEFAULT_FALLBACK_PRODUCTS } from "@/data/defaultProducts";
import type { ProductResponse } from "@/types/api.types";
import { scrollToSection } from "@/lib/scrollToSection";

const inputClass = (error?: unknown) =>
  `w-full bg-background border rounded-xl px-4 py-3 outline-none transition-all text-base sm:text-sm ${error
    ? "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
    : "border-[#FDE68A] focus:border-[#B45309] focus:ring-1 focus:ring-[#B45309]"
  }`;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs text-red-500 flex items-start gap-1 pt-0.5">
      <AlertCircle className="w-3.5 h-3.5 mt-[1px] shrink-0" />
      <span>{message}</span>
    </p>
  );
}

export function OrderSection() {
  const prefersReducedMotion = useReducedMotion();
  const isMounted = useSyncExternalStore(
    () => () => { },
    () => true,
    () => false
  );

  const { t, language } = useLanguageStore();
  const { content: cmsContent } = useWebsiteContent();
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

        if (prod.id === "default-tui-zip" || prod.name.includes("Túi Zip") || prod.name.includes("Tứ Dã")) {
          name = "Zipper Pouch 150g (Four Realms Pearls)";
          description =
            "A harmonious blend of sweet Pho Hien longan and 4 crunchy tree nuts (Cashews, Macadamia, Pumpkin seeds, Almonds) in an airtight resealable pouch.";
        } else if (prod.id === "default-dac-biet" || prod.name.includes("Đặc Biệt") || prod.name.includes("Tiến Vua")) {
          name = "Special Reserve Box 300g (Ngoc Nhan)";
          description =
            "Imperial grade convection-dried Huong Chi longan paired with 4 premium roasted nuts (Macadamia, Cashews, Almonds, Pumpkin seeds) in a luxury mica canister.";
        } else if (prod.id === "default-set-qua" || prod.name.includes("Set Quà") || prod.name.includes("Hoàng Gia") || prod.name.includes("Thương Cảng")) {
          name = "Imperial Gift Set 900g (Port Moonrise)";
          description =
            "Prestige gift box honoring 17th-century Pho Hien prosperity, containing premium Huong Chi longan and curated nutritious nuts, paired with a luxury tote.";
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

  const {
    provinces: vnProvinces,
    isLoading: isLoadingProvinces,
    error: provinceLoadError,
    enable: enableProvincePicker,
  } = useVnProvinces();
  const [manualAddress, setManualAddress] = useState(false);
  const isManualAddress = manualAddress || !!provinceLoadError;

  const [showFireworks, setShowFireworks] = useState(false);

  const {
    form,
    setField,
    errors,
    validateField,
    canAddItem,
    addItem,
    removeItem,
    updateItem,
    setCartItems,
    discountResult,
    discountNotice,
    isSubmitting,
    isApplyingCode,
    submitStatus,
    errorMessage,
    lastSubmittedEmail,
    emailDeliveryStatus,
    hasFallbackProduct,
    applyDiscount,
    calculateTotal,
    handleSubmit,
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

  const prevCartSerializedRef = useRef<string>("");

  // Tự động đồng bộ các sản phẩm từ giỏ hàng / nút "Đặt mua" / "Mua ngay" vào khung đặt hàng
  useEffect(() => {
    if (!isMounted) return;

    const cartPayload = cartStoreItems.map((i) => ({
      productId: i.productId,
      quantity: i.quantity > 0 ? i.quantity : 1,
      isCustomMix: i.isCustomMix,
      customMixDetails: i.customMixDetails,
    }));
    const currentSerialized = JSON.stringify(cartPayload);

    if (currentSerialized !== prevCartSerializedRef.current) {
      prevCartSerializedRef.current = currentSerialized;
      if (cartPayload.length > 0) {
        setCartItems(cartPayload);
      }
    }
  }, [cartStoreItems, isMounted, setCartItems]);

  // Tự động cuộn mượt đến khung đặt hàng nếu URL chứa hash #dat-hang
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#dat-hang") {
      const timer = setTimeout(() => {
        scrollToSection("dat-hang");
      }, 150);
      return () => clearTimeout(timer);
    }
  }, []);

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
  const { base, discount, final } = calculateTotal();

  return (
    <>
      <section
        id="dat-hang"
        className="py-16 sm:py-24 bg-[#451A03] text-background relative overflow-hidden w-full max-w-full [contain:paint]"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-amber-950/20 via-transparent to-amber-950/30 pointer-events-none -z-10" />

        <div className="container mx-auto px-4 md:px-6 relative z-10 w-full max-w-full">
          <div className="grid lg:grid-cols-2 gap-10 sm:gap-16 items-center">
            <div>
              <Reveal>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-4 sm:mb-6 text-white tracking-tight leading-tight [text-wrap:balance]">
                  {language === "en"
                    ? "Enjoy the Essence of Royal Flavor"
                    : cmsContent.OrderTitle
                      ? cmsContent.OrderTitle.replace(/\n/g, " ")
                      : "Thưởng Thức Hương Vị Tinh Túy"}
                </h2>
              </Reveal>
              <Reveal delay={0.08}>
                <p className="text-sm sm:text-base text-[#FDE68A] mb-6 sm:mb-8 leading-relaxed opacity-90 max-w-xl [text-wrap:pretty]">
                  {language === "en"
                    ? "Order today to receive the freshest batches of dried longan. We guarantee the highest quality delivered to your hands."
                    : cmsContent.OrderDescription ||
                    "Đặt hàng ngay hôm nay để nhận được những mẻ long nhãn mới nhất. Chúng tôi cam kết chất lượng tuyệt hảo đến tay bạn."}
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
                    <p className="text-xs sm:text-sm text-[#FDE68A]">
                      {t.contact?.hotline_label ||
                        (language === "en" ? "24/7 Consultation Hotline" : "Hotline tư vấn (24/7)")}
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-white">
                      {cmsContent.Hotline || "090 123 4567"}
                    </p>
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
                    <p className="text-xs sm:text-sm text-[#FDE68A]">
                      {t.contact?.factory_address ||
                        (language === "en" ? "Production Facility Address" : "Địa chỉ xưởng sản xuất")}
                    </p>
                    <p className="text-base sm:text-lg font-bold text-white">
                      {cmsContent.Address || "Phố Hiến, Tp. Hưng Yên"}
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Form Đặt Hàng */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 shadow-xl shadow-black/20 text-foreground">
              <h3 className="text-xl sm:text-2xl font-bold text-primary mb-4 sm:mb-6">{t.order.title}</h3>

              {isOfflineCatalog && (
                <div className="mb-6 p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm font-medium leading-relaxed">
                      {t.order.catalog_maintenance ||
                        "Hệ thống đang bảo trì dữ liệu trực tuyến. Quý khách vui lòng gọi Hotline hoặc nhắn tin Zalo để được phục vụ đặt hàng ngay."}
                    </p>
                  </div>
                  <a
                    href={`tel:${cmsContent.Hotline || "0348973285"}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shrink-0 transition-all shadow-xs"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{t.order.call_hotline_to_order || "Gọi Hotline"}</span>
                  </a>
                </div>
              )}

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
                            {emailDeliveryStatus === "NotConfigured"
                              ? t.order.order_received_email_maintenance ||
                              "Đơn hàng đã tiếp nhận thành công! Cổng gửi email tự động đang tạm bảo trì:"
                              : t.order.order_received_email_pending ||
                              "Hệ thống đã tiếp nhận đơn hàng và đang tiến hành gửi hóa đơn & thông tin xác nhận đến:"}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-emerald-950 pl-6 break-all">
                          {lastSubmittedEmail}
                        </p>
                        <p className="text-xs text-neutral-600 pl-6 italic">
                          {emailDeliveryStatus === "NotConfigured"
                            ? t.order.email_staff_call ||
                            "(Nhân viên sẽ liên hệ qua số điện thoại để xác nhận đơn và gửi hóa đơn cho bạn)"
                            : t.order.email_check_spam ||
                            "(Vui lòng kiểm tra hộp thư đến hoặc mục thư rác / spam trong ít phút tới)"}
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
                        <span>
                          {language === "en" ? "Launch fireworks again" : "Bắn pháo hoa ăn mừng 🎆"}
                        </span>
                      </button>
                    </div>
                  </motion.div>
                )}

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
                    <p className="font-medium">{errorMessage || t.order.error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5">
                  <div className="space-y-1.5">
                    <label htmlFor="customerName" className="text-sm font-medium text-foreground/80">
                      {t.order.name} *
                    </label>
                    <input
                      id="customerName"
                      name="customerName"
                      type="text"
                      required
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
                    <label htmlFor="customerPhone" className="text-sm font-medium text-foreground/80">
                      {t.order.phone} *
                    </label>
                    <input
                      id="customerPhone"
                      name="customerPhone"
                      type="tel"
                      required
                      inputMode="tel"
                      autoComplete="tel"
                      maxLength={20}
                      aria-invalid={!!errors.customerPhone}
                      value={form.customerPhone}
                      onChange={(e) => setField("customerPhone", e.target.value)}
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
                  <label htmlFor="customerEmail" className="text-sm font-medium text-foreground/80">
                    {language === "en" ? "Email (For invoice)" : "Email (Để nhận hóa đơn)"}
                  </label>
                  <input
                    id="customerEmail"
                    name="customerEmail"
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

                <div className="space-y-1.5">
                  <label
                    htmlFor={isManualAddress ? "addressDetail" : "provinceSelect"}
                    className="text-sm font-medium text-foreground/80"
                  >
                    {t.order.address} *
                  </label>

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
                          id="provinceSelect"
                          name="province"
                          aria-label={t.order.province}
                          aria-invalid={!!errors.province}
                          value={form.province}
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
                            <option key={p.code} value={p.name}>
                              {p.name}
                            </option>
                          ))}
                        </select>

                        <select
                          id="wardSelect"
                          name="ward"
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
                            <option key={w} value={w}>
                              {w}
                            </option>
                          ))}
                        </select>
                      </div>
                      {(errors.province || errors.ward) && (
                        <FieldError message={errorText(errors.province || errors.ward)} />
                      )}

                      <input
                        id="addressDetail"
                        name="addressDetail"
                        type="text"
                        required
                        maxLength={MAX_ADDRESS_DETAIL_LENGTH}
                        autoComplete="address-line1"
                        aria-label={t.order.address_detail}
                        aria-invalid={!!errors.addressDetail}
                        placeholder={`${t.order.address_detail} (${language === "en" ? "e.g. 123 Pho Hien street" : "ví dụ: 123 đường Phố Hiến"
                          })`}
                        value={form.addressDetail}
                        onChange={(e) => setField("addressDetail", e.target.value)}
                        onBlur={() => validateField("addressDetail")}
                        className={`${inputClass(errors.addressDetail)} mt-3`}
                      />
                      {errors.addressDetail && <FieldError message={errorText(errors.addressDetail)} />}
                    </>
                  )}

                  {!isManualAddress && composeAddress(form) && (
                    <p className="text-xs text-foreground/60 pt-1">📍 {composeAddress(form)}</p>
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
                      title={canAddItem ? undefined : t.order.all_products_selected || "Đã chọn hết sản phẩm đang bán"}
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
                            <div className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {custom.customProductName}
                              </p>
                              <p className="text-xs text-foreground/60 truncate">
                                {language === "en"
                                  ? custom.packagingName
                                    .replace("Túi Zip Khóa Khí Tiện Lợi", "Airtight Zipper Bag")
                                    .replace("Túi Zip", "Zip Bag")
                                    .replace("Hộp Nhựa Mica Trong Suốt", "Clear Mica Jar")
                                    .replace("Hộp Mica", "Mica Jar")
                                    .replace("Lễ Hộp Quà Tặng Hoàng Gia", "Royal Gift Box")
                                    .replace("Lễ Hộp", "Luxury Gift Box")
                                  : custom.packagingName}{" "}
                                ({custom.targetWeightGrams}g)
                                {custom.ingredients?.length
                                  ? ` · ${custom.ingredients
                                    .map((ing) => {
                                      const rawName = ing.name || "";
                                      const ingName =
                                        language === "en"
                                          ? rawName
                                            .replace("Long Nhãn Phố Hiến", "Pho Hien Longan")
                                            .replace("Long nhãn Phố Hiến", "Pho Hien Longan")
                                            .replace("Hạt Macca Đắk Lắk", "Dak Lak Macadamia")
                                            .replace("Macca Tây Nguyên", "Highland Macadamia")
                                            .replace("Hạt Điều Bình Phước Rang Mộc", "Roasted Cashews")
                                            .replace("Hạt điều rang mộc", "Roasted Cashews")
                                            .replace("Hạnh Nhân Mỹ Nướng Giòn", "Baked Almonds")
                                            .replace("Hạnh nhân nướng", "Baked Almonds")
                                            .replace("Hạt Bí Xanh Ấn Độ", "Pumpkin Seeds")
                                            .replace("Hạt bí xanh", "Pumpkin Seeds")
                                          : rawName;
                                      return `${ingName} ${ing.weightGrams}g`;
                                    })
                                    .join(", ")}`
                                  : ""}
                              </p>
                            </div>
                          ) : (
                            <select
                              id={`productSelect-${idx}`}
                              name={`productSelect-${idx}`}
                              required
                              aria-label={`${t.order.select_product} ${idx + 1}`}
                              value={item.productId}
                              onChange={(e) => updateItem(idx, "productId", e.target.value)}
                              className="w-full bg-white border border-gray-200 focus:border-[#B45309] focus:ring-1 focus:ring-[#B45309] rounded-xl px-3 py-2 text-sm outline-none transition-all truncate"
                            >
                              <option value="">{t.order.select_default}</option>
                              {effectiveProducts.map((prod) => (
                                <option key={prod.id} value={prod.id}>
                                  {prod.name} -{" "}
                                  {language === "en"
                                    ? `$${(prod.price / 25000).toFixed(2).replace(",", ".")}`
                                    : `${prod.price.toLocaleString("vi-VN").replace(/,/g, ".")}đ`}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0">
                          <div className="w-24 shrink-0">
                            <input
                              id={`productQty-${idx}`}
                              name={`productQty-${idx}`}
                              type="number"
                              min="1"
                              max="999"
                              required
                              aria-label={`${language === "en" ? "Quantity for product" : "Số lượng sản phẩm"} ${idx + 1
                                }`}
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
                              title={t.order.remove_item || (language === "en" ? "Remove item" : "Xóa sản phẩm")}
                              aria-label={t.order.remove_item || (language === "en" ? "Remove item" : "Xóa sản phẩm")}
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
                  <label htmlFor="discountCode" className="text-sm font-medium text-foreground/80">
                    {t.order.discount}
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="discountCode"
                      name="discountCode"
                      type="text"
                      value={form.discountCode}
                      onChange={(e) => setField("discountCode", e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyDiscount())}
                      className="flex-1 bg-background border border-border focus:border-accent focus:ring-1 focus:ring-accent rounded-xl px-4 py-3 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => applyDiscount()}
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
                        ? `${t.order.discount_percent_label || (language === "en" ? "Discount" : "Giảm")} ${discountResult.percentOff
                        }%`
                        : `${t.order.discount_percent_label || (language === "en" ? "Discount" : "Giảm")} ${language === "en"
                          ? `${((discountResult.amountOff || 0) / 25000).toFixed(2).replace(",", ".")}`
                          : `${discountResult.amountOff?.toLocaleString("vi-VN").replace(/,/g, ".")}đ`
                        }`}
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
                        let size = custom
                          ? `${custom.packagingName} (${custom.targetWeightGrams}g)`
                          : prod!.size;
                        if (language === "en" && custom) {
                          size = size
                            .replace("Túi Zip Khóa Khí Tiện Lợi", "Airtight Zipper Bag")
                            .replace("Túi Zip", "Zip Bag")
                            .replace("Hộp Nhựa Mica Trong Suốt", "Clear Mica Jar")
                            .replace("Hộp Mica", "Mica Jar")
                            .replace("Lễ Hộp Quà Tặng Hoàng Gia", "Royal Gift Box")
                            .replace("Lễ Hộp", "Luxury Gift Box");
                        }
                        const itemTotal = unitPrice * (item.quantity || 1);
                        return (
                          <div key={idx} className="flex justify-between items-start gap-2">
                            <span className="flex-1 min-w-0 break-words">
                              {name} ({size}) x{item.quantity}
                            </span>
                            <span className="font-medium shrink-0">
                              {language === "en"
                                ? `$${(itemTotal / 25000).toFixed(2).replace(",", ".")}`
                                : `${itemTotal.toLocaleString("vi-VN").replace(/,/g, ".")}đ`}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-between text-sm text-foreground/70 pt-1">
                      <span>{t.order.base_price}</span>
                      <span>
                        {language === "en"
                          ? `$${(base / 25000).toFixed(2).replace(",", ".")}`
                          : `${base.toLocaleString("vi-VN").replace(/,/g, ".")}đ`}
                      </span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>{t.order.discount_amount}</span>
                        <span>
                          -
                          {language === "en"
                            ? `$${(discount / 25000).toFixed(2).replace(",", ".")}`
                            : `${discount.toLocaleString("vi-VN").replace(/,/g, ".")}đ`}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-primary border-t pt-2">
                      <span>{t.order.total_bill}</span>
                      <span className="text-accent text-lg">
                        {language === "en"
                          ? `$${(final / 25000).toFixed(2).replace(",", ".")}`
                          : `${final.toLocaleString("vi-VN").replace(/,/g, ".")}đ`}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="orderNote" className="text-sm font-medium text-foreground/80">
                    {t.order.add_note}
                  </label>
                  <textarea
                    id="orderNote"
                    name="orderNote"
                    rows={3}
                    value={form.note}
                    onChange={(e) => setField("note", e.target.value)}
                    className="w-full bg-background border border-border focus:border-accent focus:ring-1 focus:ring-accent rounded-xl px-4 py-3 outline-none transition-all resize-none"
                    placeholder={t.order.note_placeholder}
                  />
                </div>

                {hasFallbackProduct ? (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-xl font-medium text-center">
                      {t.order.fallback_guard_notice ||
                        "Hệ thống đang bảo trì dữ liệu sản phẩm. Quý khách vui lòng gọi Hotline hoặc Zalo để đặt hàng nhanh nhất!"}
                    </p>
                    <a
                      href={`tel:${cmsContent.Hotline || "0348973285"}`}
                      className="w-full bg-accent hover:bg-[#9A3412] text-white font-bold text-base py-3.5 rounded-xl shadow-lg shadow-accent/25 transition-all flex justify-center items-center gap-2"
                    >
                      <Phone className="w-5 h-5" />
                      <span>
                        {t.order.call_hotline_to_order || "Gọi Hotline Đặt Hàng"}:{" "}
                        {cmsContent.Hotline || "034 897 3285"}
                      </span>
                    </a>
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || !form.items.some((i) => i.productId)}
                    className="w-full bg-accent hover:bg-[#9A3412] text-white font-bold text-lg py-4 rounded-xl shadow-xl shadow-accent/25 transition-all hover:-translate-y-0.5 active:scale-95 flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> {t.order.submitting}
                      </>
                    ) : (
                      <>
                        {t.order.send_order} <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Hiệu ứng pháo hoa khi đặt hàng thành công */}
      <FireworksCelebration isActive={showFireworks} onClose={() => setShowFireworks(false)} />
    </>
  );
}

export default OrderSection;

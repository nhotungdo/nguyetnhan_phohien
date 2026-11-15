"use client";

import { useState, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Leaf, Package, Award } from "lucide-react";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { useProducts } from "@/hooks/useProducts";
import { useWebsiteContent } from "@/hooks/useWebsiteContent";
import { useCartStore } from "@/stores/useCartStore";
import { ProductGalleryModal } from "@/components/ProductGalleryModal";
import { ProductInteractiveShowcase } from "@/components/ProductInteractiveShowcase";
import { ProductComparisonSection } from "@/components/ProductComparisonSection";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { FastImage } from "@/components/FastImage";
import { resolveCmsImage } from "@/lib/cmsImage";
import { DEFAULT_FALLBACK_PRODUCTS } from "@/data/defaultProducts";
import type { ProductResponse } from "@/types/api.types";
import { scrollToSection } from "@/lib/scrollToSection";

export function ProductCatalogView() {
  const isMounted = useSyncExternalStore(
    () => () => { },
    () => true,
    () => false
  );

  const [galleryProduct, setGalleryProduct] = useState<ProductResponse | null>(null);
  const searchParams = useSearchParams();
  const targetProductParam = searchParams.get("product");
  const { t, language } = useLanguageStore();
  const { products: apiProducts } = useProducts();
  const { content: cmsContent } = useWebsiteContent();

  const { addItem: addCartItem, closeCart } = useCartStore();
  const cartStoreItems = useCartStore((s) => s.items);

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

  const handleQuickBuy = (product: ProductResponse) => {
    addCartItem(product);
    closeCart();
    scrollToSection("dat-hang");
  };

  return (
    <>
      {/* Khu vực sản phẩm tương tác cao cấp */}
      <SectionErrorBoundary sectionName="Danh mục sản phẩm">
        <ProductInteractiveShowcase
          products={effectiveProducts}
          language={language as "vi" | "en"}
          cmsContent={cmsContent}
          targetProductId={targetProductParam}
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

      {/* So sánh minh bạch chất lượng */}
      <SectionErrorBoundary sectionName="So sánh chất lượng">
        <ProductComparisonSection language={language as "vi" | "en"} />
      </SectionErrorBoundary>

      {/* Lối tắt sang Studio Tự Chọn Hạt với Banner hình ảnh trực quan tràn viền */}
      <section className="bg-gradient-to-b from-[#F7F3EB] via-amber-50/20 to-stone-50/80 border-t border-border py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          {/* Tiêu đề mục giới thiệu */}
          <div className="mb-6 sm:mb-8 text-center max-w-2xl mx-auto space-y-2.5">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300/80 shadow-2xs">
              {language === "en" ? "Exclusive Feature" : "Tính Năng Mới • Tự Chọn Hạt"}
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-primary tracking-tight">
              {language === "en" ? "Choose Your Own Nut Mix" : "Phối Một Hộp Hạt Theo Ý Bạn"}
            </h2>
            <p className="text-stone-700 leading-relaxed text-sm sm:text-base [text-wrap:pretty]">
              {language === "en"
                ? "Freely customize your nut blend, select bespoke gift packaging, and print personalized labels for you or your loved ones."
                : "Tự tay lựa chọn 5 loại hạt (Long Nhãn, Điều, Hạnh Nhân, Macca, Bí Xanh), chọn mẫu hộp quà và in tem nhãn mang tên riêng hoàn toàn theo yêu cầu."}
            </p>
          </div>

          {/* Banner toàn cảnh hiển thị đầy đủ tỉ lệ chuẩn, không bị cắt xén ảnh */}
          <Link
            href="/tu-chon-hat"
            prefetch={true}
            className="group relative block w-full rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-[#E8DFC8] hover:border-[#D4AF37] shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-white cursor-pointer"
            aria-label="Vào Studio Tự Chọn Hạt Dinh Dưỡng"
          >
            <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] lg:aspect-[2.2/1] overflow-hidden bg-[#F4EFE6]">
              <FastImage
                src={resolveCmsImage(cmsContent?.CustomMix_BannerUrl) || "/images/banner_tu_chon_hat.png"}
                alt="Banner Tự Chọn Hạt Dinh Dưỡng Nguyệt Nhãn Phố Hiến"
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1152px"
                className="object-cover object-center w-full h-full transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />

              {/* Gradient phủ nhẹ tạo độ sâu và tăng tương phản nút */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />

              {/* Nút Floating CTA góc dưới */}
              <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 flex items-center gap-2 bg-primary/95 hover:bg-primary backdrop-blur-md text-[#FDE68A] group-hover:text-white px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm lg:text-base shadow-xl border border-[#FDE68A]/40 transition-all duration-300 group-hover:scale-105">
                <span>{language === "en" ? "Launch Studio Now" : (t.nav.custom_mix || "Vào Studio Tự Chọn Hạt")}</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </div>

              {/* Tag MỚI góc trái */}
              <div className="absolute top-3 left-3 sm:top-5 sm:left-5">
                <span className="inline-flex items-center gap-1.5 bg-[#A61C45] text-white text-[11px] sm:text-xs font-black uppercase tracking-wider px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full shadow-lg">
                  ★ {language === "en" ? "Exclusive" : "Tính Năng Mới"}
                </span>
              </div>
            </div>
          </Link>

          {/* 3 Thẻ điểm nhấn tính năng (không đánh số, chữ to rõ ràng) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 sm:mt-8">
            <div className="p-4 sm:p-5 rounded-2xl bg-white/90 backdrop-blur-xs border border-[#E8DFC8] shadow-2xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 shadow-2xs">
                <Leaf className="w-5 h-5 text-amber-800" />
              </div>
              <div>
                <h4 className="font-bold text-sm sm:text-base text-stone-900">
                  {language === "en" ? "5 Artisanal Nut Varieties" : "5 Loại Hạt Thượng Hạng"}
                </h4>
                <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
                  {language === "en" ? "Huong Chi longan & nutritious nuts" : "Long nhãn Hương Chi & hạt dưỡng sinh"}
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white/90 backdrop-blur-xs border border-[#E8DFC8] shadow-2xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 shadow-2xs">
                <Package className="w-5 h-5 text-amber-800" />
              </div>
              <div>
                <h4 className="font-bold text-sm sm:text-base text-stone-900">
                  {language === "en" ? "3 Luxury Packaging Options" : "3 Mẫu Bao Bì Sang Trọng"}
                </h4>
                <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
                  {language === "en" ? "Zip pouch, mica canister & royal gift set" : "Túi zip, hộp mica & lễ hộp hoàng gia"}
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white/90 backdrop-blur-xs border border-[#E8DFC8] shadow-2xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 shadow-2xs">
                <Award className="w-5 h-5 text-amber-800" />
              </div>
              <div>
                <h4 className="font-bold text-sm sm:text-base text-stone-900">
                  {language === "en" ? "Personalized Custom Labels" : "In Tem Nhãn Độc Bản"}
                </h4>
                <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
                  {language === "en" ? "Custom name & wish printed directly" : "In tên riêng & thông điệp trao tặng"}
                </p>
              </div>
            </div>
          </div>
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
    </>
  );
}

export default ProductCatalogView;


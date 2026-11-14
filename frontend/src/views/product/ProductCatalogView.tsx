"use client";

import { useState, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
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

      {/* Lối tắt sang Studio Tự Chọn Hạt với Banner hình ảnh trực quan */}
      <section className="bg-gradient-to-b from-[#F7F3EB] to-secondary/60 border-y border-border py-10 sm:py-14">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <Link
            href="/tu-chon-hat"
            prefetch={true}
            className="group relative block w-full rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-[#E8DFC8] hover:border-[#D4AF37] shadow-md hover:shadow-xl transition-all duration-300 bg-white"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
              <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10">
                <span className="text-xs font-bold uppercase tracking-wider text-primary bg-amber-200/70 border border-amber-300 px-3 py-1 rounded-full mb-3 inline-block">
                  {language === "en" ? "Exclusive Feature" : "Tính Năng Mới • Tự Chọn Hạt"}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
                  {language === "en" ? "Choose Your Own Mix" : "Phối Một Hộp Hạt Theo Ý Bạn"}
                </h2>
                <p className="mt-3 text-stone-700 text-sm sm:text-base leading-relaxed [text-wrap:pretty]">
                  {language === "en"
                    ? "Choose your favorite nuts, customize proportions, select elegant packaging, and print a personalized label for yourself or loved ones."
                    : "Tự tay lựa chọn 5 loại hạt (Long Nhãn, Điều, Hạnh Nhân, Macca, Bí Xanh), chọn mẫu hộp quà và in tem nhãn mang tên riêng hoàn toàn theo yêu cầu."}
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <span className="inline-flex items-center gap-2 bg-primary text-white rounded-xl px-5 sm:px-6 py-3 font-bold transition-all shadow-sm group-hover:bg-accent group-hover:shadow-md text-sm sm:text-base">
                    <span>{t.nav.custom_mix || "Vào Studio Tự Chọn Hạt"}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
              <div className="lg:col-span-5 relative aspect-[16/10] lg:aspect-auto lg:h-full min-h-[220px] overflow-hidden bg-neutral-100">
                <FastImage
                  src={resolveCmsImage(cmsContent?.CustomMix_BannerUrl) || "/images/banner_tu_chon_hat.png"}
                  alt="Banner Tự Chọn Hạt"
                  fill
                  className="object-cover object-center w-full h-full transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>
            </div>
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
    </>
  );
}

export default ProductCatalogView;


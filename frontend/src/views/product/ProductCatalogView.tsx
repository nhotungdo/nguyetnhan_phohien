"use client";

import { useState, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { useProducts } from "@/hooks/useProducts";
import { useWebsiteContent } from "@/hooks/useWebsiteContent";
import { useCartStore } from "@/stores/useCartStore";
import { ProductGalleryModal } from "@/components/ProductGalleryModal";
import { ProductInteractiveShowcase } from "@/components/ProductInteractiveShowcase";
import { ProductComparisonSection } from "@/components/ProductComparisonSection";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
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

        if (prod.id === "default-dac-biet" || prod.name.includes("Đặc Biệt")) {
          name = "Special Reserve Dried Longan";
          description =
            "Thick-fleshed Huong Chi longan, hot-air convection dried, uniform golden amber fruit, delightfully chewy and delicately sweet.";
        } else if (prod.id === "default-tui-zip" || prod.name.includes("Túi Zip")) {
          name = "Airtight Zipper Pouch Dried Longan";
          description =
            "Convenient resealable zipper pouch for daily storage, airtight seal keeping natural chewiness and fragrance, perfect for tea, sweet soup, or restorative infusions.";
        } else if (prod.id === "default-set-qua" || prod.name.includes("Set Quà") || prod.name.includes("Hoàng Gia")) {
          name = "Royal Heritage Gift Set";
          description =
            "Elegantly designed gift box honoring centuries of Pho Hien cultural heritage, paired with a luxury tote bag, the perfect wellness gift for loved ones and partners.";
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

      {/* Lối tắt sang Studio Tự Chọn Hạt */}
      <section className="bg-secondary/70 border-y border-border py-10 sm:py-14">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
              {language === "en" ? "Choose your own mix" : "Phối một hộp hạt theo ý bạn"}
            </h2>
            <p className="mt-2 text-stone-600 text-sm sm:text-base leading-relaxed [text-wrap:pretty]">
              {language === "en"
                ? "Choose your nuts, packaging and a name for your label in our bespoke studio."
                : "Tự tay lựa chọn 5 loại hạt, kiểu dáng hộp quà và in tem nhãn mang tên bạn hoàn toàn miễn phí."}
            </p>
          </div>
          <Link
            href="/tu-chon-hat"
            prefetch={true}
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
    </>
  );
}

export default ProductCatalogView;


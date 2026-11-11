import type { Metadata } from "next";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { productApi } from "@/services/api.service";
import { fetchWebsiteContent, websiteContentQueryKey } from "@/lib/contentQuery";
import { StorefrontLayout } from "@/components/layout/StorefrontLayout";
import { ProductCatalogView } from "@/views/product/ProductCatalogView";
import { OrderSection } from "@/views/landing/OrderSection";

export const metadata: Metadata = {
  title: "Sản Phẩm Long Nhãn Chính Gốc & Đặt Hàng Trực Tuyến",
  description:
    "Đặt mua đặc sản Long Nhãn Phố Hiến sấy nhiệt đối lưu 100% tự nhiên. Miễn phí giao hàng toàn quốc, cam kết chuẩn chất lượng tiến vua.",
  openGraph: {
    title: "Danh Mục Sản Phẩm & Đặt Mua | Nguyệt Nhãn Phố Hiến",
    description:
      "Bảng giá long nhãn sấy đối lưu, hộp quà biếu hoàng gia và đặt hàng trực tuyến tiện lợi.",
    images: ["/images/combo3sp.jpg"],
  },
};

export const dynamic = "force-dynamic";

async function getDehydratedState() {
  const queryClient = new QueryClient();
  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ["products", "public"],
      queryFn: () => productApi.getAllPublic(),
    }),
    queryClient.prefetchQuery({
      queryKey: websiteContentQueryKey,
      queryFn: fetchWebsiteContent,
    }),
  ]);
  return dehydrate(queryClient);
}

export default async function SanPhamPage() {
  const state = await getDehydratedState();

  return (
    <HydrationBoundary state={state}>
      <StorefrontLayout>
        {/* Subpage Header Banner */}
        <section className="bg-gradient-to-b from-amber-100/60 via-[#F7F3EB] to-background pt-8 pb-10 sm:pt-12 sm:pb-14 border-b border-[#E8DFC8]/60">
          <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E8DFC8] text-primary text-xs sm:text-sm font-semibold shadow-2xs mb-4">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>Chính Hãng • Sấy Đối Lưu Khép Kín • 100% Tự Nhiên</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary tracking-tight [text-wrap:balance]">
              Bộ Sưu Tập Nguyệt Nhãn Phố Hiến
            </h1>
            <p className="mt-3 text-base sm:text-lg text-stone-700 leading-relaxed [text-wrap:pretty]">
              Tuyển chọn từ những cùi nhãn lồng Hương Chi cổ thụ dày mọng, giữ trọn vẹn vị ngọt thanh tao và hương thơm tự nhiên.
            </p>
          </div>
        </section>

        {/* Danh mục sản phẩm tương tác & So sánh chất lượng */}
        <ProductCatalogView />

        {/* Form đặt hàng & Thanh toán trực tuyến */}
        <OrderSection />
      </StorefrontLayout>
    </HydrationBoundary>
  );
}

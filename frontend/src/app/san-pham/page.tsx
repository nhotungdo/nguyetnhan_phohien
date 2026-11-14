import { Suspense } from "react";
import type { Metadata } from "next";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
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
        {/* Danh mục sản phẩm tương tác & So sánh chất lượng */}
        <Suspense fallback={<div className="min-h-[400px]" />}>
          <ProductCatalogView />
        </Suspense>

        {/* Form đặt hàng & Thanh toán trực tuyến */}
        <OrderSection />
      </StorefrontLayout>
    </HydrationBoundary>
  );
}


import type { Metadata } from "next";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { productApi } from "@/services/api.service";
import { fetchWebsiteContent, websiteContentQueryKey } from "@/lib/contentQuery";
import { StorefrontLayout } from "@/components/layout/StorefrontLayout";
import { PhoHienCulinaryView } from "@/views/culinary/PhoHienCulinaryView";

export const metadata: Metadata = {
  title: "Văn Hóa Ẩm Thực & Phong Vị Tiến Vua Phố Hiến",
  description:
    "Khám phá nghệ thuật thưởng trà, chè long nhãn lồng hạt sen cung đình và cẩm nang ẩm thực ngự thiện từ long nhãn tiến vua Phố Hiến - Hưng Yên.",
  openGraph: {
    title: "Văn Hóa Ẩm Thực & Phong Vị Cung Đình | Nguyệt Nhãn Phố Hiến",
    description:
      "Nghệ thuật thưởng trà đàm đạo, chè long nhãn lồng hạt sen và bộ tứ thực đơn ngự thiện tiến vua.",
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

export default async function AmThucPage() {
  const state = await getDehydratedState();

  return (
    <HydrationBoundary state={state}>
      <StorefrontLayout>
        <PhoHienCulinaryView />
      </StorefrontLayout>
    </HydrationBoundary>
  );
}

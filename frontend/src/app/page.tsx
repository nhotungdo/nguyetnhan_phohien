import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { productApi } from "@/services/api.service";
import { fetchWebsiteContent, websiteContentQueryKey } from "@/lib/contentQuery";
import LandingPage from "@/views/landing/LandingPage";

/**
 * Tải sản phẩm + nội dung CMS ngay khi server render HTML:
 *  - Thẻ <img> của ảnh sản phẩm / logo / banner xuất hiện trong HTML đầu tiên →
 *    trình duyệt bắt đầu tải ảnh SONG SONG với bundle JS, thay vì chờ JS chạy xong
 *    rồi mới fetch JSON rồi mới thấy URL ảnh (thêm 1–2 giây mỗi lần vào trang).
 *  - React Query hydrate cache sẵn dữ liệu → lần render đầu đã có danh sách sản phẩm.
 *
 * Nếu backend không chạy / build trên máy không có API thì prefetch tự thất bại
 * trong im lặng (prefetchQuery không ném lỗi), trang rơi về cơ chế cũ: client tự fetch.
 * Dữ liệu hydrate lúc request luôn mới nhất — thay đổi sau đó đến qua SignalR
 * (useRealtimeSync), nên trang không bao giờ hiển thị sản phẩm/ảnh đã xóa hay giá cũ.
 */
async function getDehydratedState() {
  const queryClient = new QueryClient();
  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ["products", "public"],
      queryFn: () => productApi.getAllPublic(),
    }),
    queryClient.prefetchQuery({
      queryKey: websiteContentQueryKey,
      // Dùng CHÍNH queryFn của useWebsiteContent: khác shape dữ liệu dù trùng key
      // sẽ hydrate nhầm kiểu (mảng thay object) và làm hỏng ảnh/text CMS.
      queryFn: fetchWebsiteContent,
    }),
  ]);
  return dehydrate(queryClient);
}

// Render theo YÊU CẦU thay vì prerender tĩnh lúc build: dữ liệu sản phẩm/ảnh
// phải lấy từ API tại thời điểm request (apiFetch dùng cache: "no-store").
// Server chỉ mất thêm vài ms vì GET /api/products nằm trong output-cache 60s của backend.
export const dynamic = "force-dynamic";

export default async function Home() {
  const state = await getDehydratedState();

  return (
    <HydrationBoundary state={state}>
      <LandingPage />
    </HydrationBoundary>
  );
}

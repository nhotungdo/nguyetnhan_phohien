import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { productApi } from "@/services/api.service";
import { fetchWebsiteContent, websiteContentQueryKey } from "@/lib/contentQuery";
import HeroPage from "./hero-page";
import GioiThieuPage from "./gioi-thieu-page";
import CauChuyenPage from "./cau-chuyen-page";
import LichSuPage from "./lich-su-page";
import DatHangPage from "./dat-hang-page";
import LienHePage from "./lien-he-page";

/** Load products + CMS content on server render:
 *  - <img> tags of product images / logo / banner appear in initial HTML →
 *    browser starts loading images SIDELY with bundle JS, instead of waiting
 *    for JS to run then fetch JSON then see image URL (adds 1-2 seconds per page visit).
 *  - React Query hydrate pre-loaded data → first render already has product list.
 *
 * If backend doesn't run / build on machine without API then prefetchQuery silently fails
 * in im lặng (prefetchQuery doesn't throw), page falls back to old mechanism: client fetches.
 * Hydrated data is always the newest via request — changes afterward come through SignalR
 * (useRealtimeSync), so page never shows deleted products or old prices.
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
      // Use the CHIEF queryFn of useWebsiteContent: different shape data even if same key
      // will hydrate wrong type (array instead of object) and break images/text CMS.
      queryFn: fetchWebsiteContent,
    }),
  ]);
  return dehydrate(queryClient);
}

// Render according to REQUIREMENT instead of static prerender at build time: product/image
// data must be fetched from API at request time (apiFetch uses cache: "no-store").
// Server only takes a few more ms because GET /api/products is in backend's 60s output cache.
export const dynamic = "force-dynamic";

export default async function Home() {
  const state = await getDehydratedState();

  return (
    <HydrationBoundary state={state}>
      <main className="w-full max-w-full overflow-x-clip pb-20 md:pb-0">
        <HeroPage />
        <GioiThieuPage />
        <CauChuyenPage />
        <LichSuPage />
        <DatHangPage />
        <LienHePage />
      </main>
    </HydrationBoundary>
  );
}
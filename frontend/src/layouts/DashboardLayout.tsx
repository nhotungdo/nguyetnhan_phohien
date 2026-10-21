"use client"
import React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { useAdminGuard } from "@/hooks/useAdminGuard"
import { adminAuth } from "@/services/api.service"
import { ExternalLink, LogOut } from "lucide-react"

const PAGE_TITLES: { prefix: string; title: string }[] = [
  { prefix: "/dashboard", title: "Tổng quan" },
  { prefix: "/orders", title: "Quản lý Đơn hàng" },
  { prefix: "/messenger", title: "Tin nhắn" },
  { prefix: "/content", title: "Nội dung Website" },
  { prefix: "/products", title: "Quản lý Sản phẩm" },
  { prefix: "/discounts", title: "Mã giảm giá" },
  { prefix: "/payment", title: "Cấu hình thanh toán" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthorized, isLoading } = useAdminGuard();
  const pathname = usePathname() || "";
  const router = useRouter();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-foreground text-sm">Đang xác thực...</div>;
  }

  if (!isAuthorized) {
    return null;
  }

  const currentTitle = PAGE_TITLES.find((p) => pathname === p.prefix || pathname.startsWith(`${p.prefix}/`))?.title || "Quản trị";

  const handleLogout = () => {
    adminAuth.logout();
    router.push("/");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full relative">
        <AppSidebar />
        <main className="flex-1 flex flex-col relative w-full h-screen overflow-hidden">
          <header className="h-14 flex items-center justify-between gap-3 border-b border-border/50 px-3 sm:px-4 shrink-0 bg-background/90 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <SidebarTrigger className="shrink-0" />
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="font-bold text-foreground text-sm sm:text-base truncate">{currentTitle}</h1>
                <span className="hidden xs:inline-flex text-[10px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200/60 shrink-0">
                  Admin
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                title="Xem Website khách hàng"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Xem Web</span>
              </Link>
              <button
                onClick={handleLogout}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors inline-flex items-center gap-1"
                title="Đăng xuất khỏi phiên quản trị"
                aria-label="Đăng xuất"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Thoát</span>
              </button>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 relative">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}

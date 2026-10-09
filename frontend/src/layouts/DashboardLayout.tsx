"use client"
import React from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { useAdminGuard } from "@/hooks/useAdminGuard"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthorized, isLoading } = useAdminGuard();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Đang xác thực...</div>;
  }

  if (!isAuthorized) {
    // Chưa có JWT → useAdminGuard đã replace về trang chủ, không render gì thêm
    // (không có màn hình đăng nhập chiếm toàn màn hình trong khu quản trị nữa).
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full relative">
        <AppSidebar />
        <main className="flex-1 flex flex-col relative w-full h-screen overflow-hidden">
          <header className="h-14 flex items-center gap-4 border-b border-border/50 px-4 shrink-0 bg-background/80 backdrop-blur-md sticky top-0 z-10">
            <SidebarTrigger />
            <h1 className="font-semibold text-foreground text-sm">Dashboard</h1>
          </header>
          <div className="flex-1 overflow-auto p-6 relative">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}

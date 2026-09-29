"use client";

import { Package, Users, MessageSquare, TrendingUp, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { orderApi, chatApi } from "@/services/api.service"

export default function Dashboard() {
  const [stats, setStats] = useState({
    ordersCount: 0,
    customersCount: 0,
    messagesCount: 0,
    unreadMessages: 0,
    revenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [orders, sessions] = await Promise.all([
          orderApi.getAll(),
          chatApi.getAllSessions()
        ]);

        const revenue = orders
          .filter(o => o.status === "Completed")
          .reduce((sum, o) => sum + o.totalAmount, 0);

        const unread = sessions.filter(s => s.hasUnreadMessages).length;

        // Count unique customers based on phone numbers from orders and chats
        const uniquePhones = new Set([
          ...orders.map(o => o.customerPhone),
          ...sessions.map(s => s.guestPhone).filter(Boolean)
        ]);

        setStats({
          ordersCount: orders.length,
          customersCount: uniquePhones.size,
          messagesCount: sessions.length,
          unreadMessages: unread,
          revenue,
        });
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">Nguyệt Nhãn Phố Hiến</h2>
        <p className="text-muted-foreground">Tổng quan tình hình kinh doanh & tương tác.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* DOANH THU */}
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col gap-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-16 h-16" />
          </div>
          <div className="flex items-center justify-between relative z-10">
            <h3 className="font-semibold text-sm text-muted-foreground">Doanh thu (Đã giao)</h3>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <p className="text-3xl font-bold mt-2 text-primary relative z-10">{stats.revenue.toLocaleString()}đ</p>
        </div>

        {/* ĐƠN HÀNG */}
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-muted-foreground">Tổng Đơn Hàng</h3>
            <Package className="w-4 h-4 text-primary" />
          </div>
          <p className="text-3xl font-bold mt-2 text-primary">{stats.ordersCount.toLocaleString()}</p>
        </div>

        {/* KHÁCH HÀNG */}
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-muted-foreground">Khách Hàng</h3>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <p className="text-3xl font-bold mt-2 text-primary">{stats.customersCount.toLocaleString()}</p>
        </div>

        {/* TIN NHẮN */}
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-muted-foreground">Phiên Nhắn Tin</h3>
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold mt-2 text-primary">{stats.messagesCount.toLocaleString()}</p>
            {stats.unreadMessages > 0 && (
              <span className="text-xs font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded-full">
                {stats.unreadMessages} chưa đọc
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="h-[400px] rounded-xl border bg-card shadow flex flex-col relative overflow-hidden">
        {/* Organic texture overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.8\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noiseFilter)\"/%3E%3C/svg%3E')"}}></div>
        <div className="p-6 border-b z-10 flex justify-between items-center">
          <h3 className="font-bold text-lg text-primary">Biểu đồ</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center z-10 text-muted-foreground p-8 text-center space-y-4">
          <TrendingUp className="w-12 h-12 text-muted-foreground/30" />
          <p>Biểu đồ thống kê sẽ được kích hoạt khi có đủ dữ liệu từ 7 ngày trở lên.</p>
        </div>
      </div>
    </div>
  )
}

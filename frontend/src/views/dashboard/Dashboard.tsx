"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package, Users, MessageSquare, TrendingUp, Loader2, Trophy, Download } from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { dashboardApi, orderApi } from "@/services/api.service";
import type { DashboardStatsResponse, DayPointDto, OrderResponse } from "@/types/api.types";

const RANGES = [7, 14, 30] as const;

const compactVnd = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(".0", "")}tr`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}k`;
  return `${v}`;
};

const DASHBOARD_CACHE_KEY = "dashboard_stats_cache_v3";
const ORDERS_CACHE_KEY = "orders_admin_cache_v1";

function readCachedStats(): DashboardStatsResponse | null {
  if (typeof window === "undefined") return null;
  try {
    // Xoá cache v2 cũ để đảm bảo không hiển thị lại số liệu còn đơn huỷ
    if (localStorage.getItem("dashboard_stats_cache_v2")) {
      localStorage.removeItem("dashboard_stats_cache_v2");
    }
    const raw = localStorage.getItem(DASHBOARD_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCachedStats(data: DashboardStatsResponse) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(data));
  } catch {}
}

function readCachedOrders(): OrderResponse[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ORDERS_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Skeleton hiển thị lập tức nếu chưa có bộ nhớ đệm (thay vì trang trắng xoay vòng) */
function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-64 bg-muted rounded-md" />
        <div className="h-4 w-96 bg-muted/60 rounded-md" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-6 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 bg-muted rounded" />
              <div className="w-5 h-5 bg-muted rounded-full" />
            </div>
            <div className="h-8 w-36 bg-muted rounded mt-2" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="h-5 w-48 bg-muted rounded" />
            <div className="h-3 w-64 bg-muted/60 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-16 bg-muted rounded-full" />
            <div className="h-8 w-16 bg-muted rounded-full" />
            <div className="h-8 w-16 bg-muted rounded-full" />
          </div>
        </div>
        <div className="h-72 w-full bg-muted/30 rounded-lg flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="h-5 w-40 bg-muted rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-full bg-muted/40 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [rangeDays, setRangeDays] = useState<(typeof RANGES)[number]>(14);

  // Khôi phục ngay từ localStorage (0ms độ trễ, không chớp màn hình)
  const initialCached = useMemo(() => readCachedStats(), []);

  // Lấy dữ liệu tổng hợp trực tiếp từ backend endpoint siêu tốc /api/dashboard/stats
  // Backend đệm trong RAM và trả lời < 1ms, tự động đồng bộ realtime qua SignalR (useRealtimeSync)
  const { data: dashboardStats, isLoading, isFetching } = useQuery<DashboardStatsResponse>({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const data = await dashboardApi.getStats();
      writeCachedStats(data);
      return data;
    },
    initialData: initialCached ?? undefined,
    initialDataUpdatedAt: 0,
    staleTime: 30 * 1000,
  });

  // Truy vấn danh sách đơn hàng để kiểm chứng và hiển thị số lượng đơn huỷ được loại trừ
  const { data: rawOrders } = useQuery<OrderResponse[]>({
    queryKey: ["orders", "admin"],
    queryFn: async () => {
      try {
        return await orderApi.getAll();
      } catch {
        return readCachedOrders() ?? [];
      }
    },
    initialData: () => readCachedOrders() ?? undefined,
    initialDataUpdatedAt: 0,
    staleTime: 60 * 1000,
  });

  const cancelledCount = useMemo(() => {
    if (!rawOrders) return 0;
    return rawOrders.filter((o) => o.status === "Cancelled").length;
  }, [rawOrders]);

  const stats = useMemo(() => {
    // Nếu có danh sách đơn hàng, tính số đơn hiệu lực (loại trừ Cancelled)
    if (rawOrders && rawOrders.length > 0) {
      const valid = rawOrders.filter((o) => o.status !== "Cancelled");
      const completedRevenue = valid
        .filter((o) => o.status === "Completed")
        .reduce((s, o) => s + (o.totalAmount || 0), 0);
      const uniquePhones = new Set(valid.map((o) => o.customerPhone).filter(Boolean));

      return {
        revenue: completedRevenue || (dashboardStats?.revenue ?? 0),
        ordersCount: valid.length,
        customersCount: uniquePhones.size || (dashboardStats?.customersCount ?? 0),
        messagesCount: dashboardStats?.messagesCount ?? 0,
        unreadMessages: dashboardStats?.unreadMessages ?? 0,
      };
    }

    return {
      revenue: dashboardStats?.revenue ?? 0,
      ordersCount: dashboardStats?.ordersCount ?? 0,
      customersCount: dashboardStats?.customersCount ?? 0,
      messagesCount: dashboardStats?.messagesCount ?? 0,
      unreadMessages: dashboardStats?.unreadMessages ?? 0,
    };
  }, [dashboardStats, rawOrders]);

  // Cắt N ngày gần nhất từ chuỗi 30 ngày do server tính sẵn (đã loại trừ đơn huỷ)
  const chartData = useMemo<DayPointDto[]>(() => {
    const all = dashboardStats?.dailyStats ?? [];
    if (all.length === 0) return [];
    return all.slice(-rangeDays);
  }, [dashboardStats?.dailyStats, rangeDays]);

  const topProducts = useMemo(() => {
    if (rawOrders && rawOrders.length > 0) {
      const valid = rawOrders.filter((o) => o.status !== "Cancelled");
      const map: Record<string, { key: string; name: string; size: string | null; quantity: number; revenue: number }> = {};

      for (const o of valid) {
        if (o.items && o.items.length > 0) {
          for (const it of o.items) {
            const k = `${it.productName}_${it.productSize ?? ""}`;
            if (!map[k]) {
              map[k] = {
                key: k,
                name: it.productName,
                size: it.productSize ?? null,
                quantity: 0,
                revenue: 0,
              };
            }
            map[k].quantity += it.quantity;
            map[k].revenue += it.totalPrice;
          }
        } else if (o.productName) {
          const k = `${o.productName}_${o.productSize ?? ""}`;
          if (!map[k]) {
            map[k] = {
              key: k,
              name: o.productName,
              size: o.productSize ?? null,
              quantity: 0,
              revenue: 0,
            };
          }
          map[k].quantity += o.quantity ?? 1;
          map[k].revenue += o.totalAmount;
        }
      }

      const list = Object.values(map).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
      const maxQty = list.length > 0 ? list[0].quantity : 0;
      return list.map((item) => ({
        ...item,
        sharePct: maxQty > 0 ? Math.round((item.quantity / maxQty) * 1000) / 10 : 0,
      }));
    }

    return dashboardStats?.topProducts ?? [];
  }, [dashboardStats?.topProducts, rawOrders]);

  const chartSummary = useMemo(() => {
    const totalRevenue = chartData.reduce((s, p) => s + p.revenue, 0);
    const totalOrders = chartData.reduce((s, p) => s + p.orders, 0);
    return {
      revenueLabel: `${totalRevenue.toLocaleString("vi-VN")}đ`,
      avgRevenueLabel: `${Math.round(totalRevenue / rangeDays).toLocaleString("vi-VN")}đ`,
      ordersLabel: `${totalOrders} đơn hiệu lực`,
      avgOrdersLabel: `${(totalOrders / rangeDays).toFixed(1)} đơn/ngày`,
    };
  }, [chartData, rangeDays]);

  /** Xuất báo cáo CSV mở được bằng Excel */
  const buildReportCsv = () => {
    const totalRevenue = chartData.reduce((s, p) => s + p.revenue, 0);
    const totalOrders = chartData.reduce((s, p) => s + p.orders, 0);

    const esc = (v: string | number) => {
      const s = String(v);
      return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const fullDate = (key: string) => {
      const parts = key.split("-");
      if (parts.length < 3) return key;
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    };

    const L: string[] = [];
    L.push("sep=;");
    L.push("BÁO CÁO DOANH THU & ĐƠN HÀNG - NGUYỆT NHÃN PHỐ HIẾN");
    L.push(`Kỳ báo cáo;${rangeDays} ngày qua`);
    L.push(`Xuất lúc;${new Date().toLocaleString("vi-VN")}`);
    L.push("Ghi chú;Chỉ tính các đơn hàng có hiệu lực (không tính đơn đã huỷ)");
    L.push("");

    L.push("TỔNG QUAN");
    L.push(`Tổng doanh thu (đơn Đã giao);${totalRevenue}`);
    L.push(`Tổng số đơn hiệu lực;${totalOrders}`);
    if (cancelledCount > 0) {
      L.push(`Số đơn huỷ (đã loại trừ);${cancelledCount}`);
    }
    L.push(`Doanh thu TB/ngày;${Math.round(totalRevenue / rangeDays)}`);
    L.push(`Số đơn hiệu lực TB/ngày;${(totalOrders / rangeDays).toFixed(1).replace(".", ",")}`);
    L.push("");

    L.push("CHI TIẾT THEO NGÀY");
    L.push("Ngày;Doanh thu (Đã giao);Số đơn hiệu lực");
    for (const p of chartData) {
      L.push(`${fullDate(p.key)};${p.revenue};${p.orders}`);
    }
    L.push("");

    L.push("TOP SẢN PHẨM BÁN CHẠY (TỪ ĐƠN HIỆU LỰC)");
    L.push("#;Sản phẩm;Kích cỡ;Số lượng;Doanh thu");
    topProducts.forEach((p, i) => {
      L.push(`${i + 1};${esc(p.name)};${esc(p.size ?? "")};${p.quantity};${p.revenue}`);
    });

    return L.join("\r\n");
  };

  const handleExportCsv = () => {
    const blob = new Blob(["\uFEFF" + buildReportCsv()], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bao-cao-doanh-thu-${rangeDays}-ngay-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Chỉ hiện skeleton khi không có bất kỳ bộ nhớ đệm nào và đang đợi request đầu tiên
  if (isLoading && !dashboardStats && !rawOrders) {
    return <DashboardSkeleton />;
  }

  const pillClass = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
      active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-primary"
    }`;

  const hasData = stats.ordersCount > 0 || stats.messagesCount > 0 || stats.revenue > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Nguyệt Nhãn Phố Hiến</h2>
          <p className="text-muted-foreground">Tổng quan tình hình kinh doanh &amp; tương tác (chỉ tính đơn hiệu lực).</p>
        </div>
        <div className="flex items-center gap-2">
          {isFetching ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full">
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
              Đang đồng bộ...
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Realtime
            </span>
          )}
        </div>
      </div>
      
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {/* DOANH THU */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-3.5 sm:p-6 flex flex-col justify-between gap-1 sm:gap-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 sm:p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-12 h-12 sm:w-16 sm:h-16" />
          </div>
          <div className="flex items-center justify-between relative z-10">
            <h3 className="font-semibold text-xs sm:text-sm text-muted-foreground truncate">Doanh thu</h3>
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
          </div>
          <div>
            <p className="text-lg sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2 text-primary relative z-10 truncate" title={`${stats.revenue.toLocaleString("vi-VN")}đ`}>
              {stats.revenue.toLocaleString("vi-VN")}đ
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 relative z-10">Đơn hoàn thành</p>
          </div>
        </div>

        {/* ĐƠN HÀNG */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-3.5 sm:p-6 flex flex-col justify-between gap-1 sm:gap-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-xs sm:text-sm text-muted-foreground truncate">Tổng Đơn Hiệu Lực</h3>
            <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
          </div>
          <div>
            <p className="text-lg sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2 text-primary">{stats.ordersCount.toLocaleString("vi-VN")}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {cancelledCount > 0 ? `(Đã loại trừ ${cancelledCount} đơn huỷ)` : "Chỉ tính đơn có hiệu lực"}
            </p>
          </div>
        </div>

        {/* KHÁCH HÀNG */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-3.5 sm:p-6 flex flex-col justify-between gap-1 sm:gap-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-xs sm:text-sm text-muted-foreground truncate">Khách Hàng</h3>
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
          </div>
          <div>
            <p className="text-lg sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2 text-primary">{stats.customersCount.toLocaleString("vi-VN")}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Khách có đơn hiệu lực</p>
          </div>
        </div>

        {/* TIN NHẮN */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-3.5 sm:p-6 flex flex-col justify-between gap-1 sm:gap-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-xs sm:text-sm text-muted-foreground truncate">Phiên Chat</h3>
            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <p className="text-lg sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2 text-primary">{stats.messagesCount.toLocaleString("vi-VN")}</p>
              {stats.unreadMessages > 0 && (
                <span className="text-[10px] sm:text-xs font-bold text-red-500 bg-red-100 px-1.5 py-0.5 rounded-full">
                  {stats.unreadMessages} mới
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Tư vấn trực tuyến</p>
          </div>
        </div>
      </div>
      
      <div className="h-[340px] sm:h-[400px] rounded-xl border bg-card shadow-sm flex flex-col relative overflow-hidden">
        {/* Organic texture overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\\\"0 0 200 200\\\" xmlns=\\\"http://www.w3.org/2000/svg\\\"%3E%3Cfilter id=\\\"noiseFilter\\\"%3E%3CfeTurbulence type=\\\"fractalNoise\\\" baseFrequency=\\\"0.8\\\" numOctaves=\\\"3\\\" stitchTiles=\\\"stitch\\\"/%3E%3C/filter%3E%3Crect width=\\\"100%25\\\" height=\\\"100%25\\\" filter=\\\"url(%23noiseFilter)\\\"/%3E%3C/svg%3E')"}}></div>

        <div className="p-3.5 sm:p-6 border-b z-10 flex flex-col sm:flex-row gap-2.5 sm:gap-4 justify-between sm:items-center">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-primary">Biểu đồ thống kê</h3>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
              {rangeDays} ngày qua — Tổng: <span className="font-semibold text-foreground">{chartSummary.revenueLabel}</span> / <span className="font-semibold text-foreground">{chartSummary.ordersLabel}</span> (đã loại trừ đơn huỷ)
            </p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap">
            {/* Legend khớp màu với 2 trục của biểu đồ */}
            <span className="flex items-center gap-1 text-[11px] sm:text-xs font-medium text-muted-foreground">
              <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full" style={{ background: "var(--chart-1)" }} />
              Doanh thu
            </span>
            <span className="flex items-center gap-1 text-[11px] sm:text-xs font-medium text-muted-foreground">
              <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full" style={{ background: "var(--chart-2)" }} />
              Đơn hiệu lực
            </span>
            <div className="w-px h-4 bg-border mx-0.5 sm:mx-1" />
            {RANGES.map((r) => (
              <button key={r} type="button" onClick={() => setRangeDays(r)} className={pillClass(rangeDays === r)}>
                {r}N
              </button>
            ))}
            <div className="w-px h-4 bg-border mx-0.5 sm:mx-1" />
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={!hasData}
              title="Tải báo cáo doanh thu & top sản phẩm (CSV)"
              className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold border border-border bg-card text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        <div className="flex-1 z-10 p-4 pt-5 min-h-0">
          {!hasData ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center space-y-4">
              <TrendingUp className="w-12 h-12 text-muted-foreground/30" />
              <p>Biểu đồ sẽ hiển thị khi có đơn hàng đầu tiên.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                {/* Trục trái: doanh thu (đ) — Trục phải: số đơn, màu tick khớp màu series */}
                <YAxis
                  yAxisId="revenue"
                  tickFormatter={compactVnd}
                  tick={{ fontSize: 11, fill: "var(--chart-1)" }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                />
                <YAxis
                  yAxisId="orders"
                  orientation="right"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "var(--chart-2)" }}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.35 }}
                  formatter={(value, name) =>
                    name === "Doanh thu"
                      ? [`${Number(value).toLocaleString("vi-VN")}đ`, name]
                      : [`${Number(value)} đơn hiệu lực`, name]
                  }
                  labelFormatter={(label) => `Ngày ${label}`}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    color: "var(--card-foreground)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  }}
                />
                <Bar
                  yAxisId="orders"
                  dataKey="orders"
                  name="Đơn hiệu lực"
                  fill="var(--chart-2)"
                  fillOpacity={0.85}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={36}
                />
                <Area
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  name="Doanh thu"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  fill="url(#revenueGradient)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* TOP SẢN PHẨM BÁN CHẠY */}
      <div className="rounded-xl border bg-card shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg text-primary">Top sản phẩm bán chạy</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Xếp theo số lượng đã bán (chỉ tính đơn hiệu lực, không tính đơn huỷ)</p>
          </div>
          <Trophy className="w-5 h-5 text-accent" />
        </div>

        {topProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Chưa có sản phẩm nào được bán trong kỳ.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3 text-left font-semibold w-10">#</th>
                  <th className="py-2 pr-3 text-left font-semibold">Sản phẩm</th>
                  <th className="py-2 px-3 text-center font-semibold w-20">SL</th>
                  <th className="py-2 pl-3 text-right font-semibold w-36">Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, idx) => (
                  <tr key={p.key} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 pr-3">
                      <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-bold ${
                        idx === 0 ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="font-medium text-foreground">{p.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        {p.size && (
                          <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border">
                            {p.size}
                          </span>
                        )}
                        <div className="h-1 rounded-full bg-muted w-24 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${p.sharePct}%`, background: "var(--chart-2)" }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-primary">{p.quantity.toLocaleString("vi-VN")}</td>
                    <td className="py-2.5 pl-3 text-right font-bold text-accent">{p.revenue.toLocaleString("vi-VN")}đ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Package, Users, MessageSquare, TrendingUp, Loader2, Trophy, Download } from "lucide-react"
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import { orderApi, chatApi } from "@/services/api.service"

const RANGES = [7, 14, 30] as const;

/** Gom ngày theo giờ địa phương, dạng key YYYY-MM-DD */
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const compactVnd = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(".0", "")}tr`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}k`;
  return `${v}`;
};

interface DayPoint {
  key: string;
  label: string;        // dd/MM
  revenue: number;      // tổng tiền đơn Đã giao trong ngày
  orders: number;       // tổng số đơn tạo trong ngày
}

interface TopProduct {
  key: string;
  name: string;
  size?: string;
  quantity: number;     // tổng số lượng đã bán
  revenue: number;      // tiền hàng (giá × SL, chưa trừ giảm giá)
  sharePct: number;     // % số lượng so với sản phẩm dẫn đầu (vẽ progress bar)
}

const EMPTY_ORDERS: OrderResponse[] = [];

export default function Dashboard() {
  const [rangeDays, setRangeDays] = useState<(typeof RANGES)[number]>(14);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const [ordersList, sessions] = await Promise.all([
        orderApi.getAll(),
        chatApi.getAllSessions()
      ]);

      const revenueVal = ordersList
        .filter(o => o.status === "Completed")
        .reduce((sum, o) => sum + o.totalAmount, 0);

      const unread = sessions.filter(s => s.hasUnreadMessages).length;

      const uniquePhones = new Set([
        ...ordersList.map(o => o.customerPhone),
        ...sessions.map(s => s.guestPhone).filter(Boolean)
      ]);

      return {
        stats: {
          ordersCount: ordersList.length,
          customersCount: uniquePhones.size,
          messagesCount: sessions.length,
          unreadMessages: unread,
          revenue: revenueVal,
        },
        orders: ordersList
      };
    }
  });

  const stats = data?.stats || {
    ordersCount: 0,
    customersCount: 0,
    messagesCount: 0,
    unreadMessages: 0,
    revenue: 0,
  };
  const orders = data?.orders || EMPTY_ORDERS;

  /** Chuỗi dữ liệu N ngày gần nhất: doanh thu (đơn Completed) & số đơn theo ngày */
  const chartData = useMemo<DayPoint[]>(() => {
    const buckets = new Map<string, DayPoint>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      buckets.set(dayKey(d), {
        key: dayKey(d),
        label: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
        revenue: 0,
        orders: 0,
      });
    }

    for (const o of orders) {
      const point = buckets.get(dayKey(new Date(o.createdAt)));
      if (!point) continue;
      point.orders += 1;
      if (o.status === "Completed") point.revenue += o.totalAmount;
    }

    return Array.from(buckets.values());
  }, [orders, rangeDays]);

  const chartSummary = useMemo(() => {
    const totalRevenue = chartData.reduce((s, p) => s + p.revenue, 0);
    const totalOrders = chartData.reduce((s, p) => s + p.orders, 0);
    return {
      revenueLabel: `${totalRevenue.toLocaleString("vi-VN")}đ`,
      avgRevenueLabel: `${Math.round(totalRevenue / rangeDays).toLocaleString("vi-VN")}đ`,
      ordersLabel: `${totalOrders} đơn`,
      avgOrdersLabel: `${(totalOrders / rangeDays).toFixed(1)} đơn`,
    };
  }, [chartData, rangeDays]);

  /** Top 5 sản phẩm bán chạy trong kỳ: gom từ order.items (đơn mới) + legacy 1 sản phẩm (đơn cũ) */
  const topProducts = useMemo<TopProduct[]>(() => {
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - (rangeDays - 1));

    const map = new Map<string, TopProduct>();

    for (const o of orders) {
      if (new Date(o.createdAt) < cutoff) continue;

      if (o.items && o.items.length > 0) {
        for (const item of o.items) {
          const key = `p-${item.productId}`;
          const entry = map.get(key) ?? {
            key,
            name: item.productName,
            size: item.productSize,
            quantity: 0,
            revenue: 0,
            sharePct: 0,
          };
          entry.quantity += item.quantity;
          entry.revenue += item.totalPrice;
          map.set(key, entry);
        }
      } else if (o.productName) {
        // Đơn legacy 1 sản phẩm: tiền hàng của sản phẩm = BaseAmount
        const key = `n-${o.productName}|${o.productSize ?? ""}`;
        const entry = map.get(key) ?? {
          key,
          name: o.productName,
          size: o.productSize,            quantity: 0,
            revenue: 0,
            sharePct: 0,
          };
          entry.quantity += o.quantity ?? 1;
          entry.revenue += o.baseAmount ?? 0;
        map.set(key, entry);
      }
    }

    const list = [...map.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
    const maxQuantity = Math.max(...list.map(p => p.quantity), 1);
    for (const p of list) p.sharePct = Math.round((p.quantity / maxQuantity) * 100);
    return list;
  }, [orders, rangeDays]);

  /**
   * Xuất báo cáo CSV mở được bằng Excel:
   * - Thêm UTF-8 BOM (\uFEFF) để Excel hiển thị đúng tiếng Việt.
   * - Dùng dấu ";" làm phân cách + dòng "sep=;" để Excel phân tách cột
   *   đúng dù máy đang đặt locale dùng dấu phẩy thập phân (VN).
   * - Số liệu xuất dạng số thô để Excel tính toán được.
   */
  const buildReportCsv = () => {
    const totalRevenue = chartData.reduce((s, p) => s + p.revenue, 0);
    const totalOrders = chartData.reduce((s, p) => s + p.orders, 0);

    const esc = (v: string | number) => {
      const s = String(v);
      return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const fullDate = (key: string) => {
      const [y, m, d] = key.split("-");
      return `${d}/${m}/${y}`;
    };

    const L: string[] = [];
    L.push("sep=;");
    L.push("BÁO CÁO DOANH THU - NGUYỆT NHÃN PHỐ HIẾN");
    L.push(`Kỳ báo cáo;${rangeDays} ngày qua`);
    L.push(`Xuất lúc;${new Date().toLocaleString("vi-VN")}`);
    L.push("");

    L.push("TỔNG QUAN");
    L.push(`Tổng doanh thu (đơn Đã giao);${totalRevenue}`);
    L.push(`Tổng số đơn;${totalOrders}`);
    L.push(`Doanh thu TB/ngày;${Math.round(totalRevenue / rangeDays)}`);
    L.push(`Số đơn TB/ngày;${(totalOrders / rangeDays).toFixed(1).replace(".", ",")}`);
    L.push("");

    L.push("CHI TIẾT THEO NGÀY");
    L.push("Ngày;Doanh thu (Đã giao);Số đơn tạo");
    for (const p of chartData) {
      L.push(`${fullDate(p.key)};${p.revenue};${p.orders}`);
    }
    L.push("");

    L.push("TOP SẢN PHẨM BÁN CHẠY");
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
    a.download = `bao-cao-doanh-thu-${rangeDays}-ngay-${dayKey(new Date())}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pillClass = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
      active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-primary"
    }`;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">Nguyệt Nhãn Phố Hiến</h2>
        <p className="text-muted-foreground">Tổng quan tình hình kinh doanh &amp; tương tác.</p>
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
          <p className="text-3xl font-bold mt-2 text-primary relative z-10">{stats.revenue.toLocaleString("vi-VN")}đ</p>
        </div>

        {/* ĐƠN HÀNG */}
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-muted-foreground">Tổng Đơn Hàng</h3>
            <Package className="w-4 h-4 text-primary" />
          </div>
          <p className="text-3xl font-bold mt-2 text-primary">{stats.ordersCount.toLocaleString("vi-VN")}</p>
        </div>

        {/* KHÁCH HÀNG */}
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-muted-foreground">Khách Hàng</h3>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <p className="text-3xl font-bold mt-2 text-primary">{stats.customersCount.toLocaleString("vi-VN")}</p>
        </div>

        {/* TIN NHẮN */}
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-muted-foreground">Phiên Nhắn Tin</h3>
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold mt-2 text-primary">{stats.messagesCount.toLocaleString("vi-VN")}</p>
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
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\\\"0 0 200 200\\\" xmlns=\\\"http://www.w3.org/2000/svg\\\"%3E%3Cfilter id=\\\"noiseFilter\\\"%3E%3CfeTurbulence type=\\\"fractalNoise\\\" baseFrequency=\\\"0.8\\\" numOctaves=\\\"3\\\" stitchTiles=\\\"stitch\\\"/%3E%3C/filter%3E%3Crect width=\\\"100%25\\\" height=\\\"100%25\\\" filter=\\\"url(%23noiseFilter)\\\"/%3E%3C/svg%3E')"}}></div>

        <div className="p-6 border-b z-10 flex flex-wrap gap-x-4 gap-y-2 justify-between items-center">
          <div>
            <h3 className="font-bold text-lg text-primary">Biểu đồ thống kê</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {rangeDays} ngày qua — Tổng: <span className="font-semibold text-foreground">{chartSummary.revenueLabel}</span> / <span className="font-semibold text-foreground">{chartSummary.ordersLabel}</span> · TB/ngày: <span className="font-semibold text-foreground">{chartSummary.avgRevenueLabel}</span> / <span className="font-semibold text-foreground">{chartSummary.avgOrdersLabel}</span>
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Legend khớp màu với 2 trục của biểu đồ */}
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--chart-1)" }} />
              Doanh thu
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--chart-2)" }} />
              Đơn hàng
            </span>
            <div className="w-px h-5 bg-border mx-1" />
            {RANGES.map((r) => (
              <button key={r} type="button" onClick={() => setRangeDays(r)} className={pillClass(rangeDays === r)}>
                {r} ngày
              </button>
            ))}
            <div className="w-px h-5 bg-border mx-1" />
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={orders.length === 0}
              title="Tải báo cáo doanh thu & top sản phẩm (CSV mở bằng Excel)"
              className="px-3 py-1.5 rounded-full text-xs font-semibold border border-border bg-card text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Xuất CSV
            </button>
          </div>
        </div>

        <div className="flex-1 z-10 p-4 pt-5 min-h-0">
          {orders.length === 0 ? (
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
                      : [`${Number(value)} đơn`, name]
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
                  name="Đơn hàng"
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

      {/* TOP SẢN PHẨM BÁN CHẠY — dùng chung kỳ 7/14/30 ngày với biểu đồ */}
      <div className="rounded-xl border bg-card shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg text-primary">Top sản phẩm bán chạy</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{rangeDays} ngày qua — xếp theo số lượng đã bán</p>
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
  )
}

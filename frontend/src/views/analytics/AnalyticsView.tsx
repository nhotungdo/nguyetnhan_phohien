"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Globe,
  Sparkles,
  Users,
  Compass,
  BarChart3,
  TableProperties,
  Loader2,
  BrainCircuit,
  Percent,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
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
import { dashboardApi } from "@/services/api.service";
import type { DashboardStatsResponse, DayPointDto } from "@/types/api.types";

const RANGES = [7, 14, 30] as const;

export default function AnalyticsView() {
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [rangeDays, setRangeDays] = useState<(typeof RANGES)[number]>(14);

  const { data: stats, isLoading, isFetching } = useQuery<DashboardStatsResponse>({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      return await dashboardApi.getStats();
    },
    refetchInterval: 3000,
    staleTime: 0,
  });

  const chartData = useMemo<DayPointDto[]>(() => {
    const all = stats?.dailyStats ?? [];
    if (all.length === 0) return [];
    return all.slice(-rangeDays);
  }, [stats?.dailyStats, rangeDays]);

  const totalVisits = stats?.totalWebsiteVisits ?? 0;
  const todayVisits = stats?.todayWebsiteVisits ?? 0;
  const uniqueVisitors = stats?.uniqueVisitorsCount ?? 0;
  const totalAi = stats?.totalAiConsultations ?? 0;
  const todayAi = stats?.todayAiConsultations ?? 0;
  const uniqueAiUsers = stats?.uniqueAiUsersCount ?? 0;
  const topVisitedPages = stats?.topVisitedPages ?? [];

  const summary = useMemo(() => {
    const periodVisits = chartData.reduce((s, p) => s + (p.visits ?? 0), 0);
    const periodAi = chartData.reduce((s, p) => s + (p.aiConsultations ?? 0), 0);
    return {
      periodVisitsLabel: `${periodVisits.toLocaleString("vi-VN")} lượt`,
      periodAiLabel: `${periodAi.toLocaleString("vi-VN")} câu hỏi`,
      avgVisits: Math.round(periodVisits / rangeDays),
      avgAi: (periodAi / rangeDays).toFixed(1),
    };
  }, [chartData, rangeDays]);

  const aiEngagementRate = uniqueVisitors > 0 ? ((uniqueAiUsers / uniqueVisitors) * 100).toFixed(1) : "0";

  const pillClass = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
      active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-primary"
    }`;

  if (isLoading && !stats) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-72 bg-muted rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-xl" />
          ))}
        </div>
        <div className="h-96 bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* TIÊU ĐỀ TRANG TÁCH BIỆT */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">Lưu Lượng &amp; AI Dinh Dưỡng</h2>
            <span className="text-[11px] font-bold text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded-full border border-cyan-200">
              100% DB Thực
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Thống kê lượt truy cập website và mức độ tương tác Trợ lý AI dinh dưỡng từ cơ sở dữ liệu PostgreSQL.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isFetching ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full">
              <Loader2 className="w-3 h-3 animate-spin text-cyan-600" />
              Đang đồng bộ...
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Realtime Database
            </span>
          )}
        </div>
      </div>

      {/* 5 THẺ CHỈ SỐ LƯU LƯỢNG & AI */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {/* TỔNG LƯỢT XEM WEB */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 flex flex-col justify-between gap-1.5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Globe className="w-14 h-14 text-cyan-600" />
          </div>
          <div className="flex items-center justify-between relative z-10">
            <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Tổng Lượt Truy Cập</h3>
            <Globe className="w-4 h-4 text-cyan-600 shrink-0" />
          </div>
          <div className="relative z-10">
            <p className="text-2xl sm:text-3xl font-bold text-cyan-700">
              {totalVisits.toLocaleString("vi-VN")}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Hôm nay: <strong className="text-cyan-700 font-semibold">+{todayVisits}</strong>
            </p>
          </div>
        </div>

        {/* KHÁCH GHÉ THĂM DUY NHẤT */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 flex flex-col justify-between gap-1.5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-14 h-14 text-blue-600" />
          </div>
          <div className="flex items-center justify-between relative z-10">
            <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Khách Ghé Thăm</h3>
            <Users className="w-4 h-4 text-blue-600 shrink-0" />
          </div>
          <div className="relative z-10">
            <p className="text-2xl sm:text-3xl font-bold text-blue-700">
              {uniqueVisitors.toLocaleString("vi-VN")}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Người dùng phân biệt</p>
          </div>
        </div>

        {/* TỔNG CÂU HỎI AI DINH DƯỠNG */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 flex flex-col justify-between gap-1.5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles className="w-14 h-14 text-emerald-600" />
          </div>
          <div className="flex items-center justify-between relative z-10">
            <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Lượt Hỏi AI</h3>
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
          <div className="relative z-10">
            <p className="text-2xl sm:text-3xl font-bold text-emerald-700">
              {totalAi.toLocaleString("vi-VN")}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Hôm nay: <strong className="text-emerald-700 font-semibold">+{todayAi}</strong> câu hỏi
            </p>
          </div>
        </div>

        {/* NGƯỜI DÙNG DÙNG AI */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 flex flex-col justify-between gap-1.5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <BrainCircuit className="w-14 h-14 text-purple-600" />
          </div>
          <div className="flex items-center justify-between relative z-10">
            <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Khách Hỏi AI</h3>
            <BrainCircuit className="w-4 h-4 text-purple-600 shrink-0" />
          </div>
          <div className="relative z-10">
            <p className="text-2xl sm:text-3xl font-bold text-purple-700">
              {uniqueAiUsers.toLocaleString("vi-VN")}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Khách đã hỏi tư vấn</p>
          </div>
        </div>

        {/* TỶ LỆ TƯƠNG TÁC AI */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 flex flex-col justify-between gap-1.5 relative overflow-hidden group col-span-2 md:col-span-1">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Percent className="w-14 h-14 text-amber-600" />
          </div>
          <div className="flex items-center justify-between relative z-10">
            <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Tỷ Lệ Tương Tác AI</h3>
            <Percent className="w-4 h-4 text-amber-600 shrink-0" />
          </div>
          <div className="relative z-10">
            <p className="text-2xl sm:text-3xl font-bold text-amber-700">
              {aiEngagementRate}%
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Khách hỏi AI / Khách xem</p>
          </div>
        </div>
      </div>

      {/* BIỂU ĐỒ SÓNG & BẢNG THÔNG MINH */}
      <div className="h-[360px] sm:h-[420px] rounded-xl border bg-card shadow-sm flex flex-col relative overflow-hidden">
        <div className="p-3.5 sm:p-5 border-b z-10 flex flex-col sm:flex-row gap-2.5 sm:gap-4 justify-between sm:items-center">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-primary">Biến động lượt xem &amp; tương tác AI</h3>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
              {rangeDays} ngày qua — Lượt truy cập: <span className="font-semibold text-cyan-700">{summary.periodVisitsLabel}</span> ({summary.avgVisits}/ngày) • Hỏi AI: <span className="font-semibold text-emerald-700">{summary.periodAiLabel}</span> ({summary.avgAi}/ngày)
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Chuyển chế độ xem */}
            <div className="flex items-center bg-muted/70 p-0.5 rounded-lg border border-border text-xs">
              <button
                type="button"
                onClick={() => setViewMode("chart")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  viewMode === "chart" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-cyan-600" />
                <span className="hidden sm:inline">Biểu đồ</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  viewMode === "table" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <TableProperties className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden sm:inline">Bảng chi tiết</span>
              </button>
            </div>

            {viewMode === "chart" && (
              <>
                <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-600" />
                  Truy cập web
                </span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  Hỏi đáp AI
                </span>
              </>
            )}

            <div className="w-px h-4 bg-border mx-1" />
            {RANGES.map((r) => (
              <button key={r} type="button" onClick={() => setRangeDays(r)} className={pillClass(rangeDays === r)}>
                {r}N
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 z-10 p-4 pt-5 min-h-0 overflow-y-auto">
          {totalVisits === 0 && totalAi === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center space-y-3">
              <Globe className="w-12 h-12 text-muted-foreground/30" />
              <p>Chưa có dữ liệu lượt truy cập nào được ghi nhận từ cơ sở dữ liệu.</p>
            </div>
          ) : viewMode === "chart" ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 6, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="analyticsVisitsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0891b2" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0891b2" stopOpacity={0.02} />
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
                <YAxis
                  yAxisId="visits"
                  tick={{ fontSize: 11, fill: "#0891b2" }}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                />
                <YAxis
                  yAxisId="ai"
                  orientation="right"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#059669" }}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.35 }}
                  formatter={(value, name) =>
                    name === "Lượt xem web"
                      ? [`${Number(value).toLocaleString("vi-VN")} lượt truy cập`, name]
                      : [`${Number(value)} câu hỏi AI`, name]
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
                  yAxisId="ai"
                  dataKey="aiConsultations"
                  name="Hỏi đáp AI"
                  fill="#10b981"
                  fillOpacity={0.85}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={36}
                />
                <Area
                  yAxisId="visits"
                  type="monotone"
                  dataKey="visits"
                  name="Lượt xem web"
                  stroke="#0891b2"
                  strokeWidth={2.5}
                  fill="url(#analyticsVisitsGradient)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            /* BẢNG CHI TIẾT THEO NGÀY */
            <div className="overflow-x-auto h-full">
              <table className="w-full text-xs sm:text-sm text-left border-collapse">
                <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/60 sticky top-0 border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold text-center w-12">#</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Ngày</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Lượt truy cập web</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Hỏi đáp AI Dinh Dưỡng</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Tỷ lệ tương tác</th>
                    <th className="py-2.5 px-3 font-semibold">Đánh giá lưu lượng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {chartData.map((d, idx) => {
                    const visits = d.visits ?? 0;
                    const ai = d.aiConsultations ?? 0;
                    const rate = visits > 0 ? ((ai / visits) * 100).toFixed(1) : "0";
                    return (
                      <tr key={d.key} className="hover:bg-muted/40 transition-colors">
                        <td className="py-2 px-3 text-center text-muted-foreground font-mono">{idx + 1}</td>
                        <td className="py-2 px-3 text-center font-medium">{d.label}</td>
                        <td className="py-2 px-3 text-right font-bold text-cyan-700">
                          {visits.toLocaleString("vi-VN")} lượt
                        </td>
                        <td className="py-2 px-3 text-center">
                          {ai > 0 ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                              {ai} câu hỏi
                            </span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right text-muted-foreground font-medium">
                          {ai > 0 ? `${rate}%` : "—"}
                        </td>
                        <td className="py-2 px-3">
                          {visits >= 50 ? (
                            <span className="text-xs text-amber-600 font-bold flex items-center gap-1">
                              🔥 Sôi động
                            </span>
                          ) : visits > 0 ? (
                            <span className="text-xs text-cyan-700 font-medium flex items-center gap-1">
                              🟢 Ổn định
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground/70">
                              ⚪ Chưa có lượt xem
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t-2 border-border font-bold text-xs bg-muted/30 sticky bottom-0">
                  <tr>
                    <td colSpan={2} className="py-2.5 px-3 text-center text-primary">
                      TỔNG ({rangeDays} NGÀY)
                    </td>
                    <td className="py-2.5 px-3 text-right text-cyan-700 text-sm">
                      {summary.periodVisitsLabel}
                    </td>
                    <td className="py-2.5 px-3 text-center text-emerald-800">
                      {summary.periodAiLabel}
                    </td>
                    <td className="py-2.5 px-3 text-right text-muted-foreground">
                      TB {summary.avgVisits} lượt/ngày
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground text-[11px]">
                      Truy vấn thực tế từ PostgreSQL
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* HAI KHỐI PHÂN TÍCH: TOP TRANG ĐƯỢC XEM & ĐÁNH GIÁ TƯƠNG TÁC AI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* TOP TRANG ĐƯỢC XEM NHIỀU NHẤT */}
        <div className="rounded-xl border bg-card shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base sm:text-lg text-primary flex items-center gap-2">
                <span>Trang được xem nhiều nhất</span>
                <span className="text-[10px] bg-cyan-100 text-cyan-800 font-semibold px-2 py-0.5 rounded-full">
                  PostgreSQL
                </span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Xếp theo tổng lượt xem trang từ khách hàng</p>
            </div>
            <Compass className="w-5 h-5 text-cyan-600" />
          </div>

          {topVisitedPages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Chưa có dữ liệu lượt truy cập trong database.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase text-muted-foreground border-b border-border">
                    <th className="py-2 pr-3 text-left font-semibold w-10">#</th>
                    <th className="py-2 pr-3 text-left font-semibold">Trang / Đường dẫn</th>
                    <th className="py-2 px-3 text-center font-semibold w-24">Lượt xem</th>
                    <th className="py-2 pl-3 text-right font-semibold w-24">Số khách</th>
                  </tr>
                </thead>
                <tbody>
                  {topVisitedPages.map((page, idx) => {
                    const maxVisits = topVisitedPages[0]?.visitsCount || 1;
                    const pct = Math.min(100, Math.round((page.visitsCount / maxVisits) * 100));
                    const friendlyName =
                      page.path === "/"
                        ? "Trang chủ"
                        : page.path === "/gioi-thieu"
                        ? "Giới thiệu thương hiệu"
                        : page.path === "/tu-chon-hat"
                        ? "Xưởng chế tác hạt riêng"
                        : page.path === "/san-pham"
                        ? "Danh mục sản phẩm"
                        : page.path.startsWith("/san-pham/")
                        ? "Chi tiết sản phẩm"
                        : page.path;

                    return (
                      <tr key={page.path} className="border-b border-border/60 last:border-0">
                        <td className="py-2.5 pr-3">
                          <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-bold ${
                            idx === 0 ? "bg-cyan-600 text-white" : "bg-muted text-muted-foreground"
                          }`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3">
                          <div className="font-medium text-foreground">{friendlyName}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[140px] sm:max-w-[200px]" title={page.path}>
                              {page.path}
                            </span>
                            <div className="h-1 rounded-full bg-muted w-20 overflow-hidden shrink-0">
                              <div className="h-full rounded-full bg-cyan-600" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold text-cyan-700">
                          {page.visitsCount.toLocaleString("vi-VN")}
                        </td>
                        <td className="py-2.5 pl-3 text-right font-medium text-muted-foreground">
                          {page.uniqueVisitorsCount.toLocaleString("vi-VN")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ĐÁNH GIÁ TƯƠNG TÁC TRỢ LÝ AI DINH DƯỠNG */}
        <div className="rounded-xl border bg-card shadow-sm p-4 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-primary flex items-center gap-2">
                  <span>Hiệu Quả Trợ Lý AI Dinh Dưỡng</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                    AI Insight
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Mức độ quan tâm và chuyển đổi từ tính năng AI</p>
              </div>
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </div>

            <div className="space-y-3.5">
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-xs sm:text-sm text-foreground">
                    Tỷ lệ tương tác AI: <span className="text-emerald-700 font-bold">{aiEngagementRate}%</span>
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Có {uniqueAiUsers.toLocaleString("vi-VN")} trong tổng số {uniqueVisitors.toLocaleString("vi-VN")} khách ghé thăm đã chủ động đặt câu hỏi tư vấn công thức dinh dưỡng.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 flex items-start gap-3">
                <BrainCircuit className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-xs sm:text-sm text-foreground">
                    Tổng lượt tham vấn: <span className="text-purple-700 font-bold">{totalAi.toLocaleString("vi-VN")} câu hỏi</span>
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Khách hàng thường hỏi về lượng calo, thành phần dinh dưỡng hạt sen, long nhãn và cách mix hạt cho sức khỏe.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-xs sm:text-sm text-foreground">Bảo vệ quyền riêng tư &amp; Không Mock Data</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Địa chỉ IP được mã hóa hash một chiều SHA-256 bảo mật. Mọi số liệu hiển thị được tính toán trực tiếp từ các bản ghi thực tế trong PostgreSQL.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Dữ liệu được cập nhật tự động khi có khách truy cập hoặc hỏi AI</span>
            <span className="font-mono text-[11px] text-primary font-semibold">PostgreSQL v16</span>
          </div>
        </div>
      </div>
    </div>
  );
}

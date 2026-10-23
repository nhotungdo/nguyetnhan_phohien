"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { orderApi } from "@/services/api.service";
import type { OrderResponse } from "@/types/api.types";
import { Search, Package, MapPin, Phone, Loader2, Clock, Truck, XCircle, BadgeCheck, PackageCheck, Mail, MailCheck, AlertTriangle, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Phải khớp với enum OrderStatus phía backend:
// PendingConfirmation, Confirmed, Shipping, Completed, Cancelled
const STATUS_COLORS: Record<string, string> = {
  PendingConfirmation: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  Shipping: "bg-indigo-100 text-indigo-800 border-indigo-200",
  Completed: "bg-green-100 text-green-800 border-green-200",
  Cancelled: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  PendingConfirmation: <Clock className="w-4 h-4" />,
  Confirmed: <BadgeCheck className="w-4 h-4" />,
  Shipping: <Truck className="w-4 h-4" />,
  Completed: <PackageCheck className="w-4 h-4" />,
  Cancelled: <XCircle className="w-4 h-4" />,
};

const STATUS_LABELS: Record<string, string> = {
  PendingConfirmation: "Chờ xác nhận",
  Confirmed: "Đã xác nhận",
  Shipping: "Đang giao",
  Completed: "Hoàn thành",
  Cancelled: "Đã huỷ",
};

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

// Bộ đếm id toast ở phạm vi module: mỗi toast cần id duy nhất nhưng KHÔNG được gọi
// Date.now()/Math.random() trong thân component (vi phạm react-hooks/purity — hàm
// không tinh khiết làm kết quả render không ổn định).
const ORDERS_CACHE_KEY = "orders_admin_cache_v1";

function readCachedOrders(): OrderResponse[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ORDERS_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCachedOrders(data: OrderResponse[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ORDERS_CACHE_KEY, JSON.stringify(data));
  } catch {}
}

let toastSeq = 0;

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", "admin"],
    queryFn: async () => {
      const data = await orderApi.getAll();
      const sorted = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      writeCachedOrders(sorted);
      return sorted;
    },
    initialData: () => readCachedOrders() ?? undefined,
    initialDataUpdatedAt: 0,
    staleTime: 60 * 1000,
  });

  const addToast = (type: "success" | "error", message: string) => {
    const id = ++toastSeq;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      // Dùng LUÔN bản server trả về làm dữ liệu cache: một lần gọi API vừa ghi vừa
      // trả về trạng thái thật. Trước đây code setQueryData bằng giá trị client tự
      // đoán rồi `invalidateQueries` NGAY LẬP TỨC → React Query vừa nhận bản optimistic
      // lại vừa gọi API lần thứ hai để ghi đè chính nó (thừa 1 request, giá trị
      // optimistic trở nên vô nghĩa).
      const updated = await orderApi.updateStatus(id, newStatus);
      queryClient.setQueryData(["orders", "admin"], (old: OrderResponse[] | undefined) =>
        old ? old.map(order => (order.id === id ? updated : order)) : []
      );
    } catch (err) {
      console.error("Update failed", err);
      addToast("error", "Cập nhật trạng thái thất bại!");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleResendInvoice = async (order: OrderResponse) => {
    if (!order.customerEmail) {
      addToast("error", "Đơn hàng này không có email khách hàng.");
      return;
    }
    setSendingInvoiceId(order.id);
    try {
      await orderApi.resendInvoice(order.id);
      addToast("success", `Đã gửi hóa đơn tới ${order.customerEmail}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gửi hóa đơn thất bại!";
      addToast("error", message);
    } finally {
      setSendingInvoiceId(null);
    }
  };

  const filteredOrders = orders.filter((o) =>
    o.customerPhone.includes(searchTerm) ||
    o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.customerEmail?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              transition={{ duration: 0.25 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium pointer-events-auto max-w-sm border ${
                toast.type === "success"
                  ? "bg-green-50 text-green-800 border-green-200"
                  : "bg-red-50 text-red-800 border-red-200"
              }`}
            >
              {toast.type === "success" ? (
                <MailCheck className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Quản lý Đơn hàng</h2>
          <p className="text-muted-foreground">Tất cả thông tin khách hàng và trạng thái giao hàng.</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm theo Tên, SĐT hoặc Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
          />
        </div>
      </div>

      {/* DESKTOP TABLE VIEW (≥ 768px) */}
      <div className="hidden md:block bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase font-semibold text-xs">
              <tr>
                <th className="px-6 py-4">Khách hàng</th>
                <th className="px-6 py-4">Đơn hàng</th>
                <th className="px-6 py-4">Tổng tiền</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    Không tìm thấy đơn hàng nào.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, i) => (
                  <motion.tr
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    key={order.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    {/* KHÁCH HÀNG */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground mb-1">{order.customerName}</div>
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                        <Phone className="w-3 h-3 text-primary" />
                        <a href={`tel:${order.customerPhone}`} className="hover:underline font-medium text-foreground/80">
                          {order.customerPhone}
                        </a>
                      </div>
                      {order.customerEmail ? (
                        <div className="flex items-center gap-1.5 text-blue-600 text-xs mb-1">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-[180px]" title={order.customerEmail}>
                            {order.customerEmail}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-muted-foreground/50 text-xs mb-1 italic">
                          <Mail className="w-3 h-3" /> Không có email
                        </div>
                      )}
                      <div className="flex items-start gap-1.5 text-muted-foreground text-xs max-w-[200px]">
                        <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                        <span className="truncate" title={order.customerAddress}>{order.customerAddress}</span>
                      </div>
                    </td>

                    {/* ĐƠN HÀNG */}
                    <td className="px-6 py-4">
                      {order.items && order.items.length > 0 ? (
                        <div className="space-y-1 mb-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-xs font-medium">
                              <Package className="w-3.5 h-3.5 text-accent shrink-0" />
                              <span>
                                {item.productName}
                                {item.productSize ? ` (${item.productSize})` : ""} x{item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mb-1">
                          <Package className="w-4 h-4 text-accent" />
                          <span className="font-medium text-xs">
                            {order.productName}
                            {order.productSize ? ` (${order.productSize})` : ""} x{order.quantity}
                          </span>
                        </div>
                      )}
                      {order.discountCodeApplied && (
                        <div className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded border border-green-200 inline-block mt-1">
                          Mã: {order.discountCodeApplied}
                        </div>
                      )}
                      {order.note && (
                        <p className="text-xs text-muted-foreground mt-1 italic truncate max-w-[220px]" title={order.note}>
                          &quot;{order.note}&quot;
                        </p>
                      )}
                    </td>

                    {/* TỔNG TIỀN */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-accent text-base">
                        {order.totalAmount.toLocaleString()}đ
                      </div>
                      {order.discountAmount > 0 && (
                        <div className="text-xs text-green-600 line-through opacity-70">
                          - {order.discountAmount.toLocaleString()}đ
                        </div>
                      )}
                    </td>

                    {/* TRẠNG THÁI */}
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-800"}`}>
                        {STATUS_ICONS[order.status]}
                        {STATUS_LABELS[order.status] || order.status}
                      </div>
                    </td>

                    {/* THAO TÁC */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end gap-2">
                        {/* Cập nhật trạng thái */}
                        {updatingId === order.id ? (
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        ) : (
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                            className="bg-background border border-border text-xs rounded-md px-2 py-1.5 outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
                          >
                            <option value="PendingConfirmation">Chờ xác nhận</option>
                            <option value="Confirmed">Đã xác nhận</option>
                            <option value="Shipping">Đang giao</option>
                            <option value="Completed">Hoàn thành</option>
                            <option value="Cancelled">Hủy đơn</option>
                          </select>
                        )}

                        {/* Nút gửi hóa đơn qua email */}
                        <button
                          onClick={() => handleResendInvoice(order)}
                          disabled={sendingInvoiceId === order.id || !order.customerEmail}
                          title={
                            order.customerEmail
                              ? `Gửi hóa đơn tới ${order.customerEmail}`
                              : "Khách hàng chưa cung cấp email"
                          }
                          className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${
                            order.customerEmail
                              ? "border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 active:scale-95"
                              : "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed opacity-60"
                          }`}
                        >
                          {sendingInvoiceId === order.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          {sendingInvoiceId === order.id ? "Đang gửi..." : "Gửi hóa đơn"}
                        </button>

                        <div className="text-[10px] text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE CARD VIEW (< 768px) */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
            Đang tải dữ liệu đơn hàng...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground text-sm">
            Không tìm thấy đơn hàng nào phù hợp.
          </div>
        ) : (
          filteredOrders.map((order, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              key={order.id}
              className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm flex flex-col gap-3 relative"
            >
              {/* Header card: Tên khách & Trạng thái */}
              <div className="flex items-start justify-between gap-2 border-b border-border/50 pb-2.5">
                <div className="min-w-0">
                  <h3 className="font-bold text-foreground text-base truncate">{order.customerName}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
                    >
                      <Phone className="w-3 h-3 shrink-0" />
                      {order.customerPhone}
                    </a>
                    <span>•</span>
                    <span className="text-[11px]">
                      {new Date(order.createdAt).toLocaleDateString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-800"}`}>
                  {STATUS_ICONS[order.status]}
                  <span>{STATUS_LABELS[order.status] || order.status}</span>
                </div>
              </div>

              {/* Thông tin địa chỉ & email */}
              <div className="space-y-1.5 text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-xl border border-border/30">
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground/90 font-medium leading-relaxed">{order.customerAddress}</span>
                </div>
                {order.customerEmail ? (
                  <div className="flex items-center gap-1.5 text-blue-600">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{order.customerEmail}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-muted-foreground/50 italic">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span>Không có email</span>
                  </div>
                )}
              </div>

              {/* Danh sách sản phẩm */}
              <div className="space-y-1 py-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Sản phẩm đặt mua
                </span>
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 text-xs py-1 border-b border-border/30 last:border-none">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Package className="w-3.5 h-3.5 text-accent shrink-0" />
                        <span className="font-medium text-foreground truncate">
                          {item.productName} {item.productSize ? `(${item.productSize})` : ""}
                        </span>
                      </div>
                      <span className="font-bold text-foreground shrink-0 bg-muted px-2 py-0.5 rounded-md">
                        x{item.quantity}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-between gap-2 text-xs py-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Package className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span className="font-medium text-foreground truncate">
                        {order.productName} {order.productSize ? `(${order.productSize})` : ""}
                      </span>
                    </div>
                    <span className="font-bold text-foreground shrink-0 bg-muted px-2 py-0.5 rounded-md">
                      x{order.quantity}
                    </span>
                  </div>
                )}

                {order.discountCodeApplied && (
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                    <span className="font-semibold">Mã giảm giá:</span>
                    <span className="font-mono font-bold">{order.discountCodeApplied}</span>
                    {order.discountAmount > 0 && (
                      <span className="text-[11px] ml-auto font-medium">(-{order.discountAmount.toLocaleString()}đ)</span>
                    )}
                  </div>
                )}

                {order.note && (
                  <p className="text-xs text-muted-foreground/90 italic bg-amber-500/5 p-2 rounded-lg border border-amber-500/10 mt-1.5">
                    &quot;{order.note}&quot;
                  </p>
                )}
              </div>

              {/* Tổng tiền & Thao tác */}
              <div className="pt-2 border-t border-border/50 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-semibold">Tổng thanh toán:</span>
                  <div className="text-right">
                    <span className="font-bold text-primary text-lg">
                      {order.totalAmount.toLocaleString()}đ
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Select đổi trạng thái */}
                  <div className="relative">
                    {updatingId === order.id ? (
                      <div className="w-full py-2.5 px-3 rounded-xl border border-border bg-muted/40 flex items-center justify-center text-xs text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin text-primary mr-1.5" />
                        Đang lưu...
                      </div>
                    ) : (
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                        className="w-full bg-background border border-border text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-sm"
                      >
                        <option value="PendingConfirmation">Chờ xác nhận</option>
                        <option value="Confirmed">Đã xác nhận</option>
                        <option value="Shipping">Đang giao</option>
                        <option value="Completed">Hoàn thành</option>
                        <option value="Cancelled">Hủy đơn</option>
                      </select>
                    )}
                  </div>

                  {/* Nút gửi lại hóa đơn */}
                  <button
                    onClick={() => handleResendInvoice(order)}
                    disabled={sendingInvoiceId === order.id || !order.customerEmail}
                    className={`w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 px-3 rounded-xl border transition-all ${
                      order.customerEmail
                        ? "border-blue-200 text-blue-700 bg-blue-50 active:scale-95"
                        : "border-gray-200 text-gray-400 bg-gray-50 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    {sendingInvoiceId === order.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>{sendingInvoiceId === order.id ? "Đang gửi..." : "Gửi hóa đơn"}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

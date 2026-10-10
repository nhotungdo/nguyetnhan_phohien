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
      return data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
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

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase font-semibold">
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
                    transition={{ delay: i * 0.05 }}
                    key={order.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    {/* KHÁCH HÀNG */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground mb-1">{order.customerName}</div>
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                        <Phone className="w-3 h-3" /> {order.customerPhone}
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
                      <div className="font-bold text-accent">
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
                            className="bg-background border border-border text-xs rounded-md px-2 py-1.5 outline-none focus:ring-1 focus:ring-primary focus:border-primary"
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
    </div>
  );
}

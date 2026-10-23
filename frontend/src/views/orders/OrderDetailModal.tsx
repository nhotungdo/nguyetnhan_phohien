"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Package,
  Clock,
  Truck,
  BadgeCheck,
  PackageCheck,
  XCircle,
  Send,
  Printer,
  Copy,
  Check,
  CreditCard,
  QrCode,
  Tag,
  FileText,
  User,
  Share2,
  Loader2,
  ExternalLink,
} from "lucide-react";
import type { OrderResponse } from "@/types/api.types";
import { paymentSettingsApi } from "@/services/api.service";
import { buildVietQrUrl } from "@/lib/vietqr";

interface OrderDetailModalProps {
  order: OrderResponse;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: string) => Promise<void>;
  onResendInvoice: (order: OrderResponse) => Promise<void>;
  isUpdatingStatus: boolean;
  isSendingInvoice: boolean;
  addToast: (type: "success" | "error", message: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  PendingConfirmation: "bg-amber-100 text-amber-900 border-amber-300",
  Confirmed: "bg-blue-100 text-blue-900 border-blue-300",
  Shipping: "bg-indigo-100 text-indigo-900 border-indigo-300",
  Completed: "bg-emerald-100 text-emerald-900 border-emerald-300",
  Cancelled: "bg-rose-100 text-rose-900 border-rose-300",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  PendingConfirmation: <Clock className="w-4 h-4 text-amber-600" />,
  Confirmed: <BadgeCheck className="w-4 h-4 text-blue-600" />,
  Shipping: <Truck className="w-4 h-4 text-indigo-600" />,
  Completed: <PackageCheck className="w-4 h-4 text-emerald-600" />,
  Cancelled: <XCircle className="w-4 h-4 text-rose-600" />,
};

const STATUS_LABELS: Record<string, string> = {
  PendingConfirmation: "Chờ xác nhận",
  Confirmed: "Đã xác nhận",
  Shipping: "Đang giao hàng",
  Completed: "Hoàn thành",
  Cancelled: "Đã huỷ",
};

export default function OrderDetailModal({
  order,
  onClose,
  onUpdateStatus,
  onResendInvoice,
  isUpdatingStatus,
  isSendingInvoice,
  addToast,
}: OrderDetailModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Fetch payment settings để tạo mã VietQR chuẩn xác
  const { data: paymentSettings } = useQuery({
    queryKey: ["payment", "settings"],
    queryFn: async () => {
      try {
        return await paymentSettingsApi.get();
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const isBankConfigured = Boolean(
    paymentSettings?.bankId &&
    paymentSettings?.accountNumber &&
    paymentSettings?.accountName
  );

  const transferNote = `Thanh toan don ${order.id.slice(0, 8)}`;
  const qrUrl = isBankConfigured && paymentSettings
    ? buildVietQrUrl(paymentSettings, {
        amount: order.totalAmount,
        transferNote,
      })
    : null;

  // Xử lý phím Escape để đóng modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const copyToClipboard = useCallback((text: string, key: string, successMessage: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    addToast("success", successMessage);
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 2000);
  }, [addToast]);

  // Sao chép tóm tắt đơn hàng để nhắn tin qua Zalo / Facebook / SMS
  const handleCopySummary = () => {
    const itemsText = order.items && order.items.length > 0
      ? order.items
          .map(
            (item, idx) =>
              `  ${idx + 1}. ${item.productName}${item.productSize ? ` (${item.productSize})` : ""} - SL: ${item.quantity} x ${item.unitPrice.toLocaleString("vi-VN")}đ = ${item.totalPrice.toLocaleString("vi-VN")}đ`
          )
          .join("\n")
      : `  1. ${order.productName || "Sản phẩm"}${order.productSize ? ` (${order.productSize})` : ""} - SL: ${order.quantity || 1} = ${order.totalAmount.toLocaleString("vi-VN")}đ`;

    const summary = `📦 ĐƠN HÀNG: #${order.id.slice(0, 8).toUpperCase()}
👤 Khách hàng: ${order.customerName}
📞 Số điện thoại: ${order.customerPhone}
📍 Địa chỉ nhận hàng: ${order.customerAddress}
${order.customerEmail ? `✉️ Email: ${order.customerEmail}\n` : ""}${order.note ? `📝 Ghi chú: ${order.note}\n` : ""}
🛍️ DANH SÁCH SẢN PHẨM:
${itemsText}

💰 Tiền hàng: ${order.baseAmount.toLocaleString("vi-VN")}đ
${order.discountAmount > 0 ? `🎁 Giảm giá (${order.discountCodeApplied || "Khuyến mãi"}): -${order.discountAmount.toLocaleString("vi-VN")}đ\n` : ""}🚚 Phí vận chuyển: Thỏa thuận khi giao hàng
👉 TỔNG THANH TOÁN: ${order.totalAmount.toLocaleString("vi-VN")}đ
⚡ Trạng thái: ${STATUS_LABELS[order.status] || order.status}
⏰ Ngày đặt: ${new Date(order.createdAt).toLocaleString("vi-VN")}`;

    copyToClipboard(summary, "full_summary", "Đã sao chép tóm tắt đơn hàng!");
  };

  const handlePrint = () => {
    window.print();
  };

  const shortCode = order.id.slice(0, 8).toUpperCase();
  const formattedDate = new Date(order.createdAt).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border text-foreground rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto"
      >
        {/* MODAL HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-6 border-b border-border bg-muted/20 shrink-0">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-bold font-mono tracking-wider bg-primary/10 text-primary px-2.5 py-1 rounded-md border border-primary/20">
                #{shortCode}
              </span>
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                  STATUS_COLORS[order.status] || "bg-muted text-foreground border-border"
                }`}
              >
                {STATUS_ICONS[order.status]}
                <span>{STATUS_LABELS[order.status] || order.status}</span>
              </div>
              <button
                onClick={() => copyToClipboard(order.id, "uuid", "Đã sao chép mã đơn đầy đủ!")}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
                title="Sao chép ID đầy đủ"
              >
                {copiedKey === "uuid" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span className="font-mono truncate max-w-[100px] sm:max-w-none">{order.id}</span>
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>Thời gian đặt hàng: {formattedDate}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted text-foreground transition-all active:scale-95"
              title="In hóa đơn đơn hàng"
            >
              <Printer className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">In hóa đơn</span>
            </button>
            <button
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted text-foreground transition-all active:scale-95"
              title="Sao chép tóm tắt để gửi Zalo / SMS"
            >
              {copiedKey === "full_summary" ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Share2 className="w-3.5 h-3.5 text-primary" />
              )}
              <span className="hidden sm:inline">Sao chép tóm tắt</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Đóng chi tiết"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL QUICK ACTION BAR */}
        <div className="px-4 sm:px-6 py-3 border-b border-border/60 bg-muted/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-muted-foreground">Cập nhật trạng thái:</span>
            {isUpdatingStatus ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-primary font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang lưu...</span>
              </div>
            ) : (
              <select
                value={order.status}
                onChange={(e) => onUpdateStatus(order.id, e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-1.5 font-medium outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-sm text-foreground"
              >
                <option value="PendingConfirmation">Chờ xác nhận</option>
                <option value="Confirmed">Đã xác nhận</option>
                <option value="Shipping">Đang giao hàng</option>
                <option value="Completed">Hoàn thành</option>
                <option value="Cancelled">Đã huỷ đơn</option>
              </select>
            )}
          </div>

          <button
            onClick={() => onResendInvoice(order)}
            disabled={isSendingInvoice || !order.customerEmail}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition-all ${
              order.customerEmail
                ? "border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 active:scale-95"
                : "border-border text-muted-foreground/60 bg-muted/40 cursor-not-allowed opacity-60"
            }`}
          >
            {isSendingInvoice ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>
              {isSendingInvoice
                ? "Đang gửi..."
                : order.customerEmail
                ? `Gửi lại hóa đơn (${order.customerEmail})`
                : "Không có email khách hàng"}
            </span>
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* GRID 2 CỘT: KHÁCH HÀNG & THANH TOÁN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* THÔNG TIN KHÁCH HÀNG */}
            <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <User className="w-4 h-4" />
                  <span>Thông tin khách hàng</span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs sm:text-sm">
                <div>
                  <div className="text-[11px] text-muted-foreground uppercase font-semibold">
                    Họ và tên người nhận
                  </div>
                  <div className="text-base font-bold text-foreground mt-0.5">
                    {order.customerName}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-muted-foreground uppercase font-semibold">
                    Số điện thoại
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="text-primary font-bold hover:underline"
                    >
                      {order.customerPhone}
                    </a>
                    <button
                      onClick={() =>
                        copyToClipboard(order.customerPhone, "phone", "Đã sao chép số điện thoại!")
                      }
                      className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted"
                      title="Sao chép SĐT"
                    >
                      {copiedKey === "phone" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-muted-foreground uppercase font-semibold">
                    Email nhận hóa đơn
                  </div>
                  {order.customerEmail ? (
                    <div className="flex items-center gap-2 mt-0.5">
                      <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <a
                        href={`mailto:${order.customerEmail}`}
                        className="text-blue-600 font-medium hover:underline truncate"
                      >
                        {order.customerEmail}
                      </a>
                      <button
                        onClick={() =>
                          copyToClipboard(order.customerEmail!, "email", "Đã sao chép email!")
                        }
                        className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted"
                        title="Sao chép Email"
                      >
                        {copiedKey === "email" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-muted-foreground/60 italic text-xs mt-0.5">
                      <Mail className="w-3.5 h-3.5" />
                      <span>Khách hàng không để lại email</span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-[11px] text-muted-foreground uppercase font-semibold">
                    Địa chỉ giao hàng
                  </div>
                  <div className="flex items-start gap-2 mt-0.5">
                    <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="font-medium text-foreground leading-relaxed flex-1">
                      {order.customerAddress}
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(order.customerAddress, "address", "Đã sao chép địa chỉ!")
                      }
                      className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted shrink-0"
                      title="Sao chép địa chỉ"
                    >
                      {copiedKey === "address" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {order.note && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mt-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 uppercase tracking-wide">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Ghi chú của khách</span>
                    </div>
                    <p className="text-xs text-foreground/90 italic mt-1 leading-relaxed">
                      &quot;{order.note}&quot;
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* THÔNG TIN THANH TOÁN & VIETQR */}
            <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <CreditCard className="w-4 h-4" />
                    <span>Thanh toán & Chuyển khoản</span>
                  </div>
                </div>

                {isBankConfigured && paymentSettings ? (
                  <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-4 items-center mt-3">
                    {/* Ảnh QR VietQR */}
                    <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-border shadow-xs">
                      {qrUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={qrUrl}
                          alt="Mã VietQR thanh toán"
                          className="w-32 h-32 object-contain rounded"
                        />
                      ) : (
                        <QrCode className="w-24 h-24 text-muted-foreground" />
                      )}
                      <span className="text-[10px] text-muted-foreground font-semibold mt-1">
                        VietQR tự động
                      </span>
                    </div>

                    {/* Chi tiết tài khoản */}
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[11px] text-muted-foreground uppercase font-semibold block">
                          Ngân hàng
                        </span>
                        <span className="font-bold text-foreground">{paymentSettings.bankId}</span>
                      </div>

                      <div>
                        <span className="text-[11px] text-muted-foreground uppercase font-semibold block">
                          Số tài khoản
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-primary text-sm">
                            {paymentSettings.accountNumber}
                          </span>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                paymentSettings.accountNumber,
                                "bank_account",
                                "Đã sao chép số tài khoản!"
                              )
                            }
                            className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted"
                            title="Sao chép STK"
                          >
                            {copiedKey === "bank_account" ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] text-muted-foreground uppercase font-semibold block">
                          Chủ tài khoản
                        </span>
                        <span className="font-semibold text-foreground uppercase">
                          {paymentSettings.accountName}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-muted-foreground uppercase font-semibold block">
                          Nội dung chuyển khoản
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-accent bg-muted/60 px-2 py-0.5 rounded text-xs border border-border">
                            {transferNote}
                          </span>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                transferNote,
                                "transfer_note",
                                "Đã sao chép nội dung chuyển khoản!"
                              )
                            }
                            className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted"
                            title="Sao chép nội dung CK"
                          >
                            {copiedKey === "transfer_note" ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-muted/20 border border-dashed border-border rounded-xl text-center space-y-2 mt-3">
                    <QrCode className="w-8 h-8 text-muted-foreground mx-auto" />
                    <p className="text-xs text-muted-foreground">
                      Chưa cấu hình tài khoản ngân hàng nhận thanh toán.
                    </p>
                    <a
                      href="/payment"
                      className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                    >
                      <span>Cấu hình tại /payment</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Tóm tắt tổng tiền */}
              <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  Số tiền cần thanh toán:
                </span>
                <span className="text-xl font-bold text-primary">
                  {order.totalAmount.toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>
          </div>

          {/* DANH SÁCH SẢN PHẨM */}
          <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border/60 bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-primary">
                <Package className="w-4 h-4 text-accent" />
                <span>Danh sách sản phẩm đặt mua</span>
              </div>
              <span className="text-xs text-muted-foreground">
                Tổng số dòng: {order.items?.length || 1}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left">
                <thead className="bg-muted/40 text-muted-foreground font-semibold text-[11px] uppercase border-b border-border/60">
                  <tr>
                    <th className="px-4 py-3">Sản phẩm</th>
                    <th className="px-4 py-3 text-right">Đơn giá</th>
                    <th className="px-4 py-3 text-center">Số lượng</th>
                    <th className="px-4 py-3 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-foreground">{item.productName}</div>
                          {item.productSize && (
                            <span className="inline-block mt-0.5 text-[11px] font-medium bg-secondary text-primary px-2 py-0.5 rounded-md border border-primary/20">
                              Quy cách: {item.productSize}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right font-medium text-muted-foreground">
                          {item.unitPrice.toLocaleString("vi-VN")}đ
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-foreground">
                          x{item.quantity}
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-foreground">
                          {item.totalPrice.toLocaleString("vi-VN")}đ
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-foreground">
                          {order.productName || "Sản phẩm"}
                        </div>
                        {order.productSize && (
                          <span className="inline-block mt-0.5 text-[11px] font-medium bg-secondary text-primary px-2 py-0.5 rounded-md border border-primary/20">
                            Quy cách: {order.productSize}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-muted-foreground">
                        {order.baseAmount.toLocaleString("vi-VN")}đ
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-foreground">
                        x{order.quantity || 1}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-foreground">
                        {order.baseAmount.toLocaleString("vi-VN")}đ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* BẢNG TỔNG KẾT TÀI CHÍNH */}
            <div className="p-4 sm:p-5 bg-muted/10 border-t border-border/60">
              <div className="max-w-xs ml-auto space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Tiền hàng (Tạm tính):</span>
                  <span className="font-semibold text-foreground">
                    {order.baseAmount.toLocaleString("vi-VN")}đ
                  </span>
                </div>

                {order.discountAmount > 0 && (
                  <div className="flex justify-between items-center text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                    <span className="flex items-center gap-1 font-medium">
                      <Tag className="w-3.5 h-3.5" />
                      Giảm giá ({order.discountCodeApplied || "Mã ưu đãi"}):
                    </span>
                    <span className="font-bold">
                      -{order.discountAmount.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-muted-foreground">
                  <span>Phí vận chuyển:</span>
                  <span className="font-medium text-foreground">Thỏa thuận khi giao</span>
                </div>

                <div className="border-t border-border/80 pt-2.5 flex justify-between items-baseline">
                  <span className="font-bold text-sm sm:text-base text-foreground">
                    TỔNG THANH TOÁN:
                  </span>
                  <span className="font-extrabold text-lg sm:text-2xl text-primary">
                    {order.totalAmount.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 border-t border-border bg-muted/20 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-muted-foreground">
            Mã định danh đơn hàng: <span className="font-mono font-medium">{order.id}</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-95 transition-all shadow-sm ml-auto"
          >
            Đóng
          </button>
        </div>
      </motion.div>

      {/* SECTION IN HÓA ĐƠN ĐƠN HÀNG (CHỈ HIỂN THỊ KHI BẤM PRINT) */}
      <div id="order-printable-receipt" className="hidden">
        <div style={{ maxWidth: "700px", margin: "0 auto", fontFamily: "sans-serif", color: "#111" }}>
          {/* Header */}
          <div style={{ textAlign: "center", borderBottom: "2px solid #333", paddingBottom: "15px", marginBottom: "20px" }}>
            <h1 style={{ margin: "0", fontSize: "24px", fontWeight: "bold", textTransform: "uppercase" }}>
              Nguyệt Nhãn Phố Hiến
            </h1>
            <p style={{ margin: "4px 0", fontSize: "14px", color: "#555" }}>
              Đặc sản Long Nhãn Hưng Yên truyền thống
            </p>
            <p style={{ margin: "2px 0", fontSize: "12px", color: "#666" }}>
              Phường Hồng Châu, TP. Hưng Yên &bull; Hotline: 034 897 3285 &bull; nguyetnhanphohien@gmail.com
            </p>
            <h2 style={{ margin: "16px 0 0 0", fontSize: "18px", fontWeight: "bold", letterSpacing: "1px" }}>
              HÓA ĐƠN BÁN HÀNG
            </h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>
              Mã đơn: #{shortCode} &bull; Ngày: {formattedDate}
            </p>
          </div>

          {/* Customer info */}
          <div style={{ marginBottom: "20px", fontSize: "13px", lineHeight: "1.6" }}>
            <div><strong>Khách hàng:</strong> {order.customerName}</div>
            <div><strong>Số điện thoại:</strong> {order.customerPhone}</div>
            <div><strong>Địa chỉ:</strong> {order.customerAddress}</div>
            {order.customerEmail && <div><strong>Email:</strong> {order.customerEmail}</div>}
            {order.note && <div><strong>Ghi chú:</strong> {order.note}</div>}
            <div><strong>Trạng thái:</strong> {STATUS_LABELS[order.status] || order.status}</div>
          </div>

          {/* Items table */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1.5px solid #333", textAlign: "left" }}>
                <th style={{ padding: "8px 4px", width: "5%" }}>#</th>
                <th style={{ padding: "8px 4px", width: "50%" }}>Sản phẩm</th>
                <th style={{ padding: "8px 4px", textAlign: "right", width: "15%" }}>Đơn giá</th>
                <th style={{ padding: "8px 4px", textAlign: "center", width: "10%" }}>SL</th>
                <th style={{ padding: "8px 4px", textAlign: "right", width: "20%" }}>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {order.items && order.items.length > 0 ? (
                order.items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #ddd" }}>
                    <td style={{ padding: "8px 4px" }}>{idx + 1}</td>
                    <td style={{ padding: "8px 4px" }}>
                      {item.productName}
                      {item.productSize ? ` (${item.productSize})` : ""}
                    </td>
                    <td style={{ padding: "8px 4px", textAlign: "right" }}>
                      {item.unitPrice.toLocaleString("vi-VN")}đ
                    </td>
                    <td style={{ padding: "8px 4px", textAlign: "center" }}>{item.quantity}</td>
                    <td style={{ padding: "8px 4px", textAlign: "right" }}>
                      {item.totalPrice.toLocaleString("vi-VN")}đ
                    </td>
                  </tr>
                ))
              ) : (
                <tr style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "8px 4px" }}>1</td>
                  <td style={{ padding: "8px 4px" }}>
                    {order.productName || "Sản phẩm"}
                    {order.productSize ? ` (${order.productSize})` : ""}
                  </td>
                  <td style={{ padding: "8px 4px", textAlign: "right" }}>
                    {order.baseAmount.toLocaleString("vi-VN")}đ
                  </td>
                  <td style={{ padding: "8px 4px", textAlign: "center" }}>{order.quantity || 1}</td>
                  <td style={{ padding: "8px 4px", textAlign: "right" }}>
                    {order.baseAmount.toLocaleString("vi-VN")}đ
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ marginLeft: "auto", width: "260px", fontSize: "13px", lineHeight: "1.8", marginBottom: "25px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Tạm tính:</span>
              <strong>{order.baseAmount.toLocaleString("vi-VN")}đ</strong>
            </div>
            {order.discountAmount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", color: "#15803d" }}>
                <span>Giảm giá ({order.discountCodeApplied}):</span>
                <strong>-{order.discountAmount.toLocaleString("vi-VN")}đ</strong>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Phí vận chuyển:</span>
              <span>Thỏa thuận</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid #333", paddingTop: "6px", fontSize: "15px", fontWeight: "bold" }}>
              <span>TỔNG CỘNG:</span>
              <span>{order.totalAmount.toLocaleString("vi-VN")}đ</span>
            </div>
          </div>

          {/* Bank transfer info if configured */}
          {isBankConfigured && paymentSettings && (
            <div style={{ border: "1px dashed #666", padding: "12px", borderRadius: "8px", fontSize: "12px", marginBottom: "20px" }}>
              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>THÔNG TIN CHUYỂN KHOẢN:</div>
              <div>Ngân hàng: {paymentSettings.bankId} &bull; Số TK: <strong>{paymentSettings.accountNumber}</strong></div>
              <div>Chủ tài khoản: <strong>{paymentSettings.accountName}</strong></div>
              <div>Nội dung CK: <strong>{transferNote}</strong></div>
            </div>
          )}

          {/* Footer */}
          <div style={{ textAlign: "center", borderTop: "1px solid #ddd", paddingTop: "15px", fontSize: "12px", color: "#666" }}>
            <p style={{ margin: "0 0 4px 0", fontStyle: "italic" }}>
              Cảm ơn quý khách đã tin tưởng và thưởng thức đặc sản Nguyệt Nhãn Phố Hiến!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

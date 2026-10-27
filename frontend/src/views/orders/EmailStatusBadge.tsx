import React from "react";
import type { OrderResponse } from "@/types/api.types";
import { Mail } from "lucide-react";

interface EmailStatusBadgeProps {
  order: OrderResponse;
  className?: string;
}

export default function EmailStatusBadge({ order, className = "" }: EmailStatusBadgeProps) {
  if (!order.customerEmail) {
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] text-muted-foreground/50 italic ${className}`}>
        <Mail className="w-3 h-3 shrink-0" /> Không có email
      </span>
    );
  }

  if (order.invoiceEmailSentAt) {
    const d = new Date(order.invoiceEmailSentAt);
    const hours = d.getHours().toString().padStart(2, "0");
    const mins = d.getMinutes().toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const timeStr = `${hours}:${mins} ${day}/${month}`;

    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70 ${className}`}
        title={`Đã gửi email hóa đơn lúc ${d.toLocaleString("vi-VN")}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        <span>Đã gửi {timeStr}</span>
      </span>
    );
  }

  if (order.invoiceEmailError) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200/70 cursor-help ${className}`}
        title={`Lỗi gửi email: ${order.invoiceEmailError}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
        <span>Gửi thất bại</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/70 ${className}`}
      title="Email đang trong hàng đợi gửi tự động"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
      <span>Đang gửi...</span>
    </span>
  );
}

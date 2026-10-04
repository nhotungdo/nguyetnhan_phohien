"use client";

import React, { useState } from "react";
import { useDiscounts, DiscountDto } from "@/hooks/useDiscounts";
import { Ticket, Plus, Trash2, Edit, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * Chuyển ngày hết hạn (UTC từ server) thành chuỗi cho input `datetime-local`.
 * Input này ĐỌC theo giờ máy khách nên bắt buộc phải dùng giờ LOCAL.
 * Trước đây dùng toISOString().slice(0, 16) (giờ UTC) khiến ô hiển thị lệch 7h với
 * Việt Nam và mỗi lần bấm Lưu không sửa gì là ExpiresAt bị đẩy lùi thêm 7 giờ.
 */
const toDateTimeLocalValue = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

export function DiscountManager() {
  const { discounts, isLoading, createDiscount, updateDiscount, deleteDiscount } = useDiscounts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: "",
    type: "percent", // percent | amount
    value: 0,
    maxUsageCount: "",
    expiresAt: "",
    isActive: true,
  });

  const openCreateModal = () => {
    setEditingId(null);
    setForm({
      code: "",
      type: "percent",
      value: 0,
      maxUsageCount: "",
      expiresAt: "",
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (discount: DiscountDto) => {
    setEditingId(discount.id);
    setForm({
      code: discount.code,
      type: discount.percentOff != null ? "percent" : "amount",
      value: discount.percentOff ?? discount.amountOff ?? 0,
      maxUsageCount: discount.maxUsageCount?.toString() ?? "",
      expiresAt: discount.expiresAt ? toDateTimeLocalValue(discount.expiresAt) : "",
      isActive: discount.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) return alert("Vui lòng nhập mã code");

    const payload = {
      code: form.code.trim(),
      percentOff: form.type === "percent" && form.value > 0 ? form.value : null,
      amountOff: form.type === "amount" && form.value > 0 ? form.value : null,
      isActive: form.isActive,
      maxUsageCount: form.maxUsageCount ? parseInt(form.maxUsageCount) : null,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
    };

    try {
      if (editingId) {
        await updateDiscount(editingId, payload);
      } else {
        await createDiscount(payload);
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Đã xảy ra lỗi khi lưu mã giảm giá.";
      alert(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa mã giảm giá này?")) {
      try {
        await deleteDiscount(id);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        alert("Lỗi khi xóa mã: " + message);
      }
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Đang tải danh sách...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-6 rounded-xl border border-border/50 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Ticket className="w-6 h-6 text-primary" />
            Mã Giảm Giá
          </h2>
          <p className="text-muted-foreground mt-1">Quản lý các mã khuyến mãi của hệ thống.</p>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="w-4 h-4" />
          Tạo mã mới
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border/50">
                <th className="p-4 font-semibold">Mã Code</th>
                <th className="p-4 font-semibold">Loại giảm / Giá trị</th>
                <th className="p-4 font-semibold text-center">Đã dùng / Giới hạn</th>
                <th className="p-4 font-semibold">Hết hạn</th>
                <th className="p-4 font-semibold text-center">Trạng thái</th>
                <th className="p-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {discounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Chưa có mã giảm giá nào.
                  </td>
                </tr>
              ) : (
                discounts.map((discount) => (
                  <tr key={discount.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold px-2 py-1 bg-primary/10 text-primary rounded-md">
                          {discount.code}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      {discount.percentOff != null ? (
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">Giảm {discount.percentOff}%</span>
                      ) : discount.amountOff != null ? (
                        <span className="font-medium text-blue-600 dark:text-blue-400">Giảm {discount.amountOff.toLocaleString()}đ</span>
                      ) : (
                        <span className="text-muted-foreground">Không rõ</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-medium">{discount.usageCount}</span>
                      <span className="text-muted-foreground"> / {discount.maxUsageCount ?? "∞"}</span>
                    </td>
                    <td className="p-4">
                      {discount.expiresAt ? (
                        new Date(discount.expiresAt) < new Date() ? (
                          <span className="text-destructive text-sm font-medium">Đã hết hạn</span>
                        ) : (
                          <span className="text-sm">{new Date(discount.expiresAt).toLocaleDateString("vi-VN")}</span>
                        )
                      ) : (
                        <span className="text-muted-foreground text-sm">Không thời hạn</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {discount.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-full">
                          <Check className="w-3 h-3" /> Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 px-2 py-1 rounded-full">
                          <X className="w-3 h-3" /> Tạm dừng
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => openEditModal(discount)}>
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button variant="outline" size="icon" className="hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(discount.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-xl shadow-2xl border border-border/50 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-border/50 shrink-0 flex justify-between items-center">
              <h3 className="text-xl font-bold">{editingId ? "Sửa mã giảm giá" : "Tạo mã mới"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Mã Code *</label>
                <input 
                  type="text" 
                  required
                  value={form.code}
                  onChange={e => setForm({...form, code: e.target.value.toUpperCase()})}
                  className="w-full p-2 rounded-md border border-input bg-background font-mono"
                  placeholder="VD: VIP2026"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Loại giảm</label>
                      <select 
                        value={form.type}
                        onChange={e => setForm({...form, type: e.target.value})}
                        className="w-full p-2 rounded-md border border-input bg-background"
                      >
                        <option value="percent">Giảm theo %</option>
                        <option value="amount">Giảm tiền (VNĐ)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Giá trị *</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        value={form.value}
                        onChange={e => setForm({...form, value: Number(e.target.value)})}
                        className="w-full p-2 rounded-md border border-input bg-background"
                      />
                    </div>
                  </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Giới hạn số lần dùng</label>
                  <input 
                    type="number" 
                    min="1"
                    value={form.maxUsageCount}
                    onChange={e => setForm({...form, maxUsageCount: e.target.value})}
                    placeholder="Không giới hạn"
                    className="w-full p-2 rounded-md border border-input bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Ngày hết hạn</label>
                  <input 
                    type="datetime-local" 
                    value={form.expiresAt}
                    onChange={e => setForm({...form, expiresAt: e.target.value})}
                    className="w-full p-2 rounded-md border border-input bg-background"
                  />
                </div>
              </div>

              {editingId && (
                <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="checkbox" 
                    id="isActive"
                    checked={form.isActive}
                    onChange={e => setForm({...form, isActive: e.target.checked})}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <label htmlFor="isActive" className="text-sm font-semibold cursor-pointer">
                    Cho phép sử dụng (Active)
                  </label>
                </div>
              )}
              
              <div className="pt-4 flex justify-end gap-3 border-t border-border/50">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
                <Button type="submit">Lưu lại</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

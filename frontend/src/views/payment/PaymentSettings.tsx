"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentSettingsApi } from "@/services/api.service";
import type { PaymentSettings } from "@/types/api.types";
import { buildVietQrUrl } from "@/lib/vietqr";
import { FastImage } from "@/components/FastImage";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Hash,
  Landmark,
  Loader2,
  QrCode,
  RefreshCw,
  Save,
  User,
} from "lucide-react";

const EMPTY: PaymentSettings = { bankId: "", accountNumber: "", accountName: "" };

/**
 * Gợi ý mã ngân hàng theo VietQR. Gõ sai mã thì ảnh QR không dựng được (hoặc dựng ra
 * QR của ngân hàng khác) — đây là lỗi im lặng vì trang vẫn "lưu thành công".
 */
const BANK_SUGGESTIONS: { id: string; name: string }[] = [
  { id: "MB", name: "MB Bank (Quân đội)" },
  { id: "VCB", name: "Vietcombank" },
  { id: "ICB", name: "VietinBank" },
  { id: "BIDV", name: "BIDV" },
  { id: "VBA", name: "Agribank" },
  { id: "TCB", name: "Techcombank" },
  { id: "ACB", name: "ACB" },
  { id: "TPB", name: "TPBank" },
  { id: "VPB", name: "VPBank" },
  { id: "STB", name: "Sacombank" },
  { id: "HDB", name: "HDBank" },
  { id: "VIB", name: "VIB" },
  { id: "MSB", name: "MSB" },
  { id: "SHB", name: "SHB" },
  { id: "OCB", name: "OCB" },
  { id: "EIB", name: "Eximbank" },
  { id: "LPB", name: "LPBank" },
  { id: "SCB", name: "SCB" },
];

/** Nội dung chuyển khoản mẫu dùng cho QR xem trước (hóa đơn thật thay bằng mã đơn). */
const PREVIEW_TRANSFER_NOTE = "Thanh toan don DEMO0001";
const DEFAULT_PREVIEW_AMOUNT = 100000;

export default function PaymentSettingsView() {
  const queryClient = useQueryClient();

  const [form, setForm] = useState<PaymentSettings>(EMPTY);
  const [previewAmount, setPreviewAmount] = useState<number>(DEFAULT_PREVIEW_AMOUNT);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [qrFailed, setQrFailed] = useState(false);
  /** Đồng bộ server → form CHỈ lần đầu, không ghi đè phần đang sửa dở khi refetch. */
  const hydratedRef = useRef(false);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["payment", "settings"],
    queryFn: () => paymentSettingsApi.get(),
  });

  useEffect(() => {
    if (!data || hydratedRef.current) return;
    hydratedRef.current = true;
    setForm(data);
  }, [data]);

  const setField = (field: keyof PaymentSettings, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
    setSaveError("");
    setQrFailed(false);
  };

  const isComplete =
    form.bankId.trim().length > 0 &&
    form.accountNumber.trim().length > 0 &&
    form.accountName.trim().length > 0;

  const qrUrl = isComplete
    ? buildVietQrUrl(form, { amount: previewAmount, transferNote: PREVIEW_TRANSFER_NOTE })
    : "";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    setSaveError("");
    setSaved(false);

    try {
      const updated = await paymentSettingsApi.update(form);
      // Dùng chính bản server trả về (backend chuẩn hóa IN HOA + bỏ ký tự phân cách
      // trong số tài khoản) làm dữ liệu cache và form → ô nhập hiện đúng giá trị đã lưu.
      setForm(updated);
      queryClient.setQueryData(["payment", "settings"], updated);
      setQrFailed(false);
      setSaved(true);
    } catch (err: unknown) {
      setSaveError(
        err instanceof Error ? err.message : "Lưu thất bại. Vui lòng thử lại."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-10 flex flex-col items-center gap-3 text-center">
        <div className="w-11 h-11 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-red-500" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold">Không tải được cấu hình thanh toán</p>
          <p className="text-sm text-muted-foreground max-w-md">
            {error instanceof Error ? error.message : "Không kết nối được máy chủ."}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="border hover:bg-muted px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Thử lại
        </button>
      </div>
    );
  }

  const inputClass =
    "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all";

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
          <CreditCard className="w-6 h-6 sm:w-7 sm:h-7 shrink-0" /> Cấu hình thanh toán
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Thông tin này được in thành mã QR trong email hóa đơn gửi khách. Đổi số tài
          khoản tại đây có hiệu lực ngay, không cần khởi động lại hệ thống.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 items-start">
        {/* FORM */}
        <form onSubmit={handleSave} className="bg-card border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b bg-muted/20">
            <h3 className="font-semibold text-sm sm:text-base">Tài khoản nhận tiền</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Tên chủ tài khoản nên viết không dấu, đúng như ngân hàng đăng ký.
            </p>
          </div>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Landmark className="w-4 h-4 text-primary" /> Mã ngân hàng (VietQR)
              </label>
              <input
                type="text"
                required
                list="bank-suggestions"
                value={form.bankId}
                onChange={(e) => setField("bankId", e.target.value.toUpperCase())}
                placeholder="VD: MB, VCB, TCB"
                className={`${inputClass} font-mono uppercase`}
              />
              <datalist id="bank-suggestions">
                {BANK_SUGGESTIONS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </datalist>
              <p className="text-xs text-muted-foreground">
                Sai mã ngân hàng thì mã QR sẽ không quét được — hãy chọn từ gợi ý.
              </p>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Hash className="w-4 h-4 text-primary" /> Số tài khoản
              </label>
              <input
                type="text"
                required
                value={form.accountNumber}
                onChange={(e) => setField("accountNumber", e.target.value)}
                placeholder="VD: 868606052004"
                className={`${inputClass} font-mono`}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <User className="w-4 h-4 text-primary" /> Tên chủ tài khoản
              </label>
              <input
                type="text"
                required
                value={form.accountName}
                // Ép IN HOA ngay khi nhập cho khớp kiểu hiển thị `uppercase` bên dưới —
                // nếu chỉ để CSS in hoa, giá trị lưu xuống DB vẫn là chữ thường khiến
                // admin tưởng đã lưu chữ hoa.
                onChange={(e) => setField("accountName", e.target.value.toUpperCase())}
                placeholder="VD: NGUYEN VAN A"
                className={`${inputClass} uppercase`}
              />
            </div>

            {saveError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{saveError}</span>
              </div>
            )}

            {saved && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  Đã lưu. Mã QR trong email hóa đơn tiếp theo sẽ dùng thông tin mới.
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving || !isComplete}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Lưu cấu hình
                </>
              )}
            </button>
          </div>
        </form>

        {/* XEM TRƯỚC QR */}
        <div className="bg-card border rounded-xl shadow-sm overflow-hidden lg:sticky lg:top-20">
          <div className="p-5 border-b bg-muted/20">
            <h3 className="font-semibold flex items-center gap-2">
              <QrCode className="w-4 h-4 text-primary" /> Xem trước mã QR
            </h3>
            <p className="text-sm text-muted-foreground">
              Đúng bằng mã khách nhận trong email (kèm sẵn số tiền và nội dung chuyển khoản).
            </p>
          </div>

          <div className="p-6 space-y-5">
            {!isComplete ? (
              <div className="border-2 border-dashed border-border rounded-xl py-14 text-center text-sm text-muted-foreground">
                Điền đủ ngân hàng, số tài khoản và tên chủ tài khoản để xem trước mã QR.
              </div>
            ) : (
              <>
                <div className="border rounded-xl p-4 flex flex-col items-center gap-3 bg-white">
                  <div className="relative w-[240px] h-[240px]">
                    {qrFailed ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-4">
                        <AlertCircle className="w-6 h-6 text-red-400" />
                        <p className="text-sm font-semibold text-red-600">
                          Không dựng được mã QR
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Kiểm tra lại mã ngân hàng và số tài khoản.
                        </p>
                      </div>
                    ) : (
                      <FastImage
                        src={qrUrl}
                        alt="Mã QR thanh toán xem trước"
                        fill
                        sizes="240px"
                        className="w-full h-full object-contain"
                        onError={() => setQrFailed(true)}
                      />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold uppercase">{form.accountName}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {form.bankId} · {form.accountNumber}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Số tiền thử (để kiểm tra QR)</label>
                  <input
                    type="number"
                    min={0}
                    value={previewAmount}
                    onChange={(e) => {
                      setPreviewAmount(Number(e.target.value) || 0);
                      setQrFailed(false);
                    }}
                    className={inputClass}
                  />
                  <p className="text-xs text-muted-foreground">
                    Nội dung chuyển khoản mẫu: <span className="font-mono">{PREVIEW_TRANSFER_NOTE}</span>.
                    Hóa đơn thật dùng mã đơn hàng tương ứng.
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    URL mã QR
                  </p>
                  <code className="block text-xs bg-muted rounded-lg p-3 break-all text-muted-foreground">
                    {qrUrl}
                  </code>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

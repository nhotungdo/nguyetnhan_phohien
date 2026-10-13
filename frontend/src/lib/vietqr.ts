import type { PaymentSettings } from "@/types/api.types";

/**
 * Sinh URL ảnh QR VietQR — dùng cho phần XEM TRƯỚC trong trang quản trị /payment.
 *
 * PHẢI khớp công thức với backend `PaymentQr.Build`
 * (backend/src/NguyetnhanPhohien.Application/Payment/PaymentQr.cs), bao gồm cả phần
 * chuẩn hóa `PaymentSettingsNormalizer` (backend/src/NguyetnhanPhohien.Application/Payment/PaymentSettingsNormalizer.cs).
 * Hai bên dùng chung một định dạng URL thì ảnh xem trước mới đúng bằng QR thật sự gửi
 * cho khách trong email hóa đơn. Đổi một bên thì phải đổi bên còn lại.
 *
 * Mọi giá trị được encode bằng `encodeURIComponent` (dấu cách → %20, giống backend):
 * nội dung chuyển khoản và tên chủ tài khoản đều có dấu cách, để thô trong query sẽ
 * khiến một số app ngân hàng dựng QR sai.
 */
export function buildVietQrUrl(
  settings: PaymentSettings,
  options: { amount?: number; transferNote?: string } = {}
): string {
  // Chuẩn hóa GIỐNG backend trước khi ghép URL: người dùng hay dán số tài khoản kèm
  // dấu cách ("8686 0605 2004") — giữ nguyên sẽ tạo ra QR không quét được. Xem trước
  // phải cho ra đúng URL mà server sẽ gửi cho khách, nên phải chuẩn hóa ở đây.
  const bankId = settings.bankId.trim().toUpperCase();
  const accountNumber = settings.accountNumber
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
  const accountName = settings.accountName.trim();

  const params: string[] = [];
  if (options.amount && options.amount > 0) params.push(`amount=${options.amount}`);
  if (options.transferNote?.trim()) {
    params.push(`addInfo=${encodeURIComponent(options.transferNote.trim())}`);
  }
  if (accountName) params.push(`accountName=${encodeURIComponent(accountName)}`);

  const base = `https://img.vietqr.io/image/${bankId}-${accountNumber}-compact.svg`;
  return params.length > 0 ? `${base}?${params.join("&")}` : base;
}

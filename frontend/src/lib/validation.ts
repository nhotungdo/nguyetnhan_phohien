/**
 * Validate dữ liệu khách nhập ở form đặt hàng.
 *
 * Chỉ trả về MÃ LỖI (không phải câu chữ) để tầng UI tự dịch theo ngôn ngữ đang
 * chọn (vi/en) — lib này thuần logic, dễ test, không phụ thuộc i18n.
 *
 * Quy tắc SĐT Việt Nam:
 *  - Di động: 10 số, bắt đầu bằng 03/05/07/08/09 (vd 0982072601).
 *  - Cố định: 11–12 số, bắt đầu bằng 02 (vd 02213825555 — Hưng Yên).
 *  - Chấp nhận cả dạng +84… và dạng thiếu số 0 đầu, rồi chuẩn hoá về 0xxxxxxxxx
 *    vì backend lưu SĐT dạng chuỗi số để so khớp "mỗi SĐT dùng mã 1 lần".
 */

const VN_PHONE_DOMESTIC = /^0(?:[35789]\d{8}|2\d{8,9})$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

export const MAX_NAME_LENGTH = 100;
export const MAX_EMAIL_LENGTH = 200;
export const MAX_ADDRESS_DETAIL_LENGTH = 200;
/** Backend chặn CustomerAddress > 300 ký tự, nên địa chỉ ghép lại phải nằm trong ngưỡng này. */
export const MAX_ADDRESS_LENGTH = 300;

/** Bỏ khoảng trắng/dấu chấm/gạch và đưa +84 về dạng nội địa. Chuỗi rác → trả về "". */
export function normalizePhone(raw: string): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "";

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";

  // "+84 982 072 601" / "84 982072601" → "0982072601"
  // Bỏ ĐÚNG 2 ký tự đầu ("84") rồi thêm "0" — đúng cho CẢ di động lẫn cố định:
  //   - Di động "84982072601"  (11 số) → "0982072601"  (10 số nội địa).
  //   - Cố định "842213825555" (12 số) → "02213825555" (11 số nội địa).
  // Trước đây dùng digits.slice(-9) (giữ 9 số cuối) — công thức chỉ đúng với di
  // động; với số cố định 12 số nó vứt mất một chữ số thật của tổng đài → số
  // sai, khách bị chặn "phone_invalid" dù nhập hợp lệ.
  // Bản sao logic này nằm ở backend OrdersController.NormalizePhone — đổi một
  // bên phải đổi cả bên kia để validate client và chuẩn hoá server khớp nhau.
  if (digits.startsWith("84") && digits.length > 2) {
    // Nếu người dùng gõ nhầm "84" + số nội địa có sẵn số 0 đầu
    // ("840982072601") thì bỏ số 0 đó, tránh tạo ra "00..." vô nghĩa.
    return "0" + digits.slice(2).replace(/^0+/, "");
  }
  // Khách gõ thiếu số 0 đầu (9 số, đầu số di động) → thêm 0 cho đúng dạng.
  if (digits.length === 9) return "0" + digits;
  return digits;
}

export function isValidVnPhone(raw: string): boolean {
  return VN_PHONE_DOMESTIC.test(normalizePhone(raw));
}

export function isValidEmail(raw: string): boolean {
  const value = (raw ?? "").trim();
  if (!value) return false;
  if (value.length > MAX_EMAIL_LENGTH) return false;
  return EMAIL.test(value);
}

export interface OrderFormValues {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  province: string;
  ward: string;
  addressDetail: string;
}

export type OrderField =
  | "customerName"
  | "customerPhone"
  | "customerEmail"
  | "province"
  | "ward"
  | "addressDetail";

export type OrderFieldErrorCode =
  | "name_required"
  | "phone_invalid"
  | "email_invalid"
  | "province_required"
  | "ward_required"
  | "address_detail_required"
  | "address_too_long";

export type OrderFormErrors = Partial<Record<OrderField, OrderFieldErrorCode>>;

/** Ghép 3 phần địa chỉ thành chuỗi gửi lên API (backend lưu 1 cột CustomerAddress). */
export function composeAddress(values: Pick<OrderFormValues, "addressDetail" | "ward" | "province">): string {
  return [values.addressDetail.trim(), values.ward.trim(), values.province.trim()]
    .filter(Boolean)
    .join(", ");
}

/**
 * @param options.requireAdministrativeUnits = false khi khách chuyển sang nhập
 *   địa chỉ thủ công (danh sách Tỉnh/Phường không tải được, hoặc địa chỉ của
 *   khách không có trong danh sách): lúc đó chỉ cần ô địa chỉ đầy đủ.
 */
export function validateOrderForm(
  values: OrderFormValues,
  options: { requireAdministrativeUnits?: boolean } = {}
): OrderFormErrors {
  const errors: OrderFormErrors = {};
  const requireUnits = options.requireAdministrativeUnits ?? true;

  if (!values.customerName.trim()) errors.customerName = "name_required";
  if (!isValidVnPhone(values.customerPhone)) errors.customerPhone = "phone_invalid";

  const email = values.customerEmail.trim();
  if (email && !isValidEmail(email)) errors.customerEmail = "email_invalid";

  if (requireUnits) {
    if (!values.province.trim()) errors.province = "province_required";
    if (!values.ward.trim()) errors.ward = "ward_required";
  }
  if (!values.addressDetail.trim()) errors.addressDetail = "address_detail_required";

  if (composeAddress(values).length > MAX_ADDRESS_LENGTH) errors.addressDetail = "address_too_long";

  return errors;
}

export function hasErrors(errors: OrderFormErrors): boolean {
  return Object.values(errors).some(Boolean);
}

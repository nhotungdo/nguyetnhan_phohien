/**
 * Dữ liệu đơn vị hành chính 2 cấp (Tỉnh/Thành phố → Phường/Xã) dùng cho ô chọn
 * địa điểm giao hàng.
 *
 * File JSON nằm trong `public/data/` chứ KHÔNG import trực tiếp vào bundle:
 *  - Khách chỉ tải khi thực sự mở ô chọn địa điểm (xem `loadVnProvinces`).
 *  - Không phụ thuộc mạng ngoài: dữ liệu nằm cùng domain với trang.
 *  - Sinh lại bằng `node scripts/generate-vn-address-data.mjs` khi nhà nước
 *    sáp nhập/điều chỉnh đơn vị hành chính.
 */

export interface VnProvince {
  code: number;
  name: string;
  wards: string[];
}

const DATA_URL = "/data/vn-administrative-units.json";

// Cache ở cấp module: cả trang chỉ tải file 1 lần, kể cả khi component unmount
// rồi mount lại (React StrictMode ở dev cũng không tải trùng).
let provincesPromise: Promise<VnProvince[]> | null = null;

export function loadVnProvinces(): Promise<VnProvince[]> {
  provincesPromise ??= fetch(DATA_URL, { cache: "force-cache" })
    .then((res) => {
      if (!res.ok) throw new Error(`Không tải được dữ liệu địa chỉ (HTTP ${res.status}).`);
      return res.json() as Promise<{ provinces: VnProvince[] }>;
    })
    .then((data) => data.provinces)
    .catch((err) => {
      // Lần sau người dùng mở lại ô chọn vẫn thử tải lại thay vì kẹt ở lỗi cũ.
      provincesPromise = null;
      throw err;
    });

  return provincesPromise;
}

/** Danh sách phường/xã của 1 tỉnh — so khớp theo tên vì UI lưu tên, không lưu code. */
export function wardsOf(provinces: VnProvince[], provinceName: string): string[] {
  return provinces.find((p) => p.name === provinceName)?.wards ?? [];
}

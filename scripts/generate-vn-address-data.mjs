// Sinh dữ liệu đơn vị hành chính 2 cấp (sau sáp nhập 2025) để đóng gói vào app.
// Chạy 1 lần từ thư mục gốc repo: node scripts/generate-vn-address-data.mjs
// Nguồn: provinces.open-api.vn (bản v2 — chỉ còn Tỉnh/Thành phố + Phường/Xã).
import { writeFile } from "node:fs/promises";

const PROVINCES_URL = "https://provinces.open-api.vn/api/v2/p/";
const WARDS_URL = "https://provinces.open-api.vn/api/v2/w/";
const OUT = "frontend/public/data/vn-administrative-units.json";

const provinces = await (await fetch(PROVINCES_URL)).json();
const wards = await (await fetch(WARDS_URL)).json();

const byProvince = new Map();
for (const w of wards) {
  if (!byProvince.has(w.province_code)) byProvince.set(w.province_code, []);
  byProvince.get(w.province_code).push(w.name);
}

const data = {
  source: "provinces.open-api.vn/api/v2",
  note: "Đơn vị hành chính 2 cấp sau sáp nhập 2025: Tỉnh/Thành phố trung ương → Phường/Xã/Đặc khu.",
  provinces: provinces
    .map((p) => ({
      code: p.code,
      name: p.name,
      wards: (byProvince.get(p.code) ?? []).sort((a, b) => a.localeCompare(b, "vi")),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "vi")),
};

await writeFile(OUT, JSON.stringify(data), "utf8");

const totalWards = data.provinces.reduce((n, p) => n + p.wards.length, 0);
console.log(`provinces=${data.provinces.length} wards=${totalWards}`);
console.log(`emptyWards=${data.provinces.filter((p) => !p.wards.length).map((p) => p.name).join(", ") || "none"}`);

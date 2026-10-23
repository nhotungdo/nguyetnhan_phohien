import type { ProductResponse } from "@/types/api.types";

export const DEFAULT_FALLBACK_PRODUCTS: ProductResponse[] = [
  {
    id: "default-dac-biet",
    name: "Long Nhãn Loại Đặc Biệt",
    price: 350000,
    size: "Hộp 500g",
    description: "Nhãn lồng cùi dày Hương Chi, sấy nhiệt nóng (sấy đối lưu), hạt đều tăm tắp, màu vàng cánh gián hổ phách sang trọng, dẻo ngọt thanh tao.",
    isActive: true,
    displayOrder: 1,
    images: [{ id: "img-1", imagePath: "/images/hopnhua.jpg", displayOrder: 1 }],
  },
  {
    id: "default-tui-zip",
    name: "Long Nhãn Dạng Túi Zip",
    price: 320000,
    size: "Túi 500g",
    description: "Thiết kế túi zip tiện dụng bảo quản hàng ngày, khóa kín khí giữ nguyên vị dẻo thơm, phù hợp pha trà, nấu chè giải nhiệt hoặc ngâm rượu bồi bổ.",
    isActive: true,
    displayOrder: 2,
    images: [{ id: "img-2", imagePath: "/images/tuizip.jpg", displayOrder: 1 }],
  },
  {
    id: "default-set-qua",
    name: "Set Quà Tặng Cao Cấp Hoàng Gia",
    price: 850000,
    size: "Set 1kg (2 Hộp)",
    description: "Hộp quà thiết kế trang nhã mang đậm bản sắc văn hóa Phố Hiến ngàn năm, kết hợp túi xách sang trọng, là món quà sức khỏe vô giá gửi tặng người thân, đối tác.",
    isActive: true,
    displayOrder: 3,
    images: [{ id: "img-3", imagePath: "/images/setqua.jpg", displayOrder: 1 }],
  },
];

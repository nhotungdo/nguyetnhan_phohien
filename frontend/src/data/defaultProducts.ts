import type { ProductResponse } from "@/types/api.types";

export const DEFAULT_FALLBACK_PRODUCTS: ProductResponse[] = [
  {
    id: "default-tui-zip",
    name: "Gói \"Trân Châu Tứ Dã\" (Túi Zip)",
    price: 69000,
    size: "Túi 150g",
    description: "Túi zip khóa kín khí tiện lợi bảo quản hàng ngày, múi nhãn Hương Chi sấy nhiệt đối lưu dẻo thơm, phù hợp pha trà, ăn liền hoặc mang theo.",
    isActive: true,
    displayOrder: 1,
    images: [{ id: "img-tui-zip", imagePath: "/images/tuizip.jpg", displayOrder: 1 }],
  },
  {
    id: "default-dac-biet",
    name: "Hộp \"Ngọc Nhãn Tiến Vua\" (Bản Ngự Thiện)",
    price: 153000,
    size: "Hộp 300g",
    description: "Nhãn lồng cùi dày Hương Chi thượng hạng tuyển chọn, sấy nhiệt nóng (sấy đối lưu), màu vàng cánh gián hổ phách sang trọng, dẻo ngọt thanh tao.",
    isActive: true,
    displayOrder: 2,
    images: [{ id: "img-hop-nhua", imagePath: "/images/hopnhua.jpg", displayOrder: 1 }],
  },
  {
    id: "default-set-qua",
    name: "Lễ Hộp \"Vọng Nguyệt Thương Cảng\" (Hoàng Gia)",
    price: 756000,
    size: "Set 900g",
    description: "Lễ hộp cao cấp mang âm hưởng Phố Hiến thế kỷ 17 kèm túi xách trang trọng, tinh hoa phẩm vật tiến vua, là món quà sức khỏe thượng hạng trao gửi tri ân.",
    isActive: true,
    displayOrder: 3,
    images: [{ id: "img-set-qua", imagePath: "/images/setqua.jpg", displayOrder: 1 }],
  },
];

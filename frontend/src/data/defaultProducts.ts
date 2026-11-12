import type { ProductResponse } from "@/types/api.types";

export const DEFAULT_FALLBACK_PRODUCTS: ProductResponse[] = [
  {
    id: "default-tui-zip",
    name: "Gói \"Trân Châu Tứ Dã\" (Túi Zip)",
    price: 69000,
    size: "Túi 150g",
    description: "Sự kết hợp hoàn hảo giữa Long nhãn Phố Hiến dẻo ngọt và 4 loại hạt dinh dưỡng (Hạt điều, Macca, Bí xanh, Hạnh nhân) giòn bùi tự nhiên, túi zip tiện lợi.",
    isActive: true,
    displayOrder: 1,
    images: [{ id: "img-tui-zip", imagePath: "/images/tuizip.jpg", displayOrder: 1 }],
  },
  {
    id: "default-dac-biet",
    name: "Hộp \"Ngọc Nhãn Tiến Vua\" (Bản Ngự Thiện)",
    price: 153000,
    size: "Hộp 300g",
    description: "Phiên bản ngự thiện cùi nhãn Hương Chi tiến vua hòa quyện cùng các loại hạt dinh dưỡng thượng hạng (Macca, Điều, Bí xanh, Hạnh nhân), hộp mica nắp nhôm xé cao cấp.",
    isActive: true,
    displayOrder: 2,
    images: [{ id: "img-hop-nhua", imagePath: "/images/hopnhua.jpg", displayOrder: 1 }],
  },
  {
    id: "default-set-qua",
    name: "Lễ Hộp \"Vọng Nguyệt Thương Cảng\" (Hoàng Gia)",
    price: 756000,
    size: "Set 900g",
    description: "Lễ hộp cao cấp mang âm hưởng Phố Hiến thế kỷ 17 kèm túi xách sang trọng, tinh hoa phẩm vật tiến vua kết hợp long nhãn đối lưu và 4 loại hạt dinh dưỡng hảo hạng.",
    isActive: true,
    displayOrder: 3,
    images: [{ id: "img-set-qua", imagePath: "/images/setqua.jpg", displayOrder: 1 }],
  },
];

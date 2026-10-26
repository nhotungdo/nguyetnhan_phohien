"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ShoppingBag,
  Check,
  AlertCircle,
  Plus,
  Minus,
  Wand2,
  Scale,
  RotateCcw,
  Package,
  Flame,
  CheckCircle2,
  Loader2,
  ZoomIn,
  X,
} from "lucide-react";
import { useCartStore } from "@/stores/useCartStore";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartButton } from "@/components/cart/CartButton";
import { FastImage } from "@/components/FastImage";
import { customMixApi } from "@/services/api.service";
import type {
  CustomPackaging,
  CustomIngredient,
  CustomMixItemDetailDto,
} from "@/types/api.types";

// Dữ liệu dự phòng mặc định (Fallback) nếu chưa kết nối API Backend
const FALLBACK_PACKAGINGS: CustomPackaging[] = [
  {
    id: "c0000001-0000-0000-0000-000000000150",
    name: "Túi Zip Khóa Khí Tiện Lợi",
    packagingType: "ZipBag",
    capacityGrams: 150,
    fixedPrice: 69000,
    imageUrl: "/images/tuizip.jpg",
    description: "Túi zip tráng bạc khóa kín khí, giữ trọn hương vị và độ giòn tan, tiện lợi mang theo hàng ngày.",
    displayOrder: 1,
  },
  {
    id: "c0000001-0000-0000-0000-000000000300",
    name: "Hộp Nhựa Mica Trong Suốt",
    packagingType: "Box",
    capacityGrams: 300,
    fixedPrice: 153000,
    imageUrl: "/images/hopnhua.jpg",
    description: "Hộp tròn mica cao cấp nắp nhôm xé, bảo quản tối ưu, nhìn rõ từng tầng hạt xếp lớp sang trọng.",
    displayOrder: 2,
  },
  {
    id: "c0000001-0000-0000-0000-000000000900",
    name: "Lễ Hộp Quà Tặng Hoàng Gia",
    packagingType: "GiftSet",
    capacityGrams: 900,
    fixedPrice: 756000,
    imageUrl: "/images/setqua.jpg",
    description: "Lễ hộp cao cấp mang âm hưởng Phố Hiến ngàn năm kèm túi xách trang trọng, món quà thượng hạng trao gửi yêu thương.",
    displayOrder: 3,
  },
];

const FALLBACK_INGREDIENTS: CustomIngredient[] = [
  {
    id: "d0000001-0000-0000-0000-000000000001",
    name: "Long Nhãn Phố Hiến Tuyển Chọn",
    caloriesPer100g: 310,
    imageUrl: "/images/nuts/longnhan.jpg",
    description: "Cùi dày dẻo thơm, màu vàng cánh gián hổ phách, sấy đối lưu nhiệt nóng bí truyền, vị ngọt thanh tao tự nhiên.",
    tagline: "Đặc sản tiến vua, bổ huyết, an thần ngủ ngon",
    minGrams: 0,
    maxGrams: 900,
    stepGrams: 10,
    displayOrder: 1,
  },
  {
    id: "d0000001-0000-0000-0000-000000000003",
    name: "Hạt Macca Tây Nguyên (Tách Nhân)",
    caloriesPer100g: 718,
    imageUrl: "/images/nuts/macca.jpg",
    description: "Nữ hoàng các loại hạt, nhân trắng ngà béo ngậy thơm ngon, tan nhẹ trên đầu lưỡi.",
    tagline: "Giàu Omega-7 và chất béo tốt cho tim mạch",
    minGrams: 0,
    maxGrams: 900,
    stepGrams: 10,
    displayOrder: 2,
  },
  {
    id: "d0000001-0000-0000-0000-000000000004",
    name: "Hạt Điều Bình Phước Rang Mộc (A+)",
    caloriesPer100g: 553,
    imageUrl: "/images/nuts/hatdieu.jpg",
    description: "Hạt điều to mập mẩy, rang mộc giữ trọn độ giòn rụm và vị ngọt bùi thuần khiết.",
    tagline: "Giàu protein, tăng cường sinh lực & năng lượng",
    minGrams: 0,
    maxGrams: 900,
    stepGrams: 10,
    displayOrder: 3,
  },
  {
    id: "d0000001-0000-0000-0000-000000000005",
    name: "Hạnh Nhân Nướng Mộc California",
    caloriesPer100g: 579,
    imageUrl: "/images/nuts/hanhnhan.jpg",
    description: "Hạnh nhân nguyên hạt nướng mộc tự nhiên, giòn chắc thơm bùi đậm vị.",
    tagline: "Dồi dào Vitamin E & chất xơ, hỗ trợ vóc dáng & làn da",
    minGrams: 0,
    maxGrams: 900,
    stepGrams: 10,
    displayOrder: 4,
  },
  {
    id: "d0000001-0000-0000-0000-000000000006",
    name: "Hạt Bí Xanh Ấn Độ",
    caloriesPer100g: 559,
    imageUrl: "/images/nuts/bixanh.jpg",
    description: "Hạt mẩy xanh ngọc đều đặn, vị bùi béo thanh nhẹ, sấy mộc giòn thơm.",
    tagline: "Giàu kẽm & magie, tăng cường đề kháng cơ thể",
    minGrams: 0,
    maxGrams: 900,
    stepGrams: 10,
    displayOrder: 5,
  },
];

function formatVND(amount: number) {
  return amount.toLocaleString("vi-VN").replace(/,/g, ".") + "đ";
}

export default function CustomMixStudio() {
  const router = useRouter();
  const { addCustomMixItem, openCart, closeCart, getTotalItems } = useCartStore();
  const totalCartCount = getTotalItems();

  const [packagings, setPackagings] = useState<CustomPackaging[]>(FALLBACK_PACKAGINGS);
  const [ingredients, setIngredients] = useState<CustomIngredient[]>(FALLBACK_INGREDIENTS);
  const [selectedPackagingId, setSelectedPackagingId] = useState<string>(
    FALLBACK_PACKAGINGS[1].id // Mặc định chọn Hộp nhựa 300g
  );

  // Khối lượng từng loại hạt { [ingredientId]: grams }
  const [weights, setWeights] = useState<Record<string, number>>({});

  // Tên sản phẩm khách tự đặt và lời chúc
  const [customName, setCustomName] = useState<string>("Hộp Dưỡng Nhan Cho Mẹ");
  const [customMessage, setCustomMessage] = useState<string>("Kính chúc Mẹ vạn sự bình an & trẻ đẹp");
  const [quantity, setQuantity] = useState<number>(1);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [previewNut, setPreviewNut] = useState<CustomIngredient | null>(null);

  // Lắng nghe phím ESC để đóng modal xem ảnh phóng to
  useEffect(() => {
    if (!previewNut) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPreviewNut(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewNut]);

  // Tải danh sách bao bì & hạt từ API
  useEffect(() => {
    let isMounted = true;
    customMixApi
      .getOptions()
      .then((data) => {
        if (!isMounted) return;
        if (data.packagings?.length > 0) {
          setPackagings(data.packagings);
          setSelectedPackagingId(data.packagings[1]?.id || data.packagings[0].id);
        }
        if (data.ingredients?.length > 0) {
          setIngredients(data.ingredients);
        }
      })
      .catch(() => {
        // Fallback data already set
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Bao bì đang chọn
  const activePackaging = useMemo(() => {
    return (
      packagings.find((p) => p.id === selectedPackagingId) || packagings[0]
    );
  }, [packagings, selectedPackagingId]);

  // Tổng số gram hiện tại
  const totalGrams = useMemo(() => {
    return Object.values(weights).reduce((sum, g) => sum + (g || 0), 0);
  }, [weights]);

  const targetGrams = activePackaging.capacityGrams;
  const remainingGrams = targetGrams - totalGrams;
  const isPerfectMatch = totalGrams === targetGrams;
  const isOverweight = totalGrams > targetGrams;
  const progressPercent = Math.min(100, Math.round((totalGrams / targetGrams) * 100));

  // Tự động phân bổ lại khi đổi bao bì (tự động co giãn theo tỉ lệ nếu bao bì mới nhỏ hơn số gram hiện tại)
  const handleSelectPackaging = (pkg: CustomPackaging) => {
    setSelectedPackagingId(pkg.id);
    setErrorMessage(null);
    const newTarget = pkg.capacityGrams;

    if (totalGrams > newTarget) {
      const activeEntries = Object.entries(weights).filter(([, g]) => (g || 0) > 0);
      if (activeEntries.length > 0) {
        const scaled: Record<string, number> = {};
        let allocated = 0;

        activeEntries.forEach(([id, g], idx) => {
          if (idx === activeEntries.length - 1) {
            const remainder = Math.max(0, newTarget - allocated);
            if (remainder > 0) {
              scaled[id] = remainder;
            }
          } else {
            const ratio = g / totalGrams;
            const approx = Math.max(10, Math.floor((ratio * newTarget) / 10) * 10);
            scaled[id] = approx;
            allocated += approx;
          }
        });
        setWeights(scaled);
      }
    }
  };

  // Cập nhật số gram của 1 hạt
  const handleUpdateGrams = (ingredientId: string, newGrams: number) => {
    const clamped = Math.max(0, Math.min(targetGrams, newGrams));
    setWeights((prev) => {
      const next = { ...prev };
      if (clamped <= 0) {
        delete next[ingredientId];
      } else {
        next[ingredientId] = clamped;
      }
      return next;
    });
  };

  // Helper tra cứu hạt theo loại ngữ nghĩa (bảo đảm an toàn tuyệt đối khi DB đổi thứ tự DisplayOrder)
  const findNut = useCallback(
    (key: "longnhan" | "macca" | "dieu" | "hanhnhan" | "bixanh") => {
      const SEED_IDS: Record<string, string> = {
        longnhan: "d0000001-0000-0000-0000-000000000001",
        macca: "d0000001-0000-0000-0000-000000000003",
        dieu: "d0000001-0000-0000-0000-000000000004",
        hanhnhan: "d0000001-0000-0000-0000-000000000005",
        bixanh: "d0000001-0000-0000-0000-000000000006",
      };
      const KEYWORDS: Record<string, string[]> = {
        longnhan: ["long nhãn", "long nhan"],
        macca: ["macca", "mắc ca"],
        dieu: ["điều", "dieu"],
        hanhnhan: ["hạnh nhân", "hanh nhan"],
        bixanh: ["bí xanh", "bi xanh", "hạt bí"],
      };

      const seedId = SEED_IDS[key];
      const byId = ingredients.find((i) => i.id === seedId);
      if (byId) return byId;

      const words = KEYWORDS[key] || [];
      return ingredients.find((i) => {
        const lower = (i.name || "").toLowerCase();
        return words.some((w) => lower.includes(w));
      });
    },
    [ingredients]
  );

  // Tự động bù đầy bằng Long Nhãn Phố Hiến
  const handleAutoFillLongNhan = () => {
    if (remainingGrams <= 0) return;
    const longNhan = findNut("longnhan") || ingredients[0];
    if (!longNhan) return;
    const currentLongNhan = weights[longNhan.id] || 0;
    handleUpdateGrams(longNhan.id, currentLongNhan + remainingGrams);
  };

  // Chia đều số gram cho các hạt đang chọn (hoặc tất cả hạt nếu chưa chọn gì)
  const handleDistributeEqually = () => {
    const activeIds = Object.keys(weights).filter((id) => (weights[id] || 0) > 0);
    const targetNutList = activeIds.length > 0 ? activeIds : ingredients.map((i) => i.id);

    const count = targetNutList.length;
    if (count === 0) return;

    const basePerNut = Math.floor(targetGrams / count / 10) * 10;
    const allocatedTotal = basePerNut * count;
    const remainder = targetGrams - allocatedTotal;

    const newWeights: Record<string, number> = {};
    targetNutList.forEach((id, idx) => {
      newWeights[id] = basePerNut + (idx === 0 ? remainder : 0);
    });

    setWeights(newWeights);
  };

  // Đặt lại về 0
  const handleReset = () => {
    setWeights({});
  };

  // Áp dụng công thức gợi ý
  const handleApplyPreset = (presetType: "duong-nhan" | "nang-luong" | "thuong-hang") => {
    const newWeights: Record<string, number> = {};
    const longNhanId = findNut("longnhan")?.id || ingredients[0]?.id;
    const maccaId = findNut("macca")?.id || ingredients[1]?.id;
    const dieuId = findNut("dieu")?.id || ingredients[2]?.id;
    const hanhNhanId = findNut("hanhnhan")?.id || ingredients[3]?.id;
    const biXanhId = findNut("bixanh")?.id || ingredients[4]?.id;

    if (presetType === "duong-nhan") {
      // 40% Long nhãn, 30% Hạt macca, 30% Hạnh nhân
      const w1 = Math.round((targetGrams * 0.4) / 10) * 10;
      const w2 = Math.round((targetGrams * 0.3) / 10) * 10;
      const w3 = targetGrams - w1 - w2;
      if (longNhanId) newWeights[longNhanId] = w1;
      if (maccaId) newWeights[maccaId] = w2;
      if (hanhNhanId) newWeights[hanhNhanId] = w3;
      setCustomName("Hộp Dưỡng Nhan Thanh Tâm");
      setCustomMessage("Kính chúc Mẹ luôn bình an, tươi trẻ và ngủ thật ngon");
      setNameError(null);
    } else if (presetType === "nang-luong") {
      // 30% Long nhãn, 25% Hạt điều, 25% Macca, 20% Hạt bí
      const w1 = Math.round((targetGrams * 0.3) / 10) * 10;
      const w2 = Math.round((targetGrams * 0.25) / 10) * 10;
      const w3 = Math.round((targetGrams * 0.25) / 10) * 10;
      const w4 = targetGrams - w1 - w2 - w3;
      if (longNhanId) newWeights[longNhanId] = w1;
      if (dieuId) newWeights[dieuId] = w2;
      if (maccaId) newWeights[maccaId] = w3;
      if (biXanhId) newWeights[biXanhId] = w4;
      setCustomName("Mix Năng Lượng Đỉnh Cao");
      setCustomMessage("Tràn đầy năng lượng, bứt phá mọi mục tiêu");
      setNameError(null);
    } else {
      // 40% Long nhãn Tiến Vua, 35% Macca, 25% Hạt điều
      const w1 = Math.round((targetGrams * 0.4) / 10) * 10;
      const w2 = Math.round((targetGrams * 0.35) / 10) * 10;
      const w3 = targetGrams - w1 - w2;
      if (longNhanId) newWeights[longNhanId] = w1;
      if (maccaId) newWeights[maccaId] = w2;
      if (dieuId) newWeights[dieuId] = w3;
      setCustomName("Long Nhãn Tam Vị Tiến Vua");
      setCustomMessage("Kính chúc Quý Đối Tác vạn sự hanh thông, đại cát đại lợi");
      setNameError(null);
    }

    setWeights(newWeights);
  };

  // Danh sách các hạt đã chọn kèm % tỉ lệ
  const selectedNutsList = useMemo(() => {
    return ingredients
      .filter((ing) => (weights[ing.id] || 0) > 0)
      .map((ing) => {
        const grams = weights[ing.id] || 0;
        const percentage = targetGrams > 0 ? Math.round((grams * 100) / targetGrams) : 0;
        return {
          ingredientId: ing.id,
          name: ing.name,
          weightGrams: grams,
          percentage,
          imageUrl: ing.imageUrl,
        };
      });
  }, [ingredients, weights, targetGrams]);

  // Xử lý Thêm vào giỏ hàng (kiểm tra qua API Backend /api/custom-mix/validate trước khi lưu)
  const handleAddToCart = async (autoOpenCart = false) => {
    if (!isPerfectMatch || isValidating) return;
    setErrorMessage(null);

    // Bắt buộc nhập tên sản phẩm theo dấu * quy ước
    if (!customName.trim()) {
      setNameError("Vui lòng đặt tên cho sản phẩm tự chọn hạt của bạn trước khi thêm vào giỏ.");
      setErrorMessage("Vui lòng đặt tên cho sản phẩm tự chọn hạt của bạn trước khi thêm vào giỏ.");
      const inputEl = document.getElementById("customProductNameInput");
      if (inputEl) {
        inputEl.scrollIntoView({ behavior: "smooth", block: "center" });
        inputEl.focus();
      }
      return;
    }
    setNameError(null);
    setIsValidating(true);

    try {
      let validatedFixedPrice = activePackaging.fixedPrice;
      let validatedIngredients = selectedNutsList;

      try {
        const validateRes = await customMixApi.validate({
          packagingId: activePackaging.id,
          customProductName: customName.trim(),
          customLabelMessage: customMessage.trim() || undefined,
          ingredients: selectedNutsList.map((n) => ({
            ingredientId: n.ingredientId,
            weightGrams: n.weightGrams,
          })),
        });

        // Nếu backend phản hồi từ chối công thức (lỗi nghiệp vụ do server trả về)
        if (validateRes && !validateRes.isValid) {
          setErrorMessage(validateRes.message || "Công thức phối hạt chưa hợp lệ.");
          setIsValidating(false);
          return;
        }

        if (validateRes?.isValid) {
          if (validateRes.fixedPrice && validateRes.fixedPrice > 0) {
            validatedFixedPrice = validateRes.fixedPrice;
          }
          if (validateRes.ingredients?.length) {
            validatedIngredients = validateRes.ingredients.map((ing) => {
              const matched = ingredients.find((i) => i.id === ing.ingredientId);
              return {
                ingredientId: ing.ingredientId,
                name: ing.name || matched?.name || "Hạt dinh dưỡng",
                weightGrams: ing.weightGrams,
                percentage: ing.percentage ?? (targetGrams > 0 ? Math.round((ing.weightGrams * 100) / targetGrams) : 0),
                imageUrl: matched?.imageUrl || "/images/setqua.jpg",
              };
            });
          }
        }
      } catch (apiErr) {
        // Fallback an toàn: nếu API kiểm tra tạm thời gặp lỗi mạng / 404 / mất kết nối server,
        // vì công thức phía client đã được kiểm định đạt chuẩn chính xác (isPerfectMatch),
        // cho phép khách tiếp tục lưu vào giỏ hàng với công thức và đơn giá đã tính
        // để không làm gián đoạn trải nghiệm mua hàng (server sẽ thẩm định lại lần nữa khi tạo đơn).
        console.warn("API custom-mix validate unreachable or error, falling back to client-verified mix:", apiErr);
      }

      const payload: CustomMixItemDetailDto = {
        packagingId: activePackaging.id,
        packagingName: activePackaging.name,
        targetWeightGrams: activePackaging.capacityGrams,
        customProductName: customName.trim() || `Sản phẩm Tự Chọn Hạt (${activePackaging.capacityGrams}g)`,
        customLabelMessage: customMessage.trim() || undefined,
        ingredients: validatedIngredients,
        fixedPrice: validatedFixedPrice,
      };

      addCustomMixItem(payload, quantity, activePackaging.imageUrl);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3500);

      if (autoOpenCart) {
        openCart();
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error)?.message || "Không thể thêm vào giỏ hàng.");
    } finally {
      setIsValidating(false);
    }
  };

  // Mua ngay -> Validate qua API rồi mở drawer giỏ hàng
  const handleBuyNow = () => {
    if (!isPerfectMatch || isValidating) return;
    handleAddToCart(true);
  };

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#292524] font-sans selection:bg-[#B45309]/20 selection:text-[#B45309]">
      {/* HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#FDE68A]/60 shadow-xs">
        <div className="container mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-[#FDE68A]/30 text-primary transition-colors border border-border/60"
              aria-label="Quay lại Trang Chủ"
            >
              <ArrowLeft className="w-5 h-5 text-[#B45309]" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-bold text-[#B45309] bg-[#FEF3C7] border border-[#FDE68A] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Custom Mix Studio
                </span>
              </div>
              <h1 className="text-base sm:text-xl font-bold text-primary leading-tight mt-0.5">
                Xưởng Chế Tác Hạt Riêng
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={openCart}
              className="relative p-2 sm:px-4 sm:py-2 rounded-full bg-amber-50 hover:bg-amber-100 text-[#B45309] border border-amber-200 transition-all flex items-center gap-2 text-sm font-semibold shadow-sm active:scale-95 cursor-pointer"
              aria-label="Mở giỏ hàng"
            >
              <ShoppingBag className="w-5 h-5 text-[#B45309]" />
              <span className="hidden sm:inline">Giỏ hàng</span>
              {totalCartCount > 0 && (
                <span className="w-5 h-5 bg-red-500 text-white text-[11px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {totalCartCount > 99 ? "99+" : totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* TOAST THÀNH CÔNG */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 sm:right-8 z-50 bg-[#15803D] text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-400"
          >
            <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
            <div>
              <p className="font-bold text-sm">Đã thêm vào giỏ hàng!</p>
              <p className="text-xs text-emerald-100">Sản phẩm &ldquo;{customName}&rdquo; đã sẵn sàng thanh toán.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOAST LỖI TỪ SERVER */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 sm:right-8 z-50 bg-[#B91C1C] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-start gap-3 border border-red-400 max-w-md"
          >
            <AlertCircle className="w-5 h-5 text-white shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-sm">Chưa thể thêm vào giỏ hàng</p>
              <p className="text-xs text-red-100 mt-0.5 leading-relaxed">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-200 hover:text-white p-1 text-sm font-bold cursor-pointer"
              aria-label="Đóng"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>



      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-28 lg:pb-10 max-w-7xl">
        {/* INTRO HERO BANNER */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#23452F] via-[#2F5A3E] to-[#1C3625] text-white p-6 sm:p-10 mb-8 sm:mb-12 shadow-xl border border-emerald-900/40">
          <div className="relative z-10 max-w-3xl space-y-3">
            <span className="inline-block text-xs uppercase tracking-widest text-[#E9B949] font-bold">
              Đặc sản Phố Hiến độc bản
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#FFF9ED] leading-tight">
              Tự Tay Mix Hạt Theo Sở Thích & Đặt Tên Cho Tuyệt Tác Của Bạn
            </h2>
            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed font-light">
              Tự do lựa chọn tỉ lệ từ 5 loại hạt dinh dưỡng & đặc sản trứ danh. Đạt đúng khối lượng tịnh yêu cầu với mức giá cố định trọn gói, được in tem nhãn cá nhân hóa miễn phí.
            </p>
          </div>
          {/* Decorative glowing circle */}
          <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full bg-[#E9B949]/10 blur-3xl pointer-events-none" />
        </div>

        {/* WORKSPACE LAYOUT (2 COLUMNS) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI: BỘ ĐIỀU KHIỂN & CHỌN HẠT (7 CỘT) */}
          <div className="lg:col-span-7 space-y-8">
            {/* STEP 1: CHỌN QUY CÁCH BAO BÌ */}
            <section className="bg-white rounded-3xl p-5 sm:p-7 border border-[#FDE68A]/60 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#FDE68A]/40 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-[#B45309] text-white font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <h3 className="font-bold text-lg text-primary">Chọn Quy Cách & Khối Lượng</h3>
                </div>
                <span className="text-xs font-semibold text-accent">Giá trọn gói niêm yết</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {packagings.map((pkg) => {
                  const isSelected = pkg.id === selectedPackagingId;
                  return (
                    <button
                      key={pkg.id}
                      onClick={() => handleSelectPackaging(pkg)}
                      type="button"
                      className={`group text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all relative overflow-hidden flex flex-col justify-between ${
                        isSelected
                          ? "border-[#B45309] bg-[#FFFBEB] shadow-md ring-2 ring-[#B45309]/20"
                          : "border-border/60 hover:border-[#FDE68A] hover:bg-[#FFFDF8]"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5 z-10 w-5 h-5 rounded-full bg-[#B45309] text-white flex items-center justify-center shadow-sm">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div>
                        {/* Khung ảnh trọn vẹn quy cách bao bì không bị cắt xén */}
                        <div className="w-full h-52 sm:h-56 rounded-xl overflow-hidden mb-3 bg-[#FAF7F2] border border-amber-100/70 relative flex items-center justify-center p-2 shadow-2xs">
                          <FastImage
                            src={pkg.imageUrl}
                            alt={pkg.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 240px"
                            className="object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <h4 className="font-bold text-sm text-foreground leading-snug">{pkg.name}</h4>
                        <span className="inline-block mt-1 text-xs font-bold text-[#B45309] bg-[#FEF3C7] px-2 py-0.5 rounded-md">
                          Khối lượng: {pkg.capacityGrams}g
                        </span>
                        {pkg.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                            {pkg.description}
                          </p>
                        )}
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-border/40 flex items-baseline justify-between">
                        <span className="text-[11px] text-muted-foreground">Trọn gói:</span>
                        <span className="font-extrabold text-base text-[#B45309]">
                          {formatVND(pkg.fixedPrice)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* STEP 2: CHỌN & CHỈNH LƯỢNG 5 LOẠI HẠT */}
            <section className="bg-white rounded-3xl p-5 sm:p-7 border border-[#FDE68A]/60 shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#FDE68A]/40 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-[#B45309] text-white font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <div>
                    <h3 className="font-bold text-lg text-primary">Tinh Chỉnh Lượng Hạt</h3>
                    <p className="text-xs text-muted-foreground">Mục tiêu: Đạt đúng {targetGrams}g</p>
                  </div>
                </div>

                {/* Tiện ích thông minh */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAutoFillLongNhan}
                    disabled={remainingGrams <= 0}
                    type="button"
                    title="Tự động bù số gram còn thiếu bằng Long Nhãn"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shadow-2xs"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-amber-700" />
                    <span>Bù Long Nhãn</span>
                  </button>

                  <button
                    onClick={handleDistributeEqually}
                    type="button"
                    title="Chia đều khối lượng cho các loại hạt"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs font-semibold transition-all active:scale-95"
                  >
                    <Scale className="w-3.5 h-3.5 text-neutral-700" />
                    <span>Chia đều</span>
                  </button>

                  <button
                    onClick={handleReset}
                    type="button"
                    title="Đặt lại về 0g"
                    className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* THANH ĐO TIẾN TRÌNH TRÊN MOBILE (HIỂN THỊ NGAY TRONG BƯỚC 2 ĐỂ KHÔNG PHẢI CUỘN XUỐNG DƯỚI) */}
              <div className="lg:hidden bg-gradient-to-br from-[#FFFDF8] via-[#FFFBEB] to-[#FEF3C7]/40 rounded-2xl p-4 border-2 border-[#FDE68A] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center">
                      <Scale className="w-3.5 h-3.5 text-[#B45309]" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                      Đo lường dung tích
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${
                      isPerfectMatch
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : isOverweight
                        ? "bg-rose-50 text-rose-800 border-rose-300"
                        : "bg-amber-50 text-amber-800 border-amber-300"
                    }`}
                  >
                    {isPerfectMatch
                      ? "🟢 Chuẩn xác 100%"
                      : isOverweight
                      ? `🔴 Vượt ${Math.abs(remainingGrams)}g`
                      : `🟡 Còn thiếu ${remainingGrams}g`}
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-2xl font-extrabold text-primary font-mono tracking-tight">
                      {totalGrams}g
                      <span className="text-xs font-medium text-muted-foreground font-sans ml-1">
                        / {targetGrams}g
                      </span>
                    </span>
                    <span className="text-xs font-bold text-[#B45309]">
                      {progressPercent}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-3 bg-neutral-200/80 rounded-full overflow-hidden p-0.5 border border-border/60">
                    <motion.div
                      initial={false}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.25 }}
                      className={`h-full rounded-full transition-colors ${
                        isPerfectMatch
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                          : isOverweight
                          ? "bg-gradient-to-r from-rose-500 to-rose-600"
                          : "bg-gradient-to-r from-amber-400 to-[#B45309]"
                      }`}
                    />
                  </div>
                </div>

                <div className="text-xs leading-relaxed">
                  {isPerfectMatch ? (
                    <p className="text-emerald-800 bg-emerald-50/90 px-3 py-2 rounded-xl border border-emerald-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Tuyệt vời! Khối lượng hạt đã đạt đúng chuẩn <strong>{targetGrams}g</strong>. Bạn có thể sang Bước 3 đặt tên!</span>
                    </p>
                  ) : isOverweight ? (
                    <p className="text-rose-800 bg-rose-50/90 px-3 py-2 rounded-xl border border-rose-200 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Đã vượt quá <strong>{Math.abs(remainingGrams)}g</strong>. Vui lòng bấm dấu trừ để giảm bớt.</span>
                    </p>
                  ) : (
                    <p className="text-amber-900 bg-amber-50/90 px-3 py-2 rounded-xl border border-amber-200 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Cần chọn thêm <strong>{remainingGrams}g</strong> nữa để đóng gói hộp {targetGrams}g.</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Gợi ý công thức 1-click */}
              <div className="bg-[#FFFDF8] border border-[#FDE68A]/60 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5 shrink-0">
                  Công thức gợi ý:
                </span>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleApplyPreset("duong-nhan")}
                    type="button"
                    className="px-2.5 py-1 rounded-lg bg-white border border-[#FDE68A] hover:bg-[#FEF3C7] text-xs font-semibold text-[#B45309] transition-all shadow-2xs"
                  >
                    🌸 Dưỡng Nhan
                  </button>
                  <button
                    onClick={() => handleApplyPreset("nang-luong")}
                    type="button"
                    className="px-2.5 py-1 rounded-lg bg-white border border-[#FDE68A] hover:bg-[#FEF3C7] text-xs font-semibold text-[#B45309] transition-all shadow-2xs"
                  >
                    ⚡ Năng Lượng Gym
                  </button>
                  <button
                    onClick={() => handleApplyPreset("thuong-hang")}
                    type="button"
                    className="px-2.5 py-1 rounded-lg bg-white border border-[#FDE68A] hover:bg-[#FEF3C7] text-xs font-semibold text-[#B45309] transition-all shadow-2xs"
                  >
                    👑 Tiến Vua
                  </button>
                </div>
              </div>

              {/* GRID 5 LOẠI HẠT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ingredients.map((ing) => {
                  const currentWeight = weights[ing.id] || 0;
                  const isSelected = currentWeight > 0;

                  return (
                    <div
                      key={ing.id}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-[#B45309]/60 bg-[#FFFDF8] shadow-sm ring-1 ring-[#B45309]/30"
                          : "border-border/60 bg-white hover:border-[#FDE68A]/80"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => setPreviewNut(ing)}
                          className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden shrink-0 border border-border/60 bg-neutral-100 relative group cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-[#B45309]/50 transition-all hover:border-[#B45309]/60 text-left"
                          title={`Bấm để phóng to ảnh ${ing.name}`}
                          aria-label={`Phóng to ảnh ${ing.name}`}
                        >
                          <FastImage
                            src={ing.imageUrl}
                            alt={ing.name}
                            fill
                            sizes="72px"
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                          </div>
                          {/* Huy hiệu kính lúp nhỏ ở góc ảnh */}
                          <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center shadow-2xs pointer-events-none">
                            <ZoomIn className="w-2.5 h-2.5" />
                          </div>
                        </button>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-foreground leading-snug line-clamp-1">
                            {ing.name}
                          </h4>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                            {ing.tagline}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-foreground/70">
                            <span className="flex items-center gap-0.5 font-medium text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                              <Flame className="w-3 h-3 text-amber-600" /> {ing.caloriesPer100g} kcal/100g
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bộ điều khiển gram */}
                      <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 bg-neutral-100 rounded-xl p-1 border border-border/60">
                          <button
                            onClick={() => handleUpdateGrams(ing.id, currentWeight - 10)}
                            disabled={currentWeight <= 0}
                            type="button"
                            className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-primary hover:bg-[#FEF3C7] transition-colors disabled:opacity-30 disabled:hover:bg-white shadow-2xs"
                            aria-label={`Giảm ${ing.name}`}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <div className="w-14 text-center">
                            <span className="font-bold text-sm text-primary select-none">
                              {currentWeight}g
                            </span>
                          </div>

                          <button
                            onClick={() => handleUpdateGrams(ing.id, currentWeight + 10)}
                            disabled={totalGrams >= targetGrams}
                            type="button"
                            className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-primary hover:bg-[#FEF3C7] transition-colors disabled:opacity-30 disabled:hover:bg-white shadow-2xs"
                            aria-label={`Tăng ${ing.name}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Nút tắt nhanh: +50g (bội số của bước 10g để backend luôn chấp nhận) */}
                        <button
                          onClick={() => handleUpdateGrams(ing.id, currentWeight + 50)}
                          disabled={totalGrams + 50 > targetGrams}
                          type="button"
                          className="px-2 py-1 rounded-lg bg-neutral-50 hover:bg-[#FEF3C7] border border-border/80 text-[11px] font-semibold text-neutral-700 transition-colors disabled:opacity-30"
                        >
                          +50g
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* STEP 3: ĐẶT TÊN SẢN PHẨM & LỜI CHÚC */}
            <section id="step3Section" className="bg-white rounded-3xl p-5 sm:p-7 border border-[#FDE68A]/60 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 border-b border-[#FDE68A]/40 pb-3">
                <span className="w-7 h-7 rounded-full bg-[#B45309] text-white font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <div>
                  <h3 className="font-bold text-lg text-primary">Cá Nhân Hóa Sản Phẩm Của Bạn</h3>
                  <p className="text-xs text-muted-foreground">Đặt tên & in thông điệp trên tem nhãn riêng miễn phí</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="customProductNameInput" className="text-xs font-bold text-foreground uppercase tracking-wide block mb-1.5">
                    Tên sản phẩm của bạn <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="customProductNameInput"
                    type="text"
                    maxLength={50}
                    value={customName}
                    onChange={(e) => {
                      setCustomName(e.target.value);
                      if (nameError && e.target.value.trim()) setNameError(null);
                    }}
                    placeholder="Ví dụ: Hộp Dưỡng Nhan Mẹ Yêu, Mix Năng Lượng Của Nam..."
                    className={`w-full bg-[#FFFDF8] border rounded-2xl px-4 py-3 text-sm font-semibold text-primary outline-none transition-all ${
                      nameError
                        ? "border-red-500 ring-2 ring-red-200"
                        : "border-border/80 focus:border-[#B45309] focus:ring-1 focus:ring-[#B45309]"
                    }`}
                  />
                  {nameError ? (
                    <p className="text-xs text-red-600 font-semibold mt-1.5 flex items-center gap-1">
                      <span>⚠️</span> {nameError}
                    </p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Tên này sẽ được in nổi bật ở trung tâm tem nhãn sản phẩm.
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="customLabelMessageInput" className="text-xs font-bold text-foreground uppercase tracking-wide block mb-1.5">
                    Lời chúc / Thông điệp in nhãn (Tùy chọn)
                  </label>
                  <input
                    id="customLabelMessageInput"
                    type="text"
                    maxLength={80}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Ví dụ: Kính chúc Mẹ luôn bình an, chúc mừng sinh nhật..."
                    className="w-full bg-[#FFFDF8] border border-border/80 rounded-2xl px-4 py-3 text-sm text-foreground outline-none focus:border-[#B45309] focus:ring-1 focus:ring-[#B45309] transition-all"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Dòng chữ trang trọng gửi gắm tình cảm đến người nhận quà.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* CỘT PHẢI: THANH TIẾN TRÌNH & BẢN XEM TRƯỚC TEM NHÃN 3D (5 CỘT) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            {/* THANH ĐO TIẾN TRÌNH KHỐI LƯỢNG MỤC TIÊU (DESKTOP) */}
            <div className="hidden lg:block bg-white rounded-3xl p-5 sm:p-6 border border-[#FDE68A]/60 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Đo lường dung tích
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                    isPerfectMatch
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                      : isOverweight
                      ? "bg-rose-50 text-rose-800 border-rose-300"
                      : "bg-amber-50 text-amber-800 border-amber-300"
                  }`}
                >
                  {isPerfectMatch
                    ? "🟢 Chuẩn xác 100%"
                    : isOverweight
                    ? "🔴 Quá tải"
                    : `🟡 Còn thiếu ${remainingGrams}g`}
                </span>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-2xl font-extrabold text-primary font-mono">
                    {totalGrams}g
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground">
                    Mục tiêu: <strong className="text-foreground">{targetGrams}g</strong>
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3.5 bg-neutral-100 rounded-full overflow-hidden p-0.5 border border-border/60">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.3 }}
                    className={`h-full rounded-full transition-colors ${
                      isPerfectMatch
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                        : isOverweight
                        ? "bg-gradient-to-r from-rose-500 to-rose-600"
                        : "bg-gradient-to-r from-amber-400 to-[#B45309]"
                    }`}
                  />
                </div>
              </div>

              {/* Thông báo hướng dẫn */}
              <div className="text-xs">
                {isPerfectMatch ? (
                  <p className="text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Tuyệt vời! Khối lượng hạt đã đạt đúng {targetGrams}g của bao bì.</span>
                  </p>
                ) : isOverweight ? (
                  <p className="text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Bạn đã chọn vượt quá {Math.abs(remainingGrams)}g. Vui lòng giảm bớt hạt.</span>
                  </p>
                ) : (
                  <p className="text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Cần thêm {remainingGrams}g hạt nữa để hoàn tất đóng gói.</span>
                  </p>
                )}
              </div>
            </div>

            {/* LIVE PRODUCT & LABEL PREVIEW (MÔ PHỎNG TEM NHÃN ẢO) */}
            <div className="bg-[#23452F] rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-emerald-900/60 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4 border-b border-emerald-800/80 pb-3">
                <span className="text-xs uppercase tracking-widest text-[#E9B949] font-bold flex items-center gap-1.5">
                  <Package className="w-4 h-4" /> Bản xem trước nhãn dán
                </span>
                <span className="text-[11px] text-emerald-200/80">Khối lượng: {targetGrams}g</span>
              </div>

              {/* TEM NHÃN HOÀNG GIA DÁN TRÊN HỘP/TÚI */}
              <div className="bg-[#FFF9ED] text-[#292524] rounded-2xl p-5 sm:p-6 shadow-2xl border-2 border-[#E9B949] relative">
                {/* Viền hoa văn cổ */}
                <div className="border border-[#B45309]/30 p-4 rounded-xl space-y-3.5 text-center relative bg-[radial-gradient(#FDE68A_1px,transparent_1px)] [background-size:16px_16px]">
                  {/* Brand header */}
                  <div>
                    <h5 className="text-[11px] uppercase tracking-widest font-extrabold text-[#B45309]">
                      NGUYỆT NHÃN PHỐ HIẾN
                    </h5>
                    <p className="text-[9px] text-[#78350F] italic">Tinh Hoa Đất Phố Hiến Ngàn Năm</p>
                  </div>

                  {/* Tên do khách đặt */}
                  <div className="py-2 border-y border-[#B45309]/20">
                    <span
                      style={{ fontFamily: "var(--font-dancing)" }}
                      className="text-2xl sm:text-3xl font-bold text-[#B45309] block leading-tight tracking-wide"
                    >
                      {customName.trim() || "Sản Phẩm Tự Chọn Hạt"}
                    </span>
                    {customMessage.trim() && (
                      <p className="text-xs text-[#78350F] italic mt-1 font-sans">
                        &ldquo;{customMessage.trim()}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Bảng % thành phần hạt */}
                  <div className="text-left space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#78350F] block">
                      Thành phần định lượng:
                    </span>
                    {selectedNutsList.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedNutsList.map((nut) => (
                          <span
                            key={nut.ingredientId}
                            className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] px-2 py-0.5 rounded-md"
                          >
                            <span>{nut.name}</span>
                            <span className="text-amber-800">({nut.weightGrams}g - {nut.percentage}%)</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground italic">
                        Chưa chọn hạt nào...
                      </p>
                    )}
                  </div>

                  {/* Thông tin NSX & Quy cách */}
                  <div className="pt-2 border-t border-[#B45309]/20 flex items-center justify-between text-[10px] text-neutral-600 font-medium">
                    <span>Quy cách: {activePackaging.capacityGrams}g</span>
                    <span>Ngày đóng gói: {todayStr}</span>
                    <span>HSD: 6 tháng</span>
                  </div>
                </div>
              </div>

              {/* TÓM TẮT GIÁ & NÚT ĐẶT HÀNG */}
              <div className="mt-6 pt-5 border-t border-emerald-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-emerald-200 block">Tổng thanh toán trọn gói:</span>
                    <span className="text-2xl font-extrabold text-[#E9B949]">
                      {formatVND(activePackaging.fixedPrice * quantity)}
                    </span>
                  </div>

                  {/* Số lượng */}
                  <div className="flex items-center gap-1 bg-emerald-950/80 rounded-xl p-1 border border-emerald-800">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      type="button"
                      className="w-7 h-7 rounded-lg bg-emerald-900 flex items-center justify-center text-emerald-200 hover:text-white"
                      aria-label="Giảm số lượng hộp"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-bold text-sm text-white">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      type="button"
                      className="w-7 h-7 rounded-lg bg-emerald-900 flex items-center justify-center text-emerald-200 hover:text-white"
                      aria-label="Tăng số lượng hộp"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleAddToCart(false)}
                    disabled={!isPerfectMatch || isValidating}
                    type="button"
                    className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-neutral-100 text-primary font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed active:scale-98 cursor-pointer"
                  >
                    {isValidating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#B45309]" />
                        <span>Đang kiểm tra...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4 text-[#B45309]" />
                        <span>Thêm Giỏ Hàng</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleBuyNow}
                    disabled={!isPerfectMatch || isValidating}
                    type="button"
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#D97706] to-[#B45309] hover:from-[#B45309] hover:to-[#92400E] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-950/40 disabled:opacity-40 disabled:cursor-not-allowed active:scale-98 cursor-pointer"
                  >
                    {isValidating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Đang kiểm tra...</span>
                      </>
                    ) : (
                      <span>Mua Ngay</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* THANH ĐO LƯỜNG DUNG TÍCH CỐ ĐỊNH DƯỚI ĐÁY MÀN HÌNH (STICKY BOTTOM BAR CHO MOBILE) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#FDE68A] shadow-[0_-6px_25px_rgba(0,0,0,0.12)] px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          {/* Cụm đo lường khối lượng */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-primary flex items-center gap-1">
                <span>Dung tích:</span>
                <strong className="text-sm font-extrabold text-[#B45309] font-mono">
                  {totalGrams}g
                </strong>
                <span className="text-[11px] text-muted-foreground font-normal">
                  /{targetGrams}g
                </span>
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isPerfectMatch
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : isOverweight
                    ? "bg-rose-50 text-rose-800 border-rose-300"
                    : "bg-amber-50 text-amber-800 border-amber-300"
                }`}
              >
                {isPerfectMatch
                  ? "🟢 Đã đủ 100%"
                  : isOverweight
                  ? `🔴 Thừa ${Math.abs(remainingGrams)}g (${progressPercent}%)`
                  : `🟡 Thiếu ${remainingGrams}g (${progressPercent}%)`}
              </span>
            </div>

            {/* Thanh tiến trình mini */}
            <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden border border-border/60">
              <div
                style={{ width: `${progressPercent}%` }}
                className={`h-full rounded-full transition-all duration-300 ${
                  isPerfectMatch
                    ? "bg-emerald-500"
                    : isOverweight
                    ? "bg-rose-500"
                    : "bg-gradient-to-r from-amber-400 to-[#B45309]"
                }`}
              />
            </div>
          </div>

          {/* Nút hành động nhanh */}
          <div className="shrink-0 flex items-center gap-1.5">
            {remainingGrams > 0 ? (
              <button
                type="button"
                onClick={handleAutoFillLongNhan}
                className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-[#78350F] text-xs font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer shadow-2xs"
                title="Tự động bù số gram còn thiếu bằng Long Nhãn"
              >
                <Wand2 className="w-3.5 h-3.5 text-amber-700" />
                <span>Bù đầy</span>
              </button>
            ) : isPerfectMatch ? (
              <button
                type="button"
                onClick={() => {
                  const step3 = document.getElementById("step3Section");
                  if (step3) {
                    step3.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1 shadow-md shadow-emerald-950/20 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Đặt tên</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReset}
                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt lại</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MODAL PHÓNG TO HÌNH ẢNH HẠT */}
      <AnimatePresence>
        {previewNut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setPreviewNut(null)}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label={`Xem ảnh lớn ${previewNut.name}`}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm sm:max-w-md bg-stone-900 rounded-3xl overflow-hidden shadow-2xl border border-amber-500/30 flex flex-col"
            >
              {/* Nút đóng */}
              <button
                type="button"
                onClick={() => setPreviewNut(null)}
                className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors border border-white/20 cursor-pointer shadow-md"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Khung ảnh phóng to sắc nét */}
              <div className="relative w-full aspect-square bg-stone-950 flex items-center justify-center overflow-hidden">
                <FastImage
                  src={previewNut.imageUrl}
                  alt={previewNut.name}
                  fill
                  sizes="(max-width: 640px) 90vw, 450px"
                  className="object-cover"
                  priority
                />
              </div>

              {/* Thông tin chi tiết loại hạt */}
              <div className="p-4 sm:p-5 bg-gradient-to-b from-stone-900 to-stone-950 text-white space-y-2 border-t border-amber-500/20">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-base sm:text-lg text-[#FFF9ED]">
                    {previewNut.name}
                  </h3>
                  <span className="shrink-0 flex items-center gap-1 font-semibold text-xs text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>{previewNut.caloriesPer100g} kcal/100g</span>
                  </span>
                </div>
                {previewNut.tagline && (
                  <p className="text-xs text-amber-200/90 leading-relaxed font-light">
                    {previewNut.tagline}
                  </p>
                )}
                {previewNut.description && (
                  <p className="text-xs text-stone-300 leading-relaxed font-light line-clamp-3">
                    {previewNut.description}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NÚT GIỎ HÀNG NỔI & DRAWER */}
      <CartButton />
      <CartDrawer
        language="vi"
        onCheckout={() => {
          // Đóng drawer trước khi sang trang đặt hàng: nếu để mở, overlay + khoá
          // scroll của giỏ hàng sẽ phủ lên form khi trang chủ vừa hiển thị.
          closeCart();
          router.push("/#dat-hang");
        }}
      />
    </div>
  );
}

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
  Globe,
} from "lucide-react";
import { useCartStore } from "@/stores/useCartStore";
import { useLanguageStore } from "@/store/useLanguageStore";
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
    imageUrl: "/images/nuts/longnhanomsen.jpg",
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

function getPackagingTranslation(pkg: CustomPackaging, language: "vi" | "en") {
  if (language === "vi") return { name: pkg.name, description: pkg.description };
  const lower = (pkg.name || "").toLowerCase();
  if (pkg.capacityGrams === 150 || lower.includes("zip")) {
    return {
      name: "Airtight Zipper Pouch",
      description: "Silver-lined airtight zip bag, retaining pristine crispness and aroma, convenient for everyday carry.",
    };
  }
  if (pkg.capacityGrams === 300 || lower.includes("nhựa") || lower.includes("mica")) {
    return {
      name: "Crystal Clear Mica Jar",
      description: "Premium round mica jar with peelable aluminum seal, optimal preservation, showcasing distinct layered nuts.",
    };
  }
  if (pkg.capacityGrams === 900 || lower.includes("quà") || lower.includes("gift") || lower.includes("hộp")) {
    return {
      name: "Royal Heritage Gift Box",
      description: "Luxury gift set celebrating thousand-year Pho Hien heritage with an elegant gift bag, a supreme gesture of affection.",
    };
  }
  return { name: pkg.name, description: pkg.description };
}

function getIngredientTranslation(ing: CustomIngredient, language: "vi" | "en") {
  if (language === "vi") return { name: ing.name, tagline: ing.tagline, description: ing.description };
  const lower = (ing.name || "").toLowerCase();
  if (lower.includes("nhãn") || lower.includes("longan")) {
    return {
      name: "Selected Pho Hien Dried Longan",
      tagline: "Royal tribute delicacy, nourishes blood, eases mind & promotes deep sleep",
      description: "Thick, chewy, fragrant pulp in translucent amber-gold, masterfully convection dried, subtly sweet and 100% natural.",
    };
  }
  if (lower.includes("macca") || lower.includes("mắc ca")) {
    return {
      name: "Highland Macadamia (Shelled)",
      tagline: "Rich in Omega-7 and heart-healthy monounsaturated fats",
      description: "Queen of nuts, ivory-white kernels creamy and fragrant, melting gently on the tongue.",
    };
  }
  if (lower.includes("điều") || lower.includes("dieu")) {
    return {
      name: "Binh Phuoc Roasted Cashews (Grade A+)",
      tagline: "Rich in plant protein, boosting vitality & energy",
      description: "Plump, full-bodied cashew nuts, naturally dry-roasted to preserve crisp crunch and buttery sweet notes.",
    };
  }
  if (lower.includes("hạnh nhân") || lower.includes("hanh nhan")) {
    return {
      name: "California Dry Roasted Almonds",
      tagline: "Abundant Vitamin E & dietary fiber, supporting fitness & glowing skin",
      description: "Whole almonds roasted au naturel, crunchy, deeply fragrant and nutrient-dense.",
    };
  }
  if (lower.includes("bí") || lower.includes("bi")) {
    return {
      name: "Indian Green Pumpkin Seeds",
      tagline: "Rich in zinc & magnesium, strengthening immune defense",
      description: "Uniform jade-green kernels, pleasantly savory and mild, dry roasted to light crunchiness.",
    };
  }
  return { name: ing.name, tagline: ing.tagline, description: ing.description };
}

function formatPrice(amount: number, language: "vi" | "en") {
  if (language === "en") {
    return `$${(amount / 25000).toFixed(2)}`;
  }
  return amount.toLocaleString("vi-VN").replace(/,/g, ".") + "đ";
}

export default function CustomMixStudio() {
  const router = useRouter();
  const { language, setLanguage } = useLanguageStore();
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
  const [customName, setCustomName] = useState<string>(
    language === "en" ? "Mom's Radiance Box" : "Hộp Dưỡng Nhan Cho Mẹ"
  );
  const [customMessage, setCustomMessage] = useState<string>(
    language === "en" ? "Wishing Mom peace, youthfulness & radiant joy" : "Kính chúc Mẹ vạn sự bình an & trẻ đẹp"
  );
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
      setCustomName(language === "en" ? "Radiance & Beauty Blend" : "Hộp Dưỡng Nhan Thanh Tâm");
      setCustomMessage(
        language === "en"
          ? "Wishing Mom endless peace, youthfulness and sound sleep"
          : "Kính chúc Mẹ luôn bình an, tươi trẻ và ngủ thật ngon"
      );
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
      setCustomName(language === "en" ? "Peak Performance Energy Mix" : "Mix Năng Lượng Đỉnh Cao");
      setCustomMessage(
        language === "en"
          ? "Full of vital energy to break every boundary"
          : "Tràn đầy năng lượng, bứt phá mọi mục tiêu"
      );
      setNameError(null);
    } else {
      // 40% Long nhãn Tiến Vua, 35% Macca, 25% Hạt điều
      const w1 = Math.round((targetGrams * 0.4) / 10) * 10;
      const w2 = Math.round((targetGrams * 0.35) / 10) * 10;
      const w3 = targetGrams - w1 - w2;
      if (longNhanId) newWeights[longNhanId] = w1;
      if (maccaId) newWeights[maccaId] = w2;
      if (dieuId) newWeights[dieuId] = w3;
      setCustomName(language === "en" ? "Pho Hien Royal Trio" : "Long Nhãn Tam Vị Tiến Vua");
      setCustomMessage(
        language === "en"
          ? "Wishing our esteemed partner prosperity, fortune and triumph"
          : "Kính chúc Quý Đối Tác vạn sự hanh thông, đại cát đại lợi"
      );
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
        const trans = getIngredientTranslation(ing, language as "vi" | "en");
        return {
          ingredientId: ing.id,
          name: trans.name,
          weightGrams: grams,
          percentage,
          imageUrl: ing.imageUrl,
        };
      });
  }, [ingredients, weights, targetGrams, language]);

  // Xử lý Thêm vào giỏ hàng (kiểm tra qua API Backend /api/custom-mix/validate trước khi lưu)
  const handleAddToCart = async (autoOpenCart = false) => {
    if (!isPerfectMatch || isValidating) return;
    setErrorMessage(null);

    // Bắt buộc nhập tên sản phẩm theo dấu * quy ước
    if (!customName.trim()) {
      const msg = language === "en"
        ? "Please name your custom mix product before adding to cart."
        : "Vui lòng đặt tên cho sản phẩm tự chọn hạt của bạn trước khi thêm vào giỏ.";
      setNameError(msg);
      setErrorMessage(msg);
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
          setErrorMessage(validateRes.message || (language === "en" ? "Nut recipe proportions are invalid." : "Công thức phối hạt chưa hợp lệ."));
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
              const trans = matched ? getIngredientTranslation(matched, language as "vi" | "en") : null;
              return {
                ingredientId: ing.ingredientId,
                name: (language === "en" ? trans?.name : ing.name) || matched?.name || (language === "en" ? "Nutrient Seed" : "Hạt dinh dưỡng"),
                weightGrams: ing.weightGrams,
                percentage: ing.percentage ?? (targetGrams > 0 ? Math.round((ing.weightGrams * 100) / targetGrams) : 0),
                imageUrl: matched?.imageUrl || "/images/setqua.jpg",
              };
            });
          }
        }
      } catch (apiErr) {
        console.warn("API custom-mix validate unreachable or error, falling back to client-verified mix:", apiErr);
      }

      const activePkgTrans = getPackagingTranslation(activePackaging, language as "vi" | "en");
      const defaultName = language === "en"
        ? `Custom Nut Blend (${activePackaging.capacityGrams}g)`
        : `Sản phẩm Tự Chọn Hạt (${activePackaging.capacityGrams}g)`;

      const payload: CustomMixItemDetailDto = {
        packagingId: activePackaging.id,
        packagingName: activePkgTrans.name,
        targetWeightGrams: activePackaging.capacityGrams,
        customProductName: customName.trim() || defaultName,
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
      setErrorMessage((err as Error)?.message || (language === "en" ? "Could not add item to cart." : "Không thể thêm vào giỏ hàng."));
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
    if (language === "en") {
      return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")}/${d.getFullYear()}`;
    }
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
  }, [language]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#292524] font-sans selection:bg-[#B45309]/20 selection:text-[#B45309]">
      {/* HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#FDE68A]/60 shadow-xs">
        <div className="container mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-[#FDE68A]/30 text-primary transition-colors border border-border/60"
              aria-label={language === "en" ? "Back to Home" : "Quay lại Trang Chủ"}
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
                {language === "en" ? "Artisan Custom Nut Atelier" : "Xưởng Chế Tác Hạt Riêng"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Nút chuyển đổi ngôn ngữ đồng bộ toàn bộ app */}
            <button
              type="button"
              onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
              className="px-3 py-1.5 rounded-full border border-amber-300 bg-amber-50 hover:bg-amber-100 text-[#B45309] text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              aria-label={language === "en" ? "Switch to Vietnamese" : "Chuyển sang Tiếng Anh"}
            >
              <Globe className="w-3.5 h-3.5 text-[#B45309]" />
              <span>{language === "en" ? "EN" : "VI"}</span>
            </button>

            <button
              type="button"
              onClick={openCart}
              className="relative p-2 sm:px-4 sm:py-2 rounded-full bg-amber-50 hover:bg-amber-100 text-[#B45309] border border-amber-200 transition-all flex items-center gap-2 text-sm font-semibold shadow-sm active:scale-95 cursor-pointer"
              aria-label={language === "en" ? "Open Cart" : "Mở giỏ hàng"}
            >
              <ShoppingBag className="w-5 h-5 text-[#B45309]" />
              <span className="hidden sm:inline">{language === "en" ? "Cart" : "Giỏ hàng"}</span>
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
              <p className="font-bold text-sm">
                {language === "en" ? "Added to Cart!" : "Đã thêm vào giỏ hàng!"}
              </p>
              <p className="text-xs text-emerald-100">
                {language === "en"
                  ? `Product "${customName}" is ready for checkout.`
                  : `Sản phẩm "${customName}" đã sẵn sàng thanh toán.`}
              </p>
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
              <p className="font-bold text-sm">
                {language === "en" ? "Unable to Add to Cart" : "Chưa thể thêm vào giỏ hàng"}
              </p>
              <p className="text-xs text-red-100 mt-0.5 leading-relaxed">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-200 hover:text-white p-1 text-sm font-bold cursor-pointer"
              aria-label={language === "en" ? "Close" : "Đóng"}
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
              {language === "en" ? "Exclusive Pho Hien Specialty" : "Đặc sản Phố Hiến độc bản"}
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#FFF9ED] leading-tight">
              {language === "en"
                ? "Craft Your Custom Nut Blend & Name Your Own Masterpiece"
                : "Tự Tay Mix Hạt Theo Sở Thích & Đặt Tên Cho Tuyệt Tác Của Bạn"}
            </h2>
            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed font-light">
              {language === "en"
                ? "Freely blend proportions from 5 celebrated nuts and delicacies. Match the exact target weight at a fixed all-inclusive price, complete with complimentary custom label printing."
                : "Tự do lựa chọn tỉ lệ từ 5 loại hạt dinh dưỡng & đặc sản trứ danh. Đạt đúng khối lượng tịnh yêu cầu với mức giá cố định trọn gói, được in tem nhãn cá nhân hóa miễn phí."}
            </p>
          </div>
          {/* Decorative glowing circle dùng Radial Gradient thuần */}
          <div
            className="absolute right-0 bottom-0 w-64 h-64 pointer-events-none"
            style={{
              background: "radial-gradient(circle at 80% 80%, rgba(233, 185, 73, 0.25) 0%, transparent 70%)",
            }}
          />
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
                  <h3 className="font-bold text-lg text-primary">
                    {language === "en" ? "Select Packaging & Weight" : "Chọn Quy Cách & Khối Lượng"}
                  </h3>
                </div>
                <span className="text-xs font-semibold text-accent">
                  {language === "en" ? "All-inclusive fixed price" : "Giá trọn gói niêm yết"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {packagings.map((pkg) => {
                  const isSelected = pkg.id === selectedPackagingId;
                  const pkgTrans = getPackagingTranslation(pkg, language as "vi" | "en");
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
                            alt={pkgTrans.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 240px"
                            className="object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <h4 className="font-bold text-sm text-foreground leading-snug">{pkgTrans.name}</h4>
                        <span className="inline-block mt-1 text-xs font-bold text-[#B45309] bg-[#FEF3C7] px-2 py-0.5 rounded-md">
                          {language === "en" ? `Net weight: ${pkg.capacityGrams}g` : `Khối lượng: ${pkg.capacityGrams}g`}
                        </span>
                        {pkgTrans.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                            {pkgTrans.description}
                          </p>
                        )}
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-border/40 flex items-baseline justify-between">
                        <span className="text-[11px] text-muted-foreground">
                          {language === "en" ? "All-inclusive:" : "Trọn gói:"}
                        </span>
                        <span className="font-extrabold text-base text-[#B45309]">
                          {formatPrice(pkg.fixedPrice, language as "vi" | "en")}
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
                    <h3 className="font-bold text-lg text-primary">
                      {language === "en" ? "Fine-Tune Nut Proportions" : "Tinh Chỉnh Lượng Hạt"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {language === "en" ? `Target: Exact ${targetGrams}g` : `Mục tiêu: Đạt đúng ${targetGrams}g`}
                    </p>
                  </div>
                </div>

                {/* Tiện ích thông minh */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAutoFillLongNhan}
                    disabled={remainingGrams <= 0}
                    type="button"
                    title={language === "en" ? "Automatically fill remaining grams with Longan" : "Tự động bù số gram còn thiếu bằng Long Nhãn"}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shadow-2xs"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-amber-700" />
                    <span>{language === "en" ? "Fill Longan" : "Bù Long Nhãn"}</span>
                  </button>

                  <button
                    onClick={handleDistributeEqually}
                    type="button"
                    title={language === "en" ? "Distribute weight equally among nuts" : "Chia đều khối lượng cho các loại hạt"}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs font-semibold transition-all active:scale-95"
                  >
                    <Scale className="w-3.5 h-3.5 text-neutral-700" />
                    <span>{language === "en" ? "Split Equally" : "Chia đều"}</span>
                  </button>

                  <button
                    onClick={handleReset}
                    type="button"
                    title={language === "en" ? "Reset to 0g" : "Đặt lại về 0g"}
                    className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* THANH ĐO TIẾN TRÌNH TRÊN MOBILE */}
              <div className="lg:hidden bg-gradient-to-br from-[#FFFDF8] via-[#FFFBEB] to-[#FEF3C7]/40 rounded-2xl p-4 border-2 border-[#FDE68A] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center">
                      <Scale className="w-3.5 h-3.5 text-[#B45309]" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                      {language === "en" ? "Capacity Meter" : "Đo lường dung tích"}
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
                      ? (language === "en" ? "🟢 100% Exact Match" : "🟢 Chuẩn xác 100%")
                      : isOverweight
                      ? (language === "en" ? `🔴 Over by ${Math.abs(remainingGrams)}g` : `🔴 Vượt ${Math.abs(remainingGrams)}g`)
                      : (language === "en" ? `🟡 Need ${remainingGrams}g more` : `🟡 Còn thiếu ${remainingGrams}g`)}
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
                      <span>
                        {language === "en" ? (
                          <>Wonderful! Total weight is exactly <strong>{targetGrams}g</strong>. Proceed to Step 3 to name your blend!</>
                        ) : (
                          <>Tuyệt vời! Khối lượng hạt đã đạt đúng chuẩn <strong>{targetGrams}g</strong>. Bạn có thể sang Bước 3 đặt tên!</>
                        )}
                      </span>
                    </p>
                  ) : isOverweight ? (
                    <p className="text-rose-800 bg-rose-50/90 px-3 py-2 rounded-xl border border-rose-200 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>
                        {language === "en" ? (
                          <>Exceeded by <strong>{Math.abs(remainingGrams)}g</strong>. Please tap minus button to reduce.</>
                        ) : (
                          <>Đã vượt quá <strong>{Math.abs(remainingGrams)}g</strong>. Vui lòng bấm dấu trừ để giảm bớt.</>
                        )}
                      </span>
                    </p>
                  ) : (
                    <p className="text-amber-900 bg-amber-50/90 px-3 py-2 rounded-xl border border-amber-200 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        {language === "en" ? (
                          <>Need <strong>{remainingGrams}g</strong> more to complete your {targetGrams}g package.</>
                        ) : (
                          <>Cần chọn thêm <strong>{remainingGrams}g</strong> nữa để đóng gói hộp {targetGrams}g.</>
                        )}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* Gợi ý công thức 1-click */}
              <div className="bg-[#FFFDF8] border border-[#FDE68A]/60 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5 shrink-0">
                  {language === "en" ? "Suggested Recipes:" : "Công thức gợi ý:"}
                </span>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleApplyPreset("duong-nhan")}
                    type="button"
                    className="px-2.5 py-1 rounded-lg bg-white border border-[#FDE68A] hover:bg-[#FEF3C7] text-xs font-semibold text-[#B45309] transition-all shadow-2xs"
                  >
                    {language === "en" ? "🌸 Radiance Glow" : "🌸 Dưỡng Nhan"}
                  </button>
                  <button
                    onClick={() => handleApplyPreset("nang-luong")}
                    type="button"
                    className="px-2.5 py-1 rounded-lg bg-white border border-[#FDE68A] hover:bg-[#FEF3C7] text-xs font-semibold text-[#B45309] transition-all shadow-2xs"
                  >
                    {language === "en" ? "⚡ Active Energy" : "⚡ Năng Lượng Gym"}
                  </button>
                  <button
                    onClick={() => handleApplyPreset("thuong-hang")}
                    type="button"
                    className="px-2.5 py-1 rounded-lg bg-white border border-[#FDE68A] hover:bg-[#FEF3C7] text-xs font-semibold text-[#B45309] transition-all shadow-2xs"
                  >
                    {language === "en" ? "👑 Royal Banquet" : "👑 Tiến Vua"}
                  </button>
                </div>
              </div>

              {/* GRID 5 LOẠI HẠT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ingredients.map((ing) => {
                  const currentWeight = weights[ing.id] || 0;
                  const isSelected = currentWeight > 0;
                  const ingTrans = getIngredientTranslation(ing, language as "vi" | "en");

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
                          title={language === "en" ? `Click to enlarge ${ingTrans.name}` : `Bấm để phóng to ảnh ${ing.name}`}
                          aria-label={language === "en" ? `Enlarge image ${ingTrans.name}` : `Phóng to ảnh ${ing.name}`}
                        >
                          <FastImage
                            src={ing.imageUrl}
                            alt={ingTrans.name}
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
                            {ingTrans.name}
                          </h4>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                            {ingTrans.tagline}
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
                            aria-label={language === "en" ? `Decrease ${ingTrans.name}` : `Giảm ${ing.name}`}
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
                            aria-label={language === "en" ? `Increase ${ingTrans.name}` : `Tăng ${ing.name}`}
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
                  <h3 className="font-bold text-lg text-primary">
                    {language === "en" ? "Personalize Your Product" : "Cá Nhân Hóa Sản Phẩm Của Bạn"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {language === "en"
                      ? "Name & print custom message on bespoke label for free"
                      : "Đặt tên & in thông điệp trên tem nhãn riêng miễn phí"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="customProductNameInput" className="text-xs font-bold text-foreground uppercase tracking-wide block mb-1.5">
                    {language === "en" ? "Your Custom Product Name" : "Tên sản phẩm của bạn"}{" "}
                    <span className="text-red-500">*</span>
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
                    placeholder={
                      language === "en"
                        ? "e.g., Mom's Glow Box, Daily Energy Mix..."
                        : "Ví dụ: Hộp Dưỡng Nhan Mẹ Yêu, Mix Năng Lượng Của Nam..."
                    }
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
                      {language === "en"
                        ? "This name will be printed prominently at the center of your label."
                        : "Tên này sẽ được in nổi bật ở trung tâm tem nhãn sản phẩm."}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="customLabelMessageInput" className="text-xs font-bold text-foreground uppercase tracking-wide block mb-1.5">
                    {language === "en"
                      ? "Gift Dedication / Message on Label (Optional)"
                      : "Lời chúc / Thông điệp in nhãn (Tùy chọn)"}
                  </label>
                  <input
                    id="customLabelMessageInput"
                    type="text"
                    maxLength={80}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder={
                      language === "en"
                        ? "e.g., Wishing you joyful days, happy birthday..."
                        : "Ví dụ: Kính chúc Mẹ luôn bình an, chúc mừng sinh nhật..."
                    }
                    className="w-full bg-[#FFFDF8] border border-border/80 rounded-2xl px-4 py-3 text-sm text-foreground outline-none focus:border-[#B45309] focus:ring-1 focus:ring-[#B45309] transition-all"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {language === "en"
                      ? "An affectionate dedication to the recipient."
                      : "Dòng chữ trang trọng gửi gắm tình cảm đến người nhận quà."}
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
                  {language === "en" ? "Capacity Meter" : "Đo lường dung tích"}
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
                    ? (language === "en" ? "🟢 100% Exact Match" : "🟢 Chuẩn xác 100%")
                    : isOverweight
                    ? (language === "en" ? "🔴 Overweight" : "🔴 Quá tải")
                    : (language === "en" ? `🟡 Need ${remainingGrams}g more` : `🟡 Còn thiếu ${remainingGrams}g`)}
                </span>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-2xl font-extrabold text-primary font-mono">
                    {totalGrams}g
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {language === "en" ? "Target:" : "Mục tiêu:"}{" "}
                    <strong className="text-foreground">{targetGrams}g</strong>
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
                    <span>
                      {language === "en"
                        ? `Wonderful! Total weight reached exact ${targetGrams}g.`
                        : `Tuyệt vời! Khối lượng hạt đã đạt đúng ${targetGrams}g của bao bì.`}
                    </span>
                  </p>
                ) : isOverweight ? (
                  <p className="text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      {language === "en"
                        ? `Selected weight exceeded by ${Math.abs(remainingGrams)}g. Please reduce.`
                        : `Bạn đã chọn vượt quá ${Math.abs(remainingGrams)}g. Vui lòng giảm bớt hạt.`}
                    </span>
                  </p>
                ) : (
                  <p className="text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      {language === "en"
                        ? `Need ${remainingGrams}g more to complete packaging.`
                        : `Cần thêm ${remainingGrams}g hạt nữa để hoàn tất đóng gói.`}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* LIVE PRODUCT & LABEL PREVIEW (MÔ PHỎNG TEM NHÃN ẢO) */}
            <div className="bg-[#23452F] rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-emerald-900/60 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4 border-b border-emerald-800/80 pb-3">
                <span className="text-xs uppercase tracking-widest text-[#E9B949] font-bold flex items-center gap-1.5">
                  <Package className="w-4 h-4" />{" "}
                  {language === "en" ? "Live Label Preview" : "Bản xem trước nhãn dán"}
                </span>
                <span className="text-[11px] text-emerald-200/80">
                  {language === "en" ? `Weight: ${targetGrams}g` : `Khối lượng: ${targetGrams}g`}
                </span>
              </div>

              {/* TEM NHÃN HOÀNG GIA DÁN TRÊN HỘP/TÚI */}
              <div className="bg-[#FFF9ED] text-[#292524] rounded-2xl p-5 sm:p-6 shadow-2xl border-2 border-[#E9B949] relative">
                {/* Viền hoa văn cổ */}
                <div className="border border-[#B45309]/30 p-4 rounded-xl space-y-3.5 text-center relative bg-[radial-gradient(#FDE68A_1px,transparent_1px)] [background-size:16px_16px]">
                  {/* Brand header: Giữ trọn tên thương hiệu "NGUYỆT NHÃN PHỐ HIẾN" theo yêu cầu */}
                  <div>
                    <h5 className="text-[11px] uppercase tracking-widest font-extrabold text-[#B45309]">
                      NGUYỆT NHÃN PHỐ HIẾN
                    </h5>
                    <p className="text-[9px] text-[#78350F] italic">
                      {language === "en" ? "Essence of Thousand-Year Pho Hien Heritage" : "Tinh Hoa Đất Phố Hiến Ngàn Năm"}
                    </p>
                  </div>

                  {/* Tên do khách đặt */}
                  <div className="py-2 border-y border-[#B45309]/20">
                    <span
                      style={{ fontFamily: "var(--font-dancing)" }}
                      className="text-2xl sm:text-3xl font-bold text-[#B45309] block leading-tight tracking-wide"
                    >
                      {customName.trim() || (language === "en" ? "Custom Nut Blend" : "Sản Phẩm Tự Chọn Hạt")}
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
                      {language === "en" ? "Nutritional composition:" : "Thành phần định lượng:"}
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
                        {language === "en" ? "No ingredients selected yet..." : "Chưa chọn hạt nào..."}
                      </p>
                    )}
                  </div>

                  {/* Thông tin NSX & Quy cách */}
                  <div className="pt-2 border-t border-[#B45309]/20 flex items-center justify-between text-[10px] text-neutral-600 font-medium">
                    <span>
                      {language === "en" ? `Net wt: ${activePackaging.capacityGrams}g` : `Quy cách: ${activePackaging.capacityGrams}g`}
                    </span>
                    <span>
                      {language === "en" ? `Packed: ${todayStr}` : `Ngày đóng gói: ${todayStr}`}
                    </span>
                    <span>
                      {language === "en" ? "Best before: 6 months" : "HSD: 6 tháng"}
                    </span>
                  </div>
                </div>
              </div>

              {/* TÓM TẮT GIÁ & NÚT ĐẶT HÀNG */}
              <div className="mt-6 pt-5 border-t border-emerald-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-emerald-200 block">
                      {language === "en" ? "Total all-inclusive:" : "Tổng thanh toán trọn gói:"}
                    </span>
                    <span className="text-2xl font-extrabold text-[#E9B949]">
                      {formatPrice(activePackaging.fixedPrice * quantity, language as "vi" | "en")}
                    </span>
                  </div>

                  {/* Số lượng */}
                  <div className="flex items-center gap-1 bg-emerald-950/80 rounded-xl p-1 border border-emerald-800">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      type="button"
                      className="w-7 h-7 rounded-lg bg-emerald-900 flex items-center justify-center text-emerald-200 hover:text-white"
                      aria-label={language === "en" ? "Decrease quantity" : "Giảm số lượng hộp"}
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
                      aria-label={language === "en" ? "Increase quantity" : "Tăng số lượng hộp"}
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
                        <span>{language === "en" ? "Validating..." : "Đang kiểm tra..."}</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4 text-[#B45309]" />
                        <span>{language === "en" ? "Add to Cart" : "Thêm Giỏ Hàng"}</span>
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
                        <span>{language === "en" ? "Validating..." : "Đang kiểm tra..."}</span>
                      </>
                    ) : (
                      <span>{language === "en" ? "Order Now" : "Mua Ngay"}</span>
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
                <span>{language === "en" ? "Capacity:" : "Dung tích:"}</span>
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
                  ? (language === "en" ? "🟢 100% Ready" : "🟢 Đã đủ 100%")
                  : isOverweight
                  ? (language === "en" ? `🔴 Over ${Math.abs(remainingGrams)}g (${progressPercent}%)` : `🔴 Thừa ${Math.abs(remainingGrams)}g (${progressPercent}%)`)
                  : (language === "en" ? `🟡 Need ${remainingGrams}g (${progressPercent}%)` : `🟡 Thiếu ${remainingGrams}g (${progressPercent}%)`)}
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
                title={language === "en" ? "Automatically fill remaining grams with Longan" : "Tự động bù số gram còn thiếu bằng Long Nhãn"}
              >
                <Wand2 className="w-3.5 h-3.5 text-amber-700" />
                <span>{language === "en" ? "Auto-fill" : "Bù đầy"}</span>
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
                <span>{language === "en" ? "Name it" : "Đặt tên"}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReset}
                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{language === "en" ? "Reset" : "Đặt lại"}</span>
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
            aria-label={language === "en" ? `View enlarged image of ${previewNut.name}` : `Xem ảnh lớn ${previewNut.name}`}
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
                aria-label={language === "en" ? "Close" : "Đóng"}
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
              {(() => {
                const previewNutTrans = getIngredientTranslation(previewNut, language as "vi" | "en");
                return (
                  <div className="p-4 sm:p-5 bg-gradient-to-b from-stone-900 to-stone-950 text-white space-y-2 border-t border-amber-500/20">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-base sm:text-lg text-[#FFF9ED]">
                        {previewNutTrans.name}
                      </h3>
                      <span className="shrink-0 flex items-center gap-1 font-semibold text-xs text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        <span>{previewNut.caloriesPer100g} kcal/100g</span>
                      </span>
                    </div>
                    {previewNutTrans.tagline && (
                      <p className="text-xs text-amber-200/90 leading-relaxed font-light">
                        {previewNutTrans.tagline}
                      </p>
                    )}
                    {previewNutTrans.description && (
                      <p className="text-xs text-stone-300 leading-relaxed font-light line-clamp-3">
                        {previewNutTrans.description}
                      </p>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NÚT GIỎ HÀNG NỔI & DRAWER */}
      <CartButton />
      <CartDrawer
        language={language as "vi" | "en"}
        onCheckout={() => {
          closeCart();
          router.push("/#dat-hang");
        }}
      />
    </div>
  );
}

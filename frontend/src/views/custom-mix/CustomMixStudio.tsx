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
  Scale,
  RotateCcw,
  Package,
  Flame,
  CheckCircle2,
  Loader2,
  ZoomIn,
  X,
  Globe,
  Share2,
  Copy,
  Lock,
  Unlock,
  BookOpen,
  ShieldCheck,
  Tag,
  QrCode,
  Layers,
  Heart,
  Sliders,
  Leaf,
} from "lucide-react";
import { useCartStore } from "@/stores/useCartStore";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { useWebsiteContent } from "@/hooks/useWebsiteContent";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartButton } from "@/components/cart/CartButton";
import { NutritionAiWidget } from "@/components/NutritionAiWidget";
import { FastImage } from "@/components/FastImage";
import { resolveCmsImage } from "@/lib/cmsImage";
import { customMixApi } from "@/services/api.service";
import type {
  CustomPackaging,
  CustomIngredient,
  CustomMixItemDetailDto,
} from "@/types/api.types";

const DRAFT_STORAGE_KEY = "nguyetnhan_custom_mix_draft_v2";

// Dữ liệu dự phòng mặc định (Fallback) nếu chưa kết nối API Backend
const FALLBACK_PACKAGINGS: CustomPackaging[] = [
  {
    id: "c0000001-0000-0000-0000-000000000150",
    name: "Túi Zip Khóa Khí Tiện Lợi",
    packagingType: "ZipBag",
    capacityGrams: 150,
    fixedPrice: 69000,
    imageUrl: "/images/tuizip/tuizip.jpg",
    description: "Túi zip tráng bạc khóa kín khí, giữ trọn hương vị và độ giòn tan, tiện lợi mang theo hàng ngày.",
    displayOrder: 1,
  },
  {
    id: "c0000001-0000-0000-0000-000000000300",
    name: "Hộp Tròn Nắp Gỗ Cao Cấp",
    packagingType: "Box",
    capacityGrams: 300,
    fixedPrice: 153000,
    imageUrl: "/images/hopnhua/hopnhua.jpg",
    description: "Hộp tròn cao cấp nắp gỗ tự nhiên kín khí, bảo quản tối ưu, nhìn rõ từng tầng hạt xếp lớp sang trọng.",
    displayOrder: 2,
  },
  {
    id: "c0000001-0000-0000-0000-000000000900",
    name: "Lễ Hộp Quà Tặng Hoàng Gia",
    packagingType: "GiftSet",
    capacityGrams: 900,
    fixedPrice: 756000,
    imageUrl: "/images/hopdo/hopdo.jpg",
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

// Bảng màu & gradient phong phú cho mô phỏng tầng hạt
const NUT_VISUAL_THEMES: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  longnhan: {
    bg: "from-amber-700 via-amber-600 to-amber-800",
    border: "border-amber-400/80",
    text: "text-amber-100",
    glow: "rgba(217, 119, 6, 0.45)",
  },
  macca: {
    bg: "from-amber-100 via-amber-50 to-yellow-100",
    border: "border-amber-300",
    text: "text-stone-800",
    glow: "rgba(254, 243, 199, 0.6)",
  },
  dieu: {
    bg: "from-amber-500 via-yellow-500 to-orange-500",
    border: "border-amber-300",
    text: "text-amber-950",
    glow: "rgba(245, 158, 11, 0.4)",
  },
  hanhnhan: {
    bg: "from-stone-800 via-amber-900 to-stone-900",
    border: "border-amber-600/60",
    text: "text-amber-200",
    glow: "rgba(120, 53, 15, 0.4)",
  },
  bixanh: {
    bg: "from-emerald-700 via-teal-600 to-emerald-800",
    border: "border-emerald-300",
    text: "text-emerald-100",
    glow: "rgba(16, 185, 129, 0.4)",
  },
};

function getNutKey(name: string): "longnhan" | "macca" | "dieu" | "hanhnhan" | "bixanh" {
  const lower = (name || "").toLowerCase();
  if (lower.includes("nhãn") || lower.includes("longan")) return "longnhan";
  if (lower.includes("macca") || lower.includes("mắc ca")) return "macca";
  if (lower.includes("điều") || lower.includes("dieu") || lower.includes("cashew")) return "dieu";
  if (lower.includes("hạnh nhân") || lower.includes("hanh nhan") || lower.includes("almond")) return "hanhnhan";
  return "bixanh";
}

function getPackagingTranslation(pkg: CustomPackaging, language: "vi" | "en") {
  if (language === "vi") return { name: pkg.name, description: pkg.description };
  const lower = (pkg.name || "").toLowerCase();
  if (pkg.capacityGrams === 150 || lower.includes("zip")) {
    return {
      name: "Airtight Zipper Pouch",
      description: "Silver-lined airtight zip bag, retaining pristine crispness and aroma, convenient for everyday carry.",
    };
  }
  if (pkg.capacityGrams === 300 || lower.includes("gỗ") || lower.includes("nhựa") || lower.includes("mica")) {
    return {
      name: "Premium Wooden Lid Jar",
      description: "Premium round canister with airtight natural wooden lid, optimal preservation, showcasing distinct layered nuts.",
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
  const { content } = useWebsiteContent();

  const [packagings, setPackagings] = useState<CustomPackaging[]>(FALLBACK_PACKAGINGS);
  const [ingredients, setIngredients] = useState<CustomIngredient[]>(FALLBACK_INGREDIENTS);
  const [selectedPackagingId, setSelectedPackagingId] = useState<string>(
    FALLBACK_PACKAGINGS[1].id // Mặc định chọn Hộp nhựa 300g
  );

  // Ánh xạ ảnh từ CMS (nếu admin đã cấu hình qua /content) đè lên imageUrl của bao bì & hạt
  const displayPackagings = useMemo(() => {
    return packagings.map((pkg) => {
      let cmsImg = "";
      if (pkg.packagingType === "ZipBag" || pkg.id.endsWith("150")) {
        cmsImg = content["CustomMix_Pkg_ZipBag"];
      } else if (pkg.packagingType === "Box" || pkg.id.endsWith("300")) {
        cmsImg = content["CustomMix_Pkg_Box"];
      } else if (pkg.packagingType === "GiftSet" || pkg.id.endsWith("900")) {
        cmsImg = content["CustomMix_Pkg_GiftSet"];
      }
      return cmsImg ? { ...pkg, imageUrl: cmsImg } : pkg;
    });
  }, [packagings, content]);

  const displayIngredients = useMemo(() => {
    return ingredients.map((ing) => {
      let cmsImg = "";
      const lower = ing.name.toLowerCase();
      if (lower.includes("nhãn") || ing.id.endsWith("0001")) {
        cmsImg = content["CustomMix_Nut_LongNhan"];
      } else if (lower.includes("macca") || ing.id.endsWith("0003")) {
        cmsImg = content["CustomMix_Nut_Macca"];
      } else if (lower.includes("điều") || ing.id.endsWith("0004")) {
        cmsImg = content["CustomMix_Nut_HatDieu"];
      } else if (lower.includes("hạnh nhân") || ing.id.endsWith("0005")) {
        cmsImg = content["CustomMix_Nut_HanhNhan"];
      } else if (lower.includes("bí xanh") || ing.id.endsWith("0006")) {
        cmsImg = content["CustomMix_Nut_BiXanh"];
      }
      return cmsImg ? { ...ing, imageUrl: cmsImg } : ing;
    });
  }, [ingredients, content]);

  // Banner đầu trang: ưu tiên ảnh Quản trị viên đã cấu hình trong CMS
  const bannerUrl = resolveCmsImage(content["CustomMix_BannerUrl"]) || "/images/banner_tu_chon_hat.png";

  // Khối lượng từng loại hạt { [ingredientId]: grams }
  const [weights, setWeights] = useState<Record<string, number>>({});

  // Danh sách các hạt bị khóa khối lượng (không bị đổi khi bù đầy / chia đều)
  const [lockedNutIds, setLockedNutIds] = useState<Set<string>>(new Set());

  // Chế độ xem trước bên cột phải: "jar" (Mô phỏng hũ hạt) hoặc "label" (Tem nhãn hoàng gia)
  const [previewTab, setPreviewTab] = useState<"jar" | "label">("jar");

  // Tên sản phẩm khách tự đặt và lời chúc
  const [customName, setCustomName] = useState<string>(
    language === "en" ? "Mom's Radiance Box" : "Hộp Dưỡng Nhan Cho Mẹ"
  );
  const [customMessage, setCustomMessage] = useState<string>(
    language === "en" ? "Wishing Mom peace, youthfulness & radiant joy" : "Kính chúc Mẹ vạn sự bình an & trẻ đẹp"
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [previewNut, setPreviewNut] = useState<CustomIngredient | null>(null);

  // Trạng thái mở modal Chuyên gia AI Dinh Dưỡng
  const [isAiChatOpen, setIsAiChatOpen] = useState<boolean>(false);
  const [aiCustomPrompt, setAiCustomPrompt] = useState<string | undefined>(undefined);

  // Tóm tắt công thức hạt hiện tại cho AI phân tích
  const currentRecipeSummary = useMemo(() => {
    const activeItems = Object.entries(weights)
      .filter(([, g]) => g > 0)
      .map(([id, g]) => {
        const ing = displayIngredients.find((i) => i.id === id);
        const name = ing ? (language === "en" ? getIngredientTranslation(ing, "en").name : ing.name) : id;
        return `${g}g ${name}`;
      });
    return activeItems.join(", ");
  }, [weights, displayIngredients, language]);

  const handleOpenAiNutrition = (promptToSend?: string) => {
    setAiCustomPrompt(promptToSend);
    setIsAiChatOpen(true);
  };

  // Khôi phục bản nháp từ LocalStorage khi khởi tạo
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setTimeout(() => {
          if (parsed.selectedPackagingId) setSelectedPackagingId(parsed.selectedPackagingId);
          if (parsed.weights && Object.keys(parsed.weights).length > 0) {
            setWeights(parsed.weights);
          }
          if (parsed.customName) setCustomName(parsed.customName);
          if (parsed.customMessage !== undefined) setCustomMessage(parsed.customMessage);
        }, 0);
      }
    } catch (e) {
      console.warn("Could not load custom mix draft:", e);
    }
  }, []);

  // Tự động lưu bản nháp vào LocalStorage khi có thay đổi
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({
            selectedPackagingId,
            weights,
            customName,
            customMessage,
          })
        );
      } catch (e) {
        console.warn("Could not save custom mix draft:", e);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [selectedPackagingId, weights, customName, customMessage]);

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
          setSelectedPackagingId((prev) => {
            const exists = data.packagings.some((p) => p.id === prev);
            return exists ? prev : data.packagings[1]?.id || data.packagings[0].id;
          });
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
      displayPackagings.find((p) => p.id === selectedPackagingId) || displayPackagings[0]
    );
  }, [displayPackagings, selectedPackagingId]);

  // Tổng số gram hiện tại
  const totalGrams = useMemo(() => {
    return Object.values(weights).reduce((sum, g) => sum + (g || 0), 0);
  }, [weights]);

  const targetGrams = activePackaging.capacityGrams;
  const remainingGrams = targetGrams - totalGrams;
  const isPerfectMatch = totalGrams === targetGrams;
  const isOverweight = totalGrams > targetGrams;
  const progressPercent = Math.min(100, Math.round((totalGrams / targetGrams) * 100));

  // Tự động phân bổ lại khi đổi bao bì
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
    const clamped = Math.max(0, Math.min(targetGrams, Math.round(newGrams / 10) * 10));
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

  // Bật/tắt khóa hạt
  const toggleLockNut = (ingredientId: string) => {
    setLockedNutIds((prev) => {
      const next = new Set(prev);
      if (next.has(ingredientId)) {
        next.delete(ingredientId);
      } else {
        next.add(ingredientId);
      }
      return next;
    });
  };

  // Helper tra cứu hạt theo loại ngữ nghĩa
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

  // Chia đều số gram cho các hạt chưa bị khóa
  const handleDistributeEqually = () => {
    const unlockedIngredients = ingredients.filter((i) => !lockedNutIds.has(i.id));
    if (unlockedIngredients.length === 0) return;

    // Số gram đã bị chiếm bởi các hạt đã khóa
    const lockedTotal = Array.from(lockedNutIds).reduce((sum, id) => sum + (weights[id] || 0), 0);
    const availableGrams = Math.max(0, targetGrams - lockedTotal);

    const count = unlockedIngredients.length;
    const basePerNut = Math.floor(availableGrams / count / 10) * 10;
    const allocatedTotal = basePerNut * count;
    const remainder = availableGrams - allocatedTotal;

    const newWeights: Record<string, number> = {};
    // Giữ nguyên hạt đã khóa
    lockedNutIds.forEach((id) => {
      if (weights[id]) newWeights[id] = weights[id];
    });

    unlockedIngredients.forEach((ing, idx) => {
      const g = basePerNut + (idx === 0 ? remainder : 0);
      if (g > 0) newWeights[ing.id] = g;
    });

    setWeights(newWeights);
  };

  // Đặt lại về ban đầu (Xóa trắng hoặc Xóa bản nháp)
  const handleReset = () => {
    setWeights({});
    setLockedNutIds(new Set());
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (e) {
      console.warn("Could not remove custom mix draft:", e);
    }
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

  // Danh sách các hạt đã chọn kèm % tỉ lệ và key giao diện
  const selectedNutsList = useMemo(() => {
    return displayIngredients
      .filter((ing) => (weights[ing.id] || 0) > 0)
      .map((ing) => {
        const grams = weights[ing.id] || 0;
        const percentage = targetGrams > 0 ? Math.round((grams * 100) / targetGrams) : 0;
        const trans = getIngredientTranslation(ing, language as "vi" | "en");
        return {
          ingredientId: ing.id,
          name: trans.name,
          nutKey: getNutKey(ing.name),
          weightGrams: grams,
          percentage,
          imageUrl: ing.imageUrl,
          caloriesPer100g: ing.caloriesPer100g,
        };
      });
  }, [displayIngredients, weights, targetGrams, language]);

  // Bộ tính toán Calo & Dinh dưỡng thông minh
  const totalCalories = useMemo(() => {
    return Math.round(
      selectedNutsList.reduce((sum, nut) => {
        const cal = nut.caloriesPer100g || 500;
        return sum + (nut.weightGrams * cal) / 100;
      }, 0)
    );
  }, [selectedNutsList]);

  const caloriesPer30gServing = useMemo(() => {
    if (totalGrams <= 0) return 0;
    return Math.round((totalCalories / totalGrams) * 30);
  }, [totalCalories, totalGrams]);

  // Nhận định dinh dưỡng nổi bật dựa trên thành phần cao nhất
  const topNutrientHighlight = useMemo(() => {
    if (selectedNutsList.length === 0) return null;
    const sorted = [...selectedNutsList].sort((a, b) => b.weightGrams - a.weightGrams);
    const top = sorted[0];
    switch (top.nutKey) {
      case "longnhan":
        return language === "en"
          ? "Rich in herbal nourishment, calming the mind and supporting deep sleep"
          : "Đặc biệt giàu tinh chất bổ huyết, dưỡng tâm, an thần ngủ sâu giấc";
      case "macca":
        return language === "en"
          ? "High in healthy monounsaturated fats & Omega-7 for cardiovascular wellness"
          : "Dồi dào chất béo tốt không bão hòa & Omega-7 tốt cho tim mạch";
      case "dieu":
        return language === "en"
          ? "Abundant in natural plant protein, boosting daily energy and vitality"
          : "Dồi dào đạm thực vật nguyên chất, tăng cường năng lượng & sinh lực";
      case "hanhnhan":
        return language === "en"
          ? "Loaded with Vitamin E & dietary fiber, promoting radiant skin & metabolism"
          : "Giàu Vitamin E & chất xơ tự nhiên, hỗ trợ sáng da & giữ gìn vóc dáng";
      case "bixanh":
        return language === "en"
          ? "High in natural zinc and magnesium, strengthening immunity & cell defense"
          : "Giàu khoáng chất Kẽm & Magie, tăng cường hệ miễn dịch & sức đề kháng";
      default:
        return language === "en" ? "Nutrient-rich balanced blend" : "Sự kết hợp đa dưỡng chất cân bằng";
    }
  }, [selectedNutsList, language]);

  // Chia sẻ công thức
  const handleShareRecipe = () => {
    const nutDetails = selectedNutsList.map((n) => `${n.name} (${n.weightGrams}g - ${n.percentage}%)`).join(", ");
    const shareText = `[Nguyệt Nhãn Phố Hiến] Tuyệt tác hạt riêng "${customName}": ${nutDetails}. Tổng khối lượng: ${totalGrams}g.`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${shareText}\nKhám phá tại: ${window.location.href}`);
      const msg = language === "en" ? "Recipe copied to clipboard!" : "Đã sao chép công thức phối hạt!";
      setShareToast(msg);
      setTimeout(() => setShareToast(null), 3000);
    }
  };

  // Cuộn mượt tới các bước
  const scrollToStep = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Xử lý Thêm vào giỏ hàng
  const handleAddToCart = async (autoOpenCart = false) => {
    if (!isPerfectMatch || isValidating) return;
    setErrorMessage(null);

    // Bắt buộc nhập tên sản phẩm
    if (!customName.trim()) {
      const msg = language === "en"
        ? "Please name your custom mix product before adding to cart."
        : "Vui lòng đặt tên cho sản phẩm tự chọn hạt của bạn trước khi thêm vào giỏ.";
      setNameError(msg);
      setErrorMessage(msg);
      scrollToStep("step3Section");
      const inputEl = document.getElementById("customProductNameInput");
      if (inputEl) {
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
              const matched = displayIngredients.find((i) => i.id === ing.ingredientId);
              const trans = matched ? getIngredientTranslation(matched, language as "vi" | "en") : null;
              return {
                ingredientId: ing.ingredientId,
                name: (language === "en" ? trans?.name : ing.name) || matched?.name || (language === "en" ? "Nutrient Seed" : "Hạt dinh dưỡng"),
                nutKey: getNutKey(ing.name || matched?.name || ""),
                weightGrams: ing.weightGrams,
                percentage: ing.percentage ?? (targetGrams > 0 ? Math.round((ing.weightGrams * 100) / targetGrams) : 0),
                imageUrl: matched?.imageUrl || "/images/combo3sp.jpg",
                caloriesPer100g: matched?.caloriesPer100g || 500,
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

  // Mua ngay
  const handleBuyNow = () => {
    if (!isPerfectMatch || isValidating) return;
    handleAddToCart(false);
    closeCart();
    router.push("/san-pham#dat-hang");
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
              <h1 className="text-base sm:text-xl font-bold text-primary leading-tight">
                {language === "en" ? "Artisan Custom Nut Atelier" : "Xưởng Chế Tác Hạt Riêng"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Nút Tư Vấn Dinh Dưỡng trên Header */}
            <button
              type="button"
              onClick={() => handleOpenAiNutrition()}
              className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-full border border-amber-300 bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 hover:from-amber-500/20 hover:to-amber-500/30 text-[#92400E] text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              title={language === "en" ? "Nutrition Guide" : "Tư Vấn Dinh Dưỡng"}
              aria-label={language === "en" ? "Nutrition Guide" : "Tư Vấn Dinh Dưỡng"}
            >
              <Leaf className="w-3.5 h-3.5 text-[#B45309]" />
              <span className="hidden sm:inline">{language === "en" ? "Nutrition Guide" : "Tư Vấn Dinh Dưỡng"}</span>
            </button>

            {/* Nút chia sẻ công thức */}
            <button
              type="button"
              onClick={handleShareRecipe}
              className="p-2 sm:px-3 sm:py-1.5 rounded-full border border-amber-200 bg-white hover:bg-amber-50 text-stone-700 hover:text-[#B45309] text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              title={language === "en" ? "Share Recipe" : "Chia sẻ công thức"}
              aria-label={language === "en" ? "Share Recipe" : "Chia sẻ công thức"}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{language === "en" ? "Share" : "Chia sẻ"}</span>
            </button>

            {/* Nút chuyển đổi ngôn ngữ */}
            <button
              type="button"
              onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
              className="px-3 py-1.5 rounded-full border border-amber-300 bg-amber-50 hover:bg-amber-100 text-[#B45309] text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              aria-label={language === "en" ? "Switch to Vietnamese" : "Chuyển sang Tiếng Anh"}
            >
              <Globe className="w-3.5 h-3.5 text-[#B45309]" />
              <span>{language === "en" ? "EN" : "VI"}</span>
            </button>

            {/* Nút Giỏ hàng */}
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

      {/* TOAST CHIA SẺ */}
      <AnimatePresence>
        {shareToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 sm:right-8 z-50 bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 border border-amber-400/50"
          >
            <Copy className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-xs font-semibold text-amber-200">{shareToast}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOAST LỖI */}
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

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-32 lg:pb-12 max-w-7xl">
        {/* BANNER TỰ CHỌN HẠT DINH DƯỠNG: Hiển thị tràn viền sang trọng, tỉ lệ chuẩn cinematic không bị thừa dải trống hai bên */}
        <section
          className="mb-6 sm:mb-8"
          aria-label={language === "en" ? "Custom nutritious nut mix banner" : "Banner tự chọn hạt dinh dưỡng"}
        >
          <button
            type="button"
            onClick={() => scrollToStep("step1Section")}
            className="group relative block w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-[#FDE68A]/80 shadow-md hover:shadow-xl transition-all cursor-pointer aspect-[16/9] sm:aspect-[2/1] lg:aspect-[2.05/1] bg-[#F7F3EB]"
          >
            <FastImage
              src={bannerUrl}
              alt={
                language === "en"
                  ? "Create your own nutritious nut mix – free to blend to your taste"
                  : "Tự chọn hạt dinh dưỡng – tự do phối trộn theo sở thích"
              }
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover object-center w-full h-full transition-transform duration-500 group-hover:scale-[1.015]"
            />
          </button>
        </section>

        {/* THANH STEPPER 3 BƯỚC ĐIỀU HƯỚNG QUY TRÌNH THÔNG MINH */}
        <nav
          aria-label="Quy trình chế tác hạt"
          className="mb-6 sm:mb-8 bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-2 sm:p-3 border border-[#FDE68A]/80 shadow-xs"
        >
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
            {/* Bước 1 */}
            <button
              type="button"
              onClick={() => scrollToStep("step1Section")}
              className="flex items-center justify-center gap-1.5 sm:gap-2.5 py-2 px-2 sm:px-3 rounded-xl transition-all cursor-pointer bg-amber-50/80 text-[#B45309] border border-amber-200/80 hover:bg-amber-100"
            >
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#B45309] text-white flex items-center justify-center text-[11px] sm:text-xs font-bold shrink-0">
                1
              </span>
              <span className="text-xs sm:text-sm font-bold truncate">
                {language === "en" ? "1. Packaging" : "1. Chọn Bao Bì"}
              </span>
            </button>

            {/* Bước 2 */}
            <button
              type="button"
              onClick={() => scrollToStep("step2Section")}
              className={`flex items-center justify-center gap-1.5 sm:gap-2.5 py-2 px-2 sm:px-3 rounded-xl transition-all cursor-pointer border ${isPerfectMatch
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : "bg-white text-stone-700 border-border/70 hover:bg-neutral-50"
                }`}
            >
              <span
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-bold shrink-0 ${isPerfectMatch
                    ? "bg-emerald-600 text-white"
                    : "bg-amber-100 text-[#B45309]"
                  }`}
              >
                {isPerfectMatch ? "✓" : "2"}
              </span>
              <span className="text-xs sm:text-sm font-bold truncate">
                {language === "en" ? "2. Custom Mix" : "2. Phối Hạt"}
              </span>
            </button>

            {/* Bước 3 */}
            <button
              type="button"
              onClick={() => scrollToStep("step3Section")}
              className={`flex items-center justify-center gap-1.5 sm:gap-2.5 py-2 px-2 sm:px-3 rounded-xl transition-all cursor-pointer border ${customName.trim() && isPerfectMatch
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : "bg-white text-stone-700 border-border/70 hover:bg-neutral-50"
                }`}
            >
              <span
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-bold shrink-0 ${customName.trim() && isPerfectMatch
                    ? "bg-emerald-600 text-white"
                    : "bg-neutral-100 text-neutral-600"
                  }`}
              >
                {customName.trim() && isPerfectMatch ? "✓" : "3"}
              </span>
              <span className="text-xs sm:text-sm font-bold truncate">
                {language === "en" ? "3. Bespoke Label" : "3. Khắc Tem Nhãn"}
              </span>
            </button>
          </div>
        </nav>

        {/* WORKSPACE LAYOUT (2 COLUMNS) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI: BỘ ĐIỀU KHIỂN & CHỌN HẠT (7 CỘT) */}
          <div className="lg:col-span-7 space-y-8">
            {/* STEP 1: CHỌN QUY CÁCH BAO BÌ */}
            <section
              id="step1Section"
              className="bg-white rounded-3xl p-5 sm:p-7 border border-[#FDE68A]/60 shadow-sm space-y-4 scroll-mt-24"
            >
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
                {displayPackagings.map((pkg) => {
                  const isSelected = pkg.id === selectedPackagingId;
                  const pkgTrans = getPackagingTranslation(pkg, language as "vi" | "en");
                  return (
                    <button
                      key={pkg.id}
                      onClick={() => handleSelectPackaging(pkg)}
                      type="button"
                      className={`group text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${isSelected
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
                        <div className="w-full h-44 sm:h-48 rounded-xl overflow-hidden mb-3 bg-[#FAF7F2] border border-amber-100/70 relative flex items-center justify-center p-2 shadow-2xs">
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
            <section
              id="step2Section"
              className="bg-white rounded-3xl p-5 sm:p-7 border border-[#FDE68A]/60 shadow-sm space-y-5 scroll-mt-24"
            >
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
                    onClick={() => {
                      if (currentRecipeSummary) {
                        const prompt = language === "en"
                          ? `I am mixing a ${targetGrams}g custom nut box containing: ${currentRecipeSummary}. Please analyze its health benefits and give advice.`
                          : `Tôi đang phối hũ hạt ${targetGrams}g gồm: ${currentRecipeSummary}. Nhờ chuyên gia AI phân tích lợi ích và tư vấn tỷ lệ tối ưu cho tôi.`;
                        handleOpenAiNutrition(prompt);
                      } else {
                        const prompt = language === "en"
                          ? `Please recommend an optimal nut recipe for a ${targetGrams}g box combining dried longan with nutritious tree nuts.`
                          : `Hãy gợi ý cho tôi một công thức phối hạt dinh dưỡng chuẩn cho hộp ${targetGrams}g kết hợp giữa Long Nhãn và các loại hạt.`;
                        handleOpenAiNutrition(prompt);
                      }
                    }}
                    type="button"
                    title={language === "en" ? "Recipe suggestions" : "Gợi ý tỷ lệ phối hạt"}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-500/25 to-amber-500/15 hover:from-amber-500/25 hover:to-amber-500/35 border border-amber-400/80 text-[#92400E] text-xs font-bold transition-all active:scale-95 shadow-2xs cursor-pointer"
                  >
                    <Leaf className="w-3.5 h-3.5 text-[#B45309]" />
                    <span>{language === "en" ? "Recipe Advisor" : "Gợi Ý Tỷ Lệ"}</span>
                  </button>

                  <button
                    onClick={handleAutoFillLongNhan}
                    disabled={remainingGrams <= 0}
                    type="button"
                    title={language === "en" ? "Automatically fill remaining grams with Longan" : "Tự động bù số gram còn thiếu bằng Long Nhãn"}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-700" />
                    <span>{language === "en" ? "Fill Longan" : "Bù Long Nhãn"}</span>
                  </button>

                  <button
                    onClick={handleDistributeEqually}
                    type="button"
                    title={language === "en" ? "Distribute weight equally among unlocked nuts" : "Chia đều khối lượng cho các loại hạt chưa khóa"}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                  >
                    <Scale className="w-3.5 h-3.5 text-neutral-700" />
                    <span>{language === "en" ? "Split Equally" : "Chia đều"}</span>
                  </button>

                  <button
                    onClick={handleReset}
                    type="button"
                    title={language === "en" ? "Reset to 0g" : "Đặt lại về 0g"}
                    className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                    aria-label={language === "en" ? "Reset" : "Đặt lại"}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* THANH TIẾN TRÌNH MOBILE TRONG BƯỚC 2 */}
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
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${isPerfectMatch
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
                    <span className="text-xs font-bold text-accent">
                      {progressPercent}%
                    </span>
                  </div>

                  <div className="w-full h-3 bg-neutral-200/80 rounded-full overflow-hidden p-0.5 border border-border/60">
                    <motion.div
                      initial={false}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.25 }}
                      className={`h-full rounded-full transition-colors ${isPerfectMatch
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                          : isOverweight
                            ? "bg-gradient-to-r from-rose-500 to-rose-600"
                            : "bg-gradient-to-r from-amber-500 to-accent"
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
                  <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                  {language === "en" ? "Suggested Recipes:" : "Công thức gợi ý:"}
                </span>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleApplyPreset("duong-nhan")}
                    type="button"
                    className="px-2.5 py-1 rounded-lg bg-white border border-[#FDE68A] hover:bg-[#FEF3C7] text-xs font-semibold text-[#B45309] transition-all shadow-2xs cursor-pointer active:scale-95"
                  >
                    {language === "en" ? "🌸 Radiance Glow" : "🌸 Dưỡng Nhan"}
                  </button>
                  <button
                    onClick={() => handleApplyPreset("nang-luong")}
                    type="button"
                    className="px-2.5 py-1 rounded-lg bg-white border border-[#FDE68A] hover:bg-[#FEF3C7] text-xs font-semibold text-[#B45309] transition-all shadow-2xs cursor-pointer active:scale-95"
                  >
                    {language === "en" ? "⚡ Active Energy" : "⚡ Năng Lượng Gym"}
                  </button>
                  <button
                    onClick={() => handleApplyPreset("thuong-hang")}
                    type="button"
                    className="px-2.5 py-1 rounded-lg bg-white border border-[#FDE68A] hover:bg-[#FEF3C7] text-xs font-semibold text-[#B45309] transition-all shadow-2xs cursor-pointer active:scale-95"
                  >
                    {language === "en" ? "👑 Royal Banquet" : "👑 Tiến Vua"}
                  </button>
                </div>
              </div>

              {/* GRID 5 LOẠI HẠT VỚI BỘ ĐIỀU KHIỂN & SLIDER & NÚT KHÓA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {displayIngredients.map((ing) => {
                  const currentWeight = weights[ing.id] || 0;
                  const isSelected = currentWeight > 0;
                  const isLocked = lockedNutIds.has(ing.id);
                  const ingTrans = getIngredientTranslation(ing, language as "vi" | "en");
                  const percentOfBox = targetGrams > 0 ? Math.round((currentWeight * 100) / targetGrams) : 0;

                  return (
                    <div
                      key={ing.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${isSelected
                          ? "border-[#B45309]/60 bg-[#FFFDF8] shadow-sm ring-1 ring-[#B45309]/30"
                          : "border-border/60 bg-white hover:border-[#FDE68A]/80"
                        }`}
                    >
                      <div>
                        {/* Header của thẻ hạt */}
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
                            <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center shadow-2xs pointer-events-none">
                              <ZoomIn className="w-2.5 h-2.5" />
                            </div>
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <h4 className="font-bold text-sm text-foreground leading-snug line-clamp-1">
                                {ingTrans.name}
                              </h4>
                              {/* Nút khóa khối lượng hạt */}
                              <button
                                type="button"
                                onClick={() => toggleLockNut(ing.id)}
                                title={
                                  isLocked
                                    ? (language === "en" ? "Unlock weight" : "Mở khóa khối lượng")
                                    : (language === "en" ? "Lock weight (keeps grams fixed)" : "Khóa khối lượng (giữ cố định số gram)")
                                }
                                className={`p-1 rounded-md transition-all cursor-pointer ${isLocked
                                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                                    : "text-stone-400 hover:text-stone-600 hover:bg-stone-100"
                                  }`}
                              >
                                {isLocked ? <Lock className="w-3.5 h-3.5 text-[#B45309]" /> : <Unlock className="w-3.5 h-3.5" />}
                              </button>
                            </div>

                            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                              {ingTrans.tagline}
                            </p>

                            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-foreground/70">
                              <span className="flex items-center gap-0.5 font-medium text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                                <Flame className="w-3 h-3 text-amber-600" /> {ing.caloriesPer100g} kcal/100g
                              </span>
                              {isSelected && (
                                <span className="font-bold text-[#B45309] bg-[#FEF3C7] px-1.5 py-0.5 rounded">
                                  {percentOfBox}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Thanh trượt Range Slider điều khiển gram trực tiếp */}
                        <div className="mt-3 pt-2 border-t border-border/30">
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                            <span className="flex items-center gap-1 font-medium">
                              <Sliders className="w-3 h-3 text-stone-500" />
                              {language === "en" ? "Adjust Slider:" : "Thanh kéo gram:"}
                            </span>
                            <span className="font-bold text-primary">{currentWeight}g / {targetGrams}g</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max={targetGrams}
                            step="10"
                            value={currentWeight}
                            disabled={isLocked}
                            onChange={(e) => handleUpdateGrams(ing.id, parseInt(e.target.value) || 0)}
                            className="w-full accent-[#B45309] h-2 bg-neutral-200 rounded-lg cursor-pointer disabled:opacity-40"
                          />
                        </div>
                      </div>

                      {/* Phím bấm điều khiển gram & phím tắt tỷ lệ % nhanh */}
                      <div className="mt-3 pt-2.5 border-t border-border/40 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 bg-neutral-100 rounded-xl p-1 border border-border/60">
                            <button
                              onClick={() => handleUpdateGrams(ing.id, currentWeight - 10)}
                              disabled={currentWeight <= 0 || isLocked}
                              type="button"
                              className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-primary hover:bg-[#FEF3C7] transition-colors disabled:opacity-30 disabled:hover:bg-white shadow-2xs cursor-pointer"
                              aria-label={language === "en" ? `Decrease ${ingTrans.name}` : `Giảm ${ing.name}`}
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>

                            <div className="w-14 text-center">
                              <span className="font-bold text-sm text-primary select-none font-mono">
                                {currentWeight}g
                              </span>
                            </div>

                            <button
                              onClick={() => handleUpdateGrams(ing.id, currentWeight + 10)}
                              disabled={totalGrams >= targetGrams || isLocked}
                              type="button"
                              className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-primary hover:bg-[#FEF3C7] transition-colors disabled:opacity-30 disabled:hover:bg-white shadow-2xs cursor-pointer"
                              aria-label={language === "en" ? `Increase ${ingTrans.name}` : `Tăng ${ing.name}`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Phím tắt nhanh: +50g */}
                          <button
                            onClick={() => handleUpdateGrams(ing.id, currentWeight + 50)}
                            disabled={totalGrams + 50 > targetGrams || isLocked}
                            type="button"
                            className="px-2.5 py-1.5 rounded-xl bg-neutral-50 hover:bg-[#FEF3C7] border border-border/80 text-[11px] font-semibold text-neutral-700 transition-colors disabled:opacity-30 cursor-pointer shadow-2xs"
                          >
                            +50g
                          </button>
                        </div>

                        {/* Phím tắt phân bổ nhanh theo tỷ lệ % */}
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className="text-muted-foreground mr-1">{language === "en" ? "Quick:" : "Nhanh:"}</span>
                          <button
                            type="button"
                            disabled={isLocked}
                            onClick={() => handleUpdateGrams(ing.id, Math.round((targetGrams * 0.25) / 10) * 10)}
                            className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 border border-stone-200 transition-all disabled:opacity-40 cursor-pointer"
                          >
                            25%
                          </button>
                          <button
                            type="button"
                            disabled={isLocked}
                            onClick={() => handleUpdateGrams(ing.id, Math.round((targetGrams * 0.5) / 10) * 10)}
                            className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 border border-stone-200 transition-all disabled:opacity-40 cursor-pointer"
                          >
                            50%
                          </button>
                          <button
                            type="button"
                            disabled={isLocked}
                            onClick={() => handleUpdateGrams(ing.id, currentWeight + Math.max(0, remainingGrams))}
                            className="px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-200 text-amber-900 border border-amber-300 font-semibold transition-all disabled:opacity-40 cursor-pointer"
                          >
                            {language === "en" ? "Max" : "Tối đa"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* STEP 3: ĐẶT TÊN SẢN PHẨM & LỜI CHÚC */}
            <section
              id="step3Section"
              className="bg-white rounded-3xl p-5 sm:p-7 border border-[#FDE68A]/60 shadow-sm space-y-4 scroll-mt-24"
            >
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
                    className={`w-full bg-[#FFFDF8] border rounded-2xl px-4 py-3 text-sm font-semibold text-primary outline-none transition-all ${nameError
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

                {/* Thông tin cảnh báo an toàn thực phẩm & dị ứng */}
                <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900/90 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <p className="leading-relaxed text-[11px]">
                    {language === "en"
                      ? "Allergen Notice: Packed in a dedicated facility handling natural tree nuts (Longan, Macadamia, Cashew, Almond, Pumpkin Seeds). Preserved naturally with vacuum or nitrogen-sealed tech."
                      : "Cam kết ATVSTP: Chế tác vô trùng từ 100% hạt cây tuyển chọn (Long nhãn, Macca, Điều, Hạnh nhân, Bí xanh). Niêm phong nắp gỗ khóa khí không dùng phụ gia bảo quản."}
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* CỘT PHẢI: BỘ XEM TRƯỚC HŨ HẠT & TEM NHÃN + DINH DƯỠNG + THANH TOÁN (5 CỘT) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            {/* THANH ĐO TIẾN TRÌNH KHỐI LƯỢNG MỤC TIÊU (DESKTOP) */}
            <div className="hidden lg:block bg-white rounded-3xl p-5 border border-[#FDE68A]/60 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {language === "en" ? "Capacity Meter" : "Đo lường dung tích"}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full border ${isPerfectMatch
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

                <div className="w-full h-3.5 bg-neutral-100 rounded-full overflow-hidden p-0.5 border border-border/60">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.3 }}
                    className={`h-full rounded-full transition-colors ${isPerfectMatch
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                        : isOverweight
                          ? "bg-gradient-to-r from-rose-500 to-rose-600"
                          : "bg-gradient-to-r from-amber-500 to-accent"
                      }`}
                  />
                </div>
              </div>

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

            {/* BẢNG XEM TRƯỚC SẢN PHẨM: 2 TABS CHUYỂN ĐỔI GIỮA HŨ HẠT & TEM NHÃN */}
            <div className="bg-[#23452F] rounded-3xl p-5 sm:p-6 text-white shadow-xl border border-emerald-900/60 relative overflow-hidden">
              {/* Header 2 Tabs */}
              <div className="flex items-center justify-between mb-4 border-b border-emerald-800/80 pb-3">
                <div className="flex items-center gap-1.5 bg-emerald-950/80 p-1 rounded-xl border border-emerald-800">
                  <button
                    type="button"
                    onClick={() => setPreviewTab("jar")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${previewTab === "jar"
                        ? "bg-[#E9B949] text-stone-950 shadow-sm"
                        : "text-emerald-200 hover:text-white"
                      }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{language === "en" ? "Virtual Jar" : "Mô Phỏng Hũ"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab("label")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${previewTab === "label"
                        ? "bg-[#E9B949] text-stone-950 shadow-sm"
                        : "text-emerald-200 hover:text-white"
                      }`}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>{language === "en" ? "Royal Label" : "Tem Nhãn"}</span>
                  </button>
                </div>

                <span className="text-[11px] text-emerald-200/80 font-mono">
                  {totalGrams}g / {targetGrams}g
                </span>
              </div>

              {/* TAB 1: MÔ PHỎNG HŨ HẠT ĐA TẦNG TRỰC QUAN (VIRTUAL LAYERED JAR PREVIEW) */}
              {previewTab === "jar" && (
                <div className="space-y-4">
                  <div className="relative w-full max-w-[280px] mx-auto aspect-[3/4] bg-stone-950/50 rounded-[2rem] border-2 border-[#E9B949]/60 p-3 shadow-2xl flex flex-col justify-between overflow-hidden backdrop-blur-xs">
                    {/* Nắp gỗ tự nhiên hoặc khóa miệng túi */}
                    <div className={`w-full h-7 rounded-xl border shadow-md flex items-center justify-center shrink-0 ${
                      activePackaging.packagingType === "ZipBag"
                        ? "bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 border-amber-400"
                        : "bg-gradient-to-r from-[#8B5A2B] via-[#A0522D] to-[#6E421F] border-[#CD853F]/80"
                    }`}>
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
                        activePackaging.packagingType === "ZipBag" ? "text-[#78350F]" : "text-amber-100"
                      }`}>
                        {activePackaging.packagingType === "ZipBag"
                          ? (language === "en" ? "Airtight Seal" : "Khóa Kín Khí")
                          : (language === "en" ? "Airtight Wooden Lid" : "Nắp Gỗ Tự Nhiên Kín Khí")}
                      </span>
                    </div>

                    {/* Thân hũ thủy tinh / mica trong suốt chứa các tầng hạt */}
                    <div className="relative flex-1 w-full my-2 rounded-2xl overflow-hidden border border-white/20 bg-gradient-to-b from-white/10 via-transparent to-white/5 flex flex-col-reverse p-1 gap-1">
                      {selectedNutsList.length > 0 ? (
                        selectedNutsList.map((nut) => {
                          const theme = NUT_VISUAL_THEMES[nut.nutKey] || NUT_VISUAL_THEMES.longnhan;
                          return (
                            <motion.div
                              key={nut.ingredientId}
                              initial={{ scaleY: 0 }}
                              animate={{ scaleY: 1 }}
                              style={{
                                height: `${Math.max(12, nut.percentage)}%`,
                              }}
                              className={`w-full rounded-xl bg-gradient-to-r ${theme.bg} border ${theme.border} p-1.5 flex items-center justify-between shadow-inner origin-bottom transition-all duration-300 relative overflow-hidden group`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0 z-10">
                                <span className="text-xs">
                                  {nut.nutKey === "longnhan" ? "👑" : nut.nutKey === "macca" ? "⚪" : nut.nutKey === "dieu" ? "🟤" : nut.nutKey === "hanhnhan" ? "🌰" : "🟢"}
                                </span>
                                <span className={`text-[11px] font-bold ${theme.text} truncate drop-shadow`}>
                                  {nut.name}
                                </span>
                              </div>
                              <span className={`text-[10px] font-extrabold ${theme.text} z-10 shrink-0 font-mono drop-shadow`}>
                                {nut.weightGrams}g ({nut.percentage}%)
                              </span>
                              {/* Vệt sáng lướt qua tầng hạt */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none opacity-40 group-hover:opacity-75 transition-opacity" />
                            </motion.div>
                          );
                        })
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-4 text-emerald-200/60">
                          <Package className="w-8 h-8 mb-2 opacity-50" />
                          <p className="text-xs">
                            {language === "en" ? "Jar is empty. Adjust nut grams in Step 2 to fill." : "Hũ hạt đang trống. Hãy tinh chỉnh lượng hạt ở Bước 2 để lấp đầy."}
                          </p>
                        </div>
                      )}

                      {/* Khoảng trống còn lại trong hũ nếu chưa đủ 100% */}
                      {remainingGrams > 0 && selectedNutsList.length > 0 && (
                        <div className="flex-1 w-full border-2 border-dashed border-amber-300/40 rounded-xl flex items-center justify-center p-2 text-center bg-black/20">
                          <span className="text-[10px] font-bold text-amber-200/80 animate-pulse">
                            {language === "en" ? `Need ${remainingGrams}g more to fill` : `Còn trống ${remainingGrams}g`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Đáy hũ */}
                    <div className="w-full h-4 rounded-xl bg-gradient-to-r from-amber-900 via-stone-800 to-amber-950 border border-amber-700/60 flex items-center justify-center">
                      <span className="text-[9px] text-amber-300/80 font-bold uppercase tracking-widest">
                        {targetGrams}g
                      </span>
                    </div>
                  </div>

                  <p className="text-center text-xs text-emerald-200/90 italic">
                    {language === "en"
                      ? "💡 Realistic simulation of layered nuts inside transparent packaging."
                      : "💡 Mô phỏng sinh động các tầng hạt xếp lớp sang trọng bên trong bao bì."}
                  </p>
                </div>
              )}

              {/* TAB 2: TEM NHÃN HOÀNG GIA DÁN TRÊN HỘP/TÚI (ROYAL LABEL PREVIEW) */}
              {previewTab === "label" && (
                <div className="bg-[#FFF9ED] text-[#292524] rounded-2xl p-5 shadow-2xl border-2 border-[#E9B949] relative">
                  <div className="border border-[#B45309]/30 p-4 rounded-xl space-y-3.5 text-center relative bg-[radial-gradient(#FDE68A_1px,transparent_1px)] [background-size:16px_16px]">
                    {/* Con dấu triện đỏ điện tử góc tem nhãn */}
                    <div className="absolute top-2 right-2 w-12 h-12 border-2 border-red-700/80 text-red-700 rounded-sm flex flex-col items-center justify-center text-[7.5px] leading-tight rotate-[-4deg] shadow-2xs select-none pointer-events-none uppercase font-extrabold bg-red-50/20">
                      <span>NGUYỆT NHÃN</span>
                      <span className="text-[6px] tracking-wider text-red-800">THƯỢNG PHẨM</span>
                      <span className="text-[5.5px] text-red-600">PHỐ HIẾN</span>
                    </div>

                    {/* Brand header: Giữ trọn tên thương hiệu "NGUYỆT NHÃN PHỐ HIẾN" */}
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

                    {/* Thông tin NSX & Quy cách & QR Code */}
                    <div className="pt-2 border-t border-[#B45309]/20 flex items-center justify-between text-[10px] text-neutral-600 font-medium">
                      <div className="text-left">
                        <span>{language === "en" ? `Net wt: ${targetGrams}g` : `Quy cách: ${targetGrams}g`}</span>
                        <span className="block">{language === "en" ? `Packed: ${todayStr}` : `Ngày đóng gói: ${todayStr}`}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded border border-amber-200 text-stone-700">
                        <QrCode className="w-3.5 h-3.5 text-[#B45309]" />
                        <span className="text-[9px] font-semibold">{language === "en" ? "Traceable" : "Truy xuất"}</span>
                      </div>
                      <div className="text-right">
                        <span>{language === "en" ? "Best before: 6 months" : "HSD: 6 tháng"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* BẢNG TÍNH CALO & DINH DƯỠNG THÔNG MINH */}
              <div className="mt-4 pt-3.5 border-t border-emerald-800/80 bg-emerald-950/60 rounded-2xl p-3.5 border border-emerald-800/60 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#E9B949] flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-400" />
                    {language === "en" ? "Smart Nutrition Profile" : "Hồ Sơ Dinh Dưỡng Hộp Hạt"}
                  </span>
                  <span className="text-[11px] text-emerald-200">
                    {language === "en" ? "~30g per serving" : "~30g mỗi khẩu phần"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-emerald-900/50 rounded-xl p-2 border border-emerald-700/50">
                    <span className="text-[10px] text-emerald-200 block uppercase font-medium">
                      {language === "en" ? "Total Energy" : "Tổng Năng Lượng"}
                    </span>
                    <span className="text-lg font-black text-white font-mono">
                      {totalCalories} <span className="text-xs font-sans text-emerald-300">kcal</span>
                    </span>
                  </div>
                  <div className="bg-emerald-900/50 rounded-xl p-2 border border-emerald-700/50">
                    <span className="text-[10px] text-emerald-200 block uppercase font-medium">
                      {language === "en" ? "Per 30g Serving" : "Mỗi Khẩu Phần 30g"}
                    </span>
                    <span className="text-lg font-black text-amber-300 font-mono">
                      ~{caloriesPer30gServing} <span className="text-xs font-sans text-emerald-300">kcal</span>
                    </span>
                  </div>
                </div>

                {topNutrientHighlight && (
                  <div className="text-[11px] text-emerald-100 flex items-start gap-1.5 leading-snug pt-1">
                    <Heart className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <span>{topNutrientHighlight}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const recipeText = currentRecipeSummary || (language === "en" ? "No ingredients selected yet" : "Chưa chọn hạt");
                    const prompt = language === "en"
                      ? `Please analyze my current custom mix: ${recipeText} (Total: ${totalCalories} kcal). Is this blend well-balanced and safe for daily wellness?`
                      : `Hãy phân tích chuyên sâu công thức hạt tôi đang chọn: ${recipeText} (Tổng ${totalCalories} kcal). Công thức này có cân bằng và phù hợp để dưỡng sinh mỗi ngày không?`;
                    handleOpenAiNutrition(prompt);
                  }}
                  className="w-full mt-2 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-500/20 hover:from-amber-500/30 hover:to-amber-500/40 border border-amber-400/60 text-[#FDE68A] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
                >
                  <Leaf className="w-4 h-4 text-amber-300" />
                  <span>{language === "en" ? "Consult on this blend" : "Tư vấn dinh dưỡng công thức này"}</span>
                </button>
              </div>

              {/* TÓM TẮT GIÁ & NÚT ĐẶT HÀNG TRÊN DESKTOP */}
              <div className="mt-4 pt-4 border-t border-emerald-800/80 space-y-3.5">
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
                      className="w-7 h-7 rounded-lg bg-emerald-900 flex items-center justify-center text-emerald-200 hover:text-white cursor-pointer"
                      aria-label={language === "en" ? "Decrease quantity" : "Giảm số lượng hộp"}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-bold text-sm text-white font-mono">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      type="button"
                      className="w-7 h-7 rounded-lg bg-emerald-900 flex items-center justify-center text-emerald-200 hover:text-white cursor-pointer"
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

      {/* THANH ĐO LƯỜNG DUNG TÍCH CỐ ĐỊNH DƯỚI ĐÁY MÀN HÌNH (STICKY BOTTOM BAR MOBILE NÂNG CẤP CHUYỂN ĐỔI CAO) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#FDE68A] shadow-[0_-6px_25px_rgba(0,0,0,0.12)] px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          {/* Cụm hiển thị thông tin khối lượng hoặc giá tiền */}
          <div className="flex-1 min-w-0">
            {isPerfectMatch && customName.trim() ? (
              <div>
                <span className="text-[10px] text-muted-foreground block font-medium">
                  {language === "en" ? "Total all-inclusive:" : "Tổng thanh toán:"}
                </span>
                <span className="text-base font-extrabold text-[#B45309] font-mono leading-tight">
                  {formatPrice(activePackaging.fixedPrice * quantity, language as "vi" | "en")}
                </span>
              </div>
            ) : (
              <div>
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
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isPerfectMatch
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : isOverweight
                          ? "bg-rose-50 text-rose-800 border-rose-300"
                          : "bg-amber-50 text-amber-800 border-amber-300"
                      }`}
                  >
                    {isPerfectMatch
                      ? (language === "en" ? "🟢 100% Ready" : "🟢 Đã đủ 100%")
                      : isOverweight
                        ? (language === "en" ? `🔴 Over ${Math.abs(remainingGrams)}g` : `🔴 Thừa ${Math.abs(remainingGrams)}g`)
                        : (language === "en" ? `🟡 Need ${remainingGrams}g` : `🟡 Thiếu ${remainingGrams}g`)}
                  </span>
                </div>

                <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden border border-border/60">
                  <div
                    style={{ width: `${progressPercent}%` }}
                    className={`h-full rounded-full transition-all duration-300 ${isPerfectMatch
                        ? "bg-emerald-500"
                        : isOverweight
                          ? "bg-rose-500"
                          : "bg-gradient-to-r from-amber-500 to-accent"
                      }`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cụm nút hành động linh hoạt trên Mobile */}
          <div className="shrink-0 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                const prompt = currentRecipeSummary
                  ? (language === "en"
                    ? `Please analyze my current recipe: ${currentRecipeSummary}.`
                    : `Nhờ AI phân tích công thức này: ${currentRecipeSummary}.`)
                  : undefined;
                handleOpenAiNutrition(prompt);
              }}
              className="p-2 rounded-xl bg-gradient-to-r from-amber-500/15 to-amber-500/25 border border-amber-300 text-[#78350F] transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-2xs"
              title={language === "en" ? "Nutrition Guide" : "Tư Vấn Dinh Dưỡng"}
              aria-label={language === "en" ? "Nutrition Guide" : "Tư Vấn Dinh Dưỡng"}
            >
              <Leaf className="w-4 h-4 text-[#B45309]" />
            </button>

            {remainingGrams > 0 ? (
              <button
                type="button"
                onClick={handleAutoFillLongNhan}
                className="px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-[#78350F] text-xs font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer shadow-2xs"
                title={language === "en" ? "Automatically fill remaining grams with Longan" : "Tự động bù số gram còn thiếu bằng Long Nhãn"}
              >
                <Plus className="w-3.5 h-3.5 text-amber-700" />
                <span>{language === "en" ? "Auto-fill" : "Bù đầy"}</span>
              </button>
            ) : isPerfectMatch ? (
              !customName.trim() ? (
                <button
                  type="button"
                  onClick={() => scrollToStep("step3Section")}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1 shadow-md shadow-emerald-950/20 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{language === "en" ? "Name it" : "Đặt tên"}</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(false)}
                    disabled={isValidating}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-neutral-100 border border-border text-primary text-xs font-bold transition-all active:scale-95 flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-[#B45309]" />
                    <span className="hidden xs:inline">{language === "en" ? "Cart" : "Giỏ"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={isValidating}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#D97706] to-[#B45309] hover:from-[#B45309] hover:to-[#92400E] text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1 shadow-md shadow-amber-950/30 cursor-pointer"
                  >
                    <span>{language === "en" ? "Order Now" : "Mua Ngay"}</span>
                  </button>
                </div>
              )
            ) : (
              <button
                type="button"
                onClick={handleReset}
                className="px-2.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
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
              <button
                type="button"
                onClick={() => setPreviewNut(null)}
                className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors border border-white/20 cursor-pointer shadow-md"
                aria-label={language === "en" ? "Close" : "Đóng"}
              >
                <X className="w-4 h-4" />
              </button>

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

      {/* NÚT DINH DƯỠNG NỔI */}
      {!isAiChatOpen && (
        <motion.button
          id="ai-nutrition-floating-button"
          onClick={() => handleOpenAiNutrition()}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          aria-label={language === "en" ? "Nutrition Advisor" : "Chuyên Gia Dinh Dưỡng"}
          className="fixed bottom-24 right-4 sm:bottom-6 sm:right-24 z-40 bg-gradient-to-r from-[#78350F] via-[#92400E] to-[#B45309] text-white p-3 sm:px-4 sm:py-3.5 rounded-full shadow-2xl hover:shadow-[#92400E]/50 flex items-center gap-2.5 transition-all group border border-amber-300/40 cursor-pointer"
        >
          <div className="relative">
            <Leaf className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping pointer-events-none" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-white" />
          </div>
          <div className="hidden sm:flex flex-col text-left leading-tight pr-1">
            <span className="text-[10px] font-normal text-amber-200">Trợ lý công thức</span>
            <span className="font-bold text-xs tracking-wide text-white">Tư Vấn Dinh Dưỡng</span>
          </div>
        </motion.button>
      )}

      {/* MODAL TRỢ LÝ DINH DƯỠNG */}
      <AnimatePresence>
        {isAiChatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-[100] sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[420px] sm:h-[630px] sm:max-h-[calc(100dvh-2.5rem)] w-full h-[100dvh] bg-white sm:rounded-2xl sm:shadow-2xl sm:border sm:border-amber-200/70 overflow-hidden flex flex-col sm:origin-bottom-right"
          >
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-[#78350F] via-[#92400E] to-[#B45309] text-white p-3.5 sm:p-4 pt-[max(0.875rem,env(safe-area-inset-top))] shrink-0 shadow-md flex justify-between items-center">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-white/20 border border-white/30 flex items-center justify-center font-bold text-xs shadow-inner shrink-0">
                  <Leaf className="w-5 h-5 text-amber-200" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm sm:text-base leading-tight truncate">
                    {language === "en" ? "Nutrition Advisor" : "Chuyên Gia Dinh Dưỡng"}
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] opacity-90 leading-tight">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="truncate">
                      {language === "en" ? "Custom Mix Recipe Advisor" : "Tư vấn công thức tự chọn hạt"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiChatOpen(false)}
                className="hover:bg-white/20 p-2 rounded-full transition-all active:scale-95 touch-manipulation cursor-pointer text-white"
                aria-label={language === "en" ? "Close" : "Đóng"}
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* AI Nutrition Widget Body */}
            <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
              <NutritionAiWidget
                language={language as "vi" | "en"}
                initialPrompt={aiCustomPrompt}
                customRecipeContext={currentRecipeSummary || undefined}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NÚT GIỎ HÀNG NỔI & DRAWER */}
      <CartButton isChatOpen={isAiChatOpen} />
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

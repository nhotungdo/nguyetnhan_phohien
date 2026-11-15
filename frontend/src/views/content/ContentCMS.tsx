"use client";

import imageCompression from 'browser-image-compression';

import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { contentApi, productApi } from "@/services/api.service";
import type { ProductResponse, ProductRequest, ProductSensoryScores } from "@/types/api.types";
import { FastImage } from "@/components/FastImage";
import { fetchWebsiteContent } from "@/lib/contentQuery";
import {
  Loader2, Save, CheckCircle2, Plus, Edit, Trash2, X,
  Type, Phone, MapPin, Globe, Image as ImageIcon, Package, Upload,
  CloudUpload, Link as LinkIcon, RefreshCw, AlertCircle,
  Star, BookOpen, ShoppingBag, Mail, Clock, Camera, RotateCcw, Heart
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

// URL tuyệt đối (https:, http:, protocol-relative //, data:) → dùng nguyên;
// còn lại (vd /uploads/banners/...) → ghép với API_URL.
const isRemoteUrl = (url: string) => /^(https?:)?\/\//i.test(url) || url.startsWith("data:");

const resolveSrc = (url?: string) => {
  if (!url) return "";
  if (isRemoteUrl(url)) return url;
  if (url.startsWith("/uploads/") || url.startsWith("uploads/")) {
    return url.startsWith("/") ? url : `/${url}`;
  }
  return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

const MAX_PRODUCT_IMAGE_MB = 5;

// Server chỉ nhận các đuôi này (whitelist ở ProductsController/ContentController).
// Kiểm tra ngay ở client để ảnh HEIC/BMP/SVG không lọt qua bước nén rồi bị server
// trả 400 SAU khi sản phẩm đã được lưu (admin tưởng "Lưu sản phẩm" thất bại).
const PRODUCT_IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const hasAllowedImageExt = (name: string) =>
  PRODUCT_IMAGE_EXTS.some((ext) => name.toLowerCase().endsWith(ext));

type TextFieldDef = {
  key: string;
  label: string;
  group: string;
  icon: React.ReactNode;
  multiline?: boolean;
  placeholder: string;
};

// Các ô văn bản admin sửa được trên Landing Page — `group` quyết định cách phân mục trong UI.
// `placeholder` = nội dung mặc định đang hiển thị: ô trống thì Landing rơi về fallback cũ.
const TEXT_KEYS: TextFieldDef[] = [
  // Phần mở đầu
  { key: "HeroTitle",    label: "Tiêu đề chính (Hero)", group: "Phần mở đầu (Hero)", icon: <Type className="w-4 h-4 text-primary" />, multiline: false, placeholder: "Đặc Sản Long Nhãn Phố Hiến" },
  { key: "HeroSubtitle", label: "Mô tả phụ (Hero)",     group: "Phần mở đầu (Hero)", icon: <Type className="w-4 h-4 text-primary" />, multiline: true,  placeholder: "Hương vị truyền thống, đậm đà bản sắc Hưng Yên." },
  // Giới thiệu & sản phẩm
  { key: "AboutTitle",       label: "Tiêu đề giới thiệu",         group: "Giới thiệu & Sản phẩm", icon: <Type className="w-4 h-4 text-primary" />, multiline: false, placeholder: "Về Nguyệt Nhãn Phố Hiến" },
  { key: "AboutDescription", label: "Nội dung giới thiệu",        group: "Giới thiệu & Sản phẩm", icon: <Globe className="w-4 h-4 text-primary" />, multiline: true,  placeholder: "Ra đời từ mảnh đất Hưng Yên ngàn năm văn hiến..." },
  { key: "ProductsTitle",    label: "Tiêu đề danh sách sản phẩm", group: "Giới thiệu & Sản phẩm", icon: <Package className="w-4 h-4 text-primary" />, multiline: false, placeholder: "Sản Phẩm Của Chúng Tôi" },
  { key: "ProductsSubtitle", label: "Mô tả danh sách sản phẩm",   group: "Giới thiệu & Sản phẩm", icon: <Package className="w-4 h-4 text-primary" />, multiline: false, placeholder: "Món quà sức khỏe dành tặng người thân yêu" },
  // Câu chuyện
  { key: "StoryTitle",       label: "Tiêu đề câu chuyện",  group: "Câu chuyện tiến vua", icon: <BookOpen className="w-4 h-4 text-primary" />, multiline: false, placeholder: "Thứ Quả Tiến Vua Trứ Danh" },
  { key: "StoryDescription", label: "Nội dung câu chuyện", group: "Câu chuyện tiến vua", icon: <BookOpen className="w-4 h-4 text-primary" />, multiline: true,  placeholder: "Tương truyền, vào thế kỷ 16, một vị quan đi tuần qua vùng Phố Hiến..." },
  // Khối đặt hàng
  { key: "OrderTitle",       label: "Tiêu đề khối đặt hàng (mỗi dòng = 1 dòng hiển thị)", group: "Khối đặt hàng", icon: <ShoppingBag className="w-4 h-4 text-primary" />, multiline: true,  placeholder: "Thưởng Thức\nHương Vị Tinh Túy" },
  { key: "OrderDescription", label: "Mô tả khối đặt hàng", group: "Khối đặt hàng", icon: <ShoppingBag className="w-4 h-4 text-primary" />, multiline: true,  placeholder: "Đặt hàng ngay hôm nay để nhận được những mẻ long nhãn mới nhất..." },
  { key: "Hotline",          label: "Số hotline liên hệ",     group: "Khối đặt hàng", icon: <Phone className="w-4 h-4 text-primary" />, multiline: false, placeholder: "090 123 4567" },
  { key: "Address",          label: "Địa chỉ xưởng sản xuất", group: "Khối đặt hàng", icon: <MapPin className="w-4 h-4 text-primary" />, multiline: false, placeholder: "Số 1, Đường Phố Hiến, Tp. Hưng Yên" },
  // Chân trang & liên hệ
  { key: "FooterHotline", label: "Hotline/Zalo (chân trang)", group: "Chân trang & Liên hệ", icon: <Phone className="w-4 h-4 text-primary" />, multiline: false, placeholder: "0982.072.601" },
  { key: "FooterAddress", label: "Địa chỉ (chân trang)",      group: "Chân trang & Liên hệ", icon: <MapPin className="w-4 h-4 text-primary" />, multiline: false, placeholder: "123 Phố Hiến, Phường Hồng Châu, Tp. Hưng Yên" },
  { key: "ContactEmail",  label: "Email liên hệ",             group: "Chân trang & Liên hệ", icon: <Mail className="w-4 h-4 text-primary" />, multiline: false, placeholder: "nguyetnhanphohien@gmail.com" },
  { key: "ContactHours",  label: "Giờ mở cửa",                group: "Chân trang & Liên hệ", icon: <Clock className="w-4 h-4 text-primary" />, multiline: false, placeholder: "08:00 - 20:00 (T2-CN)" },
  { key: "FooterText",    label: "Nội dung chân trang",       group: "Chân trang & Liên hệ", icon: <Globe className="w-4 h-4 text-primary" />, multiline: true,  placeholder: "© 2026 Nguyệt Nhãn Phố Hiến. Tất cả các quyền được bảo lưu." },
];

// Thứ tự nhóm hiển thị trong UI (lấy theo thứ tự xuất hiện của TEXT_KEYS)
const TEXT_GROUPS = Array.from(new Set(TEXT_KEYS.map(f => f.group)));

type ImageSlot = {
  key: string;
  label: string;
  hint: string;
  boxClass: string;
  group: string;
  defaultPath?: string;
};

// Danh sách các ô ảnh Quản trị viên có thể thay đổi trực tiếp qua CMS
// Khớp whitelist ImageKeys phía Backend (ContentService.cs).
const IMAGE_SLOTS: ImageSlot[] = [
  // ===== 1. ẢNH TRANG CHỦ (LANDING PAGE) =====
  {
    key: "SiteLogo",
    label: "Logo thương hiệu",
    hint: "Hiển thị ở Header và Footer toàn trang web. Mặc định: /logo.jpg.",
    boxClass: "w-28 h-28 rounded-full",
    group: "Ảnh Trang Chủ (Landing Page)",
    defaultPath: "/logo.jpg",
  },
  {
    key: "HeroBannerUrl",
    label: "Ảnh banner Hero",
    hint: "Ảnh lớn ở phần mở đầu trang chủ Landing Page. Mặc định: /images/hero.png.",
    boxClass: "w-full aspect-video rounded-xl",
    group: "Ảnh Trang Chủ (Landing Page)",
    defaultPath: "/images/hero.png",
  },
  {
    key: "HeroBgImage",
    label: "Ảnh nền phong cảnh mờ của Hero trang chủ",
    hint: "Ảnh phong cảnh Chùa Chuông mờ phía sau Hero trang chủ. Mặc định: /images/chuachuong_hero_bg.jpg.",
    boxClass: "w-full aspect-video rounded-xl",
    group: "Ảnh Trang Chủ (Landing Page)",
    defaultPath: "/images/chuachuong_hero_bg.jpg",
  },
  {
    key: "StoryImage",
    label: "Ảnh câu chuyện di sản",
    hint: "Bên cạnh tiêu đề “Thứ Quả Tiến Vua Trứ Danh”.",
    boxClass: "w-40 aspect-[4/5] rounded-xl",
    group: "Ảnh Trang Chủ (Landing Page)",
  },
  {
    key: "CultureImage",
    label: "Ảnh văn hóa thưởng trà",
    hint: "Khối tròn tôn vinh nghệ thuật ẩm thực ở mục Văn hóa Phố Hiến.",
    boxClass: "w-40 h-40 rounded-full",
    group: "Ảnh Trang Chủ (Landing Page)",
  },

  // ===== 2. ẢNH TRANG CÂU CHUYỆN DI SẢN (/cau-chuyen) =====
  {
    key: "Story_HeroBg",
    label: "Ảnh nền mở đầu (Hero)",
    hint: "Ảnh nền mờ toàn cảnh phần mở đầu trang /cau-chuyen. Mặc định: /images/chuachuong_hero_bg.jpg.",
    boxClass: "w-full aspect-[21/9] rounded-xl",
    group: "Ảnh Trang Câu Chuyện Di Sản (/cau-chuyen)",
    defaultPath: "/images/chuachuong_hero_bg.jpg",
  },
  {
    key: "Story_ChuaHien",
    label: "Ảnh Chùa Hiến & Cây Nhãn Tổ",
    hint: "Ảnh minh họa phần lịch sử cây nhãn tổ hơn 3 thế kỷ. Mặc định: /images/chuachuong.jpg.",
    boxClass: "w-full aspect-[4/3] rounded-xl",
    group: "Ảnh Trang Câu Chuyện Di Sản (/cau-chuyen)",
    defaultPath: "/images/chuachuong.jpg",
  },
  {
    key: "Story_Ingredients",
    label: "Ảnh Bộ 3 Tinh Hoa Nguyên Liệu",
    hint: "Ảnh kết tinh long nhãn, sen Bắc & hạt dưỡng sinh. Mặc định: /images/combo3sp.jpg.",
    boxClass: "w-full aspect-[4/3] rounded-xl",
    group: "Ảnh Trang Câu Chuyện Di Sản (/cau-chuyen)",
    defaultPath: "/images/combo3sp.jpg",
  },
  {
    key: "Story_PosterUrl",
    label: "Bìa video Ký Sự Di Sản VTV",
    hint: "Ảnh poster hiển thị trước khi bấm phát video tư liệu ký sự. Mặc định: /images/setqua.jpg.",
    boxClass: "w-full aspect-video rounded-xl",
    group: "Ảnh Trang Câu Chuyện Di Sản (/cau-chuyen)",
    defaultPath: "/images/setqua.jpg",
  },
  {
    key: "Story_Pillar_Nguyet",
    label: "Triết lý: Nguyệt (Vẹn Tròn Đoàn Viên)",
    hint: "Ảnh minh họa trụ cột triết lý Nguyệt. Mặc định: /images/anhdep1.png.",
    boxClass: "w-full aspect-[4/3] rounded-xl",
    group: "Ảnh Trang Câu Chuyện Di Sản (/cau-chuyen)",
    defaultPath: "/images/anhdep1.png",
  },
  {
    key: "Story_Pillar_Nhan",
    label: "Triết lý: Nhãn (Tinh Hoa Dưỡng Sinh)",
    hint: "Ảnh minh họa trụ cột triết lý Nhãn. Mặc định: /images/nuts/longnhanomsen.jpg.",
    boxClass: "w-full aspect-[4/3] rounded-xl",
    group: "Ảnh Trang Câu Chuyện Di Sản (/cau-chuyen)",
    defaultPath: "/images/nuts/longnhanomsen.jpg",
  },
  {
    key: "Story_Pillar_PhoHien",
    label: "Triết lý: Phố Hiến (Tự Hào Di Sản)",
    hint: "Ảnh minh họa trụ cột triết lý Phố Hiến. Mặc định: /images/chuachuong.jpg.",
    boxClass: "w-full aspect-[4/3] rounded-xl",
    group: "Ảnh Trang Câu Chuyện Di Sản (/cau-chuyen)",
    defaultPath: "/images/chuachuong.jpg",
  },

  // ===== 2. BAO BÌ & QUY CÁCH ĐÓNG GÓI (TRANG TỰ CHỌN HẠT) =====
  {
    key: "CustomMix_Pkg_ZipBag",
    label: "Bao bì: Túi Zip 150g",
    hint: "Ảnh thẻ chọn bao bì Bước 1 & tóm tắt đơn hàng trang /tu-chon-hat. Mặc định: /images/tuizip.jpg.",
    boxClass: "w-32 h-32 rounded-2xl",
    group: "Bao Bì Trang Tự Chọn Hạt (Custom Mix)",
    defaultPath: "/images/tuizip.jpg",
  },
  {
    key: "CustomMix_Pkg_Box",
    label: "Bao bì: Hộp Mica 300g",
    hint: "Ảnh thẻ chọn bao bì Bước 1 & tóm tắt đơn hàng trang /tu-chon-hat. Mặc định: /images/hopnhua.jpg.",
    boxClass: "w-32 h-32 rounded-2xl",
    group: "Bao Bì Trang Tự Chọn Hạt (Custom Mix)",
    defaultPath: "/images/hopnhua.jpg",
  },
  {
    key: "CustomMix_Pkg_GiftSet",
    label: "Bao bì: Lễ Hộp Hoàng Gia 900g",
    hint: "Ảnh thẻ chọn bao bì Bước 1 & tóm tắt đơn hàng trang /tu-chon-hat. Mặc định: /images/setqua.jpg.",
    boxClass: "w-32 h-32 rounded-2xl",
    group: "Bao Bì Trang Tự Chọn Hạt (Custom Mix)",
    defaultPath: "/images/setqua.jpg",
  },

  // ===== 3. NGUYÊN LIỆU 5 LOẠI HẠT ĐẶC SẢN (TRANG TỰ CHỌN HẠT) =====
  {
    key: "CustomMix_Nut_LongNhan",
    label: "Hạt: Long Nhãn Phố Hiến Tuyển Chọn",
    hint: "Ảnh hạt ở Bước 2 & cửa sổ xem cận cảnh trong /tu-chon-hat. Mặc định: /images/nuts/longnhanomsen.jpg.",
    boxClass: "w-28 h-28 rounded-full",
    group: "5 Loại Hạt Trang Tự Chọn Hạt (Custom Mix)",
    defaultPath: "/images/nuts/longnhanomsen.jpg",
  },
  {
    key: "CustomMix_Nut_Macca",
    label: "Hạt: Hạt Macca Tây Nguyên (Tách Nhân)",
    hint: "Ảnh hạt ở Bước 2 & cửa sổ xem cận cảnh trong /tu-chon-hat. Mặc định: /images/nuts/macca.jpg.",
    boxClass: "w-28 h-28 rounded-full",
    group: "5 Loại Hạt Trang Tự Chọn Hạt (Custom Mix)",
    defaultPath: "/images/nuts/macca.jpg",
  },
  {
    key: "CustomMix_Nut_HatDieu",
    label: "Hạt: Hạt Điều Bình Phước Rang Mộc (A+)",
    hint: "Ảnh hạt ở Bước 2 & cửa sổ xem cận cảnh trong /tu-chon-hat. Mặc định: /images/nuts/hatdieu.jpg.",
    boxClass: "w-28 h-28 rounded-full",
    group: "5 Loại Hạt Trang Tự Chọn Hạt (Custom Mix)",
    defaultPath: "/images/nuts/hatdieu.jpg",
  },
  {
    key: "CustomMix_Nut_HanhNhan",
    label: "Hạt: Hạnh Nhân Nướng Mộc California",
    hint: "Ảnh hạt ở Bước 2 & cửa sổ xem cận cảnh trong /tu-chon-hat. Mặc định: /images/nuts/hanhnhan.jpg.",
    boxClass: "w-28 h-28 rounded-full",
    group: "5 Loại Hạt Trang Tự Chọn Hạt (Custom Mix)",
    defaultPath: "/images/nuts/hanhnhan.jpg",
  },
  {
    key: "CustomMix_Nut_BiXanh",
    label: "Hạt: Hạt Bí Xanh Ấn Độ",
    hint: "Ảnh hạt ở Bước 2 & cửa sổ xem cận cảnh trong /tu-chon-hat. Mặc định: /images/nuts/bixanh.jpg.",
    boxClass: "w-28 h-28 rounded-full",
    group: "5 Loại Hạt Trang Tự Chọn Hạt (Custom Mix)",
    defaultPath: "/images/nuts/bixanh.jpg",
  },

  // ===== 4. BANNER TRANG TỰ CHỌN HẠT =====
  {
    key: "CustomMix_BannerUrl",
    label: "Banner đầu trang Tự Chọn Hạt",
    hint: "Ảnh banner minh họa nổi bật ở phần đầu trang /tu-chon-hat.",
    boxClass: "w-full aspect-video rounded-xl",
    group: "Banner & Minh Họa Trang Tự Chọn Hạt",
    defaultPath: "/images/banner_tu_chon_hat.png",
  },
];

const IMAGE_GROUPS = Array.from(new Set(IMAGE_SLOTS.map(s => s.group)));

const EMPTY_FORM: ProductRequest = {
  productCode: "",
  name: "",
  nameEn: "",
  packagingType: "",
  size: "",
  price: 0,
  badge: "",
  description: "",
  overview: "",
  ingredients: "",
  sensoryScores: '{"nutCrispiness":8.5,"longanChewiness":9.0,"naturalSweetness":9.0,"harmoniousAroma":9.0}',
  healthBenefits: "",
  usageInstructions: "",
  isActive: true,
  isFavorite: false,
  displayOrder: 0,
};

type Tab = "text" | "products" | "images";
type ModalTab = "basic" | "content" | "sensory" | "images";
type ImageInputMode = "upload" | "url";

function parseSensoryScores(jsonStr?: string) {
  try {
    const p = typeof jsonStr === "string" ? JSON.parse(jsonStr) : jsonStr;
    if (p && typeof p === "object") {
      return {
        nutCrispiness: typeof p.nutCrispiness === "number" ? p.nutCrispiness : 8.5,
        longanChewiness: typeof p.longanChewiness === "number" ? p.longanChewiness : 9.0,
        naturalSweetness: typeof p.naturalSweetness === "number" ? p.naturalSweetness : 9.0,
        harmoniousAroma: typeof p.harmoniousAroma === "number" ? p.harmoniousAroma : 9.0,
      };
    }
  } catch {}
  return { nutCrispiness: 8.5, longanChewiness: 9.0, naturalSweetness: 9.0, harmoniousAroma: 9.0 };
}

export default function ContentCMS() {
  const [activeTab, setActiveTab] = useState<Tab>("text");
  const [contents, setContents] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // React Query: Fetch content
  const {
    data: fetchedContents, isLoading: isLoadingText,
    isError: isErrorText, error: contentError, refetch: refetchContents
  } = useQuery({
    queryKey: ["website", "content"],
    queryFn: async () => {
      // Dùng CHUNG queryFn với Landing Page (fetchWebsiteContent) cho cùng query key:
      // nếu mỗi nơi tự map một kiểu thì React Query lấy bản của observer chạy trước →
      // mở /content rồi điều hướng sang / có thể nhận bản THIẾU defaultContents và
      // làm mất text mặc định trên Landing Page.
      const mapped = await fetchWebsiteContent();
      [...TEXT_KEYS, ...IMAGE_SLOTS].forEach(f => { if (mapped[f.key] === undefined) mapped[f.key] = ""; });
      return mapped;
    }
  });

  // Đồng bộ server → state local CHỈ khi tải lần đầu.
  // Nếu sync ở mỗi refetch (sau khi lưu một field) thì phần đang soạn dở
  // ở các field khác sẽ bị ghi đè mất.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (!fetchedContents || hydratedRef.current) return;
    hydratedRef.current = true;
    setContents(fetchedContents);
  }, [fetchedContents]);

  // React Query: Fetch products (Admin)
  const { data: products = [], isLoading: isLoadingProducts, isError: isErrorProducts, refetch: refetchProducts } = useQuery({
    queryKey: ["products", "admin"],
    queryFn: () => productApi.getAllAdmin(),
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<ModalTab>("basic");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductRequest>(EMPTY_FORM);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  // Ảnh chờ upload: kèm blob URL tạo sẵn — tránh tạo URL mới mỗi lần render (rò rỉ bộ nhớ)
  const [pendingImages, setPendingImages] = useState<{ file: File; url: string }[]>([]);
  const [existingImages, setExistingImages] = useState<{ id: string; imagePath: string; displayOrder: number }[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleSaveText = async (key: string) => {
    setIsSaving(key);
    try {
      await contentApi.upsert({ key, value: contents[key] || "" });
      queryClient.invalidateQueries({ queryKey: ["website", "content"] });
      setSaveSuccess(key); setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      const label = TEXT_KEYS.find(f => f.key === key)?.label ?? key;
      alert(`Lỗi khi lưu "${label}".\n${err instanceof Error ? err.message : ""}`.trim());
    }
    finally { setIsSaving(null); }
  };

  // Sau khi một ô ảnh lưu thành công (upload hoặc URL): cập nhật state +
  // invalidate cache để Landing Page thấy ngay thay đổi.
  const handleSlotSaved = (key: string, path: string) => {
    setContents(prev => ({ ...prev, [key]: path }));
    queryClient.invalidateQueries({ queryKey: ["website", "content"] });
  };

  // Giải phóng toàn bộ blob URL của ảnh đang chờ upload
  const clearPendingImages = () => {
    setPendingImages(prev => { prev.forEach(p => URL.revokeObjectURL(p.url)); return []; });
  };

  const [togglingFavoriteId, setTogglingFavoriteId] = useState<string | null>(null);

  const handleToggleFavorite = async (product: ProductResponse) => {
    if (togglingFavoriteId) return;
    setTogglingFavoriteId(product.id);

    // Optimistic UI update in React Query cache
    queryClient.setQueryData<ProductResponse[]>(["products", "admin"], old => {
      if (!old) return old;
      return old.map(p => p.id === product.id ? { ...p, isFavorite: !p.isFavorite } : p);
    });

    try {
      await productApi.toggleFavorite(product.id);
      await refetchProducts();
      await queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (err) {
      await refetchProducts();
      alert(`Không thể cập nhật trạng thái yêu thích!\n${err instanceof Error ? err.message : "Vui lòng tải lại trang và thử lại."}`.trim());
    } finally {
      setTogglingFavoriteId(null);
    }
  };

  const openModal = (product?: ProductResponse) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        productCode: product.productCode || "",
        name: product.name,
        nameEn: product.nameEn || "",
        packagingType: product.packagingType || "",
        size: product.size,
        price: product.price,
        badge: product.badge || "",
        description: product.description || "",
        overview: product.overview || "",
        ingredients: product.ingredients || "",
        sensoryScores: product.sensoryScores || '{"nutCrispiness":8.5,"longanChewiness":9.0,"naturalSweetness":9.0,"harmoniousAroma":9.0}',
        healthBenefits: product.healthBenefits || "",
        usageInstructions: product.usageInstructions || "",
        isActive: product.isActive,
        isFavorite: product.isFavorite ?? false,
        displayOrder: product.displayOrder,
      });
      setExistingImages([...product.images]);
    } else {
      setEditingId(null);
      // Số thứ tự kế tiếp phải lấy theo giá trị LỚN NHẤT hiện có, không dùng
      // products.length + 1 (xóa sản phẩm ở giữa rồi thêm mới → trùng thứ tự).
      const maxDisplayOrder = products.reduce((max, p) => Math.max(max, p.displayOrder), 0);
      setFormData({ ...EMPTY_FORM, displayOrder: maxDisplayOrder + 1 });
      setExistingImages([]);
    }
    setModalTab("basic");
    clearPendingImages();
    setDeletedImageIds([]);
    setIsModalOpen(true);
  };

  const closeModal = () => { clearPendingImages(); setIsModalOpen(false); setEditingId(null); };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    const valid: { file: File; url: string }[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) { alert(`"${file.name}" không phải file ảnh.`); continue; }
      if (!hasAllowedImageExt(file.name)) {
        alert(`"${file.name}" không đúng định dạng. Chỉ nhận JPG, PNG, WEBP hoặc GIF.`);
        continue;
      }
      if (file.size > MAX_PRODUCT_IMAGE_MB * 1024 * 1024) {
        alert(`"${file.name}" vượt quá ${MAX_PRODUCT_IMAGE_MB}MB (${(file.size / 1024 / 1024).toFixed(1)}MB).`);
        continue;
      }
      valid.push({ file, url: URL.createObjectURL(file) });
    }
    if (valid.length > 0) setPendingImages(prev => [...prev, ...valid]);
  };

  const removePendingImage = (idx: number) => setPendingImages(prev => {
    const target = prev[idx];
    if (target) URL.revokeObjectURL(target.url);
    return prev.filter((_, i) => i !== idx);
  });
  const removeExistingImage = (imgId: string) => {
    setExistingImages(prev => prev.filter(i => i.id !== imgId));
    setDeletedImageIds(prev => [...prev, imgId]);
  };

  // Đặt 1 ảnh ĐÃ LƯU làm ảnh đại diện: chuyển lên đầu rồi đồng bộ thứ tự lên server.
  const setMainImage = async (imgId: string) => {
    if (!editingId) return;
    const previous = existingImages;
    const idx = previous.findIndex(i => i.id === imgId);
    if (idx <= 0) return;
    const next = [...previous];
    const [moved] = next.splice(idx, 1);
    next.unshift(moved);
    setExistingImages(next);
    try {
      // Backend mới đã hỗ trợ reorder linh hoạt: đưa danh sách id ưu tiên lên đầu
      await productApi.reorderImages(editingId, next.map(i => i.id));
      await refetchProducts();
      await queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (err) {
      setExistingImages(previous); // server từ chối → hoàn nguyên lại thứ tự cũ
      alert(`Lỗi khi đặt ảnh chính!\n${err instanceof Error ? err.message : ""}`.trim());
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingProduct) return;
    setIsSavingProduct(true);

    let productId = editingId;
    let touchedServer = false;
    try {
      if (productId) {
        await productApi.update(productId, formData);
      } else {
        const created = await productApi.create(formData);
        productId = created.id;
        // Ghi ngay editingId: nếu các bước sau lỗi, bấm "Lưu" lần nữa sẽ UPDATE
        // thay vì tạo thêm sản phẩm trùng.
        setEditingId(created.id);
      }
      touchedServer = true;

      // Upload ảnh MỚI trước, xóa ảnh CŨ sau — upload lỗi thì chưa mất ảnh nào.
      const uploadedImageIds: string[] = [];
      if (pendingImages.length > 0) {
        setUploadingImages(true);
        for (const item of [...pendingImages]) {
          // Compress the image before uploading to optimize speed and avoid size limits
          const options = {
            maxSizeMB: 1, // Max 1MB for product images
            maxWidthOrHeight: 1280,
            useWebWorker: true
          };
          let fileToUpload = item.file;
          try {
            const compressed = await imageCompression(item.file, options);
            // Re-create the File object to ensure the 'name' property is preserved
            fileToUpload = new File([compressed], item.file.name, {
              type: compressed.type,
              lastModified: Date.now(),
            });
          } catch (error) {
            console.error("Lỗi nén ảnh sản phẩm:", error);
          }

          const uploaded = await productApi.uploadImage(productId!, fileToUpload);
          if (uploaded && uploaded.id) {
            uploadedImageIds.push(uploaded.id);
          }
          URL.revokeObjectURL(item.url);
          // Bỏ dần khỏi danh sách chờ để retry không upload trùng lại ảnh đã lên
          setPendingImages(prev => prev.filter(p => p.url !== item.url));
        }
      }
      for (const imgId of [...deletedImageIds]) {
        await productApi.deleteImage(productId!, imgId);
        setDeletedImageIds(prev => prev.filter(id => id !== imgId));
        setExistingImages(prev => prev.filter(i => i.id !== imgId));
      }

      // Đặt ảnh mới tải lên làm ảnh chính (DisplayOrder = 0) nếu có tải ảnh mới lên
      const remainingExistingIds = existingImages
        .filter(i => !deletedImageIds.includes(i.id))
        .map(i => i.id);
      const finalImageOrder = [...uploadedImageIds, ...remainingExistingIds];
      if (uploadedImageIds.length > 0 && finalImageOrder.length > 0 && productId) {
        try {
          await productApi.reorderImages(productId, finalImageOrder);
        } catch (reorderErr) {
          console.warn("Không reorder được ảnh sau khi lưu:", reorderErr);
        }
      }

      await refetchProducts();
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      closeModal();
    } catch (err) {
      console.error(err);
      alert(`Lỗi khi lưu sản phẩm!\n${err instanceof Error ? err.message : ""}`.trim());
      // Đã tạo/đã sửa được một phần → đồng bộ lại danh sách để không hiển thị dữ liệu cũ
      if (touchedServer) {
        refetchProducts();
        queryClient.invalidateQueries({ queryKey: ["products"] });
      }
    } finally { setIsSavingProduct(false); setUploadingImages(false); }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Bạn có chắc xóa sản phẩm này?")) return;
    try { 
      await productApi.delete(id); 
      await refetchProducts();
      await queryClient.invalidateQueries({ queryKey: ["products"] });
    }
    catch (err) { alert(`Lỗi khi xóa sản phẩm!\n${err instanceof Error ? err.message : ""}`.trim()); }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "text",     label: "📝 Văn bản & Thông tin", icon: <Type className="w-4 h-4" /> },
    { key: "products", label: "📦 Sản phẩm",            icon: <Package className="w-4 h-4" /> },
    { key: "images",   label: "🖼️ Quản Lý Hình Ảnh (Website & Tự Chọn Hạt)", icon: <ImageIcon className="w-4 h-4" /> },
  ];

  // UI khi không tải được nội dung — không render form rỗng để tránh admin
  // ghi đè dữ liệu thật bằng giá trị trống.
  const contentErrorBlock = (
    <div className="p-10 flex flex-col items-center gap-3 text-center">
      <div className="w-11 h-11 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
        <AlertCircle className="w-5 h-5 text-red-500" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold">Không tải được nội dung website</p>
        <p className="text-sm text-muted-foreground max-w-md">
          {contentError instanceof Error ? contentError.message : "Không kết nối được máy chủ. Vui lòng thử lại."}
        </p>
      </div>
      <button onClick={() => refetchContents()} className="border hover:bg-muted px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
        <RefreshCw className="w-4 h-4" /> Thử lại
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">Nội dung Website</h2>
        <p className="text-muted-foreground">Quản lý toàn bộ nội dung hiển thị trên Landing Page và trang Tự Chọn Hạt.</p>
      </div>

      <div className="border-b border-border flex gap-1 overflow-x-auto pb-px scrollbar-none">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: VAN BAN */}
      {activeTab === "text" && (
        <div className="bg-card border shadow-sm rounded-xl overflow-hidden">
          <div className="p-3.5 sm:p-5 border-b bg-muted/20">
            <h3 className="font-semibold text-sm sm:text-base">Chỉnh sửa văn bản trên Landing Page</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">Thay đổi ngay lập tức, không cần deploy lại</p>
          </div>
          {isLoadingText ? <div className="flex justify-center p-10"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div> : isErrorText && !fetchedContents ? contentErrorBlock : (
            <div className="p-3.5 sm:p-6 space-y-7 sm:space-y-9">
              {TEXT_GROUPS.map(group => (
                <section key={group} className="space-y-4 sm:space-y-5">
                  <div className="flex items-center gap-3">
                    <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-primary">{group}</h4>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  {TEXT_KEYS.filter(f => f.group === group).map(field => (
                    <div key={field.key} className="space-y-1.5 sm:space-y-2">
                      <label className="flex items-center gap-2 font-medium text-xs sm:text-sm">{field.icon}{field.label}</label>
                      <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-start">
                        {field.multiline
                          ? <textarea value={contents[field.key] || ""} onChange={e => setContents(p => ({ ...p, [field.key]: e.target.value }))} placeholder={field.placeholder} rows={3} className="w-full sm:flex-1 bg-background border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-y" />
                          : <input type="text" value={contents[field.key] || ""} onChange={e => setContents(p => ({ ...p, [field.key]: e.target.value }))} placeholder={field.placeholder} className="w-full sm:flex-1 bg-background border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />}
                        <button onClick={() => handleSaveText(field.key)} disabled={isSaving === field.key} className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-4 py-2.5 sm:py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-sm shrink-0 w-full sm:w-auto">
                          {isSaving === field.key ? <><Loader2 className="w-4 h-4 animate-spin" /> Lưu...</> : saveSuccess === field.key ? <><CheckCircle2 className="w-4 h-4" /> Đã lưu</> : <><Save className="w-4 h-4" /> Lưu lại</>}
                        </button>
                      </div>
                    </div>
                  ))}
                </section>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SAN PHAM */}
      {activeTab === "products" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-2">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Quản lý sản phẩm hiển thị trên <strong>Trang chủ</strong> và trang <strong>Sản phẩm</strong>.
              Sản phẩm mới sẽ tự động xuất hiện ở cả hai trang sau khi lưu nếu bật “Hiển thị”.
            </p>
            <button onClick={() => openModal()} className="bg-accent hover:bg-accent/90 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-all shadow-sm text-xs sm:text-sm shrink-0">
              <Plus className="w-4 h-4" /> Thêm sản phẩm
            </button>
          </div>

          {/* DESKTOP TABLE VIEW (≥ 768px) */}
          <div className="hidden md:block bg-card border rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground text-xs font-semibold uppercase">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Ảnh chính</th>
                  <th className="px-5 py-3.5 font-medium">Mã & Tên sản phẩm</th>
                  <th className="px-5 py-3.5 font-medium">Bao bì & Quy cách</th>
                  <th className="px-5 py-3.5 font-medium">Giá bán (VNĐ)</th>
                  <th className="px-5 py-3.5 font-medium">Huy hiệu</th>
                  <th className="px-5 py-3.5 font-medium text-center">Yêu thích</th>
                  <th className="px-5 py-3.5 font-medium">Số ảnh</th>
                  <th className="px-5 py-3.5 font-medium">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoadingProducts ? (
                  <tr><td colSpan={9} className="px-5 py-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></td></tr>
                ) : isErrorProducts && products.length === 0 ? (
                  <tr><td colSpan={9} className="px-5 py-8 text-center space-y-2">
                    <p className="text-sm font-medium">Không tải được danh sách sản phẩm.</p>
                    <button onClick={() => refetchProducts()} className="border hover:bg-muted px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 transition-colors">
                      <RefreshCw className="w-4 h-4" /> Thử lại
                    </button>
                  </td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={9} className="px-5 py-8 text-center text-muted-foreground">Chưa có sản phẩm. Hãy thêm mới!</td></tr>
                ) : products.map(p => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                        {p.images[0]
                          ? <FastImage src={resolveSrc(p.images[0].imagePath)} alt={p.name} width={48} height={48} loading="lazy" className="w-full h-full object-cover" />
                          : <ImageIcon className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          {p.productCode && (
                            <span className="text-[10px] font-mono font-bold bg-muted px-1.5 py-0.5 rounded border text-stone-600 shrink-0">
                              {p.productCode}
                            </span>
                          )}
                          <span className="font-bold text-foreground">{p.name}</span>
                        </div>
                        {p.nameEn && <div className="text-xs text-muted-foreground">{p.nameEn}</div>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-foreground">{p.size}</div>
                      {p.packagingType && <div className="text-xs text-muted-foreground">{p.packagingType}</div>}
                    </td>
                    <td className="px-5 py-3.5 text-accent font-semibold">{p.price.toLocaleString("vi-VN").replace(/,/g, ".")}đ</td>
                    <td className="px-5 py-3.5">
                      {p.badge ? (
                        <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-semibold px-2 py-0.5 rounded-full inline-block max-w-[160px] truncate">
                          {p.badge}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleFavorite(p)}
                        disabled={togglingFavoriteId === p.id}
                        title={p.isFavorite ? "Bỏ đánh dấu yêu thích" : "Đánh dấu là sản phẩm yêu thích"}
                        className={`p-2 rounded-full transition-all cursor-pointer inline-flex items-center justify-center ${
                          p.isFavorite
                            ? "bg-rose-50 text-rose-600 hover:bg-rose-100 ring-1 ring-rose-200 shadow-2xs"
                            : "text-stone-300 hover:text-stone-500 hover:bg-stone-100"
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 transition-transform active:scale-125 ${
                            p.isFavorite ? "fill-rose-500 text-rose-600" : ""
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-5 py-3.5"><span className="bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full">{p.images.length} ảnh</span></td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{p.isActive ? "Hiển thị" : "Đang ẩn"}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openModal(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Chỉnh sửa sản phẩm"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteProduct(p.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Xóa sản phẩm"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE PRODUCT CARDS (< 768px) */}
          <div className="md:hidden space-y-3">
            {isLoadingProducts ? (
              <div className="bg-card border rounded-2xl p-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></div>
            ) : isErrorProducts && products.length === 0 ? (
              <div className="bg-card border rounded-2xl p-6 text-center space-y-2">
                <p className="text-sm font-medium">Không tải được danh sách sản phẩm.</p>
                <button onClick={() => refetchProducts()} className="border hover:bg-muted px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 transition-colors">
                  <RefreshCw className="w-4 h-4" /> Thử lại
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="bg-card border rounded-2xl p-8 text-center text-muted-foreground text-sm">Chưa có sản phẩm. Hãy thêm mới!</div>
            ) : (
              products.map(p => (
                <div key={p.id} className="bg-card border border-border/80 rounded-2xl p-3.5 shadow-sm flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden border shrink-0">
                      {p.images[0]
                        ? <FastImage src={resolveSrc(p.images[0].imagePath)} alt={p.name} width={64} height={64} loading="lazy" className="w-full h-full object-cover" />
                        : <ImageIcon className="w-5 h-5 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0">
                          {p.productCode && (
                            <span className="text-[10px] font-mono font-bold bg-muted px-1.5 py-0.5 rounded border text-stone-600 inline-block mb-0.5">
                              {p.productCode}
                            </span>
                          )}
                          <h4 className="font-bold text-foreground text-sm truncate">{p.name}</h4>
                          {p.nameEn && <p className="text-xs text-muted-foreground truncate">{p.nameEn}</p>}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleFavorite(p)}
                            disabled={togglingFavoriteId === p.id}
                            title={p.isFavorite ? "Bỏ yêu thích" : "Đánh dấu yêu thích"}
                            className={`p-1.5 rounded-full transition-all cursor-pointer inline-flex items-center justify-center ${
                              p.isFavorite
                                ? "bg-rose-50 text-rose-600 ring-1 ring-rose-200 shadow-2xs"
                                : "text-stone-300 hover:text-stone-500 hover:bg-stone-100"
                            }`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${p.isFavorite ? "fill-rose-500 text-rose-600" : ""}`} />
                          </button>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {p.isActive ? "Hiển thị" : "Ẩn"}
                          </span>
                        </div>
                      </div>
                      <p className="text-accent font-bold text-sm mt-0.5">{p.price.toLocaleString("vi-VN").replace(/,/g, ".")}đ</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        <span className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-medium">{p.size}</span>
                        {p.packagingType && <span className="bg-muted px-1.5 py-0.5 rounded text-[11px]">{p.packagingType}</span>}
                        {p.badge && <span className="bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-medium truncate">{p.badge}</span>}
                        <span>•</span>
                        <span>{p.images.length} ảnh</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                    <button
                      onClick={() => openModal(p)}
                      className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 active:scale-95 transition-all cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" /> Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 active:scale-95 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Xóa
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: QUẢN LÝ HÌNH ẢNH (LANDING PAGE & TRANG TỰ CHỌN HẠT) */}
      {activeTab === "images" && (
        <div className="space-y-8 max-w-3xl">
          {isLoadingText ? (
            <div className="flex justify-center p-12"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
          ) : isErrorText && !fetchedContents ? contentErrorBlock : (
            IMAGE_GROUPS.map(groupName => {
              const groupSlots = IMAGE_SLOTS.filter(s => s.group === groupName);
              return (
                <div key={groupName} className="space-y-4 bg-card/60 p-5 rounded-2xl border border-border shadow-2xs">
                  <div className="flex items-center justify-between border-b border-border/80 pb-3">
                    <h3 className="text-base sm:text-lg font-bold text-primary flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-accent" />
                      <span>{groupName}</span>
                    </h3>
                    <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2.5 py-1 rounded-full border border-amber-200">
                      {groupSlots.length} ô ảnh
                    </span>
                  </div>
                  <div className="space-y-4 pt-1">
                    {groupSlots.map(slot => (
                      <ImageSlotEditor
                        key={slot.key}
                        slot={slot}
                        value={contents[slot.key] || ""}
                        onSaved={handleSlotSaved}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-blue-800">📌 Hướng dẫn sử dụng quản lý ảnh</p>
            <ul className="text-sm text-blue-700 space-y-1.5">
              <li><strong>Upload từ máy:</strong> Ảnh lưu an toàn trên server backend (/uploads/content/...), tự động dọn dẹp file cũ khi thay ảnh mới.</li>
              <li><strong>Dùng URL:</strong> Dán link ảnh trực tiếp từ Imgur, Cloudinary, AWS S3 hoặc CDN khác.</li>
              <li><strong>Tức thì:</strong> Sau khi lưu, ảnh mới được phát tín hiệu Realtime qua SignalR và cập nhật ngay lập tức trên cả Landing Page lẫn trang Tự Chọn Hạt mà không cần build lại dự án.</li>
            </ul>
          </div>
        </div>
      )}


      {/* MODAL THEM/SUA SAN PHAM (4 TABS CHUYÊN NGHIỆP - 100% ĐỘNG KHÔNG HARDCODE) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm">
          <div className="bg-card w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            {/* MODAL HEADER */}
            <div className="flex justify-between items-center p-4 sm:p-5 border-b shrink-0 bg-muted/10">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-primary flex items-center gap-2">
                  <Package className="w-5 h-5 text-accent" />
                  {editingId ? "Chỉnh Sửa Sản Phẩm" : "Thêm Sản Phẩm Mới"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Quản lý đầy đủ 13 trường dữ liệu động: Thông tin, Nội dung, Hồ sơ cảm quan và Hình ảnh.
                </p>
              </div>
              <button onClick={closeModal} className="text-muted-foreground hover:bg-muted p-2 rounded-full transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            {/* MODAL 4-TABS NAVIGATION */}
            <div className="flex border-b border-border bg-muted/30 px-3 sm:px-6 gap-1 overflow-x-auto scrollbar-none shrink-0">
              <button
                type="button"
                onClick={() => setModalTab("basic")}
                className={`flex items-center gap-1.5 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  modalTab === "basic"
                    ? "border-primary text-primary bg-background/60 rounded-t-lg"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Package className="w-4 h-4" /> 1. Cơ bản & Giá
              </button>
              <button
                type="button"
                onClick={() => setModalTab("content")}
                className={`flex items-center gap-1.5 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  modalTab === "content"
                    ? "border-primary text-primary bg-background/60 rounded-t-lg"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <BookOpen className="w-4 h-4" /> 2. Nội dung & Dưỡng sinh
              </button>
              <button
                type="button"
                onClick={() => setModalTab("sensory")}
                className={`flex items-center gap-1.5 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  modalTab === "sensory"
                    ? "border-primary text-primary bg-background/60 rounded-t-lg"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Clock className="w-4 h-4" /> 3. Hồ sơ cảm quan (1-10)
              </button>
              <button
                type="button"
                onClick={() => setModalTab("images")}
                className={`flex items-center gap-1.5 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  modalTab === "images"
                    ? "border-primary text-primary bg-background/60 rounded-t-lg"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <ImageIcon className="w-4 h-4" /> 4. Thư viện ảnh ({existingImages.length + pendingImages.length})
              </button>
            </div>

            {/* MODAL FORM BODY */}
            <form onSubmit={handleSaveProduct} id="product-form" className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1">
              {/* TAB 1: THÔNG TIN CƠ BẢN & GIÁ */}
              {modalTab === "basic" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-medium">Mã sản phẩm (Product Code)</label>
                      <input
                        type="text"
                        placeholder="Vd: NN-ZIP-150, NN-DEO-300..."
                        value={formData.productCode || ""}
                        onChange={e => setFormData(p => ({ ...p, productCode: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary uppercase font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-medium">Huy hiệu nổi bật (Badge)</label>
                      <input
                        type="text"
                        placeholder="Vd: Dưỡng Sinh Năng Lượng 150g, Tuyệt Kỹ Ngự Thiện..."
                        value={formData.badge || ""}
                        onChange={e => setFormData(p => ({ ...p, badge: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-medium">Tên sản phẩm (Tiếng Việt) *</label>
                      <input
                        type="text"
                        required
                        placeholder="Vd: Gói &quot;Long Nhãn Mix Hạt Dinh Dưỡng&quot; (Túi Zip)"
                        value={formData.name}
                        onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-medium">Tên tiếng Anh (International Name)</label>
                      <input
                        type="text"
                        placeholder="Vd: Artisanal Longan & Nut Blend Pouch"
                        value={formData.nameEn || ""}
                        onChange={e => setFormData(p => ({ ...p, nameEn: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-medium">Dòng bao bì</label>
                      <input
                        type="text"
                        placeholder="Vd: Túi Zip Kraft, Hũ nắp gỗ sồi, Lễ Hộp quai tre..."
                        value={formData.packagingType || ""}
                        onChange={e => setFormData(p => ({ ...p, packagingType: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-medium">Quy cách đóng gói *</label>
                      <input
                        type="text"
                        required
                        placeholder="Vd: 150g, 300g, Set 900g..."
                        value={formData.size}
                        onChange={e => setFormData(p => ({ ...p, size: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-medium">Mức giá niêm yết (VNĐ) *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        placeholder="Vd: 69000, 165000, 780000"
                        value={formData.price}
                        onChange={e => setFormData(p => ({ ...p, price: Number(e.target.value) }))}
                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary font-bold text-accent"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-medium">Thứ tự hiển thị</label>
                      <input
                        type="number"
                        value={formData.displayOrder}
                        onChange={e => setFormData(p => ({ ...p, displayOrder: Number(e.target.value) }))}
                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={e => setFormData(p => ({ ...p, isActive: e.target.checked }))}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                      <label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
                        Hiển thị sản phẩm này trên website (Landing Page & Trang Sản phẩm)
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isFavorite"
                        checked={formData.isFavorite ?? false}
                        onChange={e => setFormData(p => ({ ...p, isFavorite: e.target.checked }))}
                        className="w-4 h-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                      />
                      <label htmlFor="isFavorite" className="text-sm font-semibold text-rose-700 flex items-center gap-1.5 cursor-pointer">
                        <Heart className={`w-4 h-4 ${formData.isFavorite ? "fill-rose-500 text-rose-600" : "text-rose-400"}`} />
                        Được yêu thích nhất (Hiển thị biểu tượng ❤️ Yêu thích nổi bật trên tất cả các trang web)
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: NỘI DUNG & DƯỠNG SINH */}
              {modalTab === "content" && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-medium">Mô tả ngắn hiển thị trên thẻ sản phẩm</label>
                    <textarea
                      rows={2}
                      placeholder="Mô tả tóm tắt 1-2 câu hiển thị trực tiếp trên thẻ sản phẩm ở trang chủ và danh mục..."
                      value={formData.description}
                      onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-y"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-medium">Tổng quan sản phẩm / Câu chuyện di sản</label>
                    <textarea
                      rows={4}
                      placeholder="Câu chuyện xuất xứ, di sản tiến vua Chùa Hiến, kỹ nghệ sấy đối lưu than củi nhãn già..."
                      value={formData.overview || ""}
                      onChange={e => setFormData(p => ({ ...p, overview: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-y"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-medium">Danh sách thành phần & tỷ lệ %</label>
                    <textarea
                      rows={2}
                      placeholder="Vd: Long Nhãn Hương Chi Phố Hiến (30%), Hạt Điều Bình Phước (20%), Hạt Macca Tây Nguyên (20%)..."
                      value={formData.ingredients || ""}
                      onChange={e => setFormData(p => ({ ...p, ingredients: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-y"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-medium">Công dụng dưỡng sinh & sức khỏe</label>
                      <textarea
                        rows={3}
                        placeholder="Vd: Bổ tâm tỳ, dưỡng huyết an thần, cải thiện giấc ngủ sâu, cung cấp vitamin E và Omega tự nhiên..."
                        value={formData.healthBenefits || ""}
                        onChange={e => setFormData(p => ({ ...p, healthBenefits: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-y"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-medium">Cách thưởng thức & Bảo quản</label>
                      <textarea
                        rows={3}
                        placeholder="Vd: Dùng kèm tách trà mạn nóng hoặc trà sen, trộn cùng sữa chua granola hoặc dùng trực tiếp..."
                        value={formData.usageInstructions || ""}
                        onChange={e => setFormData(p => ({ ...p, usageInstructions: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-y"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: HỒ SƠ CẢM QUAN (1-10) */}
              {modalTab === "sensory" && (
                <div className="space-y-5">
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 space-y-1 text-xs text-amber-900">
                    <p className="font-semibold flex items-center gap-1.5 text-primary">
                      <Clock className="w-4 h-4 text-accent" /> Hồ sơ cảm quan 4 trục thưởng vị chuẩn Nguyệt Nhãn
                    </p>
                    <p className="text-stone-700">
                      Điều chỉnh thang điểm từ 1.0 đến 10.0 cho 4 chỉ số cảm quan. Các giá trị này sẽ hiển thị trực quan dạng biểu đồ thanh trong Modal Chi Tiết Sản Phẩm.
                    </p>
                  </div>

                  {(() => {
                    const sensory = parseSensoryScores(formData.sensoryScores);
                    const updateField = (key: keyof ProductSensoryScores, val: number) => {
                      const next = { ...sensory, [key]: Math.min(10, Math.max(1, Math.round(val * 10) / 10)) };
                      setFormData(p => ({ ...p, sensoryScores: JSON.stringify(next) }));
                    };

                    const applyPreset = (preset: ProductSensoryScores) => {
                      setFormData(p => ({ ...p, sensoryScores: JSON.stringify(preset) }));
                    };

                    return (
                      <div className="space-y-5">
                        {/* 4 TRỤC ĐIỀU CHỈNH */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* 1. Độ giòn ngậy của hạt */}
                          <div className="bg-muted/20 border border-border/80 rounded-xl p-3.5 space-y-2">
                            <div className="flex justify-between items-center text-xs font-semibold">
                              <span className="text-stone-700">Độ giòn ngậy của hạt</span>
                              <span className="text-primary font-bold text-sm bg-primary/10 px-2 py-0.5 rounded font-mono">
                                {sensory.nutCrispiness.toFixed(1)}/10
                              </span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              step="0.1"
                              value={sensory.nutCrispiness}
                              onChange={e => updateField("nutCrispiness", parseFloat(e.target.value))}
                              className="w-full accent-primary cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>Mềm bùi (1.0)</span>
                              <span>Rất giòn bùi (10.0)</span>
                            </div>
                          </div>

                          {/* 2. Độ dẻo ngọt của long nhãn */}
                          <div className="bg-muted/20 border border-border/80 rounded-xl p-3.5 space-y-2">
                            <div className="flex justify-between items-center text-xs font-semibold">
                              <span className="text-stone-700">Độ dẻo mọng của long nhãn</span>
                              <span className="text-primary font-bold text-sm bg-primary/10 px-2 py-0.5 rounded font-mono">
                                {sensory.longanChewiness.toFixed(1)}/10
                              </span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              step="0.1"
                              value={sensory.longanChewiness}
                              onChange={e => updateField("longanChewiness", parseFloat(e.target.value))}
                              className="w-full accent-primary cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>Hơi khô (1.0)</span>
                              <span>Dẻo quánh mật (10.0)</span>
                            </div>
                          </div>

                          {/* 3. Vị ngọt thanh thảo mộc */}
                          <div className="bg-muted/20 border border-border/80 rounded-xl p-3.5 space-y-2">
                            <div className="flex justify-between items-center text-xs font-semibold">
                              <span className="text-stone-700">Vị ngọt thanh thảo mộc</span>
                              <span className="text-primary font-bold text-sm bg-primary/10 px-2 py-0.5 rounded font-mono">
                                {sensory.naturalSweetness.toFixed(1)}/10
                              </span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              step="0.1"
                              value={sensory.naturalSweetness}
                              onChange={e => updateField("naturalSweetness", parseFloat(e.target.value))}
                              className="w-full accent-primary cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>Ngọt nhẹ (1.0)</span>
                              <span>Ngọt đậm thanh (10.0)</span>
                            </div>
                          </div>

                          {/* 4. Hương thơm hòa quyện */}
                          <div className="bg-muted/20 border border-border/80 rounded-xl p-3.5 space-y-2">
                            <div className="flex justify-between items-center text-xs font-semibold">
                              <span className="text-stone-700">Hương thơm ngậy hòa quyện</span>
                              <span className="text-primary font-bold text-sm bg-primary/10 px-2 py-0.5 rounded font-mono">
                                {sensory.harmoniousAroma.toFixed(1)}/10
                              </span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              step="0.1"
                              value={sensory.harmoniousAroma}
                              onChange={e => updateField("harmoniousAroma", parseFloat(e.target.value))}
                              className="w-full accent-primary cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>Thoang thoảng (1.0)</span>
                              <span>Nồng nàn ngậy thơm (10.0)</span>
                            </div>
                          </div>
                        </div>

                        {/* PRESETS NHANH */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground block">
                            Hoặc chọn nhanh cấu hình mẫu:
                          </label>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => applyPreset({ nutCrispiness: 9.2, longanChewiness: 8.6, naturalSweetness: 8.5, harmoniousAroma: 9.0 })}
                              className="border border-border/80 hover:bg-muted/40 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                            >
                              Túi Zip Hạt Dinh Dưỡng
                            </button>
                            <button
                              type="button"
                              onClick={() => applyPreset({ nutCrispiness: 5.0, longanChewiness: 9.8, naturalSweetness: 9.5, harmoniousAroma: 9.6 })}
                              className="border border-border/80 hover:bg-muted/40 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                            >
                              Long Nhãn Sấy Dẻo Thuần Khiết
                            </button>
                            <button
                              type="button"
                              onClick={() => applyPreset({ nutCrispiness: 7.5, longanChewiness: 9.4, naturalSweetness: 9.6, harmoniousAroma: 9.5 })}
                              className="border border-border/80 hover:bg-muted/40 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                            >
                              Long Nhãn Ôm Sen Bắc
                            </button>
                            <button
                              type="button"
                              onClick={() => applyPreset({ nutCrispiness: 9.5, longanChewiness: 9.8, naturalSweetness: 9.5, harmoniousAroma: 9.8 })}
                              className="border border-border/80 hover:bg-muted/40 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                            >
                              Lễ Hộp Hoàng Gia 900g
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB 4: THƯ VIỆN HÌNH ẢNH */}
              {modalTab === "images" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-semibold flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-primary" /> Thư viện ảnh sản phẩm
                      </label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Ảnh đầu tiên là ảnh đại diện chính. Hover vào ảnh và bấm ★ để đổi ảnh chính.
                      </p>
                    </div>
                  </div>

                  {/* DANH SÁCH ẢNH */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {existingImages.map(img => (
                      <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border-2 border-border group bg-muted/10">
                        <FastImage src={resolveSrc(img.imagePath)} alt="" fill sizes="160px" loading="lazy" className="w-full h-full object-cover" />
                        {existingImages[0]?.id !== img.id && (
                          <button
                            type="button"
                            title="Đặt làm ảnh chính"
                            onClick={() => setMainImage(img.id)}
                            className="absolute top-1 left-1 bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          title="Xóa ảnh này"
                          onClick={() => removeExistingImage(img.id)}
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs cursor-pointer shadow-md"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        {existingImages[0]?.id === img.id && (
                          <span className="absolute bottom-1.5 left-1.5 bg-primary text-white text-[10px] px-2 py-0.5 rounded font-bold shadow-xs">
                            Ảnh chính
                          </span>
                        )}
                      </div>
                    ))}
                    {pendingImages.map((item, idx) => (
                      <div key={item.url} className="relative aspect-square rounded-xl overflow-hidden border-2 border-dashed border-accent/70 group bg-muted/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          title="Hủy ảnh vừa chọn"
                          onClick={() => removePendingImage(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <span className="absolute bottom-1.5 left-1.5 bg-accent text-white text-[10px] px-2 py-0.5 rounded font-bold shadow-xs">
                          Ảnh mới
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* NÚT THAO TÁC TẢI ẢNH / CHỤP CAMERA */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-3 px-4 rounded-xl border-2 border-dashed border-muted-foreground/40 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2 text-sm font-semibold cursor-pointer bg-muted/10"
                    >
                      <Upload className="w-4 h-4" /> Chọn ảnh từ thiết bị
                    </button>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex-1 py-3 px-4 rounded-xl border-2 border-dashed border-muted-foreground/40 hover:border-accent hover:text-accent transition-all flex items-center justify-center gap-2 text-sm font-semibold cursor-pointer bg-muted/10"
                    >
                      <Camera className="w-4 h-4" /> Chụp ảnh từ Camera
                    </button>
                  </div>

                  <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileSelect} />
                  <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />

                  <div className="bg-muted/30 border rounded-xl p-3 text-xs text-muted-foreground space-y-1">
                    <p className="font-semibold text-foreground">📌 Lưu ý về hình ảnh:</p>
                    <p>• Hỗ trợ định dạng JPG, JPEG, PNG, WEBP. Dung lượng tối đa 5MB/ảnh.</p>
                    <p>• Hệ thống sẽ tự động tối ưu và nén ảnh mượt mà để tăng tốc độ tải trang cho khách hàng.</p>
                  </div>
                </div>
              )}
            </form>

            {/* MODAL FOOTER */}
            <div className="p-4 sm:p-5 border-t bg-muted/20 flex items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-muted-foreground hidden sm:block">
                Tab hiện tại: <span className="font-semibold text-foreground">
                  {modalTab === "basic" ? "1. Thông tin cơ bản" : modalTab === "content" ? "2. Nội dung & Dưỡng sinh" : modalTab === "sensory" ? "3. Hồ sơ cảm quan" : "4. Thư viện ảnh"}
                </span>
              </div>
              <div className="flex items-center gap-2.5 ml-auto">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-xs sm:text-sm font-semibold border hover:bg-muted rounded-xl transition-colors cursor-pointer">
                  Hủy
                </button>
                <button
                  type="submit"
                  form="product-form"
                  disabled={isSavingProduct}
                  className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSavingProduct ? (
                    <>
                      {uploadingImages ? (
                        <><Upload className="w-4 h-4 animate-bounce" /> Đang upload ảnh...</>
                      ) : (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>
                      )}
                    </>
                  ) : (
                    <><Save className="w-4 h-4" /> Lưu Sản Phẩm</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Một ô ảnh trên Landing Page: preview + 2 cách nhập (upload từ máy / dán URL).
 * Component tự quản lý state riêng; parent chỉ truyền giá trị đã lưu (`value`)
 * và nhận callback `onSaved` khi có ảnh mới để cập nhật cache chung.
 */
function ImageSlotEditor({ slot, value, onSaved }: {
  slot: ImageSlot;
  value: string;
  onSaved: (key: string, path: string) => void;
}) {
  const [mode, setMode] = useState<ImageInputMode>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [urlDraft, setUrlDraft] = useState(value);
  const [savingUrl, setSavingUrl] = useState(false);
  const [urlSuccess, setUrlSuccess] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Khôi phục về ảnh mặc định ban đầu
  const handleResetDefault = async () => {
    if (!confirm(`Bạn có chắc muốn khôi phục ảnh mặc định cho "${slot.label}"?`)) return;
    try {
      setSavingUrl(true);
      await contentApi.upsert({ key: slot.key, value: "" });
      onSaved(slot.key, "");
      setUrlDraft("");
      setFile(null);
      setPreviewUrl(null);
      setLoadFailed(false);
      flashSuccess(setUrlSuccess);
    } catch (err) {
      alert(`Lỗi khi khôi phục ảnh mặc định!\n${err instanceof Error ? err.message : ""}`.trim());
    } finally {
      setSavingUrl(false);
    }
  };

  // Đồng bộ giá trị đã lưu lên ô nhập URL (sau khi upload / refetch từ parent).
  // Dùng pattern "điều chỉnh state khi prop đổi" thay cho useEffect để không
  // gọi setState bên trong effect (lint react-hooks/set-state-in-effect).
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setUrlDraft(value);
  }

  // Giải phóng blob URL khi đổi ảnh hoặc unmount
  useEffect(() => () => {
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  // Dọn timer báo thành công khi unmount (tránh setState sau unmount)
  useEffect(() => () => {
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
  }, []);

  const flashSuccess = (setter: (v: boolean) => void) => {
    setter(true);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => setter(false), 4000);
  };

  const currentSrc = value ? resolveSrc(value) : (slot.defaultPath ? resolveSrc(slot.defaultPath) : null);
  const previewSrc = previewUrl ?? currentSrc;

  const pickFile = (f: File) => {
    if (!f.type.startsWith("image/")) { alert("Vui lòng chọn file ảnh."); return; }
    if (!hasAllowedImageExt(f.name)) { alert("Chỉ nhận ảnh JPG, PNG, WEBP hoặc GIF."); return; }
    if (f.size > 10 * 1024 * 1024) { alert("Ảnh vượt quá 10MB."); return; }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setLoadFailed(false);
    setUploadSuccess(false);
  };

  const resetPick = () => {
    setFile(null);
    setPreviewUrl(null); // blob cũ được effect dọn tự động
    setLoadFailed(false);
    setUploadSuccess(false);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setUploadSuccess(false);
    try {
      // Compress the image before uploading to optimize speed and avoid size limits
      const options = {
        maxSizeMB: 1.5, // Max 1.5MB for content images like banners
        maxWidthOrHeight: 1920, // Keep good resolution for banners
        useWebWorker: true
      };
      let fileToUpload = file;
      try {
        const compressed = await imageCompression(file, options);
        // Re-create the File object to ensure the 'name' property is preserved
        fileToUpload = new File([compressed], file.name, {
          type: compressed.type,
          lastModified: Date.now(),
        });
      } catch (error) {
        console.error("Lỗi nén ảnh nội dung:", error);
      }

      const result = await contentApi.uploadImage(slot.key, fileToUpload);
      onSaved(slot.key, result.imagePath);
      setFile(null);
      setPreviewUrl(null);
      setLoadFailed(false);
      flashSuccess(setUploadSuccess);
    } catch (err) {
      alert(err instanceof Error ? err.message : `Lỗi khi upload ${slot.label}!`);
    } finally { setUploading(false); }
  };

  const handleSaveUrl = async () => {
    setSavingUrl(true); setUrlSuccess(false);
    try {
      const nextValue = urlDraft.trim();
      await contentApi.upsert({ key: slot.key, value: nextValue });
      onSaved(slot.key, nextValue);
      setLoadFailed(false);
      flashSuccess(setUrlSuccess);
    } catch (err) {
      alert(`Lỗi khi lưu URL!\n${err instanceof Error ? err.message : ""}`.trim());
    } finally { setSavingUrl(false); }
  };

  return (
    <div className="bg-card border shadow-sm rounded-xl overflow-hidden">
      <div className="p-5 border-b bg-muted/20 flex items-center justify-between gap-3">
        <div>
          <h4 className="font-semibold flex items-center gap-2"><ImageIcon className="w-4 h-4 text-primary" /> {slot.label}</h4>
          <p className="text-sm text-muted-foreground mt-0.5">{slot.hint}</p>
        </div>
        <div className="flex items-center gap-2">
          {slot.defaultPath && value && (
            <button
              type="button"
              onClick={handleResetDefault}
              disabled={savingUrl}
              title="Khôi phục ảnh mặc định ban đầu"
              className="text-xs text-muted-foreground hover:text-amber-700 dark:hover:text-amber-400 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border hover:bg-muted transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
              <span>Khôi phục mặc định</span>
            </button>
          )}
          {(uploadSuccess || urlSuccess) && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg text-sm font-medium shrink-0">
              <CheckCircle2 className="w-4 h-4" /> Đã cập nhật thành công!
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* PREVIEW */}
        {previewSrc ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {previewUrl ? "Xem trước ảnh mới (chưa lưu)" : "Ảnh hiện tại trên website"}
              </p>
              {previewUrl && (
                <button onClick={resetPick} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors border px-2.5 py-1 rounded-lg hover:bg-muted">
                  <RefreshCw className="w-3 h-3" /> Đặt lại
                </button>
              )}
            </div>
            <div className={`relative overflow-hidden border-2 bg-muted ${slot.boxClass} ${previewUrl ? "border-dashed border-accent/60" : "border-border"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewSrc} alt={slot.label} className="w-full h-full object-cover"
                onLoad={e => { e.currentTarget.style.display = ""; setLoadFailed(false); }}
                onError={e => { e.currentTarget.style.display = "none"; setLoadFailed(true); }} />
              {loadFailed && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-center px-6 bg-muted">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                  <p className="text-sm font-semibold text-red-600">Không tải được ảnh</p>
                  <p className="text-xs text-muted-foreground">Link chia sẻ Google Drive/OneDrive không hiển thị trực tiếp — hãy upload từ máy hoặc dùng link CDN.</p>
                </div>
              )}
              {!loadFailed && previewUrl && <div className="absolute top-3 left-3 bg-accent/90 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-semibold shadow">Chưa upload</div>}
              {!loadFailed && !previewUrl && <div className="absolute top-3 left-3 bg-green-600/90 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-semibold shadow">Đang hiển thị</div>}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Chưa có ảnh cho ô này — Landing Page đang dùng ảnh mặc định/ô trang trí.</p>
        )}

        {/* MODE SWITCHER */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
          <button onClick={() => setMode("upload")} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === "upload" ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            <CloudUpload className="w-4 h-4" /> Upload từ máy
          </button>
          <button onClick={() => setMode("url")} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === "url" ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            <LinkIcon className="w-4 h-4" /> Dùng URL
          </button>
        </div>

        {/* UPLOAD MODE */}
        {mode === "upload" && (
          <div className="space-y-4">
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault(); setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) pickFile(f);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-10 transition-all select-none ${dragOver ? "border-primary bg-primary/5 scale-[1.01] shadow-md" : "border-muted-foreground/30 hover:border-primary/60 hover:bg-muted/30"}`}
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${dragOver ? "bg-primary/10 scale-110" : "bg-muted"}`}>
                <CloudUpload className={`w-7 h-7 transition-colors ${dragOver ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="text-center space-y-1">
                <p className="font-semibold text-sm">{dragOver ? "Thả ảnh vào đây..." : "Kéo & thả ảnh vào đây"}</p>
                <p className="text-xs text-muted-foreground">hoặc <span className="text-primary font-semibold underline underline-offset-2">click để chọn file</span></p>
              </div>
              <p className="text-xs text-muted-foreground/70">JPG, PNG, WEBP, GIF · Tối đa 10MB</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2.5 px-4 rounded-xl border bg-muted/40 hover:bg-muted text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer text-stone-700 dark:text-stone-300"
              >
                <CloudUpload className="w-4 h-4 text-primary" />
                <span>Chọn từ thư viện máy</span>
              </button>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="py-2.5 px-4 rounded-xl border border-amber-600/30 bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-100/60 text-amber-800 dark:text-amber-300 text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4 text-amber-600" />
                <span>Chụp ảnh mới từ Camera</span>
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); e.target.value = ""; }} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); e.target.value = ""; }} />

            {file && (
              <div className="flex items-center gap-3 p-3.5 bg-muted/50 rounded-xl border">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted border flex-shrink-0 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl!} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button type="button" onClick={resetPick} className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <button type="button" onClick={handleUpload} disabled={!file || uploading}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-primary-foreground py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-[0.99]">
              {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang upload lên server...</> : <><Upload className="w-4 h-4" /> Upload & Cập nhật ảnh</>}
            </button>
            <p className="text-xs text-center text-muted-foreground">💾 Ảnh sẽ được lưu trên server và cập nhật tự động lên Landing Page.</p>
          </div>
        )}

        {/* URL MODE */}
        {mode === "url" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2"><LinkIcon className="w-4 h-4 text-muted-foreground" /> URL ảnh</label>
              <input type="url" value={urlDraft} onChange={e => setUrlDraft(e.target.value)}
                placeholder="https://i.imgur.com/... hoặc CDN khác"
                className="w-full bg-background border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
              <p className="text-xs text-muted-foreground">Dán link ảnh từ Imgur, Cloudinary hoặc CDN công khai. Để trống = bỏ ảnh ô này.</p>
            </div>
            <button type="button" onClick={handleSaveUrl} disabled={savingUrl}
              className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow-sm">
              {savingUrl ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>
                : urlSuccess ? <><CheckCircle2 className="w-4 h-4" /> Đã lưu!</>
                : <><Save className="w-4 h-4" /> Cập nhật ảnh</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

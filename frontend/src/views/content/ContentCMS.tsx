"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { contentApi, productApi } from "@/services/api.service";
import type { WebsiteContentResponse, ProductResponse, ProductRequest } from "@/types/api.types";
import {
  Loader2, Save, CheckCircle2, Plus, Edit, Trash2, X,
  Type, Phone, MapPin, Globe, Image as ImageIcon, Package, Upload,
  CloudUpload, Link as LinkIcon, RefreshCw, AlertCircle,
  Star, BookOpen, ShoppingBag, Mail, Clock
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

// URL tuyệt đối (https:, http:, protocol-relative //, data:) → dùng nguyên;
// còn lại (vd /uploads/banners/...) → ghép với API_URL.
const isRemoteUrl = (url: string) => /^(https?:)?\/\//i.test(url) || url.startsWith("data:");

const MAX_PRODUCT_IMAGE_MB = 5;

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
  { key: "ContactEmail",  label: "Email liên hệ",             group: "Chân trang & Liên hệ", icon: <Mail className="w-4 h-4 text-primary" />, multiline: false, placeholder: "hello@nguyetnhan.vn" },
  { key: "ContactHours",  label: "Giờ mở cửa",                group: "Chân trang & Liên hệ", icon: <Clock className="w-4 h-4 text-primary" />, multiline: false, placeholder: "08:00 - 20:00 (T2-CN)" },
  { key: "FooterText",    label: "Nội dung chân trang",       group: "Chân trang & Liên hệ", icon: <Globe className="w-4 h-4 text-primary" />, multiline: true,  placeholder: "© 2026 Nguyệt Nhãn Phố Hiến. Tất cả các quyền được bảo lưu." },
];

// Thứ tự nhóm hiển thị trong UI (lấy theo thứ tự xuất hiện của TEXT_KEYS)
const TEXT_GROUPS = Array.from(new Set(TEXT_KEYS.map(f => f.group)));

type ImageSlot = { key: string; label: string; hint: string; boxClass: string };

// Ô ảnh admin thay được trên Landing Page — key phải khớp whitelist phía backend
// (ContentService.ImageKeys). boxClass = kiểu khung preview cho khớp tỷ lệ ảnh thật.
const IMAGE_SLOTS: ImageSlot[] = [
  { key: "SiteLogo",      label: "Logo thương hiệu",       hint: "Hiện ở header và footer. Để trống sẽ dùng logo mặc định /logo.jpg.", boxClass: "w-28 h-28 rounded-full" },
  { key: "HeroBannerUrl", label: "Ảnh banner Hero",        hint: "Ảnh lớn ở phần mở đầu trang.", boxClass: "w-full aspect-video rounded-xl" },
  { key: "StoryImage",    label: "Ảnh câu chuyện",         hint: "Bên cạnh tiêu đề “Thứ Quả Tiến Vua Trứ Danh”.", boxClass: "w-40 aspect-[4/5] rounded-xl" },
  { key: "CultureImage",  label: "Ảnh văn hóa thưởng trà", hint: "Bên cạnh khối tròn ở mục Văn hóa.", boxClass: "w-40 h-40 rounded-full" },
];

const EMPTY_FORM: ProductRequest = { name: "", price: 0, size: "", description: "", isActive: true, displayOrder: 0 };

type Tab = "text" | "products" | "images";
type ImageInputMode = "upload" | "url";

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
      const data = await contentApi.getAll();
      const mapped: Record<string, string> = {};
      data.forEach((item: WebsiteContentResponse) => { mapped[item.key] = item.value; });
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductRequest>(EMPTY_FORM);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  // Ảnh chờ upload: kèm blob URL tạo sẵn — tránh tạo URL mới mỗi lần render (rò rỉ bộ nhớ)
  const [pendingImages, setPendingImages] = useState<{ file: File; url: string }[]>([]);
  const [existingImages, setExistingImages] = useState<{ id: string; imagePath: string; displayOrder: number }[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const openModal = (product?: ProductResponse) => {
    if (product) {
      setEditingId(product.id);
      setFormData({ name: product.name, price: product.price, size: product.size, description: product.description, isActive: product.isActive, displayOrder: product.displayOrder });
      setExistingImages([...product.images]);
    } else {
      setEditingId(null);
      setFormData({ ...EMPTY_FORM, displayOrder: products.length + 1 });
      setExistingImages([]);
    }
    clearPendingImages(); setDeletedImageIds([]); setIsModalOpen(true);
  };

  const closeModal = () => { clearPendingImages(); setIsModalOpen(false); setEditingId(null); };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    const valid: { file: File; url: string }[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) { alert(`"${file.name}" không phải file ảnh.`); continue; }
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
      await productApi.reorderImages(editingId, next.map(i => i.id));
      refetchProducts();
      queryClient.invalidateQueries({ queryKey: ["products", "public"] });
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
      if (pendingImages.length > 0) {
        setUploadingImages(true);
        for (const item of [...pendingImages]) {
          await productApi.uploadImage(productId!, item.file);
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

      refetchProducts();
      queryClient.invalidateQueries({ queryKey: ["products", "public"] });
      closeModal();
    } catch (err) {
      console.error(err);
      alert(`Lỗi khi lưu sản phẩm!\n${err instanceof Error ? err.message : ""}`.trim());
      // Đã tạo/đã sửa được một phần → đồng bộ lại danh sách để không hiển thị dữ liệu cũ
      if (touchedServer) {
        refetchProducts();
        queryClient.invalidateQueries({ queryKey: ["products", "public"] });
      }
    } finally { setIsSavingProduct(false); setUploadingImages(false); }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Bạn có chắc xóa sản phẩm này?")) return;
    try { 
      await productApi.delete(id); 
      refetchProducts();
      queryClient.invalidateQueries({ queryKey: ["products", "public"] });
    }
    catch (err) { alert(`Lỗi khi xóa sản phẩm!\n${err instanceof Error ? err.message : ""}`.trim()); }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "text",     label: "📝 Văn bản & Thông tin", icon: <Type className="w-4 h-4" /> },
    { key: "products", label: "📦 Sản phẩm",            icon: <Package className="w-4 h-4" /> },
    { key: "images",   label: "🖼️ Ảnh Landing Page",   icon: <ImageIcon className="w-4 h-4" /> },
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
        <p className="text-muted-foreground">Quản lý toàn bộ nội dung hiển thị trên Landing Page.</p>
      </div>

      <div className="border-b border-border flex gap-1">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: VAN BAN */}
      {activeTab === "text" && (
        <div className="bg-card border shadow-sm rounded-xl overflow-hidden">
          <div className="p-5 border-b bg-muted/20">
            <h3 className="font-semibold">Chỉnh sửa văn bản trên Landing Page</h3>
            <p className="text-sm text-muted-foreground">Thay đổi ngay lập tức, không cần deploy lại</p>
          </div>
          {isLoadingText ? <div className="flex justify-center p-10"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div> : isErrorText && !fetchedContents ? contentErrorBlock : (
            <div className="p-6 space-y-9">
              {TEXT_GROUPS.map(group => (
                <section key={group} className="space-y-5">
                  <div className="flex items-center gap-3">
                    <h4 className="text-sm font-bold uppercase tracking-wide text-primary">{group}</h4>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  {TEXT_KEYS.filter(f => f.group === group).map(field => (
                    <div key={field.key} className="space-y-2">
                      <label className="flex items-center gap-2 font-medium text-sm">{field.icon}{field.label}</label>
                      <div className="flex gap-3 items-start">
                        {field.multiline
                          ? <textarea value={contents[field.key] || ""} onChange={e => setContents(p => ({ ...p, [field.key]: e.target.value }))} placeholder={field.placeholder} rows={3} className="flex-1 bg-background border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-y" />
                          : <input type="text" value={contents[field.key] || ""} onChange={e => setContents(p => ({ ...p, [field.key]: e.target.value }))} placeholder={field.placeholder} className="flex-1 bg-background border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />}
                        <button onClick={() => handleSaveText(field.key)} disabled={isSaving === field.key} className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all shadow-sm shrink-0">
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
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Quản lý các sản phẩm hiển thị trên Landing Page.</p>
            <button onClick={() => openModal()} className="bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all shadow-sm text-sm">
              <Plus className="w-4 h-4" /> Thêm sản phẩm
            </button>
          </div>
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Ảnh chính</th>
                  <th className="px-5 py-3.5 font-medium">Tên sản phẩm</th>
                  <th className="px-5 py-3.5 font-medium">Giá bán (VNĐ)</th>
                  <th className="px-5 py-3.5 font-medium">Quy cách</th>
                  <th className="px-5 py-3.5 font-medium">Số ảnh</th>
                  <th className="px-5 py-3.5 font-medium">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoadingProducts ? (
                  <tr><td colSpan={7} className="px-5 py-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></td></tr>
                ) : isErrorProducts && products.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-8 text-center space-y-2">
                    <p className="text-sm font-medium">Không tải được danh sách sản phẩm.</p>
                    <button onClick={() => refetchProducts()} className="border hover:bg-muted px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 transition-colors">
                      <RefreshCw className="w-4 h-4" /> Thử lại
                    </button>
                  </td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">Chưa có sản phẩm. Hãy thêm mới!</td></tr>
                ) : products.map(p => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="w-11 h-11 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                        {p.images[0]
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={`${API_URL}${p.images[0].imagePath}`} alt={p.name} className="w-full h-full object-cover" />
                          : <ImageIcon className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-medium">{p.name}</td>
                    <td className="px-5 py-3.5 text-accent font-semibold">{p.price.toLocaleString("vi-VN").replace(/,/g, ".")}đ</td>
                    <td className="px-5 py-3.5">{p.size}</td>
                    <td className="px-5 py-3.5"><span className="bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full">{p.images.length} ảnh</span></td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{p.isActive ? "Hiển thị" : "Đang ẩn"}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openModal(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteProduct(p.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ANH LANDING PAGE (logo, hero, cau chuyen, van hoa) */}
      {activeTab === "images" && (
        <div className="space-y-5 max-w-3xl">
          {isLoadingText ? (
            <div className="flex justify-center p-12"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
          ) : isErrorText && !fetchedContents ? contentErrorBlock : (
            IMAGE_SLOTS.map(slot => (
              <ImageSlotEditor
                key={slot.key}
                slot={slot}
                value={contents[slot.key] || ""}
                onSaved={handleSlotSaved}
              />
            ))
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-blue-800">📌 Hướng dẫn sử dụng</p>
            <ul className="text-sm text-blue-700 space-y-1.5">
              <li><strong>Upload từ máy:</strong> Ảnh lưu trên server, không phụ thuộc dịch vụ bên ngoài. Kéo thả hoặc click chọn file.</li>
              <li><strong>Dùng URL:</strong> Dán link từ Imgur, Cloudinary hoặc CDN khác — link chia sẻ Google Drive/OneDrive không hiển thị trực tiếp.</li>
              <li><strong>Tức thì:</strong> Thay đổi hiển thị ngay trên Landing Page, không cần build lại.</li>
            </ul>
          </div>
        </div>
      )}


      {/* MODAL THEM/SUA SAN PHAM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">
            <div className="flex justify-between items-center p-6 border-b shrink-0">
              <h3 className="text-xl font-bold text-primary">{editingId ? "Sửa Sản Phẩm" : "Thêm Sản Phẩm Mới"}</h3>
              <button onClick={closeModal} className="text-muted-foreground hover:bg-muted p-2 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveProduct} id="product-form" className="p-6 overflow-y-auto space-y-5 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Tên sản phẩm *</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Giá bán (VNĐ) *</label>
                  <input type="number" required min="0" value={formData.price} onChange={e => setFormData(p => ({ ...p, price: Number(e.target.value) }))} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Quy cách / Khối lượng *</label>
                  <input type="text" required placeholder="Vd: 500g, 1kg" value={formData.size} onChange={e => setFormData(p => ({ ...p, size: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Thứ tự hiển thị</label>
                  <input type="number" value={formData.displayOrder} onChange={e => setFormData(p => ({ ...p, displayOrder: Number(e.target.value) }))} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Mô tả sản phẩm</label>
                <textarea rows={3} value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-y" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                <label htmlFor="isActive" className="text-sm font-medium cursor-pointer">Hiển thị sản phẩm này trên website</label>
              </div>
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold flex items-center gap-2"><ImageIcon className="w-4 h-4 text-primary" />Ảnh sản phẩm</label>
                  <span className="text-xs text-muted-foreground">Ảnh đầu tiên = ảnh chính — hover ảnh, bấm ★ để đổi</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {existingImages.map(img => (
                    <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border-2 border-border group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`${API_URL}${img.imagePath}`} alt="" className="w-full h-full object-cover" />
                      {existingImages[0]?.id !== img.id && (
                        <button type="button" title="Đặt làm ảnh chính" onClick={() => setMainImage(img.id)}
                          className="absolute top-1 left-1 bg-amber-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Star className="w-3 h-3" />
                        </button>
                      )}
                      <button type="button" onClick={() => removeExistingImage(img.id)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"><X className="w-3 h-3" /></button>
                      {existingImages[0]?.id === img.id && <span className="absolute bottom-1 left-1 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded font-medium">Chính</span>}
                    </div>
                  ))}
                  {pendingImages.map((item, idx) => (
                    <div key={item.url} className="relative aspect-square rounded-xl overflow-hidden border-2 border-dashed border-accent/50 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.url} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removePendingImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                      <span className="absolute bottom-1 left-1 bg-accent text-white text-[10px] px-1.5 py-0.5 rounded font-medium">Mới</span>
                    </div>
                  ))}
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/40 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer">
                    <Upload className="w-5 h-5" />
                    <span className="text-xs font-medium">Thêm ảnh</span>
                  </button>
                </div>
                <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileSelect} />
                <p className="text-xs text-muted-foreground">📌 Hỗ trợ JPG, PNG, WEBP. Tối đa 5MB/ảnh.</p>
              </div>
            </form>
            <div className="p-5 border-t bg-muted/20 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-medium border hover:bg-muted rounded-lg transition-colors">Hủy</button>
              <button type="submit" form="product-form" disabled={isSavingProduct} className="px-5 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50">
                {isSavingProduct ? <>{uploadingImages ? <><Upload className="w-4 h-4 animate-bounce" /> Đang upload ảnh...</> : <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>}</> : <><Save className="w-4 h-4" /> Lưu Sản Phẩm</>}
              </button>
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
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const currentSrc = value ? (isRemoteUrl(value) ? value : `${API_URL}${value}`) : null;
  const previewSrc = previewUrl ?? currentSrc;

  const pickFile = (f: File) => {
    if (!f.type.startsWith("image/")) { alert("Vui lòng chọn file ảnh."); return; }
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
      const result = await contentApi.uploadImage(slot.key, file);
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
        {(uploadSuccess || urlSuccess) && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg text-sm font-medium shrink-0">
            <CheckCircle2 className="w-4 h-4" /> Đã cập nhật thành công!
          </div>
        )}
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
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
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

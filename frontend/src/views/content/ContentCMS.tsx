"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { contentApi, productApi } from "@/services/api.service";
import type { WebsiteContentResponse, ProductResponse, ProductRequest } from "@/types/api.types";
import {
  Loader2, Save, CheckCircle2, Plus, Edit, Trash2, X,
  Type, Phone, MapPin, Globe, Image as ImageIcon, Package, Upload,
  CloudUpload, Link as LinkIcon, RefreshCw
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

const TEXT_KEYS = [
  { key: "HeroTitle",    label: "Tiêu đề chính (Hero)",    icon: <Type className="w-4 h-4 text-primary" />, multiline: false, placeholder: "Vd: Đặc Sản Long Nhãn Phố Hiến" },
  { key: "HeroSubtitle", label: "Mô tả phụ (Hero)",        icon: <Type className="w-4 h-4 text-primary" />, multiline: true,  placeholder: "Vd: Hương vị truyền thống..." },
  { key: "Hotline",      label: "Số hotline liên hệ",      icon: <Phone className="w-4 h-4 text-primary" />, multiline: false, placeholder: "Vd: 090 123 4567" },
  { key: "Address",      label: "Địa chỉ cửa hàng",        icon: <MapPin className="w-4 h-4 text-primary" />, multiline: false, placeholder: "Vd: 123 Phố Hiến, Hưng Yên" },
  { key: "FooterText",   label: "Nội dung chân trang",     icon: <Globe className="w-4 h-4 text-primary" />, multiline: true,  placeholder: "Vd: © 2026 Nguyệt Nhãn Phố Hiến" },
];

const EMPTY_FORM: ProductRequest = { name: "", price: 0, size: "", description: "", isActive: true, displayOrder: 0 };

type Tab = "text" | "products" | "banner";
type BannerInputMode = "upload" | "url";

export default function ContentCMS() {
  const [activeTab, setActiveTab] = useState<Tab>("text");
  const [contents, setContents] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // React Query: Fetch content
  const { data: fetchedContents, isLoading: isLoadingText, refetch: refetchContents } = useQuery({
    queryKey: ["website", "content"],
    queryFn: async () => {
      const data = await contentApi.getAll();
      const mapped: Record<string, string> = {};
      data.forEach((item: WebsiteContentResponse) => { mapped[item.key] = item.value; });
      [...TEXT_KEYS, { key: "HeroBannerUrl" }].forEach(f => { if (mapped[f.key] === undefined) mapped[f.key] = ""; });
      return mapped;
    }
  });

  // Sync content to local state for editing
  useEffect(() => {
    if (fetchedContents) {
      setContents(fetchedContents);
    }
  }, [fetchedContents]);

  // React Query: Fetch products (Admin)
  const { data: products = [], isLoading: isLoadingProducts, refetch: refetchProducts } = useQuery({
    queryKey: ["products", "admin"],
    queryFn: () => productApi.getAllAdmin(),
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductRequest>(EMPTY_FORM);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<{ id: string; imagePath: string; displayOrder: number }[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bannerInputMode, setBannerInputMode] = useState<BannerInputMode>("upload");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [bannerUploadSuccess, setBannerUploadSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);



  useEffect(() => {
    return () => { if (bannerPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(bannerPreviewUrl); };
  }, [bannerPreviewUrl]);

  const handleSaveText = async (key: string) => {
    setIsSaving(key);
    try {
      await contentApi.upsert({ key, value: contents[key] || "" });
      queryClient.invalidateQueries({ queryKey: ["website", "content"] });
      setSaveSuccess(key); setTimeout(() => setSaveSuccess(null), 3000);
    } catch { alert("Loi khi luu " + key); }
    finally { setIsSaving(null); }
  };

  const handleBannerFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) { alert("Vui long chon file anh."); return; }
    if (file.size > 10 * 1024 * 1024) { alert("Anh vuot qua 10MB."); return; }
    if (bannerPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(bannerPreviewUrl);
    setBannerFile(file);
    setBannerPreviewUrl(URL.createObjectURL(file));
    setBannerUploadSuccess(false);
  };

  const handleBannerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    handleBannerFileSelect(e.target.files[0]);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleBannerFileSelect(file);
  };

  const handleUploadBanner = async () => {
    if (!bannerFile) return;
    setIsUploadingBanner(true); setBannerUploadSuccess(false);
    try {
      const result = await contentApi.uploadBannerImage(bannerFile);
      setContents(prev => ({ ...prev, HeroBannerUrl: result.imagePath }));
      queryClient.invalidateQueries({ queryKey: ["website", "content"] });
      if (bannerPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(bannerPreviewUrl);
      setBannerFile(null); setBannerPreviewUrl(null);
      setBannerUploadSuccess(true); setTimeout(() => setBannerUploadSuccess(false), 4000);
    } catch (err) { alert(err instanceof Error ? err.message : "Loi khi upload banner!"); }
    finally { setIsUploadingBanner(false); }
  };

  const handleSaveBannerUrl = async () => {
    setIsSaving("HeroBannerUrl");
    try {
      await contentApi.upsert({ key: "HeroBannerUrl", value: contents["HeroBannerUrl"] || "" });
      queryClient.invalidateQueries({ queryKey: ["website", "content"] });
      setSaveSuccess("HeroBannerUrl"); setTimeout(() => setSaveSuccess(null), 3000);
    } catch { alert("Loi khi luu URL banner!"); }
    finally { setIsSaving(null); }
  };

  const handleResetBanner = () => {
    if (bannerPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(bannerPreviewUrl);
    setBannerFile(null); setBannerPreviewUrl(null); setBannerUploadSuccess(false);
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
    setPendingImages([]); setDeletedImageIds([]); setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingId(null); };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setPendingImages(prev => [...prev, ...Array.from(e.target.files!).filter(f => f.type.startsWith("image/"))]);
    e.target.value = "";
  };

  const removePendingImage = (idx: number) => setPendingImages(prev => prev.filter((_, i) => i !== idx));
  const removeExistingImage = (imgId: string) => {
    setExistingImages(prev => prev.filter(i => i.id !== imgId));
    setDeletedImageIds(prev => [...prev, imgId]);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSavingProduct(true);
    try {
      let productId = editingId;
      if (productId) { await productApi.update(productId, formData); }
      else { const created = await productApi.create(formData); productId = created.id; }
      for (const imgId of deletedImageIds) await productApi.deleteImage(productId!, imgId);
      if (pendingImages.length > 0) {
        setUploadingImages(true);
        for (const file of pendingImages) await productApi.uploadImage(productId!, file);
        setUploadingImages(false);
      }
      refetchProducts();
      queryClient.invalidateQueries({ queryKey: ["products", "public"] });
      closeModal();
    } catch (err) { console.error(err); alert("Loi khi luu san pham!"); }
    finally { setIsSavingProduct(false); setUploadingImages(false); }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Bạn có chắc xóa sản phẩm này?")) return;
    try { 
      await productApi.delete(id); 
      refetchProducts();
      queryClient.invalidateQueries({ queryKey: ["products", "public"] });
    }
    catch { alert("Loi khi xoa san pham!"); }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "text",     label: "📝 Văn bản & Thông tin", icon: <Type className="w-4 h-4" /> },
    { key: "products", label: "📦 Sản phẩm",            icon: <Package className="w-4 h-4" /> },
    { key: "banner",   label: "🖼️ Ảnh Banner",         icon: <ImageIcon className="w-4 h-4" /> },
  ];

  const saved = contents["HeroBannerUrl"];
  const currentBannerSrc = saved ? (saved.startsWith("http") ? saved : `${API_URL}${saved}`) : null;

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
          {isLoadingText ? <div className="flex justify-center p-10"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div> : (
            <div className="p-6 space-y-7">
              {TEXT_KEYS.map(field => (
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

      {/* TAB 3: ANH BANNER */}
      {activeTab === "banner" && (
        <div className="space-y-5 max-w-3xl">
          <div className="bg-card border shadow-sm rounded-xl overflow-hidden">
            <div className="p-5 border-b bg-muted/20 flex items-center justify-between">
              <div>
                <h3 className="font-semibold flex items-center gap-2"><ImageIcon className="w-4 h-4 text-primary" /> Ảnh Banner Trang Chủ</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Nhập ảnh hiển thị nổi bật trên hero section của Landing Page.</p>
              </div>
              {bannerUploadSuccess && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Đã cập nhật thành công!
                </div>
              )}
            </div>

            {isLoadingText ? <div className="flex justify-center p-12"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div> : (
              <div className="p-6 space-y-6">

                {/* PREVIEW */}
                {(bannerPreviewUrl || currentBannerSrc) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {bannerPreviewUrl ? "Xem trước ảnh mới (chưa lưu)" : "Banner hiện tại trên website"}
                      </p>
                      {bannerPreviewUrl && (
                        <button onClick={handleResetBanner} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors border px-2.5 py-1 rounded-lg hover:bg-muted">
                          <RefreshCw className="w-3 h-3" /> Đặt lại
                        </button>
                      )}
                    </div>
                    <div className={`relative rounded-xl overflow-hidden border-2 aspect-video bg-muted ${bannerPreviewUrl ? "border-dashed border-accent/60" : "border-border"}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={bannerPreviewUrl ?? currentBannerSrc!} alt="Banner preview" className="w-full h-full object-cover"
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                      {bannerPreviewUrl && <div className="absolute top-3 left-3 bg-accent/90 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-semibold shadow">Chưa upload</div>}
                      {!bannerPreviewUrl && currentBannerSrc && <div className="absolute top-3 left-3 bg-green-600/90 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-semibold shadow">Đang hiển thị</div>}
                    </div>
                  </div>
                )}

                {/* MODE SWITCHER */}
                <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
                  <button onClick={() => setBannerInputMode("upload")} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${bannerInputMode === "upload" ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                    <CloudUpload className="w-4 h-4" /> Upload từ máy
                  </button>
                  <button onClick={() => setBannerInputMode("url")} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${bannerInputMode === "url" ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                    <LinkIcon className="w-4 h-4" /> Dùng URL
                  </button>
                </div>

                {/* UPLOAD MODE */}
                {bannerInputMode === "upload" && (
                  <div className="space-y-4">
                    <div
                      onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => bannerFileInputRef.current?.click()}
                      className={`relative cursor-pointer rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-14 transition-all select-none ${isDragOver ? "border-primary bg-primary/5 scale-[1.01] shadow-md" : "border-muted-foreground/30 hover:border-primary/60 hover:bg-muted/30"}`}
                    >
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isDragOver ? "bg-primary/10 scale-110" : "bg-muted"}`}>
                        <CloudUpload className={`w-8 h-8 transition-colors ${isDragOver ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="font-semibold text-sm">{isDragOver ? "Thả ảnh vào đây..." : "Kéo & thả ảnh vào đây"}</p>
                        <p className="text-xs text-muted-foreground">hoặc <span className="text-primary font-semibold underline underline-offset-2">click để chọn file</span></p>
                      </div>
                      <p className="text-xs text-muted-foreground/70">JPG, PNG, WEBP, GIF · Tối đa 10MB</p>
                    </div>
                    <input ref={bannerFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerInputChange} />

                    {bannerFile && (
                      <div className="flex items-center gap-3 p-3.5 bg-muted/50 rounded-xl border">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted border flex-shrink-0 shadow-sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={bannerPreviewUrl!} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{bannerFile.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{(bannerFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button onClick={e => { e.stopPropagation(); handleResetBanner(); }} className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <button onClick={handleUploadBanner} disabled={!bannerFile || isUploadingBanner}
                      className="w-full bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-primary-foreground py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-[0.99]">
                      {isUploadingBanner ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang upload lên server...</> : <><Upload className="w-4 h-4" /> Upload & Cập nhật Banner</>}
                    </button>
                    <p className="text-xs text-center text-muted-foreground">💾 Ảnh sẽ được lưu trên server và cập nhật tự động lên Landing Page.</p>
                  </div>
                )}

                {/* URL MODE */}
                {bannerInputMode === "url" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2"><LinkIcon className="w-4 h-4 text-muted-foreground" /> URL Ảnh Banner</label>
                      <input type="url" value={contents["HeroBannerUrl"] || ""} onChange={e => setContents(p => ({ ...p, HeroBannerUrl: e.target.value }))}
                        placeholder="https://i.imgur.com/... hoặc CDN khác"
                        className="w-full bg-background border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                      <p className="text-xs text-muted-foreground">Dán link ảnh từ Imgur, Google Drive, Cloudinary hoặc bất kỳ CDN công khai nào.</p>
                    </div>
                    <button onClick={handleSaveBannerUrl} disabled={isSaving === "HeroBannerUrl"}
                      className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow-sm">
                      {isSaving === "HeroBannerUrl" ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>
                        : saveSuccess === "HeroBannerUrl" ? <><CheckCircle2 className="w-4 h-4" /> Đã lưu!</>
                        : <><Save className="w-4 h-4" /> Cập nhật Banner</>}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-blue-800">📌 Hướng dẫn sử dụng</p>
            <ul className="text-sm text-blue-700 space-y-1.5">
              <li><strong>Upload từ máy:</strong> Ảnh lưu trên server, không phụ thuộc dịch vụ bên ngoài. Kéo thả hoặc click chọn file.</li>
              <li><strong>Dùng URL:</strong> Dán link từ Imgur, Google Drive, Cloudinary hoặc CDN khác.</li>
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
                  <span className="text-xs text-muted-foreground">Ảnh đầu tiên = ảnh chính</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {existingImages.map(img => (
                    <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border-2 border-border group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`${API_URL}${img.imagePath}`} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeExistingImage(img.id)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"><X className="w-3 h-3" /></button>
                      {existingImages[0]?.id === img.id && <span className="absolute bottom-1 left-1 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded font-medium">Chính</span>}
                    </div>
                  ))}
                  {pendingImages.map((file, idx) => (
                    <div key={`pending-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border-2 border-dashed border-accent/50 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
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

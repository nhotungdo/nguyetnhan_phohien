"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { contentApi, productApi } from "@/services/api.service";
import type { WebsiteContentResponse, ProductResponse, ProductRequest } from "@/types/api.types";
import {
  Loader2, Save, CheckCircle2, Plus, Edit, Trash2, X,
  Type, Phone, MapPin, Globe, Image as ImageIcon, Package, Upload
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

const TEXT_KEYS = [
  { key: "HeroTitle",    label: "Tiêu đề chính (Hero)",     icon: <Type className="w-4 h-4 text-primary" />, multiline: false, placeholder: "Vd: Đặc Sản Long Nhãn Phố Hiến" },
  { key: "HeroSubtitle", label: "Mô tả phụ (Hero)",         icon: <Type className="w-4 h-4 text-primary" />, multiline: true,  placeholder: "Vd: Hương vị truyền thống..." },
  { key: "Hotline",      label: "Số hotline liên hệ",       icon: <Phone className="w-4 h-4 text-primary" />, multiline: false, placeholder: "Vd: 090 123 4567" },
  { key: "Address",      label: "Địa chỉ cửa hàng",         icon: <MapPin className="w-4 h-4 text-primary" />, multiline: false, placeholder: "Vd: 123 Phố Hiến, Hưng Yên" },
  { key: "FooterText",   label: "Nội dung chân trang",       icon: <Globe className="w-4 h-4 text-primary" />, multiline: true,  placeholder: "Vd: © 2026 Nguyệt Nhãn Phố Hiến" },
  { key: "HeroBannerUrl",label: "URL Ảnh Banner trang chủ", icon: <ImageIcon className="w-4 h-4 text-primary" />, multiline: false, placeholder: "Dán link ảnh từ Imgur, Drive..." },
];

const EMPTY_FORM: ProductRequest = { name: "", price: 0, size: "", description: "", isActive: true, displayOrder: 0 };

type Tab = "text" | "products" | "banner";

export default function ContentCMS() {
  const [activeTab, setActiveTab] = useState<Tab>("text");

  // ===== TEXT STATE =====
  const [contents, setContents] = useState<Record<string, string>>({});
  const [isLoadingText, setIsLoadingText] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // ===== PRODUCT STATE =====
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductRequest>(EMPTY_FORM);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [pendingImages, setPendingImages] = useState<File[]>([]);       // Ảnh mới chờ upload
  const [existingImages, setExistingImages] = useState<{ id: string; imagePath: string; displayOrder: number }[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ===== LOAD DATA =====
  const loadProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try { setProducts(await productApi.getAllAdmin()); }
    catch (err) { console.error("Failed to load products:", err); }
    finally { setIsLoadingProducts(false); }
  }, []);

  useEffect(() => {
    let isMounted = true;
    contentApi.getAll().then((data) => {
      if (!isMounted) return;
      const mapped: Record<string, string> = {};
      data.forEach((item: WebsiteContentResponse) => { mapped[item.key] = item.value; });
      TEXT_KEYS.forEach(f => { if (mapped[f.key] === undefined) mapped[f.key] = ""; });
      setContents(mapped);
    }).catch(err => console.error("Failed to load content:", err))
      .finally(() => { if (isMounted) setIsLoadingText(false); });

    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (activeTab !== "products") return;
    let isMounted = true;
    productApi.getAllAdmin().then((prods) => {
      if (isMounted) setProducts(prods);
    }).catch(err => console.error("Failed to load products:", err))
      .finally(() => { if (isMounted) setIsLoadingProducts(false); });

    return () => { isMounted = false; };
  }, [activeTab]);

  // ===== TEXT HANDLERS =====
  const handleSaveText = async (key: string) => {
    setIsSaving(key);
    try {
      await contentApi.upsert({ key, value: contents[key] || "" });
      setSaveSuccess(key);
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch { alert(`Lỗi khi lưu ${key}!`); }
    finally { setIsSaving(null); }
  };

  // ===== PRODUCT HANDLERS =====
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
    setPendingImages([]);
    setDeletedImageIds([]);
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingId(null); };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files).filter(f => f.type.startsWith("image/"));
    setPendingImages(prev => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const removePendingImage = (idx: number) => {
    setPendingImages(prev => prev.filter((_, i) => i !== idx));
  };

  const removeExistingImage = (imgId: string) => {
    setExistingImages(prev => prev.filter(i => i.id !== imgId));
    setDeletedImageIds(prev => [...prev, imgId]);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProduct(true);
    try {
      let productId = editingId;
      if (productId) {
        await productApi.update(productId, formData);
      } else {
        const created = await productApi.create(formData);
        productId = created.id;
      }

      // Xóa ảnh đã đánh dấu xóa
      for (const imgId of deletedImageIds) {
        await productApi.deleteImage(productId!, imgId);
      }

      // Upload ảnh mới
      if (pendingImages.length > 0) {
        setUploadingImages(true);
        for (const file of pendingImages) {
          await productApi.uploadImage(productId!, file);
        }
        setUploadingImages(false);
      }

      await loadProducts();
      closeModal();
    } catch (err) {
      console.error("Lỗi khi lưu sản phẩm:", err);
      alert("Đã xảy ra lỗi khi lưu sản phẩm!");
    } finally {
      setIsSavingProduct(false);
      setUploadingImages(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;
    try { await productApi.delete(id); await loadProducts(); }
    catch { alert("Lỗi khi xóa sản phẩm!"); }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "text", label: "📝 Văn bản & Thông tin", icon: <Type className="w-4 h-4" /> },
    { key: "products", label: "📦 Sản phẩm", icon: <Package className="w-4 h-4" /> },
    { key: "banner", label: "🖼️ Ảnh Banner", icon: <ImageIcon className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">Nội dung Website</h2>
        <p className="text-muted-foreground">Quản lý toàn bộ nội dung hiển thị trên Landing Page.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border flex gap-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ===== TAB 1: VĂN BẢN ===== */}
      {activeTab === "text" && (
        <div className="bg-card border shadow-sm rounded-xl overflow-hidden">
          <div className="p-5 border-b bg-muted/20">
            <h3 className="font-semibold">Chỉnh sửa văn bản trên Landing Page</h3>
            <p className="text-sm text-muted-foreground">Thay đổi ngay lập tức — không cần deploy lại</p>
          </div>
          {isLoadingText ? (
            <div className="flex justify-center p-10"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
          ) : (
            <div className="p-6 space-y-7">
              {TEXT_KEYS.filter(f => f.key !== "HeroBannerUrl").map(field => (
                <div key={field.key} className="space-y-2">
                  <label className="flex items-center gap-2 font-medium text-sm">{field.icon}{field.label}</label>
                  <div className="flex gap-3 items-start">
                    {field.multiline ? (
                      <textarea value={contents[field.key] || ""} onChange={e => setContents(p => ({ ...p, [field.key]: e.target.value }))} placeholder={field.placeholder} rows={3} className="flex-1 bg-background border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-y" />
                    ) : (
                      <input type="text" value={contents[field.key] || ""} onChange={e => setContents(p => ({ ...p, [field.key]: e.target.value }))} placeholder={field.placeholder} className="flex-1 bg-background border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                    )}
                    <button onClick={() => handleSaveText(field.key)} disabled={isSaving === field.key} className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all shadow-sm shrink-0">
                      {isSaving === field.key ? <><Loader2 className="w-4 h-4 animate-spin" /> Lưu...</>
                        : saveSuccess === field.key ? <><CheckCircle2 className="w-4 h-4" /> Đã lưu</>
                        : <><Save className="w-4 h-4" /> Lưu lại</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== TAB 2: SẢN PHẨM ===== */}
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
                        {p.images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={`${API_URL}${p.images[0].imagePath}`} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-medium">{p.name}</td>
                    <td className="px-5 py-3.5 text-accent font-semibold">{p.price.toLocaleString("vi-VN").replace(/,/g, '.')}đ</td>
                    <td className="px-5 py-3.5">{p.size}</td>
                    <td className="px-5 py-3.5">
                      <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full">{p.images.length} ảnh</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.isActive ? "Hiển thị" : "Đang ẩn"}
                      </span>
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

      {/* ===== TAB 3: ẢNH BANNER ===== */}
      {activeTab === "banner" && (
        <div className="max-w-2xl bg-card border shadow-sm rounded-xl overflow-hidden">
          <div className="p-5 border-b bg-muted/20">
            <h3 className="font-semibold">Ảnh Banner Trang Chủ</h3>
            <p className="text-sm text-muted-foreground">Ảnh nền lớn phía trên cùng của Landing Page.</p>
          </div>
          {!isLoadingText && (
            <div className="p-6 space-y-4">
              {contents["HeroBannerUrl"] && (
                <div className="rounded-xl overflow-hidden border aspect-video bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={contents["HeroBannerUrl"]} alt="Banner preview" className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = "none"; }} />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">URL Ảnh Banner</label>
                <input type="text" value={contents["HeroBannerUrl"] || ""} onChange={e => setContents(p => ({ ...p, HeroBannerUrl: e.target.value }))} placeholder="https://... (Imgur, Google Drive, v.v.)" className="w-full bg-background border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                <p className="text-xs text-muted-foreground">💡 Dán link ảnh từ Imgur, Google Drive hoặc bất kỳ hosting ảnh công khai nào.</p>
              </div>
              <button onClick={() => handleSaveText("HeroBannerUrl")} disabled={isSaving === "HeroBannerUrl"} className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition-all shadow-sm">
                {isSaving === "HeroBannerUrl" ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</> : <><Save className="w-4 h-4" /> Cập nhật Banner</>}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===== MODAL THÊM/SỬA SẢN PHẨM ===== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b shrink-0">
              <h3 className="text-xl font-bold text-primary">{editingId ? "Sửa Sản Phẩm" : "Thêm Sản Phẩm Mới"}</h3>
              <button onClick={closeModal} className="text-muted-foreground hover:bg-muted p-2 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>

            {/* Modal Body */}
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

              {/* ===== PHẦN UPLOAD ẢNH ===== */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold flex items-center gap-2"><ImageIcon className="w-4 h-4 text-primary" />Ảnh sản phẩm</label>
                  <span className="text-xs text-muted-foreground">Ảnh đầu tiên = ảnh chính trên trang chủ</span>
                </div>

                {/* Grid ảnh hiện có + ảnh mới + nút thêm */}
                <div className="grid grid-cols-4 gap-3">
                  {/* Ảnh đang có trong DB */}
                  {existingImages.map(img => (
                    <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border-2 border-border group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`${API_URL}${img.imagePath}`} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeExistingImage(img.id)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                        <X className="w-3 h-3" />
                      </button>
                      {existingImages[0]?.id === img.id && (
                        <span className="absolute bottom-1 left-1 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded font-medium">Chính</span>
                      )}
                    </div>
                  ))}

                  {/* Ảnh mới chờ upload */}
                  {pendingImages.map((file, idx) => (
                    <div key={`pending-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border-2 border-dashed border-accent/50 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removePendingImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                      <span className="absolute bottom-1 left-1 bg-accent text-white text-[10px] px-1.5 py-0.5 rounded font-medium">Mới</span>
                    </div>
                  ))}

                  {/* Nút thêm ảnh */}
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/40 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer">
                    <Upload className="w-5 h-5" />
                    <span className="text-xs font-medium">Thêm ảnh</span>
                  </button>
                </div>

                <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileSelect} />
                <p className="text-xs text-muted-foreground">📌 Hỗ trợ JPG, PNG, WEBP. Tối đa 5MB/ảnh. Kéo thứ tự ảnh bằng cách sắp xếp lại.</p>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="p-5 border-t bg-muted/20 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-medium border hover:bg-muted rounded-lg transition-colors">Hủy</button>
              <button type="submit" form="product-form" disabled={isSavingProduct} className="px-5 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50">
                {isSavingProduct
                  ? <>{uploadingImages ? <><Upload className="w-4 h-4 animate-bounce" /> Đang upload ảnh...</> : <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>}</>
                  : <><Save className="w-4 h-4" /> Lưu Sản Phẩm</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

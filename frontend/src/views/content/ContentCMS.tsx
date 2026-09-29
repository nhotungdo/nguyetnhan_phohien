"use client";

import { useState, useEffect } from "react";
import { contentApi } from "@/services/api.service";
import { Loader2, Save, CheckCircle2, Type, Phone, MapPin, Globe } from "lucide-react";
import type { WebsiteContentResponse } from "@/types/api.types";

const CONTENT_KEYS = [
  { key: "HeroTitle", label: "Tiêu đề chính (Hero)", icon: <Type className="w-4 h-4 text-primary" />, placeholder: "Vd: Đặc Sản Long Nhãn Phố Hiến" },
  { key: "HeroSubtitle", label: "Mô tả phụ (Hero)", icon: <Type className="w-4 h-4 text-primary" />, placeholder: "Vd: Hương vị truyền thống, đậm đà..." },
  { key: "Hotline", label: "Số điện thoại Hotline", icon: <Phone className="w-4 h-4 text-primary" />, placeholder: "Vd: 090 123 4567" },
  { key: "Address", label: "Địa chỉ cửa hàng", icon: <MapPin className="w-4 h-4 text-primary" />, placeholder: "Vd: 123 Đường Phố Hiến..." },
  { key: "FooterText", label: "Nội dung chân trang", icon: <Globe className="w-4 h-4 text-primary" />, placeholder: "Vd: © 2026 Nguyệt Nhãn Phố Hiến" },
];

export default function ContentCMS() {
  const [contents, setContents] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      const data = await contentApi.getAll();
      const mapped: Record<string, string> = {};
      data.forEach((item: WebsiteContentResponse) => {
        mapped[item.key] = item.value;
      });
      
      // Khởi tạo các key trống nếu chưa có trong DB
      CONTENT_KEYS.forEach(field => {
        if (mapped[field.key] === undefined) {
          mapped[field.key] = "";
        }
      });
      
      setContents(mapped);
    } catch (err) {
      console.error("Failed to load contents:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setContents(prev => ({ ...prev, [key]: value }));
    if (saveSuccess === key) setSaveSuccess(null);
  };

  const handleSave = async (key: string) => {
    const value = contents[key] || "";
    setIsSaving(key);
    try {
      await contentApi.upsert({ key, value });
      setSaveSuccess(key);
      setTimeout(() => setSaveSuccess(null), 3000); // Ẩn thông báo sau 3s
    } catch (err) {
      console.error(`Failed to save ${key}:`, err);
      alert(`Lỗi khi lưu ${key}!`);
    } finally {
      setIsSaving(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">Nội dung Website</h2>
        <p className="text-muted-foreground">Tùy chỉnh các đoạn văn bản hiển thị trên trang chủ ngay lập tức.</p>
      </div>

      <div className="bg-card border shadow-sm rounded-xl overflow-hidden">
        <div className="p-6 border-b bg-muted/20">
          <h3 className="font-semibold text-lg">Thông tin chung</h3>
          <p className="text-sm text-muted-foreground">Sửa trực tiếp các dòng chữ quan trọng trên website</p>
        </div>
        
        <div className="p-6 space-y-8">
          {CONTENT_KEYS.map((field) => (
            <div key={field.key} className="space-y-2">
              <label className="flex items-center gap-2 font-medium text-sm text-foreground">
                {field.icon}
                {field.label}
              </label>
              <div className="flex gap-3 items-start">
                {field.key.includes("Subtitle") || field.key.includes("Footer") ? (
                  <textarea
                    value={contents[field.key]}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="flex-1 min-h-[80px] bg-background border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-y"
                  />
                ) : (
                  <input
                    type="text"
                    value={contents[field.key]}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="flex-1 bg-background border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                )}
                
                <button
                  onClick={() => handleSave(field.key)}
                  disabled={isSaving === field.key}
                  className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all shadow-sm shrink-0"
                >
                  {isSaving === field.key ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Lưu...
                    </>
                  ) : saveSuccess === field.key ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Đã lưu
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Lưu lại
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

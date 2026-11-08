"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLanguageStore } from "@/store/useLanguageStore";

export default function PolicyLayout({ children }: { children: React.ReactNode }) {
  const { language, setLanguage } = useLanguageStore();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-white py-4 shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <Link
            href="/"
            prefetch={true}
            className="flex items-center gap-2 hover:text-accent transition-colors font-medium text-sm sm:text-base"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{language === "en" ? "Back to Home" : "Trở về trang chủ"}</span>
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
              className="text-xs font-bold text-white border border-amber-300/40 px-2.5 py-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              aria-label={language === "en" ? "Switch language" : "Chuyển ngôn ngữ"}
            >
              {language === "vi" ? "🇻🇳 VI" : "🇬🇧 EN"}
            </button>
            <div style={{ fontFamily: "var(--font-playfair)" }} className="text-xl sm:text-2xl font-bold">
              Nguyệt Nhãn Phố Hiến
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 py-12 bg-secondary/20">{children}</main>
      <footer className="bg-foreground text-background py-8 text-center text-sm">
        <p>
          © 2026 Nguyệt Nhãn Phố Hiến.{" "}
          {language === "en" ? "All rights reserved." : "Tất cả các quyền được bảo lưu."}
        </p>
      </footer>
    </div>
  );
}

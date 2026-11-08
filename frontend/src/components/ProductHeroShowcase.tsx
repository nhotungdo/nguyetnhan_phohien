"use client";

import { FastImage } from "@/components/FastImage";

interface ProductHeroShowcaseProps {
  bannerUrl?: string;
  language?: "vi" | "en";
  onExploreClick?: () => void;
}

export function ProductHeroShowcase({ bannerUrl, language = "vi", onExploreClick }: ProductHeroShowcaseProps) {
  return (
    <figure className="w-full max-w-lg">
      <button type="button" onClick={onExploreClick} aria-label={language === "en" ? "Browse products" : "Xem sản phẩm"} className="relative block w-full aspect-[4/3] sm:aspect-[5/4] overflow-hidden rounded-xl bg-[#EDE6DA] cursor-pointer">
        <FastImage src={bannerUrl || "/images/setqua.jpg"} fallbackSrc="/images/setqua.jpg" alt="Nguyệt Nhãn Phố Hiến" fill priority sizes="(max-width: 768px) 100vw, 512px" className="object-contain" />
      </button>
      <figcaption className="mt-3 text-sm text-[#665A4C]">Nguyệt Nhãn Phố Hiến</figcaption>
    </figure>
  );
}

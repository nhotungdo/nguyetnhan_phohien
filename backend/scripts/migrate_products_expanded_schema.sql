-- =========================================================================================
-- Script SQL mở rộng schema bảng Products trên Supabase PostgreSQL
-- Hỗ trợ 100% dữ liệu động cho 13 trường thông tin sản phẩm (Không code cứng)
-- =========================================================================================

-- 1. Bổ sung các cột mới vào bảng Products nếu chưa tồn tại
ALTER TABLE public."Products"
    ADD COLUMN IF NOT EXISTS "ProductCode" VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS "NameEn" VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS "PackagingType" VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS "Badge" VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS "Overview" TEXT NULL,
    ADD COLUMN IF NOT EXISTS "Ingredients" TEXT NULL,
    ADD COLUMN IF NOT EXISTS "SensoryScores" TEXT NULL,
    ADD COLUMN IF NOT EXISTS "HealthBenefits" TEXT NULL,
    ADD COLUMN IF NOT EXISTS "UsageInstructions" TEXT NULL;

-- 2. Đảm bảo RLS được bật theo chuẩn Supabase Security Advisor
ALTER TABLE IF EXISTS public."Products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."ProductImages" ENABLE ROW LEVEL SECURITY;

-- 3. Tạo Index cho ProductCode để tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS "IX_Products_ProductCode" ON public."Products" ("ProductCode");

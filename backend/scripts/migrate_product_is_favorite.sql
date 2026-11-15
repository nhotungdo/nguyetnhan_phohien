-- =========================================================================================
-- Script SQL bổ sung cột IsFavorite vào bảng Products trên Supabase PostgreSQL
-- Hỗ trợ đánh dấu sản phẩm yêu thích (Admin Choice / Favorite)
-- =========================================================================================

ALTER TABLE public."Products"
    ADD COLUMN IF NOT EXISTS "IsFavorite" BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS "IX_Products_IsFavorite" ON public."Products" ("IsFavorite");

-- Đặt mặc định 2 sản phẩm best-seller là yêu thích ban đầu để kiểm nghiệm
UPDATE public."Products"
SET "IsFavorite" = TRUE
WHERE "ProductCode" IN ('NN-ZIP-150', 'NN-SEN-300');

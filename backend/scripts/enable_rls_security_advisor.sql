-- =========================================================================================
-- Script SQL khắc phục cảnh báo bảo mật Supabase Security Advisor (5 lỗi RLS Disabled in Public)
-- Áp dụng cho: CustomIngredients, CustomPackagings, EmailOutbox, WebsiteVisits, NutritionAiUsages
-- =========================================================================================

-- Bật Row Level Security (RLS) cho 5 bảng được cảnh báo
ALTER TABLE IF EXISTS public."CustomIngredients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."CustomPackagings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."EmailOutbox" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."WebsiteVisits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."NutritionAiUsages" ENABLE ROW LEVEL SECURITY;

-- Đảm bảo toàn bộ các bảng trong schema public (hiện tại và tương lai) đều bật RLS
DO $$
DECLARE
    t record;
BEGIN
    FOR t IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
          AND table_name <> '__EFMigrationsHistory'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t.table_name);
    END LOOP;
END $$;

-- Kiểm tra lại trạng thái RLS của toàn bộ bảng
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

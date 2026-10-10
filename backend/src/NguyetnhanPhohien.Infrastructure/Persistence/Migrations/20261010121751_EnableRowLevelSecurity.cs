using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NguyetnhanPhohien.Infrastructure.Persistence.Migrations
{
    /// <summary>
    /// Bật Row Level Security cho toàn bộ bảng nghiệp vụ trong schema `public`.
    ///
    /// TRƯỚC ĐÂY: khối DDL này nằm trong DbSeeder và chạy VÔ ĐIỀU KIỆN mỗi lần backend
    /// khởi động — thay đổi hành vi truy cập của cả DB mà không có dấu vết trong lịch sử
    /// migration, không thể review, và chạy lại mãi mãi.
    /// NAY: chạy đúng MỘT LẦN, có ghi nhận trong __EFMigrationsHistory.
    ///
    /// MÔ HÌNH TRUY CẬP THỰC TẾ: database này chỉ được truy cập qua kết nối Postgres
    /// trực tiếp của API .NET (role sở hữu bảng). Các role `anon`/`authenticated` của
    /// Supabase (Data API/PostgREST) KHÔNG được dùng ở đây — frontend gọi REST API của
    /// chính backend, không gọi thẳng Supabase.
    ///
    /// Vì vậy CỐ Ý KHÔNG tạo policy nào: cơ chế của Postgres là deny-by-default, nên
    /// bật RLS mà không có policy = chỉ chủ sở hữu (API) truy cập được, còn mọi role
    /// khác bị chặn sạch. Đây chính là mục tiêu của khuyến nghị Security Advisor.
    /// Nếu sau này có kênh truy cập khác (Data API, user chỉ đọc...), phải thêm policy
    /// tường minh cho ĐÚNG role đó thay vì thêm policy chung chung.
    ///
    /// Bảng `__EFMigrationsHistory` được loại trừ có chủ đích: nó thuộc hạ tầng EF,
    /// không phải dữ liệu nghiệp vụ.
    /// </summary>
    public partial class EnableRowLevelSecurity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
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
            ");
        }

        /// <inheritdoc />
        /// <remarks>
        /// Bảng được liệt kê TƯỜNG MINH (không dùng vòng lặp "mọi bảng") để việc rollback
        /// không vô tình tắt RLS trên những bảng do module khác tạo về sau.
        /// </remarks>
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            foreach (var table in new[]
            {
                "Users", "FacebookPages", "FacebookPosts", "Conversations", "Messages",
                "Customers", "AutoReplyRules", "BotSettings",
                "Orders", "OrderItems", "DiscountCodes", "DiscountRedemptions",
                "WebsiteContents", "Products", "ProductImages",
                "ChatSessions", "ChatMessages"
            })
            {
                migrationBuilder.Sql($"ALTER TABLE IF EXISTS public.\"{table}\" DISABLE ROW LEVEL SECURITY;");
            }
        }
    }
}

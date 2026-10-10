using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NguyetnhanPhohien.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDiscountRedemption : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DiscountRedemptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DiscountCodeId = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "text", nullable: false),
                    CustomerPhone = table.Column<string>(type: "text", nullable: false),
                    OrderId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DiscountRedemptions", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DiscountRedemptions_Code",
                table: "DiscountRedemptions",
                column: "Code");

            migrationBuilder.CreateIndex(
                name: "IX_DiscountRedemptions_DiscountCodeId_CustomerPhone",
                table: "DiscountRedemptions",
                columns: new[] { "DiscountCodeId", "CustomerPhone" },
                unique: true);

            // ===== BACKFILL: các đơn cũ đã dùng mã giảm giá =====
            // Không backfill thì quy tắc "mỗi SĐT dùng một mã đúng một lần" chỉ áp dụng
            // cho đơn MỚI: một khách đã dùng WELCOME10 tuần trước vẫn dùng lại được.
            // SĐT chuẩn hóa giống hệt PhoneNumber.Normalize (chỉ giữ chữ số; nếu không
            // có chữ số nào thì dùng nguyên bản đã trim).
            // ON CONFLICT DO NOTHING: dữ liệu cũ có thể đã trùng (SĐT dùng nhiều lần
            // trước khi có quy tắc mới) — giữ bản ghi đầu tiên, không làm hỏng migration.
            migrationBuilder.Sql(@"
                INSERT INTO ""DiscountRedemptions""
                    (""Id"", ""DiscountCodeId"", ""Code"", ""CustomerPhone"", ""OrderId"", ""CreatedAt"")
                SELECT
                    gen_random_uuid(),
                    d.""Id"",
                    d.""Code"",
                    CASE
                        WHEN regexp_replace(o.""CustomerPhone"", '[^0-9]', '', 'g') = ''
                            THEN btrim(o.""CustomerPhone"")
                        ELSE regexp_replace(o.""CustomerPhone"", '[^0-9]', '', 'g')
                    END,
                    o.""Id"",
                    o.""CreatedAt""
                FROM ""Orders"" o
                JOIN ""DiscountCodes"" d ON upper(d.""Code"") = upper(o.""DiscountCodeApplied"")
                WHERE o.""DiscountCodeApplied"" IS NOT NULL
                  AND btrim(o.""DiscountCodeApplied"") <> ''
                ON CONFLICT DO NOTHING;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DiscountRedemptions");
        }
    }
}

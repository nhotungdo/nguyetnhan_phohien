using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NguyetnhanPhohien.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddChatSessionUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Dọn session trùng (lỗi race trước đây): giữ lại phiên MỚI NHẤT theo SessionId,
            // nếu bằng CreatedAt thì giữ Id nhỏ hơn — tránh tạo unique index bị fail.
            migrationBuilder.Sql(@"
                DELETE FROM ""ChatSessions"" cs
                USING ""ChatSessions"" keep
                WHERE cs.""SessionId"" = keep.""SessionId""
                  AND (cs.""CreatedAt"" < keep.""CreatedAt""
                       OR (cs.""CreatedAt"" = keep.""CreatedAt"" AND cs.""Id"" > keep.""Id""));
            ");

            migrationBuilder.DropIndex(
                name: "IX_ChatSessions_SessionId",
                table: "ChatSessions");

            migrationBuilder.CreateIndex(
                name: "IX_ChatSessions_SessionId",
                table: "ChatSessions",
                column: "SessionId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ChatSessions_SessionId",
                table: "ChatSessions");

            migrationBuilder.CreateIndex(
                name: "IX_ChatSessions_SessionId",
                table: "ChatSessions",
                column: "SessionId");
        }
    }
}

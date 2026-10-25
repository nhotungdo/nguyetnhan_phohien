using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NguyetnhanPhohien.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomMixStudioEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"DROP INDEX IF EXISTS ""IX_ChatMessages_ChatSessionId"";");

            migrationBuilder.AddColumn<string>(
                name: "CustomDetailsJson",
                table: "OrderItems",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsCustomMix",
                table: "OrderItems",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "CustomIngredients",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    CaloriesPer100g = table.Column<int>(type: "integer", nullable: false),
                    ImageUrl = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Tagline = table.Column<string>(type: "text", nullable: false),
                    MinGrams = table.Column<int>(type: "integer", nullable: false),
                    MaxGrams = table.Column<int>(type: "integer", nullable: false),
                    StepGrams = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomIngredients", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CustomPackagings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    PackagingType = table.Column<string>(type: "text", nullable: false),
                    CapacityGrams = table.Column<int>(type: "integer", nullable: false),
                    FixedPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    ImageUrl = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomPackagings", x => x.Id);
                });

            migrationBuilder.Sql(@"CREATE INDEX IF NOT EXISTS ""IX_Orders_CreatedAt"" ON ""Orders"" (""CreatedAt"");");
            migrationBuilder.Sql(@"CREATE INDEX IF NOT EXISTS ""IX_Orders_CustomerPhone"" ON ""Orders"" (""CustomerPhone"");");
            migrationBuilder.Sql(@"CREATE INDEX IF NOT EXISTS ""IX_Orders_Status"" ON ""Orders"" (""Status"");");
            migrationBuilder.Sql(@"CREATE INDEX IF NOT EXISTS ""IX_ChatSessions_LastMessageAt"" ON ""ChatSessions"" (""LastMessageAt"");");
            migrationBuilder.Sql(@"CREATE INDEX IF NOT EXISTS ""IX_ChatMessages_ChatSessionId_SentAt"" ON ""ChatMessages"" (""ChatSessionId"", ""SentAt"");");

            migrationBuilder.CreateIndex(
                name: "IX_CustomIngredients_DisplayOrder",
                table: "CustomIngredients",
                column: "DisplayOrder");

            migrationBuilder.CreateIndex(
                name: "IX_CustomIngredients_IsActive",
                table: "CustomIngredients",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_CustomPackagings_DisplayOrder",
                table: "CustomPackagings",
                column: "DisplayOrder");

            migrationBuilder.CreateIndex(
                name: "IX_CustomPackagings_IsActive",
                table: "CustomPackagings",
                column: "IsActive");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CustomIngredients");

            migrationBuilder.DropTable(
                name: "CustomPackagings");

            migrationBuilder.DropIndex(
                name: "IX_Orders_CreatedAt",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_CustomerPhone",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_Status",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_ChatSessions_LastMessageAt",
                table: "ChatSessions");

            migrationBuilder.DropIndex(
                name: "IX_ChatMessages_ChatSessionId_SentAt",
                table: "ChatMessages");

            migrationBuilder.DropColumn(
                name: "CustomDetailsJson",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "IsCustomMix",
                table: "OrderItems");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_ChatSessionId",
                table: "ChatMessages",
                column: "ChatSessionId");
        }
    }
}

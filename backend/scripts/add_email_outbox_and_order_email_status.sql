-- =========================================================================================
-- Script SQL khởi tạo bảng EmailOutbox và bổ sung các trường theo dõi trạng thái email vào Orders
-- Phục vụ Transactional Outbox Pattern: Đảm bảo không mất email khi restart / deploy / crash.
-- =========================================================================================

BEGIN;

-- 1. Thêm cột theo dõi trạng thái gửi email vào bảng Orders
ALTER TABLE "Orders"
    ADD COLUMN IF NOT EXISTS "InvoiceEmailSentAt" TIMESTAMP WITH TIME ZONE NULL,
    ADD COLUMN IF NOT EXISTS "InvoiceEmailError" TEXT NULL;

CREATE INDEX IF NOT EXISTS "IX_Orders_InvoiceEmailSentAt" ON "Orders" ("InvoiceEmailSentAt");

-- 2. Tạo bảng EmailOutbox
CREATE TABLE IF NOT EXISTS "EmailOutbox" (
    "Id" UUID NOT NULL,
    "OrderId" UUID NULL,
    "EmailType" TEXT NOT NULL,
    "RecipientEmail" VARCHAR(255) NOT NULL,
    "Subject" VARCHAR(500) NOT NULL,
    "HtmlBody" TEXT NOT NULL,
    "PlainTextBody" TEXT NOT NULL,
    "Status" INTEGER NOT NULL DEFAULT 0,
    "RetryCount" INTEGER NOT NULL DEFAULT 0,
    "MaxRetries" INTEGER NOT NULL DEFAULT 3,
    "LastError" TEXT NULL,
    "NextRetryAt" TIMESTAMP WITH TIME ZONE NULL,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    "SentAt" TIMESTAMP WITH TIME ZONE NULL,
    CONSTRAINT "PK_EmailOutbox" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_EmailOutbox_Orders_OrderId" FOREIGN KEY ("OrderId") REFERENCES "Orders" ("Id") ON DELETE SET NULL
);

-- 3. Tạo Index cho EmailOutbox
CREATE INDEX IF NOT EXISTS "IX_EmailOutbox_OrderId" ON "EmailOutbox" ("OrderId");
CREATE INDEX IF NOT EXISTS "IX_EmailOutbox_Status_NextRetryAt_CreatedAt" 
    ON "EmailOutbox" ("Status", "NextRetryAt", "CreatedAt");

COMMIT;

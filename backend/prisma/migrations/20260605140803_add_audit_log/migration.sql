-- CreateEnum
CREATE TYPE "AuditCategory" AS ENUM ('MARKET_DATA', 'SIMULATOR', 'REALTIME', 'SESSION', 'SYSTEM', 'API');

-- CreateEnum
CREATE TYPE "AuditSeverity" AS ENUM ('INFO', 'WARN', 'ERROR');

-- AlterTable
ALTER TABLE "symbols" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" "AuditCategory" NOT NULL,
    "action" VARCHAR(64) NOT NULL,
    "actor" VARCHAR(64) NOT NULL,
    "severity" "AuditSeverity" NOT NULL DEFAULT 'INFO',
    "symbol" VARCHAR(32),
    "symbol_type" "SymbolType",
    "value" DECIMAL(14,4),
    "duration_ms" INTEGER,
    "meta" JSONB,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_audit_logs_timestamp" ON "audit_logs"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "idx_audit_logs_category_time" ON "audit_logs"("category", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "idx_audit_logs_symbol_time" ON "audit_logs"("symbol", "timestamp" DESC);

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "SymbolType" AS ENUM ('INDEX', 'STOCK');

CREATE TABLE "symbols" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "symbol" VARCHAR(32) NOT NULL,
  "type" "SymbolType" NOT NULL,
  "display_name" VARCHAR(128),
  "yesterday_close" DECIMAL(14,4) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "symbols_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "market_ticks" (
  "id" BIGSERIAL NOT NULL,
  "symbol" VARCHAR(32) NOT NULL,
  "type" "SymbolType" NOT NULL,
  "event_time" TIMESTAMPTZ(6) NOT NULL,
  "value" DECIMAL(14,4) NOT NULL,
  "yesterday_close" DECIMAL(14,4) NOT NULL,
  "raw_payload" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "market_ticks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "symbols_symbol_key" ON "symbols"("symbol");
CREATE INDEX "idx_market_ticks_symbol_time" ON "market_ticks"("symbol", "event_time" DESC);
CREATE INDEX "idx_market_ticks_event_time" ON "market_ticks"("event_time" DESC);

ALTER TABLE "market_ticks"
  ADD CONSTRAINT "market_ticks_symbol_fkey"
  FOREIGN KEY ("symbol")
  REFERENCES "symbols"("symbol")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

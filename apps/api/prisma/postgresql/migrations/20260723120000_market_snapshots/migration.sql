-- CreateTable
CREATE TABLE "market_daily_snapshots" (
    "trade_date" VARCHAR(10) NOT NULL,
    "snapshot_kind" VARCHAR(16) NOT NULL,
    "is_complete" BOOLEAN NOT NULL DEFAULT false,
    "indices" JSONB NOT NULL,
    "breadth_rise" INTEGER NOT NULL,
    "breadth_fall" INTEGER NOT NULL,
    "turnover" DECIMAL(14,2) NOT NULL,
    "capital_inflow" DECIMAL(14,2) NOT NULL,
    "source" VARCHAR(32),
    "captured_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "market_daily_snapshots_pkey" PRIMARY KEY ("trade_date")
);

CREATE INDEX "idx_market_snapshots_date_complete" ON "market_daily_snapshots"("trade_date" DESC, "is_complete");

-- Add currency columns to finance_records
ALTER TABLE finance_records 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS original_amount NUMERIC,
ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC DEFAULT 1;

-- Backfill existing records (assume USD)
UPDATE finance_records 
SET currency = 'USD', original_amount = amount, exchange_rate = 1 
WHERE currency IS NULL;

-- Add 'signup' to loyalty_transactions type CHECK constraint
ALTER TABLE loyalty_transactions
  DROP CONSTRAINT IF EXISTS loyalty_transactions_type_check;

ALTER TABLE loyalty_transactions
  ADD CONSTRAINT loyalty_transactions_type_check
  CHECK (type IN ('purchase', 'referral', 'review', 'redemption', 'birthday', 'adjustment', 'signup'));

-- Unique index to prevent duplicate signup bonuses
CREATE UNIQUE INDEX IF NOT EXISTS idx_loyalty_tx_signup
  ON loyalty_transactions(user_id) WHERE type = 'signup';

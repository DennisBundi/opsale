-- Extend orders.status CHECK constraint to include paid, shipped, delivered
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending', 'processing', 'completed',
    'cancelled', 'refunded',
    'paid', 'shipped', 'delivered'
  ));

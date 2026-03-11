# Order Tracking Flow Design

**Date:** 2026-03-11
**Status:** Approved

## Goal

Extend order statuses to reflect the full delivery lifecycle: payment confirmed → shipped → delivered. Customers see live status on their order page and can confirm receipt.

## Status Flow

**Online orders:**
```
pending → paid → shipped → delivered
```
- `cancelled` and `refunded` remain terminal states, reachable at any point before `delivered`

**POS orders:** unchanged — go straight to `completed`.

## Side Effects

All existing side effects (inventory deduction, loyalty points, referral bonus) continue to fire when payment clears. Status name changes from `completed` to `paid` at that point — logic is unchanged.

## Changes Required

### 1. Database Migration
Add `paid`, `shipped`, `delivered` to the `orders.status` CHECK constraint.

```sql
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'refunded', 'paid', 'shipped', 'delivered'));
```

### 2. Payment Callbacks
- `POST /api/payments/verify` (Paystack) — change status from `completed` → `paid`
- `POST /api/payments/callback/mpesa` — change status from `completed` → `paid`

### 3. Types
Update `OrderStatus` type in all files:
```ts
type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded' | 'paid' | 'shipped' | 'delivered'
```

Key files:
- `src/app/(marketplace)/profile/orders/types.ts`
- `src/app/(admin)/dashboard/orders/[id]/page.tsx`

### 4. Customer Orders List
Add badge styles for new statuses in `STATUS_STYLES`:
- `paid` → green (payment confirmed)
- `shipped` → blue/indigo (in transit)
- `delivered` → green (fulfilled)

### 5. Customer Order Detail — StatusTimeline
Replace `pending → processing → completed` with `pending → paid → shipped → delivered`.

Add a **"Mark as Received"** button visible only when `status === 'shipped'`. Calls the new deliver endpoint.

### 6. New API Endpoint — Customer Deliver
`POST /api/orders/[id]/deliver`
- Auth: logged-in customer only
- Validates order belongs to the requesting user
- Validates current status is `shipped`
- Sets status to `delivered`
- Returns updated order

### 7. Admin Order Detail
Add `paid`, `shipped`, `delivered` to the status button group alongside existing options.

## Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Who marks delivered? | Both customer and admin | Customers get UX confirmation; admin fallback for non-responsive customers |
| When do side effects fire? | At `paid` | Same as current `completed` — no behaviour change, just renamed |
| POS orders | Unchanged (`completed`) | In-store sales need no delivery tracking |
| New statuses replace `processing`? | No — keep `processing` | Admin may still use it for manual workflows |

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ReconciliationService } from '@/services/reconciliationService';
import { InventoryService } from '@/services/inventoryService';
import { LoyaltyService } from '@/services/loyaltyService';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, data } = body;

    // Verify webhook signature (Paystack sends a signature header)
    // In production, verify the signature for security

    if (event === 'charge.success') {
      const reference = data.reference;
      const metadata = data.metadata;

      if (!metadata?.order_id) {
        return NextResponse.json(
          { error: 'Order ID not found in metadata' },
          { status: 400 }
        );
      }

      const orderId = metadata.order_id;

      // Reconcile the transaction
      const reconciled = await ReconciliationService.reconcileTransaction(
        reference,
        orderId
      );

      if (!reconciled) {
        return NextResponse.json(
          { error: 'Failed to reconcile transaction' },
          { status: 500 }
        );
      }

      // Deduct inventory for completed order
      const supabase = await createClient();
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', orderId);

      if (orderItems) {
        for (const item of orderItems) {
          await InventoryService.deductStock(item.product_id, item.quantity);
        }
      }

      // Award loyalty points for purchase
      try {
        const adminClient = createAdminClient();
        const { data: completedOrder } = await adminClient
          .from('orders')
          .select('user_id, total_amount')
          .eq('id', orderId)
          .single();

        if (completedOrder?.user_id) {
          const pointsAwarded = await LoyaltyService.awardPurchasePoints(
            completedOrder.user_id,
            orderId,
            completedOrder.total_amount
          );
          if (pointsAwarded > 0) {
            console.log(`Awarded ${pointsAwarded} loyalty points for order ${orderId}`);
          }

          // Check and complete any pending referral for this user
          const { data: pendingReferral } = await adminClient
            .from('referrals')
            .select('id, referrer_id')
            .eq('referred_id', completedOrder.user_id)
            .eq('status', 'pending')
            .single();

          if (pendingReferral) {
            await adminClient
              .from('referrals')
              .update({ status: 'completed', completed_at: new Date().toISOString() })
              .eq('id', pendingReferral.id);

            const referralPoints = await LoyaltyService.awardReferralPoints(
              pendingReferral.referrer_id,
              pendingReferral.id
            );
            if (referralPoints > 0) {
              console.log(`Awarded ${referralPoints} referral points to referrer for order ${orderId}`);
            }
          }
        }
      } catch (loyaltyError) {
        console.error('Error awarding loyalty points:', loyaltyError);
      }

      return NextResponse.json({ success: true });
    }

    if (event === 'charge.failed') {
      // Handle failed payment
      const reference = data.reference;
      const supabase = await createClient();

      await supabase
        .from('transactions')
        .update({ status: 'failed' })
        .eq('provider_reference', reference);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}


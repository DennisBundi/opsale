import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (!user || authError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Find completed orders for this user older than 1 day
    const { data: orderItems, error: orderError } = await admin
      .from("order_items")
      .select("product_id, order_id, orders!inner(id, user_id, status, updated_at)")
      .eq("orders.user_id", user.id)
      .eq("orders.status", "completed")
      .lt("orders.updated_at", oneDayAgo);

    if (orderError) {
      console.error("Failed to fetch eligible orders:", orderError);
      return NextResponse.json(
        { error: "Failed to fetch eligible products." },
        { status: 500 }
      );
    }

    if (!orderItems || orderItems.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Deduplicate by product_id, keep first order_id
    const productOrderMap = new Map<string, string>();
    for (const item of orderItems) {
      if (!productOrderMap.has(item.product_id)) {
        productOrderMap.set(item.product_id, item.order_id);
      }
    }

    const productIds = [...productOrderMap.keys()];

    // Exclude products with existing pending/approved reviews
    const { data: existingReviews } = await admin
      .from("reviews")
      .select("product_id")
      .eq("user_id", user.id)
      .in("product_id", productIds)
      .in("status", ["pending", "approved"]);

    const reviewedProductIds = new Set(
      existingReviews?.map((r) => r.product_id) || []
    );

    // Exclude products where rejection_count >= 2
    const { data: attempts } = await admin
      .from("review_attempts")
      .select("product_id, rejection_count")
      .eq("user_id", user.id)
      .in("product_id", productIds);

    const blockedProductIds = new Set(
      attempts
        ?.filter((a) => a.rejection_count >= 2)
        .map((a) => a.product_id) || []
    );

    const eligibleProductIds = productIds.filter(
      (id) => !reviewedProductIds.has(id) && !blockedProductIds.has(id)
    );

    if (eligibleProductIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Fetch product details
    const { data: products } = await admin
      .from("products")
      .select("id, name, images")
      .in("id", eligibleProductIds);

    const productMap = new Map(products?.map((p) => [p.id, p]) || []);

    const result = eligibleProductIds
      .map((productId) => {
        const product = productMap.get(productId);
        if (!product) return null;
        return {
          product_id: productId,
          product_name: product.name,
          product_image: product.images?.[0] || null,
          order_id: productOrderMap.get(productId)!,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Eligible reviews error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

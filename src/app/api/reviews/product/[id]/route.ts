import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const admin = createAdminClient();

    // Fetch approved reviews for this product
    const { data: reviews, error } = await admin
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch reviews:", error);
      return NextResponse.json(
        { error: "Failed to fetch reviews." },
        { status: 500 }
      );
    }

    if (!reviews || reviews.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Fetch reviewer info for each review
    const userIds = [...new Set(reviews.map((r) => r.user_id))];

    const { data: users } = await admin
      .from("users")
      .select("id, full_name")
      .in("id", userIds);

    const { data: loyaltyAccounts } = await admin
      .from("loyalty_accounts")
      .select("user_id, tier")
      .in("user_id", userIds);

    const userMap = new Map(users?.map((u) => [u.id, u]) || []);
    const tierMap = new Map(
      loyaltyAccounts?.map((la) => [la.user_id, la.tier]) || []
    );

    const enrichedReviews = reviews.map((review) => ({
      ...review,
      reviewer_name: userMap.get(review.user_id)?.full_name || "Anonymous",
      reviewer_tier: tierMap.get(review.user_id) || null,
    }));

    return NextResponse.json({ data: enrichedReviews });
  } catch (error) {
    console.error("Fetch product reviews error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

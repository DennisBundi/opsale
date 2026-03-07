import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserRole } from "@/lib/auth/roles";

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

    // Role check — admin or manager only
    const role = await getUserRole(user.id);
    if (!role || (role !== "admin" && role !== "manager")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") || "pending";

    // Compute stats across all statuses (always return these)
    const { count: pendingCount } = await admin
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");
    const { count: approvedCount } = await admin
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved");
    const { count: rejectedCount } = await admin
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("status", "rejected");

    const stats = {
      pending: pendingCount || 0,
      approved: approvedCount || 0,
      rejected: rejectedCount || 0,
    };

    // Fetch reviews with the given status
    let query = admin
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: true });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data: reviews, error } = await query;

    if (error) {
      console.error("Failed to fetch pending reviews:", error);
      return NextResponse.json(
        { error: "Failed to fetch reviews." },
        { status: 500 }
      );
    }

    if (!reviews || reviews.length === 0) {
      return NextResponse.json({ data: [], count: 0, stats });
    }

    // Gather unique user_ids and product_ids
    const userIds = [...new Set(reviews.map((r) => r.user_id))];
    const productIds = [...new Set(reviews.map((r) => r.product_id))];

    // Fetch reviewer info
    const { data: users } = await admin
      .from("users")
      .select("id, full_name, email")
      .in("id", userIds);

    const { data: loyaltyAccounts } = await admin
      .from("loyalty_accounts")
      .select("user_id, tier")
      .in("user_id", userIds);

    // Fetch product info
    const { data: products } = await admin
      .from("products")
      .select("id, name, images")
      .in("id", productIds);

    // Fetch review_attempts for each user+product pair
    const { data: attempts } = await admin
      .from("review_attempts")
      .select("user_id, product_id, rejection_count")
      .in("user_id", userIds)
      .in("product_id", productIds);

    const userMap = new Map(users?.map((u) => [u.id, u]) || []);
    const tierMap = new Map(
      loyaltyAccounts?.map((la) => [la.user_id, la.tier]) || []
    );
    const productMap = new Map(products?.map((p) => [p.id, p]) || []);
    const attemptMap = new Map(
      attempts?.map((a) => [`${a.user_id}:${a.product_id}`, a.rejection_count]) || []
    );

    const enrichedReviews = reviews.map((review) => {
      const reviewer = userMap.get(review.user_id);
      const product = productMap.get(review.product_id);
      return {
        ...review,
        reviewer_name: reviewer?.full_name || "Unknown",
        reviewer_email: reviewer?.email || null,
        reviewer_tier: tierMap.get(review.user_id) || null,
        product_name: product?.name || "Unknown Product",
        product_images: product?.images || [],
        rejection_count:
          attemptMap.get(`${review.user_id}:${review.product_id}`) || 0,
      };
    });

    return NextResponse.json({
      data: enrichedReviews,
      count: enrichedReviews.length,
      stats,
    });
  } catch (error) {
    console.error("Pending reviews error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

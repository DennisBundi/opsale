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

    // Fetch user's reviews (all statuses)
    const { data: reviews, error } = await admin
      .from("reviews")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch user reviews:", error);
      return NextResponse.json(
        { error: "Failed to fetch your reviews." },
        { status: 500 }
      );
    }

    if (!reviews || reviews.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Fetch product names
    const productIds = [...new Set(reviews.map((r) => r.product_id))];
    const { data: products } = await admin
      .from("products")
      .select("id, name")
      .in("id", productIds);

    const productMap = new Map(products?.map((p) => [p.id, p.name]) || []);

    const enrichedReviews = reviews.map((review) => ({
      ...review,
      product_name: productMap.get(review.product_id) || "Unknown Product",
    }));

    return NextResponse.json({ data: enrichedReviews });
  } catch (error) {
    console.error("My reviews error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

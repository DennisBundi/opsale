import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const admin = createAdminClient();

    // Fetch all approved reviews for this product
    const { data: reviews, error } = await admin
      .from("reviews")
      .select("rating")
      .eq("product_id", productId)
      .eq("status", "approved");

    if (error) {
      console.error("Failed to fetch review summary:", error);
      return NextResponse.json(
        { error: "Failed to fetch review summary." },
        { status: 500 }
      );
    }

    const total_count = reviews?.length || 0;

    const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;

    if (reviews) {
      for (const review of reviews) {
        breakdown[review.rating] = (breakdown[review.rating] || 0) + 1;
        sum += review.rating;
      }
    }

    const average_rating =
      total_count > 0
        ? Math.round((sum / total_count) * 10) / 10
        : 0;

    return NextResponse.json({
      data: {
        average_rating,
        total_count,
        breakdown,
      },
    });
  } catch (error) {
    console.error("Review summary error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

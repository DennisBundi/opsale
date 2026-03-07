import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserRole } from "@/lib/auth/roles";
import { LoyaltyService } from "@/services/loyaltyService";

const moderateSchema = z.object({
  action: z.enum(["approve", "reject"]),
  rejection_reason: z
    .enum(["inappropriate_content", "spam_low_effort", "not_relevant"])
    .optional(),
}).refine(
  (data) => data.action !== "reject" || data.rejection_reason,
  { message: "rejection_reason is required when rejecting a review", path: ["rejection_reason"] }
);

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params;

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

    // Validate body
    const body = await request.json();
    const parsed = moderateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { action, rejection_reason } = parsed.data;
    const admin = createAdminClient();

    // Fetch the review
    const { data: review, error: fetchError } = await admin
      .from("reviews")
      .select("*")
      .eq("id", reviewId)
      .single();

    if (fetchError || !review) {
      return NextResponse.json(
        { error: "Review not found." },
        { status: 404 }
      );
    }

    let points_awarded = 0;

    if (action === "approve") {
      // Update review status to approved
      const { error: updateError } = await admin
        .from("reviews")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", reviewId);

      if (updateError) {
        console.error("Failed to approve review:", updateError);
        return NextResponse.json(
          { error: "Failed to approve review." },
          { status: 500 }
        );
      }

      // Award loyalty points
      const hasPhoto =
        Array.isArray(review.image_urls) && review.image_urls.length > 0;
      points_awarded = await LoyaltyService.awardReviewPoints(
        review.user_id,
        review.id,
        hasPhoto
      );
    } else {
      // Reject: upsert review_attempts to increment rejection_count
      const { data: existing } = await admin
        .from("review_attempts")
        .select("id, rejection_count")
        .eq("user_id", review.user_id)
        .eq("product_id", review.product_id)
        .single();

      if (existing) {
        await admin
          .from("review_attempts")
          .update({
            rejection_count: existing.rejection_count + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await admin.from("review_attempts").insert({
          user_id: review.user_id,
          product_id: review.product_id,
          rejection_count: 1,
        });
      }

      // Delete the review so user can resubmit (if rejection_count < 2)
      await admin.from("reviews").delete().eq("id", reviewId);
    }

    return NextResponse.json({
      data: {
        action,
        points_awarded,
      },
    });
  } catch (error) {
    console.error("Review moderation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

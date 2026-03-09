import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

const reviewSchema = z.object({
  product_id: z.string().uuid(),
  order_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(20, "Review must be at least 20 characters"),
  image_urls: z.array(z.string()).max(3).optional(),
});

export async function POST(request: NextRequest) {
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

    // Rate limit review submissions
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rlKey = rateLimitKey("review", ip, user.id);
    if (!rateLimit(rlKey, RATE_LIMITS.reviewSubmit.maxRequests, RATE_LIMITS.reviewSubmit.windowMs)) {
      return NextResponse.json(
        { error: "Too many review submissions. Please try again later." },
        { status: 429 }
      );
    }

    // Validate body
    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed" },
        { status: 400 }
      );
    }

    const { product_id, order_id, rating, text, image_urls } = parsed.data;
    const admin = createAdminClient();

    // 1. Check user has a completed order containing this product
    const { data: orderItem, error: orderError } = await admin
      .from("order_items")
      .select("id, orders!inner(id, user_id, status, updated_at)")
      .eq("orders.user_id", user.id)
      .eq("orders.status", "completed")
      .eq("product_id", product_id)
      .limit(1)
      .single();

    if (orderError || !orderItem) {
      return NextResponse.json(
        { error: "You can only review products from your completed orders." },
        { status: 403 }
      );
    }

    // 2. Check order completed at least 1 day ago
    const order = orderItem.orders as unknown as {
      id: string;
      updated_at: string;
    };
    const completedAt = new Date(order.updated_at);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (completedAt > oneDayAgo) {
      return NextResponse.json(
        {
          error:
            "You can submit a review at least 1 day after your order is completed.",
        },
        { status: 403 }
      );
    }

    // 3. Check no existing pending/approved review
    const { data: existingReview } = await admin
      .from("reviews")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", product_id)
      .in("status", ["pending", "approved"])
      .limit(1)
      .single();

    if (existingReview) {
      return NextResponse.json(
        {
          error:
            "You already have a pending or approved review for this product.",
        },
        { status: 409 }
      );
    }

    // 4. Check review_attempts rejection_count
    const { data: attempts } = await admin
      .from("review_attempts")
      .select("rejection_count")
      .eq("user_id", user.id)
      .eq("product_id", product_id)
      .single();

    if (attempts && attempts.rejection_count >= 2) {
      return NextResponse.json(
        {
          error:
            "You have exceeded the maximum number of review attempts for this product.",
        },
        { status: 403 }
      );
    }

    // All checks passed — insert review
    const { data: review, error: insertError } = await admin
      .from("reviews")
      .insert({
        user_id: user.id,
        product_id,
        order_id,
        rating,
        text,
        image_urls: image_urls || [],
        status: "pending",
      })
      .select("id, status")
      .single();

    if (insertError) {
      logger.error("Failed to insert review:", insertError);
      return NextResponse.json(
        { error: "Failed to submit review." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        id: review.id,
        status: "pending",
        message:
          "Review submitted! It will be visible after admin approval.",
      },
    });
  } catch (error) {
    logger.error("Review submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserRole } from "@/lib/auth/roles";
import { LoyaltyService } from "@/services/loyaltyService";

const awardSchema = z.object({
  target_user_id: z.string().min(1, "Target user ID is required"),
  points: z.number().int("Points must be an integer"),
  description: z.string().min(1, "Description is required"),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check user role is admin
  const role = await getUserRole(user.id);

  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = awardSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { target_user_id, points, description } = parsed.data;
  const admin = createAdminClient();

  // Verify target user has a loyalty account
  const { data: account } = await admin
    .from("loyalty_accounts")
    .select("current_points, total_points_earned")
    .eq("user_id", target_user_id)
    .single();

  if (!account) {
    return NextResponse.json(
      { error: "Target user does not have a loyalty account" },
      { status: 404 }
    );
  }

  // Insert loyalty transaction
  const { error: txError } = await admin.from("loyalty_transactions").insert({
    user_id: target_user_id,
    type: "adjustment",
    points,
    description,
  });

  if (txError) {
    console.error("Error creating adjustment transaction:", txError);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }

  // Update loyalty account points
  const newCurrentPoints = account.current_points + points;
  const newTotalEarned =
    points > 0
      ? account.total_points_earned + points
      : account.total_points_earned;

  const { error: updateError } = await admin
    .from("loyalty_accounts")
    .update({
      current_points: newCurrentPoints,
      total_points_earned: newTotalEarned,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", target_user_id);

  if (updateError) {
    console.error("Error updating loyalty account:", updateError);
    return NextResponse.json(
      { error: "Failed to update account" },
      { status: 500 }
    );
  }

  // Recalculate tier
  const newTier = await LoyaltyService.recalculateTier(target_user_id);

  return NextResponse.json({
    message: "Points adjustment applied successfully",
    target_user_id,
    points_adjusted: points,
    new_current_points: newCurrentPoints,
    new_total_earned: newTotalEarned,
    new_tier: newTier,
  });
}

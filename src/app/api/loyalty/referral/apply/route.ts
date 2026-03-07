import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const applyReferralSchema = z.object({
  referral_code: z.string().min(1, "Referral code is required"),
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

  const body = await request.json();
  const parsed = applyReferralSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Find the referrer's loyalty account by referral code
  const { data: referrerAccount, error: referrerError } = await admin
    .from("loyalty_accounts")
    .select("id, user_id")
    .eq("referral_code", parsed.data.referral_code)
    .single();

  if (referrerError || !referrerAccount) {
    return NextResponse.json(
      { error: "Invalid referral code" },
      { status: 404 }
    );
  }

  // Check referrer is not the current user
  if (referrerAccount.user_id === user.id) {
    return NextResponse.json(
      { error: "You cannot use your own referral code" },
      { status: 400 }
    );
  }

  // Check if referral already exists for this user
  const { data: existingReferral } = await admin
    .from("referrals")
    .select("id")
    .eq("referred_id", user.id)
    .single();

  if (existingReferral) {
    return NextResponse.json(
      { error: "A referral has already been applied to your account" },
      { status: 400 }
    );
  }

  // Create referral record with status pending
  const { data: referral, error: referralError } = await admin
    .from("referrals")
    .insert({
      referrer_id: referrerAccount.user_id,
      referred_id: user.id,
      referral_code: parsed.data.referral_code,
      status: "pending",
      points_awarded: false,
    })
    .select()
    .single();

  if (referralError) {
    console.error("Error creating referral:", referralError);
    return NextResponse.json(
      { error: "Failed to apply referral code" },
      { status: 500 }
    );
  }

  // Generate a referral_welcome reward code (KSh 50 off) for the referred user
  const code = `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 day expiry

  const { error: codeError } = await admin.from("reward_codes").insert({
    user_id: user.id,
    code,
    type: "referral_welcome",
    discount_amount: 50,
    expires_at: expiresAt.toISOString(),
  });

  if (codeError) {
    console.error("Error creating referral welcome code:", codeError);
  }

  return NextResponse.json(
    {
      message: "Referral code applied successfully",
      referral_id: referral.id,
      reward_code: code,
      reward_discount: 50,
    },
    { status: 201 }
  );
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get referral code from loyalty account
  const { data: account, error: accountError } = await supabase
    .from("loyalty_accounts")
    .select("referral_code")
    .eq("user_id", user.id)
    .single();

  if (accountError || !account) {
    return NextResponse.json(
      { error: "Loyalty account not found" },
      { status: 404 }
    );
  }

  // Get referrals where this user is the referrer
  const { data: referrals, error: referralsError } = await supabase
    .from("referrals")
    .select("id, referred_id, status, points_awarded, created_at")
    .eq("referrer_id", user.id)
    .order("created_at", { ascending: false });

  if (referralsError) {
    console.error("Error fetching referrals:", referralsError);
    return NextResponse.json(
      { error: "Failed to fetch referrals" },
      { status: 500 }
    );
  }

  // Fetch referred user names
  const referredUserIds = (referrals || []).map((r) => r.referred_id);
  let referredUsers: Record<string, string> = {};

  if (referredUserIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", referredUserIds);

    if (users) {
      referredUsers = Object.fromEntries(
        users.map((u) => [u.id, u.full_name || "Unknown"])
      );
    }
  }

  const referralsWithNames = (referrals || []).map((r) => ({
    ...r,
    referred_name: referredUsers[r.referred_id] || "Unknown",
  }));

  return NextResponse.json({
    referral_code: account.referral_code,
    referrals: referralsWithNames,
    total_referrals: referralsWithNames.length,
  });
}

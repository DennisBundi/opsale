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

  const { data: rewardCodes, error } = await supabase
    .from("reward_codes")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_used", false)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching reward codes:", error);
    return NextResponse.json(
      { error: "Failed to fetch reward codes" },
      { status: 500 }
    );
  }

  return NextResponse.json({ reward_codes: rewardCodes || [] });
}

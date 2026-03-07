import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LoyaltyService } from "@/services/loyaltyService";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = await LoyaltyService.getAccount(user.id);

  if (!account) {
    return NextResponse.json(
      { error: "Loyalty account not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: account });
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch user name from users table
  const { data: userData } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const userName = userData?.full_name || user.user_metadata?.full_name || null;

  const account = await LoyaltyService.createAccount(user.id, userName);

  if (!account) {
    return NextResponse.json(
      { error: "Failed to create loyalty account" },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: account }, { status: 201 });
}

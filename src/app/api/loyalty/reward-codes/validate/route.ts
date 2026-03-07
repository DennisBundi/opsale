import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const validateSchema = z.object({
  code: z.string().min(1, "Code is required"),
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
  const parsed = validateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const code = parsed.data.code.trim().toUpperCase();

  // Look up reward code — user can use their own codes or manually entered ones
  const { data: rewardCode, error: codeError } = await supabase
    .from("reward_codes")
    .select("*")
    .eq("code", code)
    .eq("is_used", false)
    .single();

  if (codeError || !rewardCode) {
    return NextResponse.json(
      { error: "Invalid or expired reward code" },
      { status: 404 }
    );
  }

  // Check if the code belongs to this user
  if (rewardCode.user_id !== user.id) {
    return NextResponse.json(
      { error: "This reward code does not belong to your account" },
      { status: 403 }
    );
  }

  // Check expiry
  if (new Date(rewardCode.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "This reward code has expired" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    data: {
      id: rewardCode.id,
      code: rewardCode.code,
      type: rewardCode.type,
      discount_amount: rewardCode.discount_amount || 0,
      discount_percent: rewardCode.discount_percent || null,
      expires_at: rewardCode.expires_at,
    },
  });
}

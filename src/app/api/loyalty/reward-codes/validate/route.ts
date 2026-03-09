import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/rateLimit";

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

  // Rate limit reward code validation
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const key = rateLimitKey("reward-validate", ip, user.id);
  if (!rateLimit(key, RATE_LIMITS.rewardValidate.maxRequests, RATE_LIMITS.rewardValidate.windowMs)) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  const body = await request.json();
  const parsed = validateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }

  const code = parsed.data.code.trim().toUpperCase();

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

  if (rewardCode.user_id !== user.id) {
    return NextResponse.json(
      { error: "This reward code does not belong to your account" },
      { status: 403 }
    );
  }

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

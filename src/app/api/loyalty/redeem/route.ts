import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { LoyaltyService } from "@/services/loyaltyService";

const redeemSchema = z.object({
  points: z.number().refine((val) => [500, 1000, 2000].includes(val), {
    message: "Points must be 500, 1000, or 2000",
  }),
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
  const parsed = redeemSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await LoyaltyService.redeemPoints(user.id, parsed.data.points);

  if (!result) {
    return NextResponse.json(
      { error: "Insufficient points or redemption failed" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    message: "Points redeemed successfully",
    code: result.code,
    discount_amount: result.discount_amount,
    expires_at: result.expires_at,
  });
}

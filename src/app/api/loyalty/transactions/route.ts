import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LoyaltyService, TransactionType } from "@/services/loyaltyService";

const VALID_TYPES: TransactionType[] = [
  "purchase",
  "referral",
  "review",
  "redemption",
  "birthday",
  "adjustment",
];

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as TransactionType | null;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

  if (type && !VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { error: "Invalid transaction type" },
      { status: 400 }
    );
  }

  const result = await LoyaltyService.getTransactionHistory(user.id, {
    type: type || undefined,
    page,
    limit,
  });

  return NextResponse.json({
    transactions: result.transactions,
    total: result.total,
    page,
    limit,
    total_pages: Math.ceil(result.total / limit),
  });
}

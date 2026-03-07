import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const birthdaySchema = z.object({
  birthday: z.string().refine(
    (val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: "Invalid date format" }
  ),
});

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = birthdaySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Check account exists
  const { data: account } = await supabase
    .from("loyalty_accounts")
    .select("id, birthday_locked")
    .eq("user_id", user.id)
    .single();

  if (!account) {
    return NextResponse.json(
      { error: "Loyalty account not found" },
      { status: 404 }
    );
  }

  if (account.birthday_locked) {
    return NextResponse.json(
      { error: "Birthday has already been set and cannot be changed" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { error: updateError } = await admin
    .from("loyalty_accounts")
    .update({
      birthday: parsed.data.birthday,
      birthday_locked: true,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (updateError) {
    console.error("Error updating birthday:", updateError);
    return NextResponse.json(
      { error: "Failed to update birthday" },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "Birthday set successfully" });
}

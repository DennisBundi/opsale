import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createClientServer } from "@/lib/supabase/server";
import { rateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/rateLimit";
import { safeErrorResponse } from "@/lib/security/errorResponse";
import { randomUUID } from "crypto";

// Magic bytes for allowed image types
const MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/jpg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF header
};

function validateMagicBytes(buffer: Buffer, claimedType: string): boolean {
  const expected = MAGIC_BYTES[claimedType];
  if (!expected) return false;

  return expected.some((magic) =>
    magic.every((byte, i) => buffer[i] === byte)
  );
}

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const key = rateLimitKey("upload", ip, user.id);
    if (!rateLimit(key, RATE_LIMITS.fileUpload.maxRequests, RATE_LIMITS.fileUpload.windowMs)) {
      return NextResponse.json(
        { error: "Too many uploads. Please try again later." },
        { status: 429 }
      );
    }

    // Verify user is an employee (admin, manager, or seller)
    const { data: employee } = await supabase
      .from("employees")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!employee) {
      return NextResponse.json(
        { error: "Only employees can upload images" },
        { status: 403 }
      );
    }

    // Get the form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WEBP are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit." },
        { status: 400 }
      );
    }

    // Convert File to Buffer for upload and validation
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate magic bytes match claimed MIME type
    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { error: "File content does not match claimed type." },
        { status: 400 }
      );
    }

    // Generate unique filename using crypto
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
    if (!fileExt || !ALLOWED_EXTENSIONS.includes(fileExt)) {
      return NextResponse.json(
        { error: "Invalid file extension" },
        { status: 400 }
      );
    }
    const fileName = `${randomUUID()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    // Use admin client to bypass RLS
    const adminClient = createAdminClient();
    const { data, error } = await adminClient.storage
      .from("product-images")
      .upload(filePath, buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      return safeErrorResponse("Failed to upload image", error);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = adminClient.storage.from("product-images").getPublicUrl(filePath);

    return NextResponse.json({
      url: publicUrl,
      path: filePath,
    });
  } catch (error) {
    return safeErrorResponse("Failed to upload image", error);
  }
}

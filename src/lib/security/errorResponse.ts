import { NextResponse } from 'next/server';

/**
 * Returns a safe error response.
 * In production, only generic messages are returned to the client.
 * In development, the full error detail is included.
 */
export function safeErrorResponse(
  genericMessage: string,
  detail: unknown,
  status: number = 500
): NextResponse {
  const isDev = process.env.NODE_ENV === 'development';

  const body: Record<string, unknown> = {
    error: genericMessage,
  };

  if (isDev && detail) {
    body.details = detail instanceof Error ? detail.message : String(detail);
  }

  return NextResponse.json(body, { status });
}

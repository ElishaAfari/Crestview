import "server-only";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

type AuthRateLimitInput = {
  action:
    | "login"
    | "password_reset"
    | "parent_access"
    | "staff_invite"
    | "access_resend";
  identifier: string;
  limit: number;
  windowMs: number;
};

function rateLimitSecret() {
  return (
    process.env.AUTH_RATE_LIMIT_SECRET ??
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

async function requestAddress() {
  const requestHeaders = await headers();
  return (
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    requestHeaders.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Counts a request against a privacy-preserving, server-side bucket. The raw
 * email, ID, password, and IP address are never retained in the database.
 */
export async function consumeAuthRateLimit({
  action,
  identifier,
  limit,
  windowMs,
}: AuthRateLimitInput) {
  const secret = rateLimitSecret();
  if (!secret)
    throw new Error("Authentication rate limiting is not configured.");

  const now = Date.now();
  const windowStart = new Date(
    Math.floor(now / windowMs) * windowMs,
  ).toISOString();
  const subject = `${action}:${(await requestAddress()).toLowerCase()}:${identifier.trim().toLowerCase()}`;
  const subjectHash = createHmac("sha256", secret)
    .update(subject)
    .digest("hex");
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("consume_auth_rate_limit", {
    p_subject_hash: subjectHash,
    p_action: action,
    p_window_start: windowStart,
    p_limit: limit,
  });
  if (error) throw new Error("Authentication rate limit check failed.");
  return data === true;
}

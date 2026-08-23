import { createClient } from "@/lib/supabase/server";

function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}

export function hasValidCronSecret(request: Request): boolean {
  const configuredSecret = process.env.CRON_SECRET;
  if (!configuredSecret) return false;
  return getBearerToken(request) === configuredSecret;
}

export async function isAuthenticatedUser(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    return !error && Boolean(data.user);
  } catch {
    return false;
  }
}

export async function canRunManualOperation(request: Request): Promise<boolean> {
  return hasValidCronSecret(request) || isAuthenticatedUser();
}

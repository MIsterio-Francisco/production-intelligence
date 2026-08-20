import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { Database } from "../../types/database.types";

export async function createClient() {
  try {
    const cookieStore = await cookies();

    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          fetch: (url: string | URL | Request, options?: RequestInit) => {
            return fetch(url, {
              ...options,
              signal: AbortSignal.timeout(700),
            });
          },
        },
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore cookie set errors in server components
            }
          },
        },
      }
    );
  } catch {
    // Outside request scope (CLI/script contexts)
    return createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mock.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "mock-key"
    );
  }
}

export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

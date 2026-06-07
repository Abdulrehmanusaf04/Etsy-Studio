import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { AUTHORIZED_EMAIL } from "@/shared/lib/auth-guard";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ═══════════════════════════════════════════
  // SINGLE-USER ENFORCEMENT (server-side gate)
  // ═══════════════════════════════════════════
  // If a user IS logged in but is NOT the authorized user, sign them out
  // and redirect to login with an error. This catches Google OAuth logins
  // or any bypass of the client-side check.
  if (user && user.email?.toLowerCase().trim() !== AUTHORIZED_EMAIL.toLowerCase()) {
    // Sign out the unauthorized user
    await supabase.auth.signOut();

    // Log the unauthorized access attempt
    console.warn("🚨 UNAUTHORIZED USER SIGNED IN — FORCED SIGN OUT:", {
      email: user.email,
      id: user.id,
      time: new Date().toISOString(),
    });

    // Fire the alert API (best-effort, non-blocking)
    try {
      const alertUrl = new URL("/api/auth-alert", request.nextUrl.origin);
      fetch(alertUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          method: "session_hijack_or_oauth",
          ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        }),
      }).catch(() => { /* best-effort */ });
    } catch {
      // ignore
    }

    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("error", "unauthorized");
    return NextResponse.redirect(url);
  }

  // Protected routes - redirect to login if not authenticated
  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    !request.nextUrl.pathname.startsWith("/api") &&
    request.nextUrl.pathname !== "/"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // If user is logged in and tries to access auth pages, redirect to dashboard
  if (user && request.nextUrl.pathname.startsWith("/auth")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

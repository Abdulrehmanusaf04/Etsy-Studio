import { NextResponse } from "next/server";
import { AUTHORIZED_EMAIL, ALERT_EMAIL, buildUnauthorizedAlert } from "@/shared/lib/auth-guard";

export async function POST(request: Request) {
  try {
    const { email, method, ip } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    // Don't alert for the authorized user
    if (email.toLowerCase().trim() === AUTHORIZED_EMAIL.toLowerCase()) {
      return NextResponse.json({ ok: true, alerted: false });
    }

    const alert = buildUnauthorizedAlert(email, method || "unknown", ip);

    // Log to server console so we always have a record
    console.warn("🚨 UNAUTHORIZED LOGIN ATTEMPT:", {
      email,
      method,
      ip,
      time: new Date().toISOString(),
    });

    // Send email alert via Supabase Edge Function or a simple fetch to a mail API
    // For now, we use Supabase's built-in email (via the admin API) or log it.
    // If you have a mail service (e.g., Resend, SendGrid), integrate here.
    // For now we store the alert in Supabase as well.
    const { createClient } = await import("@/shared/lib/supabase/server");
    const supabase = await createClient();

    // Try to insert an alert record into a simple table (create if needed)
    await supabase.from("unauthorized_attempts").insert({
      email,
      method: method || "unknown",
      ip: ip || "unknown",
      alert_sent_to: ALERT_EMAIL,
      alert_subject: alert.subject,
      alert_body: alert.body,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, alerted: true, alertEmail: ALERT_EMAIL });
  } catch (err) {
    console.error("Auth alert error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

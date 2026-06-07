/**
 * Single-user authentication guard.
 * Only the approved user (aryousaf04@gmail.com) is permitted to use this app.
 * Unauthorized login attempts are logged and optionally reported via email.
 */

// The single authorized user
export const AUTHORIZED_EMAIL = "aryousaf04@gmail.com";
export const AUTHORIZED_NAME = "A.Rehman";
export const ALERT_EMAIL = "aryousaf04@gmail.com";

/**
 * Check if the given email is the authorized user.
 */
export function isAuthorizedUser(email: string | undefined | null): boolean {
  if (!email) return false;
  return email.toLowerCase().trim() === AUTHORIZED_EMAIL.toLowerCase();
}

/**
 * Build an unauthorized access alert payload.
 */
export function buildUnauthorizedAlert(email: string, method: string, ip?: string) {
  return {
    subject: `🚨 Unauthorized Login Attempt — Etsy Studio`,
    body: `
An unauthorized login attempt was detected on your Etsy Studio app.

Details:
- Email: ${email}
- Method: ${method}
- Time: ${new Date().toISOString()}
- IP: ${ip || "unknown"}

This person was blocked from accessing the app. No action is required unless you recognize this activity.
    `.trim(),
  };
}

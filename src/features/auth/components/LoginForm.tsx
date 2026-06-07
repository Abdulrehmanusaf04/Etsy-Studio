"use client";

import { useState } from "react";
import { createClient } from "@/shared/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Sparkles, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { isAuthorizedUser, AUTHORIZED_EMAIL } from "@/shared/lib/auth-guard";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const sendUnauthorizedAlert = async (attemptEmail: string, method: string) => {
    try {
      await fetch("/api/auth-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: attemptEmail, method }),
      });
    } catch {
      // Silently fail — alert is best-effort
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Gate: only allow the authorized email
    if (!isAuthorizedUser(email)) {
      setError("Access denied. This app is restricted to authorized users only.");
      await sendUnauthorizedAlert(email, "email_password");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  // Google OAuth is removed — single-user restriction cannot reliably pre-validate Google accounts client-side
  // If you want Google login for your account, we handle it in middleware post-login

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 via-background to-background p-4 relative">
      {/* Theme toggle in corner */}
      <div className="fixed top-4 right-4 z-50"><ThemeToggle /></div>

      <Card className="w-full max-w-md bg-card border-border shadow-xl shadow-primary/5">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-violet-600 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-card-foreground">Welcome Back</CardTitle>
            <CardDescription className="mt-1">Sign in to your Etsy Studio account</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 text-white font-medium h-11 shadow-lg shadow-violet-500/20 cursor-pointer">
              {loading ? <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</div> : "Sign In"}
            </Button>
          </form>
          <div className="mt-6 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs text-center">
            <ShieldAlert className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
            This app is restricted to authorized personnel only.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

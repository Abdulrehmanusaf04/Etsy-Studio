"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Sparkles, ShieldAlert } from "lucide-react";
import { ThemeToggle } from "@/shared/components/theme-toggle";

export function SignupForm() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 via-background to-background p-4 relative">
      <div className="fixed top-4 right-4 z-50"><ThemeToggle /></div>

      <Card className="w-full max-w-md bg-card border-border shadow-xl shadow-primary/5">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-card-foreground">Registration Closed</CardTitle>
            <CardDescription className="mt-1">New account registration is not available</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-sm">
            <ShieldAlert className="w-4 h-4 inline mr-2 -mt-0.5" />
            This application is restricted to authorized users only. New registrations are currently disabled.
          </div>
          <p className="text-muted-foreground text-sm">
            If you believe you should have access, please contact the administrator.
          </p>
          <Link href="/auth/login">
            <Button variant="outline" className="w-full cursor-pointer">
              <Sparkles className="w-4 h-4 mr-2" />
              Go to Sign In
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/shared/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Settings, Save, User, Store } from "lucide-react";
import type { Profile } from "@/shared/types/global.types";

export function SettingsView() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [shopName, setShopName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) {
        setProfile(data);
        setFullName(data.full_name || "");
        setShopName(data.shop_name || "");
      }
    };
    fetchProfile();
  }, [supabase]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    await supabase.from("profiles").update({ full_name: fullName, shop_name: shopName }).eq("id", profile.id);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Settings className="w-8 h-8 text-violet-600" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage your profile and account</p>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader><CardTitle className="text-foreground text-lg flex items-center gap-2"><User className="w-5 h-5 text-violet-500" />Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground/90">Email</Label>
            <Input value={profile?.email || ""} disabled className="bg-muted border-border text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/90">Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className="bg-card border-border text-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader><CardTitle className="text-foreground text-lg flex items-center gap-2"><Store className="w-5 h-5 text-amber-500" />Etsy Shop</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground/90">Shop Name</Label>
            <Input value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="Your Etsy shop name" className="bg-card border-border text-foreground" />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-lg shadow-violet-200 gap-2 cursor-pointer">
        {saving ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
          : saved ? <><Save className="w-5 h-5" />Saved!</>
          : <><Save className="w-5 h-5" />Save Changes</>}
      </Button>
    </div>
  );
}

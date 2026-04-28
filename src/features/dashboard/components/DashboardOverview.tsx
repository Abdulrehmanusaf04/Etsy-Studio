"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/shared/lib/supabase/client";
import { Card, CardContent } from "@/shared/components/ui/card";
import Link from "next/link";
import { LayoutDashboard, Wand2, Zap, Images, BookOpen, Layers, TrendingUp, Sparkles } from "lucide-react";
import type { Generation } from "@/shared/types/global.types";

export function DashboardOverview() {
  const [stats, setStats] = useState({ total: 0, completed: 0, mockups: 0, presets: 0 });
  const [recent, setRecent] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const [genRes, mockupRes, presetRes] = await Promise.all([
        supabase.from("generations").select("*", { count: "exact" }).order("created_at", { ascending: false }).limit(5),
        supabase.from("mockup_sets").select("*", { count: "exact" }),
        supabase.from("presets").select("*", { count: "exact" }),
      ]);
      const gens = genRes.data || [];
      setStats({
        total: genRes.count || 0,
        completed: gens.filter((g) => g.status === "completed").length,
        mockups: mockupRes.count || 0,
        presets: presetRes.count || 0,
      });
      setRecent(gens.slice(0, 5));
      setLoading(false);
    };
    fetchData();
  }, [supabase]);

  const quickActions = [
    { href: "/dashboard/create", label: "Manual Create", icon: Wand2, desc: "Write a prompt and generate", color: "bg-violet-500/10 text-violet-500 dark:bg-violet-500/20 dark:text-violet-400" },
    { href: "/dashboard/auto-generate", label: "Auto Generate", icon: Zap, desc: "One-click preset generation", color: "bg-fuchsia-500/10 text-fuchsia-500 dark:bg-fuchsia-500/20 dark:text-fuchsia-400" },
    { href: "/dashboard/mockups", label: "Generate Mockups", icon: Images, desc: "8-10 matching mockups", color: "bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400" },
    { href: "/dashboard/presets", label: "Manage Presets", icon: Layers, desc: "Reusable style directions", color: "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <LayoutDashboard className="w-8 h-8 text-primary" />
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">Your Etsy design studio overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Generations", value: stats.total, icon: TrendingUp, color: "text-violet-500" },
          { label: "Completed", value: stats.completed, icon: Sparkles, color: "text-emerald-500" },
          { label: "Mockup Sets", value: stats.mockups, icon: Images, color: "text-fuchsia-500" },
          { label: "Saved Presets", value: stats.presets, icon: Layers, color: "text-amber-500" },
        ].map((s, i) => (
          <Card key={i} className="bg-card border-border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-3xl font-bold text-card-foreground mt-1">{loading ? "–" : s.value}</p>
                </div>
                <s.icon className={`w-8 h-8 ${s.color} opacity-50`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((a, i) => (
            <Link key={i} href={a.href}>
              <Card className="bg-card border-border shadow-sm hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 cursor-pointer group">
                <CardContent className="p-5">
                  <div className={`w-10 h-10 rounded-xl ${a.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <a.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-card-foreground text-sm">{a.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{a.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Recent Generations</h2>
          <Link href="/dashboard/library" className="text-sm text-primary hover:text-primary/80 font-medium">View All →</Link>
        </div>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : recent.length === 0 ? (
          <Card className="bg-card border-border"><CardContent className="p-8 text-center">
            <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No generations yet. Start creating!</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-2">
            {recent.map((gen) => (
              <Link key={gen.id} href={`/dashboard/library/${gen.id}`}>
                <Card className="bg-card border-border shadow-sm hover:border-primary/30 transition-all cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-4">
                    {gen.thumbnail_url ? (
                      <img src={gen.thumbnail_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                        <Images className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">{gen.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(gen.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {gen.source_type}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      gen.status === "completed" ? "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400" :
                      gen.status === "failed" ? "bg-red-500/10 text-red-500 dark:bg-red-500/20 dark:text-red-400" :
                      "bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400"
                    }`}>{gen.status}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

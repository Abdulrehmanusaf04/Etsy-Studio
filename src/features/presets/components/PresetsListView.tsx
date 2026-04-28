"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/shared/lib/supabase/client";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Layers, Plus, Pencil, Trash2 } from "lucide-react";
import type { Preset } from "@/shared/types/global.types";
import Link from "next/link";

export function PresetsListView() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchPresets = async () => {
      const { data } = await supabase.from("presets").select("*, category:categories(*)").order("created_at", { ascending: false });
      setPresets(data || []);
      setLoading(false);
    };
    fetchPresets();
  }, [supabase]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this preset?")) return;
    await supabase.from("presets").delete().eq("id", id);
    setPresets((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3"><Layers className="w-8 h-8 text-violet-600" />Presets</h1>
          <p className="text-muted-foreground mt-1">Manage reusable creative directions for your designs</p>
        </div>
        <Link href="/dashboard/presets/new">
          <Button className="bg-violet-600 hover:bg-violet-700 text-white gap-2 cursor-pointer"><Plus className="w-4 h-4" />New Preset</Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : presets.length === 0 ? (
        <Card className="bg-card border-border"><CardContent className="p-12 text-center">
          <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No presets yet. Create your first preset to save a reusable style direction.</p>
          <Link href="/dashboard/presets/new"><Button className="bg-violet-600 hover:bg-violet-700 text-white gap-2 cursor-pointer"><Plus className="w-4 h-4" />Create Preset</Button></Link>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {presets.map((preset) => (
            <Card key={preset.id} className="bg-card border-border shadow-sm hover:border-violet-200 dark:border-violet-500/20 transition-all">
              <CardContent className="p-5 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{preset.name}</h3>
                    {preset.category && <Badge variant="outline" className="border-violet-200 dark:border-violet-500/20 text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 text-xs">{preset.category.icon} {preset.category.name}</Badge>}
                  </div>
                  {preset.short_description && <p className="text-sm text-muted-foreground mb-2">{preset.short_description}</p>}
                  {preset.style_tags_json?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">{preset.style_tags_json.map((tag, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{tag}</span>
                    ))}</div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">{new Date(preset.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/dashboard/presets/${preset.id}`}>
                    <Button variant="outline" size="icon" className="border-border cursor-pointer"><Pencil className="w-4 h-4 text-muted-foreground" /></Button>
                  </Link>
                  <Button variant="outline" size="icon" onClick={() => handleDelete(preset.id)} className="border-red-200 dark:border-red-500/20 text-red-500 hover:bg-red-50 dark:bg-red-500/10 cursor-pointer"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

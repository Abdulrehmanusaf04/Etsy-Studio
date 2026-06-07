"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/shared/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Progress } from "@/shared/components/ui/progress";
import { Zap, Sparkles, CheckCircle2, AlertCircle, Layers, ArrowRight } from "lucide-react";
import type { Category, Preset, Generation } from "@/shared/types/global.types";
import Link from "next/link";

export function AutoGenerateView() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [presetId, setPresetId] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [result, setResult] = useState<Generation | null>(null);
  const [error, setError] = useState("");
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const [catRes, presetRes] = await Promise.all([
        supabase.from("categories").select("*").eq("is_active", true).order("name"),
        supabase.from("presets").select("*").order("name"),
      ]);
      setCategories(catRes.data || []);
      setPresets(presetRes.data || []);
    };
    fetchData();
  }, [supabase]);

  const handleGenerate = async () => {
    setLoading(true); setError(""); setResult(null); setProgress(0);
    const stages = [
      { pct: 15, text: "Preparing preset-based generation..." },
      { pct: 35, text: "AI generating template with text..." },
      { pct: 60, text: "AI generating template without text..." },
      { pct: 80, text: "Creating Etsy listing..." },
      { pct: 95, text: "Saving to library..." },
    ];
    let si = 0;
    const iv = setInterval(() => { if (si < stages.length) { setProgress(stages[si].pct); setProgressText(stages[si].text); si++; } }, 4000);

    try {
      const res = await fetch("/api/auto-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_id: categoryId, preset_id: presetId }),
      });
      clearInterval(iv);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Auto generation failed");
      setProgress(100); setProgressText("Complete!"); setResult(data.generation);
    } catch (err) { clearInterval(iv); setError(err instanceof Error ? err.message : "An error occurred"); setProgress(0); }
    finally { setLoading(false); }
  };

  const selectedPreset = presets.find(p => p.id === presetId);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-fuchsia-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md shadow-fuchsia-200">
            <Zap className="w-5 h-5 text-white" />
          </div>
          Auto Generate
        </h1>
        <p className="text-muted-foreground mt-2">One-click generation — no prompt needed. Uses your preset&apos;s creative direction.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings */}
        <div className="space-y-6">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader><CardTitle className="text-foreground text-lg flex items-center gap-2"><Layers className="w-5 h-5 text-fuchsia-500" />Generation Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground/90">Preset *</Label>
                <Select value={presetId} onValueChange={(v) => v && setPresetId(v)}>
                  <SelectTrigger className="bg-card border-border text-foreground">
                    <SelectValue placeholder="Select a preset">
                      {presetId ? (presets.find(x => x.id === presetId) ? presets.find(x => x.id === presetId)?.name : presetId) : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {presets.length === 0 ? (
                      <div className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">No presets yet</p>
                        <Link href="/dashboard/presets/new" className="text-sm text-violet-600 font-medium mt-1 block">Create one →</Link>
                      </div>
                    ) : presets.map((p) => (
                      <SelectItem key={p.id} value={p.id} label={p.name} className="text-foreground/90">{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground/90">Category *</Label>
                <Select value={categoryId} onValueChange={(v) => v && setCategoryId(v)}>
                  <SelectTrigger className="bg-card border-border text-foreground">
                    <SelectValue placeholder="Select a category">
                      {categoryId ? (categories.find(c => c.id === categoryId) ? `${categories.find(c => c.id === categoryId)?.icon || ""} ${categories.find(c => c.id === categoryId)?.name}`.trim() : categoryId) : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">{categories.map((c) => (
                    <SelectItem key={c.id} value={c.id} label={`${c.icon || ""} ${c.name}`.trim()} className="text-foreground/90">{c.icon} {c.name}</SelectItem>
                  ))}</SelectContent>
                </Select>
              </div>
              {selectedPreset && (
                <div className="p-3 rounded-lg bg-fuchsia-50 border border-fuchsia-100">
                  <p className="text-xs text-fuchsia-700 font-medium">Preset: {selectedPreset.name}</p>
                  {selectedPreset.short_description && <p className="text-xs text-fuchsia-600 mt-1">{selectedPreset.short_description}</p>}
                </div>
              )}
              <div className="p-3 rounded-lg bg-muted border border-border">
                <p className="text-xs text-muted-foreground"><strong>Aspect Ratio:</strong> 14:11 · <strong>No prompt needed</strong></p>
              </div>
            </CardContent>
          </Card>
          <Button onClick={handleGenerate} disabled={loading || !presetId || !categoryId} className="w-full h-12 bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-600 hover:to-pink-600 text-white font-semibold shadow-lg shadow-fuchsia-200 gap-2 cursor-pointer">
            {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating...</> : <><Zap className="w-5 h-5" />Auto Generate</>}
          </Button>
        </div>

        {/* Result */}
        <div className="space-y-6">
          {loading && (
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{progressText}</span>
                  <span className="text-sm text-fuchsia-600 font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex items-center gap-3 p-4 rounded-xl bg-fuchsia-50 border border-fuchsia-100">
                  <Sparkles className="w-4 h-4 text-fuchsia-500 animate-pulse" />
                  <p className="text-sm text-foreground/90">AI is generating from preset...</p>
                </div>
              </CardContent>
            </Card>
          )}
          {error && (
            <Card className="bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20"><CardContent className="p-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-red-700 dark:text-red-400 font-medium">Generation Failed</p>
                <p className="text-red-600/80 text-sm mt-1">{error}</p>
                <Button onClick={() => { setError(""); setProgress(0); }} variant="outline" className="mt-3 border-red-200 dark:border-red-500/20 text-red-600 cursor-pointer">Try Again</Button>
              </div>
            </CardContent></Card>
          )}
          {result && (
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-6 text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="text-lg font-semibold text-foreground">Generation Complete!</h3>
                <p className="text-muted-foreground text-sm">{result.title}</p>
                {result.thumbnail_url && <img src={result.thumbnail_url} alt="" className="w-full rounded-xl border border-border mt-4" />}
                <div className="flex gap-3 justify-center mt-4">
                  <Link href={`/dashboard/library/${result.id}`}>
                    <Button className="bg-violet-600 hover:bg-violet-700 text-white gap-2 cursor-pointer"><ArrowRight className="w-4 h-4" />View in Library</Button>
                  </Link>
                  <Link href="/dashboard/mockups">
                    <Button variant="outline" className="border-border gap-2 cursor-pointer">Generate Mockups</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
          {!loading && !result && !error && (
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-fuchsia-50 to-pink-50 rounded-2xl flex items-center justify-center mb-6">
                  <Zap className="w-10 h-10 text-fuchsia-300" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">One-Click Generation</h3>
                <p className="text-muted-foreground max-w-sm mx-auto text-sm">Select a preset and category. AI will handle the rest — no prompt needed.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

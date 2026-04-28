"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/shared/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Label } from "@/shared/components/ui/label";
import { Progress } from "@/shared/components/ui/progress";
import { Images, Sparkles, CheckCircle2, AlertCircle, Download, ImageIcon } from "lucide-react";
import type { Generation, MockupSet } from "@/shared/types/global.types";

export function MockupsGeneratorView() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [selectedGenId, setSelectedGenId] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [mockupResult, setMockupResult] = useState<MockupSet | null>(null);
  const [error, setError] = useState("");
  const supabase = createClient();

  useEffect(() => {
    const fetchGenerations = async () => {
      const { data } = await supabase
        .from("generations")
        .select("*, category:categories(*)")
        .eq("status", "completed")
        .order("created_at", { ascending: false });
      setGenerations(data || []);
    };
    fetchGenerations();
  }, [supabase]);

  const selectedGen = generations.find(g => g.id === selectedGenId);

  const handleGenerateMockups = async () => {
    if (!selectedGen) return;
    setLoading(true); setError(""); setMockupResult(null); setProgress(0);

    const stages = Array.from({ length: 8 }, (_, i) => ({
      pct: Math.round(((i + 1) / 8) * 90),
      text: `Generating mockup ${i + 1} of 8...`,
    }));
    let si = 0;
    const iv = setInterval(() => { if (si < stages.length) { setProgress(stages[si].pct); setProgressText(stages[si].text); si++; } }, 5000);

    try {
      const res = await fetch("/api/mockups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generation_id: selectedGen.id,
          template_url: selectedGen.image_with_text_url,
          category_name: selectedGen.category?.name || "",
          template_description: selectedGen.refined_prompt || selectedGen.prompt,
        }),
      });
      clearInterval(iv);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Mockup generation failed");
      setProgress(100); setProgressText("All mockups generated!"); setMockupResult(data.mockup_set);
    } catch (err) { clearInterval(iv); setError(err instanceof Error ? err.message : "An error occurred"); setProgress(0); }
    finally { setLoading(false); }
  };

  const handleDownload = async (url: string, filename: string) => {
    const r = await fetch(url); const b = await r.blob();
    const l = document.createElement("a"); l.href = URL.createObjectURL(b); l.download = filename; l.click(); URL.revokeObjectURL(l.href);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-amber-200">
            <Images className="w-5 h-5 text-white" />
          </div>
          Mockup Generator
        </h1>
        <p className="text-muted-foreground mt-2">Generate 8-10 Etsy-ready mockups that perfectly match your template</p>
      </div>

      {/* Selection */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader><CardTitle className="text-foreground text-lg">Select a Template</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground/90">Completed Generation *</Label>
            <Select value={selectedGenId} onValueChange={(v) => v && setSelectedGenId(v)}>
              <SelectTrigger className="bg-card border-border text-foreground"><SelectValue placeholder="Choose a completed template" /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                {generations.length === 0 ? <p className="p-3 text-sm text-muted-foreground">No completed generations yet</p> :
                  generations.map((g) => <SelectItem key={g.id} value={g.id} className="text-foreground/90">{g.category?.icon} {g.title}</SelectItem>)
                }
              </SelectContent>
            </Select>
          </div>
          {selectedGen && (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted border border-border">
              {selectedGen.thumbnail_url ? (
                <img src={selectedGen.thumbnail_url} alt="" className="w-20 h-20 rounded-lg object-cover border border-border" />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center"><ImageIcon className="w-8 h-8 text-muted-foreground" /></div>
              )}
              <div>
                <p className="font-medium text-foreground">{selectedGen.title}</p>
                <p className="text-sm text-muted-foreground">{selectedGen.category?.name} · {selectedGen.source_type}</p>
              </div>
            </div>
          )}
          <Button onClick={handleGenerateMockups} disabled={loading || !selectedGenId} className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-amber-200 gap-2 cursor-pointer">
            {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating Mockups...</> : <><Images className="w-5 h-5" />Generate 8 Mockups</>}
          </Button>
        </CardContent>
      </Card>

      {/* Progress */}
      {loading && (
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{progressText}</span>
              <span className="text-sm text-amber-600 font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <div>
                <p className="text-sm text-foreground font-medium">Creating consistent mockups</p>
                <p className="text-xs text-muted-foreground">Each mockup maintains exact design fidelity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20"><CardContent className="p-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-red-700 dark:text-red-400 font-medium">Mockup Generation Failed</p>
            <p className="text-red-600/80 text-sm mt-1">{error}</p>
            <Button onClick={() => { setError(""); setProgress(0); }} variant="outline" className="mt-3 border-red-200 dark:border-red-500/20 text-red-600 cursor-pointer">Retry</Button>
          </div>
        </CardContent></Card>
      )}

      {/* Results Grid */}
      {mockupResult && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">{mockupResult.mockup_count} Mockups Generated!</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {mockupResult.mockup_assets_json.map((mockup, i) => (
              <Card key={i} className="bg-card border-border shadow-sm overflow-hidden group">
                <CardContent className="p-0">
                  <div className="relative">
                    <img src={mockup.url} alt={mockup.description} className="w-full aspect-[14/11] object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button onClick={() => handleDownload(mockup.url, mockup.file_name)} className="bg-card/90 text-foreground hover:bg-card gap-2 text-xs cursor-pointer">
                        <Download className="w-3 h-3" />Download
                      </Button>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-muted-foreground">Mockup {i + 1}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/shared/lib/supabase/client";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { BookOpen, Images, Filter, ImageIcon } from "lucide-react";
import type { Generation, Category } from "@/shared/types/global.types";
import Link from "next/link";

export function LibraryListView() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const [genRes, catRes] = await Promise.all([
        supabase.from("generations").select("*, category:categories(*)").order("created_at", { ascending: false }),
        supabase.from("categories").select("*").eq("is_active", true).order("name"),
      ]);
      setGenerations(genRes.data || []);
      setCategories(catRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, [supabase]);

  const filtered = generations.filter((g) => {
    if (filterCat !== "all" && g.category_id !== filterCat) return false;
    if (filterStatus !== "all" && g.status !== filterStatus) return false;
    if (filterSource !== "all" && g.source_type !== filterSource) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3"><BookOpen className="w-8 h-8 text-violet-600" />Library</h1>
          <p className="text-muted-foreground mt-1">Browse and manage all your generated assets</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={filterCat} onValueChange={(v) => v && setFilterCat(v)}>
            <SelectTrigger className="w-44 bg-card border-border text-foreground"><Filter className="w-4 h-4 mr-2 text-muted-foreground" /><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent className="bg-card border-border"><SelectItem value="all" className="text-foreground/90">All Categories</SelectItem>{categories.map((c) => (<SelectItem key={c.id} value={c.id} className="text-foreground/90">{c.icon} {c.name}</SelectItem>))}</SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(v) => v && setFilterStatus(v)}>
            <SelectTrigger className="w-36 bg-card border-border text-foreground"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent className="bg-card border-border"><SelectItem value="all" className="text-foreground/90">All Status</SelectItem><SelectItem value="completed" className="text-foreground/90">Completed</SelectItem><SelectItem value="processing" className="text-foreground/90">Processing</SelectItem><SelectItem value="failed" className="text-foreground/90">Failed</SelectItem></SelectContent>
          </Select>
          <Select value={filterSource} onValueChange={(v) => v && setFilterSource(v)}>
            <SelectTrigger className="w-36 bg-card border-border text-foreground"><SelectValue placeholder="Source" /></SelectTrigger>
            <SelectContent className="bg-card border-border"><SelectItem value="all" className="text-foreground/90">All Sources</SelectItem><SelectItem value="manual" className="text-foreground/90">Manual</SelectItem><SelectItem value="auto" className="text-foreground/90">Auto</SelectItem></SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3,4,5,6].map((i) => (
          <Card key={i} className="bg-card border-border"><CardContent className="p-0"><Skeleton className="h-48 w-full bg-muted rounded-t-lg" /><div className="p-4 space-y-2"><Skeleton className="h-4 w-3/4 bg-muted" /><Skeleton className="h-3 w-1/2 bg-muted" /></div></CardContent></Card>
        ))}</div>
      ) : filtered.length === 0 ? (
        <Card className="bg-card border-border"><CardContent className="p-12 text-center">
          <Images className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-muted-foreground">No generations found</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((gen) => (
            <Link key={gen.id} href={`/dashboard/library/${gen.id}`}>
              <Card className="bg-card border-border shadow-sm overflow-hidden group hover:border-violet-200 dark:border-violet-500/20 hover:shadow-md hover:shadow-violet-50 transition-all duration-300 cursor-pointer">
                <CardContent className="p-0">
                  {gen.thumbnail_url ? (
                    <div className="relative h-48 overflow-hidden">
                      <img src={gen.thumbnail_url} alt={gen.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                        <span className="text-xs px-2 py-1 rounded-full bg-card/90 text-foreground/90 font-medium backdrop-blur">{gen.category?.name}</span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium backdrop-blur ${
                          gen.status === "completed" ? "bg-emerald-50 dark:bg-emerald-500/10/90 text-emerald-700 dark:text-emerald-400" : gen.status === "failed" ? "bg-red-50 dark:bg-red-500/10/90 text-red-700 dark:text-red-400" : "bg-amber-50 dark:bg-amber-500/10/90 text-amber-700 dark:text-amber-400"
                        }`}>{gen.status}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 bg-muted flex items-center justify-center"><ImageIcon className="w-10 h-10 text-gray-300" /></div>
                  )}
                  <div className="p-4">
                    <p className="font-medium text-foreground truncate text-sm">{gen.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(gen.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · {gen.source_type}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

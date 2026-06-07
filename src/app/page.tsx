"use client";

import Link from "next/link";
import { Sparkles, Wand2, Images, FileText, ArrowRight, Zap, Palette } from "lucide-react";
import { APPROVED_CATEGORIES } from "@/shared/lib/constants";
import { ThemeToggle } from "@/shared/components/theme-toggle";

const CATEGORY_ICONS: Record<string, string> = {
  "Birthday Invitations": "🎂",
  "Wedding Invitations": "💒",
  "Baby Shower Invitations": "👶",
  "Bridal Shower Invitations": "💐",
  "Valentine's Day Cards": "❤️",
  "Gender Reveal Invitations": "🎀",
  "Greeting Cards": "💌",
  "Christmas": "🎄",
  "Halloween": "🎃",
  "Special Occasions": "🎆",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-md shadow-violet-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-foreground">Etsy Studio</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/auth/login" className="text-sm bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 text-white px-5 py-2.5 rounded-lg font-semibold transition-all shadow-md shadow-violet-500/20 hover:shadow-violet-500/30">Sign In</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 via-fuchsia-500/3 to-transparent dark:from-violet-500/10 dark:via-fuchsia-500/5 dark:to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <Zap className="w-4 h-4" />
            <span>Powered by Google Gemini AI</span>
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-tight max-w-4xl mx-auto">
            Create Stunning{" "}
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">
              Etsy Listings
            </span>{" "}
            in Seconds
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            AI-powered studio that generates listing-ready invitation templates, matching mockups, and SEO-optimized Etsy copy — all in one click.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/login" className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white px-8 py-3.5 rounded-xl font-semibold text-lg transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 hover:-translate-y-0.5">
              Sign In <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Everything You Need to Sell on Etsy</h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">From AI-generated templates to mockups and listing copy — we handle the creative heavy lifting.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Wand2, title: "Template Generation", desc: "AI creates professional invitation templates with text & without text variants", color: "violet" },
            { icon: Images, title: "8-10 Mockups", desc: "One-click mockup generation that perfectly matches your template design", color: "fuchsia" },
            { icon: FileText, title: "Etsy Listing Copy", desc: "SEO-optimized title, description, features, usage instructions & tags", color: "amber" },
            { icon: Palette, title: "Creative Presets", desc: "Save reusable style directions for consistent brand aesthetics", color: "emerald" },
          ].map((f, i) => (
            <div key={i} className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${
                f.color === "violet" ? "bg-violet-500/10 text-violet-500 dark:bg-violet-500/20 dark:text-violet-400" :
                f.color === "fuchsia" ? "bg-fuchsia-500/10 text-fuchsia-500 dark:bg-fuchsia-500/20 dark:text-fuchsia-400" :
                f.color === "amber" ? "bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400" :
                "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400"
              }`}>
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-foreground text-lg mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-muted/50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground">How It Works</h2>
            <p className="mt-3 text-muted-foreground">Three simple steps to create Etsy-ready digital products</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Choose & Prompt", desc: "Select a category, write a prompt or use a preset, and let AI do the work." },
              { step: "02", title: "Generate Templates & Mockups", desc: "AI creates templates with & without text, then 8-10 matching mockups in one click." },
              { step: "03", title: "Download & List", desc: "Copy the auto-generated listing copy and upload your assets directly to Etsy." },
            ].map((s, i) => (
              <div key={i} className="relative p-8 rounded-2xl bg-card border border-border text-center">
                <div className="text-5xl font-bold bg-gradient-to-r from-violet-400/60 to-fuchsia-400/60 dark:from-violet-400/40 dark:to-fuchsia-400/40 bg-clip-text text-transparent mb-4">{s.step}</div>
                <h3 className="font-semibold text-foreground text-lg mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground">10 Supported Categories</h2>
          <p className="mt-3 text-muted-foreground">Specialized templates for every popular Etsy digital product niche</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {APPROVED_CATEGORIES.map((c, i) => (
            <div key={i} className="text-center p-5 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all cursor-default">
              <span className="text-3xl block mb-2">{CATEGORY_ICONS[c]}</span>
              <span className="text-sm text-foreground font-medium">{c}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center p-12 rounded-3xl bg-gradient-to-r from-violet-500/5 via-fuchsia-500/5 to-pink-500/5 dark:from-violet-500/10 dark:via-fuchsia-500/10 dark:to-pink-500/10 border border-primary/10">
          <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Transform Your Etsy Shop?</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">Join sellers using AI to create professional digital products in seconds, not hours.</p>
          <Link href="/auth/login" className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white px-8 py-3.5 rounded-xl font-semibold text-lg shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all hover:-translate-y-0.5">
            Sign In <Sparkles className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground text-sm">Etsy Studio</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Etsy Digital Art Generation Studio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

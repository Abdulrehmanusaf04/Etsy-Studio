"use client";

import { useTheme } from "@/shared/components/theme-provider";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`
        relative inline-flex items-center justify-center
        w-10 h-10 rounded-xl
        bg-secondary/80 hover:bg-secondary
        border border-border/50 hover:border-border
        transition-all duration-300 ease-out
        cursor-pointer group
        ${className}
      `}
    >
      {/* Sun icon — visible in light mode */}
      <Sun
        className={`
          absolute w-[18px] h-[18px] text-amber-500
          transition-all duration-500 ease-[cubic-bezier(0.68,-0.55,0.27,1.55)]
          ${isDark
            ? "rotate-90 scale-0 opacity-0"
            : "rotate-0 scale-100 opacity-100"
          }
        `}
      />
      {/* Moon icon — visible in dark mode */}
      <Moon
        className={`
          absolute w-[18px] h-[18px] text-violet-400
          transition-all duration-500 ease-[cubic-bezier(0.68,-0.55,0.27,1.55)]
          ${isDark
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-0 opacity-0"
          }
        `}
      />

      {/* Glow ring on hover */}
      <span
        className={`
          absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100
          transition-opacity duration-300
          ${isDark
            ? "shadow-[0_0_12px_2px_oklch(0.65_0.2_270/0.3)]"
            : "shadow-[0_0_12px_2px_oklch(0.8_0.15_80/0.3)]"
          }
        `}
      />
    </button>
  );
}

/**
 * Compact pill-style toggle for tight header layouts.
 * Shows a sliding dot between ☀ and ☾ icons.
 */
export function ThemeTogglePill({ className = "" }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`
        relative inline-flex items-center
        w-[52px] h-[28px] rounded-full
        bg-secondary border border-border/60
        transition-all duration-300
        cursor-pointer group
        ${className}
      `}
    >
      {/* Track icons */}
      <Sun className="absolute left-[6px] w-3.5 h-3.5 text-amber-500/70 transition-colors duration-300" />
      <Moon className="absolute right-[6px] w-3.5 h-3.5 text-violet-400/70 transition-colors duration-300" />

      {/* Sliding dot */}
      <span
        className={`
          absolute top-[3px] w-[22px] h-[22px] rounded-full
          shadow-sm transition-all duration-500 ease-[cubic-bezier(0.68,-0.55,0.27,1.55)]
          ${isDark
            ? "left-[27px] bg-gradient-to-br from-violet-500 to-indigo-600 shadow-violet-500/30"
            : "left-[3px] bg-gradient-to-br from-amber-400 to-orange-400 shadow-amber-400/30"
          }
        `}
      />
    </button>
  );
}

"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { usePathname } from "next/navigation";

export function TopBar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Format the path for a professional breadcrumb look
  const pathSegments = pathname?.split('/').filter(p => p) || [];
  const currentPage = pathSegments.length > 0 
    ? pathSegments[pathSegments.length - 1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : 'Dashboard';

  return (
    <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A1128] flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 hidden sm:block">
          {currentPage}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-all border border-transparent hover:border-amber-200 dark:hover:border-slate-700 shadow-sm"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        )}
      </div>
    </div>
  );
}

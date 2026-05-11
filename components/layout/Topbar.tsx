"use client";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDown, Globe } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { MONTH_NAMES } from "@/lib/utils";

interface Domain {
  id: number;
  name: string;
  slug: string;
}

interface TopbarProps {
  domains: Domain[];
  currentDomainId?: string;
  month: number;
  year: number;
}

export function Topbar({ domains, currentDomainId, month, year }: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentDomain = domains.find((d) => String(d.id) === currentDomainId);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const navigate = (params: Record<string, string>) => {
    const sp = new URLSearchParams({ month: String(month), year: String(year), ...params });
    router.push(`${pathname}?${sp.toString()}`);
  };

  return (
    <header className="fixed top-0 left-60 right-0 z-30 h-16 border-b border-white/10 bg-[#080818]/80 backdrop-blur-md flex items-center px-6 gap-4">
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
        >
          <Globe className="h-4 w-4 text-cyan-400" />
          <span>{currentDomain ? currentDomain.name : "Global (Semua Domain)"}</span>
          <ChevronDown className="h-3 w-3 text-white/50" />
        </button>

        {open && (
          <div className="absolute top-full mt-1 left-0 w-56 rounded-lg border border-white/10 bg-[#0f0f23] shadow-xl z-50 py-1">
            <button
              onClick={() => { navigate({ domainId: "global" }); setOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5"
            >
              <Globe className="h-3 w-3" />
              Global (Semua Domain)
            </button>
            <div className="h-px bg-white/10 mx-2 my-1" />
            {domains.map((d) => (
              <button
                key={d.id}
                onClick={() => { navigate({ domainId: String(d.id) }); setOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5"
              >
                <span className="h-2 w-2 rounded-full bg-cyan-400 shrink-0" />
                {d.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <select
          value={month}
          onChange={(e) => navigate({ month: e.target.value })}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
        >
          {MONTH_NAMES.map((m, i) => (
            <option key={i + 1} value={i + 1} className="bg-[#0f0f23]">{m}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => navigate({ year: e.target.value })}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
        >
          {[2024, 2025, 2026, 2027].map((y) => (
            <option key={y} value={y} className="bg-[#0f0f23]">{y}</option>
          ))}
        </select>
      </div>
    </header>
  );
}

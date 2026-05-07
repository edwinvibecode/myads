"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  DollarSign,
  CreditCard,
  BarChart3,
  Settings,
  Globe,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/revenue", label: "Revenue", icon: DollarSign },
  { href: "/expenses", label: "Pengeluaran", icon: CreditCard },
  { href: "/reports", label: "Laporan", icon: BarChart3 },
  { href: "/settings/domains", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-60 border-r border-white/10 bg-[#080818] flex flex-col">
      <div className="flex h-16 items-center px-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-cyan-500 flex items-center justify-center">
            <Globe className="h-4 w-4 text-black" />
          </div>
          <span className="font-bold text-white text-sm tracking-wide">MyAds Tracker</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                active
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/50 hover:text-red-400 hover:bg-red-500/5 transition-all"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );
}

"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TrendingUp, TrendingDown, DollarSign, CreditCard, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Topbar } from "@/components/layout/Topbar";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { NetworkChart } from "@/components/charts/NetworkChart";
import { DomainChart } from "@/components/charts/DomainChart";
import { formatCurrency, MONTH_NAMES } from "@/lib/utils";

interface DashboardData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  byNetwork: Record<string, number>;
  byDomain: Record<string, number>;
  trend: { month: number; year: number; revenue: number }[];
  domains: { id: number; name: string; slug: string }[];
  exchangeRate: number;
  month: number;
  year: number;
}

function StatCard({ title, value, sub, icon: Icon, color }: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-white/50">{title}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
            {sub && <p className="text-xs text-white/40 mt-0.5">{sub}</p>}
          </div>
          <div className={`h-10 w-10 rounded-lg ${color} flex items-center justify-center shrink-0`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const now = new Date();
  const month = parseInt(searchParams.get("month") ?? String(now.getMonth() + 1), 10);
  const year = parseInt(searchParams.get("year") ?? String(now.getFullYear()), 10);
  const domainId = searchParams.get("domainId") ?? undefined;

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ month: String(month), year: String(year) });
    if (domainId) params.set("domainId", domainId);
    fetch(`/api/dashboard?${params}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [month, year, domainId]);

  const fmt = (n: number) => formatCurrency(n, "IDR");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Topbar
        domains={data?.domains ?? []}
        currentDomainId={domainId}
        month={month}
        year={year}
      />

      <div className="pt-16 p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white">
            Dashboard — {MONTH_NAMES[month - 1]} {year}
          </h1>
          <p className="text-white/40 text-sm">
            {domainId && domainId !== "global"
              ? `Domain: ${data?.domains.find((d) => String(d.id) === domainId)?.name}`
              : "Semua Domain (Global)"}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Total Revenue"
            value={fmt(data?.totalRevenue ?? 0)}
            icon={DollarSign}
            color="bg-cyan-500/10 text-cyan-400"
          />
          <StatCard
            title="Total Pengeluaran"
            value={fmt(data?.totalExpenses ?? 0)}
            icon={CreditCard}
            color="bg-red-500/10 text-red-400"
          />
          <StatCard
            title="Net Profit"
            value={fmt(data?.netProfit ?? 0)}
            sub={`Kurs: Rp${(data?.exchangeRate ?? 16000).toLocaleString("id-ID")}/USD`}
            icon={(data?.netProfit ?? 0) >= 0 ? TrendingUp : TrendingDown}
            color={(data?.netProfit ?? 0) >= 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}
          />
          <StatCard
            title="Profit Margin"
            value={`${(data?.profitMargin ?? 0).toFixed(1)}%`}
            icon={BarChart3}
            color="bg-purple-500/10 text-purple-400"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card className="xl:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/70">Trend Revenue (12 Bulan)</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueChart data={data?.trend ?? []} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/70">Revenue per Network</CardTitle>
            </CardHeader>
            <CardContent>
              <NetworkChart data={data?.byNetwork ?? {}} />
            </CardContent>
          </Card>
        </div>

        {(!domainId || domainId === "global") && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/70">Revenue per Domain</CardTitle>
            </CardHeader>
            <CardContent>
              <DomainChart data={data?.byDomain ?? {}} />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}

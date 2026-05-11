"use client";
import { useEffect, useState, Suspense, useMemo } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, MONTH_NAMES } from "@/lib/utils";
import { RevenueChart } from "@/components/charts/RevenueChart";

interface MonthData {
  month: number; year: number; revenue: number; expenses: number; netProfit: number;
  byNetwork: Record<string, number>;
}
interface ReportData {
  monthlyData: MonthData[]; exchangeRate: number; year: number;
}
interface Domain { id: number; name: string; slug: string; }

const ALL_MONTHS = "ALL";

function ReportsContent() {
  const [data, setData] = useState<ReportData | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [domainId, setDomainId] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState<string>(ALL_MONTHS);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12

  useEffect(() => {
    fetch("/api/domains").then((r) => r.json()).then(setDomains);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ year });
    if (domainId) params.set("domainId", domainId);
    fetch(`/api/reports?${params}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [domainId, year]);

  // Filter and sort: hide future months, sort Z-A (newest first)
  const filteredData = useMemo(() => {
    if (!data) return [];
    
    const selectedYear = parseInt(year, 10);
    let months = data.monthlyData;
    
    // Hide future months for current year
    if (selectedYear === currentYear) {
      months = months.filter((m) => m.month <= currentMonth);
    }
    
    // Apply month filter
    if (month !== ALL_MONTHS) {
      months = months.filter((m) => m.month === parseInt(month, 10));
    }
    
    // Sort Z-A (descending by month - newest first)
    return [...months].sort((a, b) => b.month - a.month);
  }, [data, year, month, currentYear, currentMonth]);

  function exportCSV() {
    if (!data) return;
    const rows = [
      ["Bulan", "Tahun", "Revenue (IDR)", "Pengeluaran (IDR)", "Net Profit (IDR)"],
      ...filteredData.map((m) => [
        MONTH_NAMES[m.month - 1], m.year,
        Math.round(m.revenue), Math.round(m.expenses), Math.round(m.netProfit),
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportPDF() {
    if (!data) return;
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(`Laporan Revenue ${year}`, 14, 20);

    const tableData = filteredData.map((m) => [
      MONTH_NAMES[m.month - 1],
      formatCurrency(m.revenue, "IDR"),
      formatCurrency(m.expenses, "IDR"),
      formatCurrency(m.netProfit, "IDR"),
    ]);

    autoTable(doc, {
      head: [["Bulan", "Revenue", "Pengeluaran", "Net Profit"]],
      body: tableData,
      startY: 30,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [34, 211, 238] },
    });

    doc.save(`laporan-${year}.pdf`);
  }

  const totalRevenue = data?.monthlyData.reduce((s, m) => s + m.revenue, 0) ?? 0;
  const totalExpenses = data?.monthlyData.reduce((s, m) => s + m.expenses, 0) ?? 0;
  const totalProfit = totalRevenue - totalExpenses;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Laporan Bulanan</h1>
          <p className="text-white/40 text-sm">Ringkasan revenue dan pengeluaran per bulan</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={!data}>
            <Download className="h-4 w-4 mr-1.5" />CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF} disabled={!data}>
            <Download className="h-4 w-4 mr-1.5" />PDF
          </Button>
        </div>
      </div>

      <div className="flex gap-3">
        <Select value={domainId} onValueChange={setDomainId}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Global (Semua)" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__ALL__">Global (Semua)</SelectItem>
            {domains.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Array.from({ length: currentYear - 2023 }, (_, i) => currentYear - i).map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Semua Bulan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_MONTHS}>Semua Bulan</SelectItem>
            {[...MONTH_NAMES].reverse().map((name, idx) => {
              const monthNum = 12 - idx; // 12, 11, 10, ..., 1
              // Hide future months for current year
              if (parseInt(year) === currentYear && monthNum > currentMonth) return null;
              return <SelectItem key={monthNum} value={String(monthNum)}>{name}</SelectItem>;
            })}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-cyan-400" /></div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-white/50">Total Revenue {year}</p>
                <p className="text-xl font-bold text-cyan-400 mt-1">{formatCurrency(totalRevenue, "IDR")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-white/50">Total Pengeluaran {year}</p>
                <p className="text-xl font-bold text-red-400 mt-1">{formatCurrency(totalExpenses, "IDR")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-white/50">Net Profit {year}</p>
                <p className={`text-xl font-bold mt-1 ${totalProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {formatCurrency(totalProfit, "IDR")}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/70">Trend Revenue {year}</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueChart data={[...filteredData].sort((a, b) => a.month - b.month).map((m) => ({ month: m.month, year: m.year, revenue: m.revenue }))} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/70">Detail Per Bulan</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left px-6 py-3 text-white/50 font-medium">Bulan</th>
                      <th className="text-right px-6 py-3 text-white/50 font-medium">Revenue</th>
                      <th className="text-right px-6 py-3 text-white/50 font-medium">Pengeluaran</th>
                      <th className="text-right px-6 py-3 text-white/50 font-medium">Net Profit</th>
                      <th className="text-right px-6 py-3 text-white/50 font-medium">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((m) => {
                      const margin = m.revenue > 0 ? ((m.netProfit / m.revenue) * 100).toFixed(1) : "0.0";
                      const hasData = m.revenue > 0 || m.expenses > 0;
                      return (
                        <tr key={m.month} className={`border-b border-white/5 ${hasData ? "hover:bg-white/2" : "opacity-40"}`}>
                          <td className="px-6 py-3 text-white font-medium">{MONTH_NAMES[m.month - 1]}</td>
                          <td className="px-6 py-3 text-right font-mono text-cyan-400">{formatCurrency(m.revenue, "IDR")}</td>
                          <td className="px-6 py-3 text-right font-mono text-red-400">{formatCurrency(m.expenses, "IDR")}</td>
                          <td className={`px-6 py-3 text-right font-mono font-semibold ${m.netProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {formatCurrency(m.netProfit, "IDR")}
                          </td>
                          <td className="px-6 py-3 text-right text-white/60">{margin}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-white/20">
                      <td className="px-6 py-3 text-white/50 font-medium">Total</td>
                      <td className="px-6 py-3 text-right font-mono font-bold text-cyan-400">{formatCurrency(totalRevenue, "IDR")}</td>
                      <td className="px-6 py-3 text-right font-mono font-bold text-red-400">{formatCurrency(totalExpenses, "IDR")}</td>
                      <td className={`px-6 py-3 text-right font-mono font-bold ${totalProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {formatCurrency(totalProfit, "IDR")}
                      </td>
                      <td className="px-6 py-3 text-right text-white/60">
                        {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : "0.0"}%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default function ReportsPage() {
  return <Suspense><ReportsContent /></Suspense>;
}

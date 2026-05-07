"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { Plus, Trash2, Pencil, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, MONTH_NAMES, NETWORK_COLORS, NETWORK_LABELS } from "@/lib/utils";
import Papa from "papaparse";

interface Domain { id: number; name: string; slug: string; }
interface Revenue {
  id: number; domainId: number; network: string; amount: string;
  currency: string; month: number; year: number; notes?: string;
  domain: { id: number; name: string; slug: string };
}

const NETWORKS = ["CLICKADILLA", "CLICKADU", "ADSTERRA"];
const CURRENCIES = ["USD", "IDR"];

const emptyForm = {
  domainId: "", network: "CLICKADILLA", amount: "", currency: "USD",
  month: String(new Date().getMonth() + 1), year: String(new Date().getFullYear()), notes: "",
};

function RevenueContent() {
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [filterDomain, setFilterDomain] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/domains").then((r) => r.json()).then(setDomains);
  }, []);

  function loadRevenues(domain = filterDomain, month = filterMonth, year = filterYear) {
    setLoading(true);
    const params = new URLSearchParams();
    if (domain) params.set("domainId", domain);
    if (month) params.set("month", month);
    if (year) params.set("year", year);
    fetch(`/api/revenues?${params}`).then((r) => r.json()).then((d) => {
      setRevenues(d);
      setLoading(false);
    });
  }

  useEffect(() => { loadRevenues(filterDomain, filterMonth, filterYear); }, [filterDomain, filterMonth, filterYear]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const payload = {
      domainId: parseInt(form.domainId, 10),
      network: form.network,
      amount: parseFloat(form.amount),
      currency: form.currency,
      month: parseInt(form.month, 10),
      year: parseInt(form.year, 10),
      notes: form.notes || undefined,
    };

    const url = editId ? `/api/revenues/${editId}` : "/api/revenues";
    const method = editId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);
    if (res.ok) {
      setOpen(false);
      setForm(emptyForm);
      setEditId(null);
      loadRevenues();
    } else {
      const data = await res.json();
      setError(data.error ?? "Gagal menyimpan");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Hapus revenue ini?")) return;
    await fetch(`/api/revenues/${id}`, { method: "DELETE" });
    loadRevenues();
  }

  function handleEdit(r: Revenue) {
    setForm({
      domainId: String(r.domainId),
      network: r.network,
      amount: String(r.amount),
      currency: r.currency,
      month: String(r.month),
      year: String(r.year),
      notes: r.notes ?? "",
    });
    setEditId(r.id);
    setOpen(true);
  }

  async function handleCSVImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = (results.data as Record<string, unknown>[]).map((row) => ({
          domain: String(row.domain ?? "").trim(),
          network: String(row.network ?? "").trim().toUpperCase(),
          amount: parseFloat(String(row.amount ?? "0")),
          currency: String(row.currency ?? "USD").trim().toUpperCase(),
          month: parseInt(String(row.month ?? "1"), 10),
          year: parseInt(String(row.year ?? "2024"), 10),
          notes: row.notes ? String(row.notes).trim() : undefined,
        }));

        const res = await fetch("/api/revenues/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rows),
        });

        const data = await res.json();
        if (res.ok) {
          alert(`Berhasil import ${data.imported} data`);
          loadRevenues();
        } else {
          alert(`Import gagal: ${data.error}\n${Array.isArray(data.details) ? data.details.join("\n") : ""}`);
        }
      },
    });

    if (fileRef.current) fileRef.current.value = "";
  }

  const totalIDR = revenues.reduce((sum, r) => {
    const amount = parseFloat(String(r.amount));
    return sum + (r.currency === "USD" ? amount * 16000 : amount);
  }, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Revenue</h1>
          <p className="text-white/40 text-sm">Semua entri pendapatan</p>
        </div>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4 mr-1.5" />Import CSV
          </Button>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(emptyForm); setEditId(null); setError(""); } }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Tambah</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editId ? "Edit Revenue" : "Tambah Revenue"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label>Domain</Label>
                  <Select value={form.domainId} onValueChange={(v) => setForm({ ...form, domainId: v })}>
                    <SelectTrigger><SelectValue placeholder="Pilih domain" /></SelectTrigger>
                    <SelectContent>
                      {domains.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Ad Network</Label>
                  <Select value={form.network} onValueChange={(v) => setForm({ ...form, network: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {NETWORKS.map((n) => <SelectItem key={n} value={n}>{NETWORK_LABELS[n]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Amount</Label>
                    <Input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required placeholder="0.00" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Mata Uang</Label>
                    <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Bulan</Label>
                    <Select value={form.month} onValueChange={(v) => setForm({ ...form, month: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MONTH_NAMES.map((m, i) => <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tahun</Label>
                    <Select value={form.year} onValueChange={(v) => setForm({ ...form, year: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[2024, 2025, 2026, 2027].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Notes (opsional)</Label>
                  <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={500} placeholder="Catatan..." />
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                  <Button type="submit" disabled={submitting || !form.domainId || !form.amount}>
                    {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {editId ? "Simpan" : "Tambah"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={filterDomain} onValueChange={setFilterDomain}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Semua Domain" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Semua Domain</SelectItem>
            {domains.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Semua Bulan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Semua Bulan</SelectItem>
            {MONTH_NAMES.map((m, i) => <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-28"><SelectValue placeholder="Tahun" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Semua</SelectItem>
            {[2024, 2025, 2026, 2027].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
        {(filterDomain || filterMonth || filterYear) && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterDomain(""); setFilterMonth(""); setFilterYear(""); }}>
            Reset Filter
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-white/70">{revenues.length} entri ditemukan</CardTitle>
          <span className="text-sm font-semibold text-cyan-400">Total: {formatCurrency(totalIDR, "IDR")}</span>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-cyan-400" /></div>
          ) : revenues.length === 0 ? (
            <div className="text-center text-white/30 py-12">Belum ada data revenue</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-6 py-3 text-white/50 font-medium">Domain</th>
                    <th className="text-left px-6 py-3 text-white/50 font-medium">Network</th>
                    <th className="text-left px-6 py-3 text-white/50 font-medium">Periode</th>
                    <th className="text-right px-6 py-3 text-white/50 font-medium">Amount</th>
                    <th className="text-left px-6 py-3 text-white/50 font-medium">Notes</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {revenues.map((r) => (
                    <tr key={r.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="px-6 py-3 text-white font-medium">{r.domain.name}</td>
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: NETWORK_COLORS[r.network] }} />
                          <span className="text-white/80">{NETWORK_LABELS[r.network]}</span>
                        </span>
                      </td>
                      <td className="px-6 py-3 text-white/60">{MONTH_NAMES[r.month - 1]} {r.year}</td>
                      <td className="px-6 py-3 text-right font-mono">
                        <span className="text-white">{formatCurrency(parseFloat(String(r.amount)), r.currency as "USD" | "IDR")}</span>
                      </td>
                      <td className="px-6 py-3 text-white/40 max-w-[160px] truncate">{r.notes ?? "-"}</td>
                      <td className="px-6 py-3">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(r)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-red-400" onClick={() => handleDelete(r.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-white/30 bg-white/5 rounded-lg p-3 border border-white/10">
        <strong className="text-white/50">Format CSV:</strong> Kolom: domain, network, amount, currency, month, year, notes (opsional). Network: CLICKADILLA / CLICKADU / ADSTERRA. Currency: USD / IDR.
      </div>
    </div>
  );
}

export default function RevenuePage() {
  return <Suspense><RevenueContent /></Suspense>;
}

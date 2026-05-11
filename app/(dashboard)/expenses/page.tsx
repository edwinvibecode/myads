"use client";
import { useEffect, useState, Suspense } from "react";
import { Plus, Trash2, Pencil, Loader2, Globe, Server, Zap, ShoppingCart, Package, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, MONTH_NAMES } from "@/lib/utils";

interface Domain { id: number; name: string; slug: string; }
interface Expense {
  id: number; domainId: number | null; type: string; category: string;
  description: string; amount: string; currency: string; date: string;
  isRecurring: boolean; domain?: { id: number; name: string } | null;
}

const emptyForm = {
  domainId: "", type: "OPERATIONAL", category: "", description: "",
  amount: "", currency: "IDR", date: new Date().toISOString().split("T")[0],
  isRecurring: false,
};

function ExpensesContent() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));
  const [categories, setCategories] = useState<string[]>([]);
  const [catOpen, setCatOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    fetch("/api/domains").then((r) => r.json()).then(setDomains);
    loadCategories();
  }, []);

  function loadCategories() {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }

  function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategory.trim()) return;
    if (!categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
    }
    setNewCategory("");
  }

  function handleDeleteCategory(cat: string) {
    if (!confirm(`Hapus kategori "${cat}"?`)) return;
    setCategories(categories.filter((c) => c !== cat));
  }

  function loadExpenses(type = filterType, month = filterMonth, year = filterYear) {
    setLoading(true);
    const params = new URLSearchParams();
    if (type && type !== "__ALL__") params.set("type", type);
    if (month && month !== "__ALL__" && year && year !== "__ALL__") {
      params.set("month", month);
      params.set("year", year);
    }
    fetch(`/api/expenses?${params}`).then((r) => r.json()).then((d) => {
      setExpenses(d);
      setLoading(false);
    });
  }

  useEffect(() => { loadExpenses(filterType, filterMonth, filterYear); }, [filterType, filterMonth, filterYear]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const payload = {
      domainId: form.domainId ? parseInt(form.domainId, 10) : null,
      type: form.type,
      category: form.category.trim(),
      description: form.description.trim(),
      amount: parseFloat(form.amount),
      currency: form.currency,
      date: form.date,
      isRecurring: form.isRecurring,
    };

    const url = editId ? `/api/expenses/${editId}` : "/api/expenses";
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
      loadExpenses();
    } else {
      const data = await res.json();
      setError(data.error ?? "Gagal menyimpan");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Hapus pengeluaran ini?")) return;
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    loadExpenses();
  }

  function handleEdit(e: Expense) {
    setForm({
      domainId: e.domainId ? String(e.domainId) : "",
      type: e.type,
      category: e.category,
      description: e.description,
      amount: String(e.amount),
      currency: e.currency,
      date: e.date.split("T")[0],
      isRecurring: e.isRecurring,
    });
    setEditId(e.id);
    setOpen(true);
  }

  const totalIDR = expenses.reduce((sum, e) => {
    const amount = parseFloat(String(e.amount));
    return sum + (e.currency === "USD" ? amount * 16000 : amount);
  }, 0);

  const categoryTotals = expenses.reduce((acc, e) => {
    const cat = e.category.trim() || "Uncategorized";
    const amount = parseFloat(String(e.amount));
    const idr = e.currency === "USD" ? amount * 16000 : amount;
    acc[cat] = (acc[cat] || 0) + idr;
    return acc;
  }, {} as Record<string, number>);

  const categoryList = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const getCategoryIcon = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes("server") || c.includes("hosting")) return <Server className="h-4 w-4" />;
    if (c.includes("domain")) return <Globe className="h-4 w-4" />;
    if (c.includes("api") || c.includes("tool")) return <Zap className="h-4 w-4" />;
    if (c.includes("market") || c.includes("ads")) return <ShoppingCart className="h-4 w-4" />;
    return <Package className="h-4 w-4" />;
  };

  const getCategoryColor = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes("server") || c.includes("hosting")) return "bg-red-500/10 text-red-400";
    if (c.includes("domain")) return "bg-blue-500/10 text-blue-400";
    if (c.includes("api") || c.includes("tool")) return "bg-amber-500/10 text-amber-400";
    if (c.includes("market") || c.includes("ads")) return "bg-purple-500/10 text-purple-400";
    return "bg-cyan-500/10 text-cyan-400";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Pengeluaran</h1>
          <p className="text-white/40 text-sm">Biaya operasional dan pengeluaran lain</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(emptyForm); setEditId(null); setError(""); } }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Tambah</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Pengeluaran" : "Tambah Pengeluaran"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Tipe</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPERATIONAL">Operasional</SelectItem>
                      <SelectItem value="OTHER">Lain-lain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Domain (opsional)</Label>
                  <Select value={form.domainId} onValueChange={(v) => setForm({ ...form, domainId: v })}>
                    <SelectTrigger><SelectValue placeholder="Global" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__GLOBAL__">Global</SelectItem>
                      {domains.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Kategori</Label>
                  <Button type="button" variant="ghost" size="sm" className="h-auto py-0 px-1 text-xs text-cyan-400" onClick={() => setCatOpen(true)}>
                    <Settings className="h-3 w-3 mr-1" /> Kelola
                  </Button>
                </div>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Deskripsi (opsional)</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={500} placeholder="Detail pengeluaran..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Amount</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={form.amount ? Number(form.amount).toLocaleString("id-ID") : ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^\d]/g, "");
                      setForm({ ...form, amount: raw });
                    }}
                    onBlur={() => {
                      if (form.amount) {
                        setForm({ ...form, amount: String(Number(form.amount)) });
                      }
                    }}
                    required
                    placeholder="0"
                    className="text-right"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Mata Uang</Label>
                  <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="IDR">IDR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Tanggal</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="[color-scheme:dark]" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="recurring" checked={form.isRecurring} onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })} className="rounded border-white/20" />
                <Label htmlFor="recurring">Pengeluaran berulang (recurring)</Label>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {editId ? "Simpan" : "Tambah"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Semua Tipe" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__ALL__">Semua Tipe</SelectItem>
            <SelectItem value="OPERATIONAL">Operasional</SelectItem>
            <SelectItem value="OTHER">Lain-lain</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Semua Bulan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__ALL__">Semua Bulan</SelectItem>
            {MONTH_NAMES.map((m, i) => <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {categoryList.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {categoryList.map(([cat, total]) => (
            <Card key={cat}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-white/50 truncate max-w-[100px]">{cat}</p>
                    <p className="text-lg font-bold text-white mt-1">{formatCurrency(total, "IDR")}</p>
                    {totalIDR > 0 && (
                      <p className="text-xs text-white/40 mt-0.5">
                        {((total / totalIDR) * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${getCategoryColor(cat)}`}>
                    {getCategoryIcon(cat)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-white/70">{expenses.length} entri</CardTitle>
          <span className="text-sm font-semibold text-red-400">Total: {formatCurrency(totalIDR, "IDR")}</span>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-cyan-400" /></div>
          ) : expenses.length === 0 ? (
            <div className="text-center text-white/30 py-12">Belum ada pengeluaran</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-6 py-3 text-white/50 font-medium">Tipe</th>
                    <th className="text-left px-6 py-3 text-white/50 font-medium">Kategori</th>
                    <th className="text-left px-6 py-3 text-white/50 font-medium">Domain</th>
                    <th className="text-left px-6 py-3 text-white/50 font-medium">Tanggal</th>
                    <th className="text-right px-6 py-3 text-white/50 font-medium">Amount</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="px-6 py-3">
                        <Badge variant={e.type === "OPERATIONAL" ? "default" : "secondary"}>
                          {e.type === "OPERATIONAL" ? "Operasional" : "Lain-lain"}
                        </Badge>
                      </td>
                      <td className="px-6 py-3">
                        <p className="text-white font-medium">{e.category}</p>
                        <p className="text-white/40 text-xs truncate max-w-[180px]">{e.description}</p>
                      </td>
                      <td className="px-6 py-3 text-white/60">
                        {e.domain ? (
                          <span className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                            {e.domain.name}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-white/30">
                            <Globe className="h-3 w-3" />Global
                          </span>
                        )}
                        {e.isRecurring && <Badge variant="outline" className="ml-1 text-xs">Recurring</Badge>}
                      </td>
                      <td className="px-6 py-3 text-white/60">{new Date(e.date).toLocaleDateString("id-ID")}</td>
                      <td className="px-6 py-3 text-right font-mono text-white">
                        {formatCurrency(parseFloat(String(e.amount)), e.currency as "USD" | "IDR")}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(e)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-red-400" onClick={() => handleDelete(e.id)}>
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

      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Kelola Kategori</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Tambah kategori baru..."
                maxLength={100}
              />
              <Button type="submit" size="sm"><Plus className="h-4 w-4" /></Button>
            </form>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {categories.map((cat) => (
                <div key={cat} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5">
                  <span className="text-sm text-white">{cat}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-red-400" onClick={() => handleDeleteCategory(cat)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-center text-white/30 text-sm py-4">Belum ada kategori</p>
              )}
            </div>
            <Button variant="outline" className="w-full" onClick={() => setCatOpen(false)}>Tutup</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ExpensesPage() {
  return <Suspense><ExpensesContent /></Suspense>;
}

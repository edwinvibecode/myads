"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Archive, ArchiveRestore, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { slugify } from "@/lib/utils";

interface Domain {
  id: number; name: string; slug: string; isArchived: boolean; createdAt: string;
}

const emptyForm = { name: "", slug: "" };

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadDomains(); }, []);

  function loadDomains() {
    fetch("/api/domains").then((r) => r.json()).then((d) => { setDomains(d); setLoading(false); });
  }

  function handleNameChange(name: string) {
    setForm({ name, slug: editId ? form.slug : slugify(name) });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const url = editId ? `/api/domains/${editId}` : "/api/domains";
    const method = editId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name.trim(), slug: form.slug.trim() }),
    });

    setSubmitting(false);
    if (res.ok) {
      setOpen(false);
      setForm(emptyForm);
      setEditId(null);
      loadDomains();
    } else {
      const data = await res.json();
      setError(data.error ?? "Gagal menyimpan");
    }
  }

  async function handleArchive(id: number, isArchived: boolean) {
    await fetch(`/api/domains/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: !isArchived }),
    });
    loadDomains();
  }

  async function handleDelete(id: number) {
    if (!confirm("Hapus domain ini? Semua data revenue dan pengeluaran terkait juga akan dihapus.")) return;
    await fetch(`/api/domains/${id}`, { method: "DELETE" });
    loadDomains();
  }

  function handleEdit(d: Domain) {
    setForm({ name: d.name, slug: d.slug });
    setEditId(d.id);
    setOpen(true);
  }

  const active = domains.filter((d) => !d.isArchived);
  const archived = domains.filter((d) => d.isArchived);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Manajemen Domain</h1>
          <p className="text-white/40 text-sm">Kelola website / domain yang kamu monetisasi</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(emptyForm); setEditId(null); setError(""); } }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Tambah Domain</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Domain" : "Tambah Domain"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Nama Domain</Label>
                <Input
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required maxLength={100}
                  placeholder="mis. example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Slug (ID unik)</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                  required maxLength={100}
                  placeholder="example-com"
                />
                <p className="text-xs text-white/30">Huruf kecil, angka, dan tanda hubung saja</p>
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

      {loading ? (
        <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-cyan-400" /></div>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/70">Domain Aktif ({active.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {active.length === 0 ? (
                <div className="text-center text-white/30 py-8 text-sm">Belum ada domain aktif. Tambahkan domain pertama kamu.</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {active.map((d) => (
                    <div key={d.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/2 transition-colors">
                      <div>
                        <p className="text-white font-medium">{d.name}</p>
                        <p className="text-white/40 text-xs mt-0.5">slug: {d.slug}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(d)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-amber-400" onClick={() => handleArchive(d.id, d.isArchived)}>
                          <Archive className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-400" onClick={() => handleDelete(d.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {archived.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-white/40">Domain Diarsipkan ({archived.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-white/5">
                  {archived.map((d) => (
                    <div key={d.id} className="flex items-center justify-between px-6 py-4 opacity-50 hover:opacity-70 transition-opacity">
                      <div>
                        <p className="text-white font-medium flex items-center gap-2">
                          {d.name}
                          <Badge variant="secondary" className="text-xs">Arsip</Badge>
                        </p>
                        <p className="text-white/40 text-xs mt-0.5">slug: {d.slug}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-cyan-400" onClick={() => handleArchive(d.id, d.isArchived)}>
                          <ArchiveRestore className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-400" onClick={() => handleDelete(d.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

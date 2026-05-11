"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Copy, Check, Code2, Globe, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Domain {
  id: number;
  name: string;
  slug: string;
}

interface AdCode {
  id: number;
  name: string;
  format: string;
  htmlCode: string;
  isActive: boolean;
  createdAt: string;
}

interface AdProvider {
  id: number;
  name: string;
  codes: AdCode[];
}

const FORMAT_COLORS: Record<string, string> = {
  banner: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  popunder: "bg-red-500/20 text-red-400 border-red-500/30",
  inpage: "bg-green-500/20 text-green-400 border-green-500/30",
  native: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  push: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  interstitial: "bg-pink-500/20 text-pink-400 border-pink-500/30",
};

export default function AdCodesPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<number | null>(null);
  const [providers, setProviders] = useState<AdProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Load domains
  useEffect(() => {
    fetch("/api/domains")
      .then((r) => r.json())
      .then((data) => {
        setDomains(data);
        if (data.length > 0) setSelectedDomain(data[0].id);
      });
  }, []);

  // Load providers when domain selected
  useEffect(() => {
    if (!selectedDomain) return;
    loadProviders();
  }, [selectedDomain]);

  function loadProviders() {
    if (!selectedDomain) return;
    setLoading(true);
    fetch(`/api/ad-codes/providers?domainId=${selectedDomain}`)
      .then((r) => r.json())
      .then((data) => {
        setProviders(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  async function copyToClipboard(text: string, id: number) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Kode Iklan</h1>
          <p className="text-white/40 text-sm">Kelola kode iklan per domain & provider</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Domain Sidebar */}
        <div className="col-span-3 space-y-3">
          <h3 className="text-sm font-medium text-white/60 flex items-center gap-2">
            <Globe className="h-4 w-4" /> Domain
          </h3>
          {domains.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDomain(d.id)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center justify-between ${
                selectedDomain === d.id
                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                  : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
              }`}
            >
              <span className="font-medium truncate">{d.name}</span>
              {selectedDomain === d.id && <ChevronRight className="h-4 w-4" />}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="col-span-9">
          {selectedDomain ? (
            <AdCodesContent
              domainId={selectedDomain}
              providers={providers}
              loading={loading}
              onRefresh={loadProviders}
              copiedId={copiedId}
              onCopy={copyToClipboard}
            />
          ) : (
            <div className="text-center py-20 text-white/40">
              Pilih domain untuk melihat kode iklan
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdCodesContent({
  domainId,
  providers,
  loading,
  onRefresh,
  copiedId,
  onCopy,
}: {
  domainId: number;
  providers: AdProvider[];
  loading: boolean;
  onRefresh: () => void;
  copiedId: number | null;
  onCopy: (text: string, id: number) => void;
}) {
  const [addProviderOpen, setAddProviderOpen] = useState(false);
  const [newProviderName, setNewProviderName] = useState("");

  async function handleAddProvider() {
    if (!newProviderName.trim()) return;
    const res = await fetch("/api/ad-codes/providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domainId, name: newProviderName.trim() }),
    });
    if (res.ok) {
      setNewProviderName("");
      setAddProviderOpen(false);
      onRefresh();
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-white/40">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Add Provider Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Providers</h2>
        <Dialog open={addProviderOpen} onOpenChange={setAddProviderOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1.5" /> Tambah Provider
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Provider Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label>Nama Provider</Label>
                <Input
                  value={newProviderName}
                  onChange={(e) => setNewProviderName(e.target.value)}
                  placeholder="Contoh: Adsterra, Clickadilla..."
                />
              </div>
              <Button onClick={handleAddProvider} disabled={!newProviderName.trim()} className="w-full">
                Simpan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {providers.length === 0 ? (
        <div className="text-center py-16 bg-white/5 rounded-xl border border-white/10">
          <Code2 className="h-12 w-12 mx-auto text-white/20 mb-4" />
          <p className="text-white/40">Belum ada provider</p>
          <p className="text-sm text-white/30 mt-1">Tambah provider untuk mulai menyimpan kode iklan</p>
        </div>
      ) : (
        <AdCodesTabs
          providers={providers}
          onRefresh={onRefresh}
          copiedId={copiedId}
          onCopy={onCopy}
        />
      )}
    </div>
  );
}

function AdCodesTabs({
  providers,
  onRefresh,
  copiedId,
  onCopy,
}: {
  providers: AdProvider[];
  onRefresh: () => void;
  copiedId: number | null;
  onCopy: (text: string, id: number) => void;
}) {
  const [activeProvider, setActiveProvider] = useState(providers[0]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <div className="flex gap-2">
          {providers.map((provider) => (
            <Button
              key={provider.id}
              size="sm"
              variant="outline"
              className={`${
                activeProvider.id === provider.id
                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                  : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
              }`}
              onClick={() => setActiveProvider(provider)}
            >
              {provider.name}
            </Button>
          ))}
        </div>
      </div>

      <ProviderCard
        provider={activeProvider}
        onRefresh={onRefresh}
        copiedId={copiedId}
        onCopy={onCopy}
      />
    </div>
  );
}

function ProviderCard({
  provider,
  onRefresh,
  copiedId,
  onCopy,
}: {
  provider: AdProvider;
  onRefresh: () => void;
  copiedId: number | null;
  onCopy: (text: string, id: number) => void;
}) {
  const [addCodeOpen, setAddCodeOpen] = useState(false);
  const [editCode, setEditCode] = useState<AdCode | null>(null);

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-base text-white">{provider.name}</CardTitle>
        <div className="flex gap-2">
          <Dialog open={addCodeOpen} onOpenChange={setAddCodeOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1.5" /> Tambah Kode
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Tambah Kode Iklan</DialogTitle>
              </DialogHeader>
              <AdCodeForm
                providerId={provider.id}
                onSuccess={() => {
                  setAddCodeOpen(false);
                  onRefresh();
                }}
              />
            </DialogContent>
          </Dialog>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-400 hover:text-red-300"
            onClick={async () => {
              if (confirm(`Hapus provider ${provider.name}?`)) {
                await fetch(`/api/ad-codes/providers?id=${provider.id}`, { method: "DELETE" });
                onRefresh();
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {provider.codes.length === 0 ? (
          <p className="text-sm text-white/40 text-center py-8">Belum ada kode iklan</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {provider.codes.map((code) => (
              <AdCodeCard
                key={code.id}
                code={code}
                copiedId={copiedId}
                onCopy={onCopy}
                onEdit={() => setEditCode(code)}
                onRefresh={onRefresh}
              />
            ))}
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={!!editCode} onOpenChange={() => setEditCode(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Kode Iklan</DialogTitle>
          </DialogHeader>
          {editCode && (
            <AdCodeForm
              providerId={provider.id}
              editCode={editCode}
              onSuccess={() => {
                setEditCode(null);
                onRefresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function AdCodeCard({
  code,
  copiedId,
  onCopy,
  onEdit,
  onRefresh,
}: {
  code: AdCode;
  copiedId: number | null;
  onCopy: (text: string, id: number) => void;
  onEdit: () => void;
  onRefresh: () => void;
}) {
  const formatClass = FORMAT_COLORS[code.format] || "bg-white/10 text-white/70 border-white/20";

  return (
    <div className="bg-white/5 rounded-lg border border-white/10 p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h4 className="font-medium text-white">{code.name}</h4>
          <Badge variant="outline" className={formatClass}>
            {code.format}
          </Badge>
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => onCopy(code.htmlCode, code.id)}
          >
            {copiedId === code.id ? (
              <Check className="h-4 w-4 text-green-400" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-red-400"
            onClick={async () => {
              if (confirm("Hapus kode iklan ini?")) {
                await fetch(`/api/ad-codes?id=${code.id}`, { method: "DELETE" });
                onRefresh();
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="bg-black/30 rounded p-3 font-mono text-xs text-white/60 overflow-hidden">
        <pre className="whitespace-pre-wrap break-all line-clamp-3">{code.htmlCode}</pre>
      </div>

      {!code.isActive && (
        <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
          Non-aktif
        </Badge>
      )}
    </div>
  );
}

function AdCodeForm({
  providerId,
  editCode,
  onSuccess,
}: {
  providerId: number;
  editCode?: AdCode | null;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(editCode?.name || "");
  const [format, setFormat] = useState(editCode?.format || "banner");
  const [htmlCode, setHtmlCode] = useState(editCode?.htmlCode || "");
  const [isActive, setIsActive] = useState(editCode?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setSaving(true);
    const url = editCode ? `/api/ad-codes?id=${editCode.id}` : "/api/ad-codes";
    const method = editCode ? "PATCH" : "POST";
    const body = editCode
      ? { name, format, htmlCode, isActive }
      : { providerId, name, format, htmlCode };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);
    if (res.ok) onSuccess();
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-1.5">
        <Label>Nama Kode</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Contoh: Banner 300x250"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Format</Label>
        <Select value={format} onValueChange={setFormat}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="banner">Banner</SelectItem>
            <SelectItem value="popunder">Popunder</SelectItem>
            <SelectItem value="inpage">In-page Push</SelectItem>
            <SelectItem value="native">Native</SelectItem>
            <SelectItem value="push">Push Notification</SelectItem>
            <SelectItem value="interstitial">Interstitial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>HTML Code</Label>
        <textarea
          value={htmlCode}
          onChange={(e) => setHtmlCode(e.target.value)}
          placeholder="Paste kode iklan di sini..."
          className="w-full h-40 bg-black/30 border border-white/20 rounded-lg p-3 font-mono text-xs text-white/80 resize-none focus:outline-none focus:border-cyan-500/50"
        />
      </div>

      {editCode && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded border-white/20 bg-white/5"
          />
          <Label className="text-sm cursor-pointer">Aktif</Label>
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!name.trim() || !htmlCode.trim() || saving}
        className="w-full"
      >
        {saving ? "Menyimpan..." : editCode ? "Update" : "Simpan"}
      </Button>
    </div>
  );
}

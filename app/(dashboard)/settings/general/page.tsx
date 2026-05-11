"use client";
import { useEffect, useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ExchangeRate {
  id: number; fromCurrency: string; toCurrency: string; rate: string; effectiveDate: string;
}

export default function GeneralSettingsPage() {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [form, setForm] = useState({ rate: "", effectiveDate: new Date().toISOString().split("T")[0] });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [latestRate, setLatestRate] = useState<ExchangeRate | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings/exchange-rate")
      .then((r) => r.json())
      .then((data) => {
        setRates(data);
        setLatestRate(data[0] || null);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);

    const res = await fetch("/api/settings/exchange-rate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromCurrency: "USD",
        toCurrency: "IDR",
        rate: parseFloat(form.rate),
        effectiveDate: form.effectiveDate,
      }),
    });

    setSubmitting(false);
    if (res.ok) {
      setSuccess(true);
      fetch("/api/settings/exchange-rate").then((r) => r.json()).then(setRates);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      const data = await res.json();
      setError(data.error ?? "Gagal menyimpan");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Pengaturan Umum</h1>
        <p className="text-white/40 text-sm">Kurs mata uang dan preferensi lainnya</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-white">Kurs USD → IDR</CardTitle>
          {latestRate && (
            <p className="text-sm text-white/50 mt-1">
              Kurs aktif: <span className="text-cyan-400 font-semibold">Rp{parseFloat(latestRate.rate).toLocaleString("id-ID")}</span>
              {" "}per USD (per {new Date(latestRate.effectiveDate).toLocaleDateString("id-ID")})
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
            <div className="space-y-1.5">
              <Label>Kurs Baru (IDR per 1 USD)</Label>
              <Input
                type="number"
                step="1"
                min="1"
                value={form.rate}
                onChange={(e) => setForm({ ...form, rate: e.target.value })}
                required
                placeholder="mis. 16000"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tanggal Berlaku</Label>
              <Input
                type="date"
                value={form.effectiveDate}
                onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
                required
                className="[color-scheme:dark]"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            {success && <p className="text-sm text-green-400">Kurs berhasil disimpan!</p>}
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Simpan Kurs
            </Button>
          </form>
        </CardContent>
      </Card>

      {rates.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/70">Riwayat Kurs</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-6 py-3 text-white/50 font-medium">Tanggal Berlaku</th>
                    <th className="text-right px-6 py-3 text-white/50 font-medium">1 USD =</th>
                  </tr>
                </thead>
                <tbody>
                  {rates.slice(0, 10).map((r) => (
                    <tr key={r.id} className="border-b border-white/5">
                      <td className="px-6 py-3 text-white/60">
                        {new Date(r.effectiveDate).toLocaleDateString("id-ID")}
                        {r.id === latestRate?.id && <span className="ml-2 text-xs text-cyan-400">(Aktif)</span>}
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-white">
                        Rp{parseFloat(r.rate).toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}

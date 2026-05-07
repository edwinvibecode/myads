"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SetupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Password tidak cocok"); return; }
    if (password.length < 8) { setError("Password minimal 8 karakter"); return; }
    setLoading(true);
    setError("");

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Gagal membuat akun");
    } else {
      router.push("/login");
    }
  }

  return (
    <div className="min-h-screen bg-[#080818] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-cyan-500 flex items-center justify-center mb-4">
            <Globe className="h-6 w-6 text-black" />
          </div>
          <h1 className="text-2xl font-bold text-white">Setup Awal</h1>
          <p className="text-white/50 text-sm mt-1">Buat akun admin untuk MyAds Tracker</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} placeholder="kamu@email.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required maxLength={128} placeholder="Min. 8 karakter" />
            </div>
            <div className="space-y-1.5">
              <Label>Konfirmasi Password</Label>
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required maxLength={128} placeholder="Ulangi password" />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Buat Akun
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

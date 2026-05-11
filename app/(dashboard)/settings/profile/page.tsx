"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, Shield, Eye, EyeOff } from "lucide-react";

interface ProfileData {
  id: number;
  email: string;
  twoFactorEnabled: boolean;
  createdAt: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{type: "success" | "error", text: string} | null>(null);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // 2FA
  const [setup2FA, setSetup2FA] = useState(false);
  const [secret, setSecret] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [disabling2FA, setDisabling2FA] = useState(false);
  const [disableCode, setDisableCode] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Password baru tidak cocok" });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password minimal 6 karakter" });
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: data.message });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleSetup2FA() {
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup" }),
      });
      const data = await res.json();
      if (res.ok) {
        setSecret(data.secret);
        setSetup2FA(true);
        setMessage({ type: "success", text: data.message });
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch {
      setMessage({ type: "error", text: "Gagal setup 2FA" });
    }
  }

  async function handleVerify2FA() {
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", code: verifyCode }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: data.message });
        setSetup2FA(false);
        setVerifyCode("");
        fetchProfile();
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch {
      setMessage({ type: "error", text: "Gagal verifikasi" });
    }
  }

  async function handleDisable2FA() {
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable", code: disableCode }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: data.message });
        setDisabling2FA(false);
        setDisableCode("");
        fetchProfile();
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch {
      setMessage({ type: "error", text: "Gagal menonaktifkan 2FA" });
    }
  }

  if (loading) return <div className="p-6 text-white/40">Loading...</div>;

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="text-white/40">Kelola password dan keamanan akun</p>
      </div>

      {message && (
        <div className={`p-3 rounded-lg ${message.type === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
          {message.text}
        </div>
      )}

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white">Informasi Akun</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-white/60">Email</span>
            <span className="text-white font-medium">{profile?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Bergabung</span>
            <span className="text-white font-medium">
              {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("id-ID") : "-"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Ganti Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label>Password Saat Ini</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Password Baru</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Konfirmasi Password Baru</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={changingPassword} className="w-full">
              {changingPassword ? "Menyimpan..." : "Ganti Password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 2FA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication (2FA)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Status 2FA</p>
              <p className="text-sm text-white/60">
                {profile?.twoFactorEnabled ? "Aktif" : "Nonaktif"}
              </p>
            </div>
            {profile?.twoFactorEnabled ? (
              <Button variant="destructive" size="sm" onClick={() => setDisabling2FA(true)}>
                Nonaktifkan
              </Button>
            ) : (
              <Button size="sm" onClick={handleSetup2FA}>
                Aktifkan 2FA
              </Button>
            )}
          </div>

          {/* Setup 2FA Dialog */}
          {setup2FA && (
            <div className="border border-white/10 rounded-lg p-4 space-y-4">
              <p className="text-white/80 text-sm">
                Tambahkan secret key ini ke authenticator app (Google Authenticator, Authy, dll)
              </p>
              <div className="bg-white/5 p-3 rounded text-center">
                <p className="text-xs text-white/60 mb-1">Secret Key</p>
                <code className="text-cyan-400 text-sm break-all">{secret}</code>
              </div>
              <div className="space-y-2">
                <Label>Masukkan kode verifikasi</Label>
                <Input
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleVerify2FA} className="flex-1">Verifikasi</Button>
                <Button variant="outline" onClick={() => setSetup2FA(false)}>Batal</Button>
              </div>
            </div>
          )}

          {/* Disable 2FA Dialog */}
          {disabling2FA && (
            <div className="border border-white/10 rounded-lg p-4 space-y-4">
              <p className="text-white/80 text-sm">
                Masukkan kode 2FA untuk menonaktifkan
              </p>
              <div className="space-y-2">
                <Label>Kode verifikasi</Label>
                <Input
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleDisable2FA} variant="destructive" className="flex-1">
                  Nonaktifkan 2FA
                </Button>
                <Button variant="outline" onClick={() => setDisabling2FA(false)}>Batal</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

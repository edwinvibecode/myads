"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { NETWORK_LABELS, NETWORK_COLORS } from "@/lib/utils";

interface Props {
  data: Record<string, number>;
}

function formatIDR(val: number) {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}jt`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}rb`;
  return String(val);
}

export function NetworkChart({ data }: Props) {
  const chartData = Object.entries(data)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      name: NETWORK_LABELS[key] ?? key,
      value: Math.round(value),
      color: NETWORK_COLORS[key] ?? "#94a3b8",
    }));

  if (chartData.length === 0) {
    return <div className="flex items-center justify-center h-[180px] text-white/30 text-sm">Belum ada data</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
        <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={formatIDR} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} width={45} />
        <Tooltip
          contentStyle={{ background: "#0f0f23", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "white" }}
          formatter={(val) => [formatIDR(Number(val ?? 0)), "Revenue"]}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

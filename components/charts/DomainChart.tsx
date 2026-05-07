"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = ["#22d3ee", "#a78bfa", "#34d399", "#f59e0b", "#f87171", "#60a5fa"];

interface Props {
  data: Record<string, number>;
}

function formatIDR(val: number) {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}jt`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}rb`;
  return String(val);
}

export function DomainChart({ data }: Props) {
  const chartData = Object.entries(data)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value], i) => ({
      name,
      value: Math.round(value),
      color: COLORS[i % COLORS.length],
    }));

  if (chartData.length === 0) {
    return <div className="flex items-center justify-center h-[180px] text-white/30 text-sm">Belum ada data</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
        <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
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

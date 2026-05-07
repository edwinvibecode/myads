"use client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { MONTH_NAMES } from "@/lib/utils";

interface TrendPoint {
  month: number;
  year: number;
  revenue: number;
}

interface Props {
  data: TrendPoint[];
}

function formatIDR(val: number) {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}jt`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}rb`;
  return String(val);
}

export function RevenueChart({ data }: Props) {
  const chartData = data.map((d) => ({
    name: `${MONTH_NAMES[d.month - 1].slice(0, 3)} ${String(d.year).slice(2)}`,
    revenue: Math.round(d.revenue),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={formatIDR} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} width={45} />
        <Tooltip
          contentStyle={{ background: "#0f0f23", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "white" }}
          formatter={(val) => [formatIDR(Number(val ?? 0)), "Revenue"]}
        />
        <Area type="monotone" dataKey="revenue" stroke="#22d3ee" strokeWidth={2} fill="url(#revenueGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type FinanceChartDatum = { month: string; collected: number; pending: number };

const fallbackData: FinanceChartDatum[] = [
  { month: "Jan", collected: 82, pending: 18 },
  { month: "Feb", collected: 88, pending: 12 },
  { month: "Mar", collected: 91, pending: 9 },
  { month: "Apr", collected: 86, pending: 14 },
  { month: "May", collected: 93, pending: 7 }
];

export function FinanceChart({ data = fallbackData }: { data?: FinanceChartDatum[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(100,116,139,0.18)" vertical={false} strokeDasharray="4 6" />
          <XAxis dataKey="month" stroke="#102a56" tick={{ fontWeight: 900 }} />
          <YAxis stroke="#102a56" tick={{ fontWeight: 900 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="collected" fill="#0f766e" radius={[6, 6, 0, 0]} />
          <Bar dataKey="pending" fill="#f59e0b" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

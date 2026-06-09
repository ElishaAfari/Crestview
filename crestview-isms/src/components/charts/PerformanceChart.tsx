"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { term: "T1", average: 78 },
  { term: "T2", average: 81 },
  { term: "T3", average: 84 },
  { term: "T4", average: 86 }
];

export function PerformanceChart() {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="rgba(23,78,166,0.22)" vertical={false} />
          <XAxis dataKey="term" stroke="#102a56" tick={{ fontWeight: 900 }} />
          <YAxis stroke="#102a56" tick={{ fontWeight: 900 }} />
          <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 }} />
          <Line type="monotone" dataKey="average" stroke="#16a34a" strokeWidth={3} dot={{ fill: "#16a34a" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

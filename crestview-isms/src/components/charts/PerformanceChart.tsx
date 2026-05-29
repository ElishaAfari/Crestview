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
          <CartesianGrid stroke="rgba(148,163,184,0.16)" vertical={false} />
          <XAxis dataKey="term" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 }} />
          <Line type="monotone" dataKey="average" stroke="#16a34a" strokeWidth={3} dot={{ fill: "#16a34a" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

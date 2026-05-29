"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { day: "Mon", present: 96 },
  { day: "Tue", present: 94 },
  { day: "Wed", present: 97 },
  { day: "Thu", present: 92 },
  { day: "Fri", present: 95 }
];

export function AttendanceChart() {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(148,163,184,0.16)" vertical={false} />
          <XAxis dataKey="day" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip cursor={{ fill: "rgba(59,130,246,0.08)" }} contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 }} />
          <Bar dataKey="present" fill="#3b82f6" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

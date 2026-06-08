"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { year: "2023", students: 840 },
  { year: "2024", students: 910 },
  { year: "2025", students: 1030 },
  { year: "2026", students: 1180 }
];

export function EnrollmentChart() {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="enrollmentFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(100,116,139,0.18)" vertical={false} strokeDasharray="4 6" />
          <XAxis dataKey="year" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip />
          <Area type="monotone" dataKey="students" stroke="#1d4ed8" strokeWidth={3} fill="url(#enrollmentFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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
        <AreaChart data={data}>
          <defs>
            <linearGradient id="attendanceFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#0f766e" stopOpacity={0.32} />
              <stop offset="95%" stopColor="#0f766e" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(100,116,139,0.18)" vertical={false} strokeDasharray="4 6" />
          <XAxis dataKey="day" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip cursor={{ stroke: "rgba(15,118,110,0.35)" }} />
          <Area type="monotone" dataKey="present" stroke="#0f766e" strokeWidth={3} fill="url(#attendanceFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { grade: "A", value: 32, color: "#16a34a" },
  { grade: "B", value: 41, color: "#3b82f6" },
  { grade: "C", value: 18, color: "#ca8a04" },
  { grade: "D", value: 9, color: "#dc2626" }
];

export function GradeDistributionChart() {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 }} />
          <Pie data={data} dataKey="value" nameKey="grade" innerRadius={58} outerRadius={94} paddingAngle={3}>
            {data.map((entry) => <Cell key={entry.grade} fill={entry.color} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

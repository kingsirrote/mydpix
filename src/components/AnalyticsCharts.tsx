"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";

const COLORS = ["#FF5A1F", "#54F0B4", "#8C8178", "#FF8556", "#B8420F", "#2A2523", "#C9C0B6"];

interface DailyPoint {
  date: string;
  success: number;
  failed: number;
  moderated: number;
}

interface CategoryPoint {
  name: string;
  value: number;
}

export function AnalyticsCharts({ series, categoryData }: { series: DailyPoint[]; categoryData: CategoryPoint[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
      <Card className="p-5">
        <p className="mb-4 text-sm font-medium text-ink-300">Generations — last 14 days</p>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={series}>
            <defs>
              <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF5A1F" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#FF5A1F" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2523" />
            <XAxis dataKey="date" stroke="#8C8178" fontSize={11} />
            <YAxis stroke="#8C8178" fontSize={11} />
            <Tooltip contentStyle={{ background: "#1D1A18", border: "1px solid #2A2523", borderRadius: 8 }} />
            <Area type="monotone" dataKey="success" stroke="#FF5A1F" fill="url(#successGradient)" strokeWidth={2} />
            <Area type="monotone" dataKey="failed" stroke="#8C8178" fill="transparent" strokeWidth={1.5} />
            <Area type="monotone" dataKey="moderated" stroke="#54F0B4" fill="transparent" strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-5">
        <p className="mb-4 text-sm font-medium text-ink-300">Memes by category</p>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
              {categoryData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Legend wrapperStyle={{ fontSize: 11, color: "#C9C0B6" }} />
            <Tooltip contentStyle={{ background: "#1D1A18", border: "1px solid #2A2523", borderRadius: 8 }} />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

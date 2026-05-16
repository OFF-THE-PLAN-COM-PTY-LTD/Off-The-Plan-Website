"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type Development = { id: string; name: string };

type ChartPoint = { month: string; views: number };

interface Props {
  developments: Development[];
}

const PERIOD_OPTIONS = [
  { label: "All Time", value: 0 },
  { label: "Past 12 Months", value: 12 },
  { label: "Past 6 Months", value: 6 },
  { label: "Past 3 Months", value: 3 },
  { label: "Past Month", value: 1 },
];

export default function ReportsDashboard({ developments }: Props) {
  const [developmentId, setDevelopmentId] = useState("");
  const [months, setMonths] = useState(0);
  const [loading, setLoading] = useState(true);

  const [views, setViews] = useState(0);
  const [shares, setShares] = useState(0);
  const [totalEnquiries, setTotalEnquiries] = useState(0);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ months: String(months) });
    if (developmentId) params.set("development_id", developmentId);
    const res = await fetch(`/api/admin/reports?${params}`);
    const json = await res.json();
    setViews(json.views);
    setShares(json.shares);
    setTotalEnquiries(json.totalEnquiries);
    setChartData(json.chartData ?? []);
    setLoading(false);
  }, [developmentId, months]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div>
      {/* Header bar */}
      <div className="bg-navy flex items-center justify-between px-6 py-4 mb-6">
        <h1 className="font-display font-light text-white text-xl">Reports</h1>
        <div className="flex items-center gap-3">
          <label className="font-sans text-sm text-white/70">Project Name:</label>
          <select
            value={developmentId}
            onChange={(e) => setDevelopmentId(e.target.value)}
            className="border border-white/20 bg-navy text-white font-sans text-sm px-3 py-1.5 focus:outline-none focus:border-orange min-w-[260px]"
          >
            <option value="">— All Projects —</option>
            {developments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Views", value: views },
          { label: "Enquiry", value: totalEnquiries },
          { label: "Shares", value: shares },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-line p-5">
            <p className="font-sans text-sm text-ink/50 mb-2">{s.label}</p>
            <p className="font-display text-[42px] font-light text-navy leading-none">
              {loading ? "—" : s.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white border border-line p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="font-sans text-sm font-semibold text-ink">Total Views</p>
          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="border border-line font-sans text-sm text-ink px-3 py-1.5 focus:outline-none focus:border-orange"
          >
            {PERIOD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="h-72 flex items-center justify-center text-ink/30 font-sans text-sm">
            Loading…
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-72 flex items-center justify-center text-ink/30 font-sans text-sm">
            No view data yet. Views will appear here as the site gets traffic.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="viewGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f9a8a8" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#f9a8a8" stopOpacity={0.15} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={true} />
              <XAxis
                dataKey="month"
                tick={{ fontFamily: "sans-serif", fontSize: 11, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontFamily: "sans-serif", fontSize: 11, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="square"
                iconSize={10}
                wrapperStyle={{ fontFamily: "sans-serif", fontSize: 11, color: "#9ca3af" }}
              />
              <Tooltip
                contentStyle={{
                  fontFamily: "sans-serif",
                  fontSize: 12,
                  border: "1px solid #e5e7eb",
                  borderRadius: 0,
                }}
                formatter={(val: number) => [val, "# of Views"]}
              />
              <Area
                type="monotone"
                dataKey="views"
                stroke="#f9a8a8"
                strokeWidth={1.5}
                fill="url(#viewGradient)"
                dot={{ r: 3, fill: "#f9a8a8", stroke: "#f9a8a8", strokeWidth: 1 }}
                activeDot={{ r: 5, fill: "#E8622A" }}
                legendType="square"
                name="# of Views"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

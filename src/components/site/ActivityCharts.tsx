import { memo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, CartesianGrid,
  PieChart, Pie, Cell, Legend, LineChart, Line, RadialBarChart, RadialBar,
} from "recharts";

export type ActivityPoint = { d: string; uploads: number; minutes: number };

const axis = { stroke: "oklch(1 0 0 / 0.35)", fontSize: 11, tickLine: false, axisLine: false } as const;
const tooltipStyle = {
  background: "oklch(0.2 0.03 265 / 0.92)",
  border: "1px solid oklch(1 0 0 / 0.12)",
  borderRadius: 14,
  backdropFilter: "blur(12px)",
  fontSize: 12,
} as const;

export const MinutesArea = memo(function MinutesArea({ data }: { data: ActivityPoint[] }) {
  return (
    <ResponsiveContainer>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.72 0.19 295)" stopOpacity={0.7} />
            <stop offset="100%" stopColor="oklch(0.72 0.19 295)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
        <XAxis dataKey="d" {...axis} />
        <YAxis {...axis} width={38} />
        <Tooltip cursor={{ stroke: "oklch(1 0 0 / 0.15)" }} contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="minutes" stroke="oklch(0.78 0.17 295)" strokeWidth={2} fill="url(#g1)" animationDuration={900} />
      </AreaChart>
    </ResponsiveContainer>
  );
});

export const UploadsBar = memo(function UploadsBar({ data }: { data: ActivityPoint[] }) {
  return (
    <ResponsiveContainer>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.82 0.15 200)" />
            <stop offset="100%" stopColor="oklch(0.62 0.19 258 / 0.35)" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
        <XAxis dataKey="d" {...axis} />
        <YAxis {...axis} width={38} allowDecimals={false} />
        <Tooltip cursor={{ fill: "oklch(1 0 0 / 0.05)" }} contentStyle={tooltipStyle} />
        <Bar dataKey="uploads" fill="url(#g2)" radius={[8, 8, 0, 0]} animationDuration={900} />
      </BarChart>
    </ResponsiveContainer>
  );
});

const PIE_COLORS = [
  "oklch(0.76 0.18 300)",
  "oklch(0.80 0.15 200)",
  "oklch(0.78 0.16 150)",
  "oklch(0.82 0.15 80)",
  "oklch(0.72 0.17 20)",
  "oklch(0.70 0.12 260)",
];

export type NamedValue = { name: string; value: number };

export const DistributionPie = memo(function DistributionPie({ data }: { data: NamedValue[] }) {
  return (
    <ResponsiveContainer>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={3} animationDuration={800}>
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="oklch(1 0 0 / 0.08)" />
          ))}
        </Pie>
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
});

export const HorizontalBars = memo(function HorizontalBars({ data }: { data: NamedValue[] }) {
  return (
    <ResponsiveContainer>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="gh" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="oklch(0.62 0.19 300 / 0.5)" />
            <stop offset="100%" stopColor="oklch(0.82 0.15 200)" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="oklch(1 0 0 / 0.05)" horizontal={false} />
        <XAxis type="number" {...axis} allowDecimals={false} />
        <YAxis type="category" dataKey="name" {...axis} width={110} />
        <Tooltip cursor={{ fill: "oklch(1 0 0 / 0.05)" }} contentStyle={tooltipStyle} />
        <Bar dataKey="value" fill="url(#gh)" radius={[0, 8, 8, 0]} animationDuration={800} />
      </BarChart>
    </ResponsiveContainer>
  );
});

export type TrendPoint = { d: string; value: number };

export const TrendLine = memo(function TrendLine({ data, label }: { data: TrendPoint[]; label: string }) {
  return (
    <ResponsiveContainer>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
        <XAxis dataKey="d" {...axis} />
        <YAxis {...axis} width={38} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, label]} />
        <Line type="monotone" dataKey="value" stroke="oklch(0.82 0.15 200)" strokeWidth={2.5} dot={false} animationDuration={800} />
      </LineChart>
    </ResponsiveContainer>
  );
});

export const RadialGauge = memo(function RadialGauge({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <ResponsiveContainer>
      <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ name: "used", value: pct }]} startAngle={220} endAngle={-40}>
        <RadialBar dataKey="value" cornerRadius={12} fill="oklch(0.76 0.18 300)" background={{ fill: "oklch(1 0 0 / 0.06)" }} animationDuration={900} />
      </RadialBarChart>
    </ResponsiveContainer>
  );
});

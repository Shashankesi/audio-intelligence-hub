import { memo } from "react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, CartesianGrid } from "recharts";

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

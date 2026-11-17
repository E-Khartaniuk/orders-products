"use client";

import { Bar, BarChart, CartesianGrid, LabelList, Tooltip, XAxis, YAxis } from "recharts";
import { CHART, tooltipStyle } from "./chart-theme";

type CountBarChartProps = {
  data: { label: string; count: number }[];
  countLabel: string;
};

const ROW_HEIGHT = 36;

export default function CountBarChart({ data, countLabel }: CountBarChartProps) {
  return (
    <BarChart
      layout="vertical"
      data={data}
      style={{ width: "100%", height: Math.max(data.length * ROW_HEIGHT + 24, 120) }}
      responsive
      margin={{ top: 4, right: 40, bottom: 4, left: 8 }}
      barCategoryGap={8}
    >
      <CartesianGrid horizontal={false} stroke={CHART.grid} />
      <XAxis type="number" hide allowDecimals={false} />
      <YAxis
        type="category"
        dataKey="label"
        width={120}
        tickLine={false}
        axisLine={false}
        tick={{ fill: CHART.text, fontSize: CHART.font }}
      />
      <Tooltip cursor={{ fill: CHART.markSoft }} {...tooltipStyle} />
      <Bar
        dataKey="count"
        name={countLabel}
        fill={CHART.mark}
        radius={[0, 4, 4, 0]}
        maxBarSize={20}
        isAnimationActive={false}
      >
        <LabelList
          dataKey="count"
          position="right"
          fill={CHART.text}
          fontSize={CHART.font}
          fontWeight={600}
        />
      </Bar>
    </BarChart>
  );
}

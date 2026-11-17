"use client";

import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { useLocale } from "use-intl";
import { INTL_LOCALE } from "@/i18n/config";
import { formatAmount } from "@/lib/format";
import type { MonthDatum } from "@/lib/stats";
import { CHART, tooltipStyle } from "./chart-theme";

type MonthlyValueChartProps = {
  data: MonthDatum[];
  valueLabel: string;
};

export default function MonthlyValueChart({ data, valueLabel }: MonthlyValueChartProps) {
  const locale = useLocale();
  const monthFormat = new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
  const compact = new Intl.NumberFormat(INTL_LOCALE[locale], { notation: "compact" });
  const monthLabel = (month: string) => monthFormat.format(new Date(`${month}-01T00:00:00Z`));

  return (
    <AreaChart
      data={data}
      style={{ width: "100%", height: 260 }}
      responsive
      margin={{ top: 12, right: 16, bottom: 4, left: 0 }}
    >
      <CartesianGrid vertical={false} stroke={CHART.grid} />
      <XAxis
        dataKey="month"
        tickFormatter={monthLabel}
        tickLine={false}
        axisLine={{ stroke: CHART.grid }}
        tick={{ fill: CHART.muted, fontSize: CHART.font }}
      />
      <YAxis
        width={56}
        tickFormatter={(value: number) => compact.format(value)}
        tickLine={false}
        axisLine={false}
        tick={{ fill: CHART.muted, fontSize: CHART.font }}
      />
      <Tooltip
        {...tooltipStyle}
        cursor={{ stroke: CHART.muted, strokeDasharray: "3 3" }}
        labelFormatter={(month) => monthLabel(String(month))}
        formatter={(value) => [formatAmount(Number(value), locale), valueLabel]}
      />
      <Area
        type="monotone"
        dataKey="value"
        name={valueLabel}
        stroke={CHART.mark}
        strokeWidth={2}
        fill={CHART.markSoft}
        dot={{ r: 4, fill: CHART.mark, stroke: CHART.surface, strokeWidth: 2 }}
        activeDot={{ r: 5, fill: CHART.mark, stroke: CHART.surface, strokeWidth: 2 }}
        isAnimationActive={false}
      />
    </AreaChart>
  );
}

export const CHART = {
  mark: "#558b2f",
  markSoft: "rgba(85, 139, 47, 0.14)",
  grid: "#dfe5ea",
  text: "#2c3a46",
  muted: "#6b7b88",
  surface: "#ffffff",
  font: 12,
} as const;

export const tooltipStyle = {
  contentStyle: {
    border: `1px solid ${CHART.grid}`,
    borderRadius: 4,
    boxShadow: "0 6px 24px rgba(44, 58, 70, 0.1)",
    color: CHART.text,
    fontSize: CHART.font,
  },
  labelStyle: { color: CHART.text, fontWeight: 600 },
  itemStyle: { color: CHART.text },
} as const;

import clsx from "clsx";
import type { ProductStatus as Status } from "@/types/api";

const STATUS: Record<Status, { label: string; modifier: string }> = {
  FREE: { label: "Свободен", modifier: "free" },
  IN_REPAIR: { label: "В ремонте", modifier: "repair" },
  IN_USE: { label: "Используется", modifier: "in-use" },
};

export function StatusDot({ status }: { status: Status }) {
  return (
    <span
      className={clsx("status-dot", `status-dot--${STATUS[status].modifier}`)}
      role="img"
      aria-label={STATUS[status].label}
    />
  );
}

export function StatusLabel({ status }: { status: Status }) {
  return (
    <span className={clsx("status-label", `status-label--${STATUS[status].modifier}`)}>
      {STATUS[status].label}
    </span>
  );
}

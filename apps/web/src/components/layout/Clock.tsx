"use client";

import { useEffect, useState } from "react";
import { formatHeaderDate, formatTime, formatWeekday } from "@/lib/format";

export function Clock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="clock" aria-live="off">
      <span className="clock__weekday">{now ? formatWeekday(now) : " "}</span>
      <div className="clock__row">
        <time dateTime={now?.toISOString()}>{now ? formatHeaderDate(now) : " "}</time>
        <span className="clock__time">
          <i className="bi bi-clock" aria-hidden="true" />
          {now ? formatTime(now) : "--:--"}
        </span>
      </div>
    </div>
  );
}

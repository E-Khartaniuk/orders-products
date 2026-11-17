import clsx from "clsx";

type StateMessageProps = {
  variant: "empty" | "error";
  message: string;
  onRetry?: () => void;
};

export function StateMessage({ variant, message, onRetry }: StateMessageProps) {
  return (
    <div
      className={clsx("state", `state--${variant}`)}
      role={variant === "error" ? "alert" : "status"}
    >
      <i
        className={clsx("state__icon bi", variant === "error" ? "bi-wifi-off" : "bi-inbox")}
        aria-hidden="true"
      />
      <p className="m-0">{message}</p>
      {onRetry && (
        <button type="button" className="state__retry" onClick={onRetry}>
          Повторить
        </button>
      )}
    </div>
  );
}

export function SkeletonList({ count, height }: { count: number; height: number }) {
  return (
    <div className="d-flex flex-column gap-2" aria-busy="true" aria-label="Загрузка">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="skeleton" style={{ height }} />
      ))}
    </div>
  );
}

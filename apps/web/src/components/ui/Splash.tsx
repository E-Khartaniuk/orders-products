export function Splash({ label = "Загрузка…" }: { label?: string }) {
  return (
    <div className="splash" role="status" aria-live="polite">
      <span className="splash__spinner" aria-hidden="true" />
      <span className="visually-hidden">{label}</span>
    </div>
  );
}

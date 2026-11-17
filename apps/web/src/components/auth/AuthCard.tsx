import type { ReactNode } from "react";

type AuthCardProps = {
  title: string;
  subtitle: string;
  footer: ReactNode;
  children: ReactNode;
};

export function AuthCard({ title, subtitle, footer, children }: AuthCardProps) {
  return (
    <main className="auth-page">
      <section className="auth-page__card" aria-labelledby="auth-title">
        <div className="auth-page__brand">
          <svg className="auth-page__logo" viewBox="0 0 38 44" aria-hidden="true">
            <path d="M19 0 38 6v14c0 12-8 20.5-19 24C8 40.5 0 32 0 20V6L19 0z" fill="#7cb342" />
            <path d="M19 3 35 8.2V20c0 10.2-6.7 17.6-16 20.8V3z" fill="#689f38" />
            <circle cx="19" cy="18" r="6" fill="#f1f8e9" />
            <path
              d="M9.5 33c1.6-5.3 5.2-8 9.5-8s7.9 2.7 9.5 8c-2.6 2.5-5.8 4.3-9.5 5.6-3.7-1.3-6.9-3.1-9.5-5.6z"
              fill="#f1f8e9"
            />
          </svg>
          <span className="auth-page__brand-name">Inventory</span>
        </div>
        <h1 id="auth-title" className="auth-page__title">
          {title}
        </h1>
        <p className="auth-page__subtitle">{subtitle}</p>
        {children}
        <div className="auth-page__footer">{footer}</div>
      </section>
    </main>
  );
}

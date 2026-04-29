import type { ReactNode } from 'react';

export function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-12">
      <div className="mb-5 pb-3 border-b border-[var(--color-border)]">
        <h2 className="text-[var(--text-h2)] font-semibold text-[var(--color-text-primary)]">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] mt-1">
            {subtitle}
          </p>
        )}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function Group({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-[var(--radius-md)] p-5 shadow-[var(--shadow-xs)]">
      <div className="mb-3">
        <div className="text-[var(--text-caption)] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          {label}
        </div>
        {description && (
          <div className="text-[var(--text-body-sm)] text-[var(--color-text-secondary)] mt-1">
            {description}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

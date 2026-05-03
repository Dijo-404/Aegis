import type { ReactNode } from "react";

type SectionCardProps = {
  kicker?: string;
  title: string;
  description?: string;
  children: ReactNode;
};

export function SectionCard({
  kicker,
  title,
  description,
  children,
}: SectionCardProps) {
  return (
    <section className="glass-panel">
      <div className="flex flex-col gap-2">
        {kicker && (
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            {kicker}
          </p>
        )}
        <h2 className="text-xl font-semibold text-ink">{title}</h2>
        {description && <p className="text-sm text-slate-600">{description}</p>}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

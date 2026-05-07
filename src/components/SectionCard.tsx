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
    <section className="stripe-card">
      <div className="flex flex-col gap-2">
        {kicker && <p className="stripe-kicker">{kicker}</p>}
        <h2 className="text-subheading-lg tracking-subheading-lg text-heading">
          {title}
        </h2>
        {description && (
          <p className="text-base font-light leading-relaxed text-body">
            {description}
          </p>
        )}
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}

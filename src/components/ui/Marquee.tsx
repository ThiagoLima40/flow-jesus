import { Fragment } from "react";
import { Cross } from "./Graphics";

/** Faixa deslizante FÉ → DISCIPLINA → LUTA → VITÓRIA → PROPÓSITO. */
export function Marquee({ items, className = "" }: { items: string[]; className?: string }) {
  return (
    <div className={`relative overflow-hidden border-y border-white/10 py-4 ${className}`}>
      <div className="marquee-track">
        {[0, 1].map((rep) => (
          <div key={rep} className="flex items-center" aria-hidden={rep === 1}>
            {items.map((it, i) => (
              <Fragment key={`${rep}-${i}`}>
                <span className="px-6 font-brush text-2xl text-white md:text-3xl">{it}</span>
                <Cross className="h-4 w-3 shrink-0 text-brand-pink" />
              </Fragment>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

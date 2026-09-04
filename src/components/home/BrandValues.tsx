import { Cross, Crown } from "@/components/ui/Graphics";
import { Dumbbell, Heart } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

const values = [
  { title: "FÉ", sub: "Nosso alicerce", icon: "cross", accent: "text-brand-yellow" },
  { title: "DISCIPLINA", sub: "Nossa rotina", icon: "dumbbell", accent: "text-brand-cyan" },
  { title: "LUTA", sub: "Nossa escolha", icon: "fist", accent: "text-brand-pink" },
  { title: "VITÓRIA", sub: "Nossa promessa", icon: "crown", accent: "text-brand-yellow" },
  { title: "PROPÓSITO", sub: "Nossa missão", icon: "heart", accent: "text-brand-cyan" },
];

function Icon({ name, className }: { name: string; className: string }) {
  if (name === "cross") return <Cross className={className} />;
  if (name === "crown") return <Crown className={className} />;
  if (name === "dumbbell") return <Dumbbell className={className} />;
  if (name === "heart") return <Heart className={className} />;
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <path
        d="M8 22c0-6 4-10 10-10h6c4 0 6 3 6 6s-2 5-6 5h-4v9h-8c-6 0-10-4-10-10"
        fill="currentColor"
      />
    </svg>
  );
}

export function BrandValues() {
  return (
    <section className="border-b border-white/10 bg-ink py-14">
      <div className="mx-auto max-w-container px-4 md:px-8">
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-5">
          {values.map((v, i) => (
            <Reveal key={v.title} delay={i * 0.08} className="group flex flex-col items-center text-center">
              <Icon name={v.icon} className={`h-10 w-10 ${v.accent} transition-transform group-hover:-translate-y-1`} />
              <p className="mt-3 font-brush text-3xl text-white">{v.title}</p>
              <p className="font-display text-[0.65rem] tracking-[0.2em] text-white/50">{v.sub}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

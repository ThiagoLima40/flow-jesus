import { videos } from "@/data/videos";
import { StreetImage } from "@/components/ui/StreetImage";
import { Button } from "@/components/ui/Button";
import { BrushUnderline } from "@/components/ui/BrushUnderline";
import { Reveal } from "@/components/ui/Reveal";
import { bjjStats } from "@/data/achievements";
import { Trophy, Clock, Users } from "lucide-react";
import { Cross } from "@/components/ui/Graphics";

function StatIcon({ icon }: { icon: string }) {
  const cls = "h-6 w-6 text-brand-yellow";
  if (icon === "trophy") return <Trophy className={cls} />;
  if (icon === "clock") return <Clock className={cls} />;
  if (icon === "users") return <Users className={cls} />;
  return <Cross className="h-6 w-5 text-brand-yellow" />;
}

export function BjjPreview() {
  const clips = videos.slice(0, 3);
  return (
    <section className="relative overflow-hidden bg-street py-20">
      <div className="mx-auto max-w-container px-4 md:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <Reveal dir="left">
            <p className="mb-3 font-display text-sm tracking-[0.3em] text-brand-pink">FLOW BJJ</p>
            <h2 className="headline text-4xl leading-[0.9] md:text-6xl">
              <span className="text-white">Fé no tatame.</span>
              <br />
              <span className="text-brand-yellow">Cristo no centro.</span>
            </h2>
            <BrushUnderline color="cyan" className="mt-3 h-4 w-2/3" />
            <p className="mt-5 max-w-md text-white/70">
              Jiu-jítsu é mais que luta. É{" "}
              <span className="text-brand-pink">propósito</span>,{" "}
              <span className="text-brand-cyan">disciplina</span> e eternidade.
            </p>
            <div className="mt-6 flex flex-wrap gap-6">
              {bjjStats.slice(0, 3).map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <StatIcon icon={s.icon} />
                  <div>
                    <p className="font-brush text-2xl leading-none">{s.value}</p>
                    <p className="font-display text-[0.55rem] tracking-[0.15em] text-white/50">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Button href="/flow-bjj" variant="pink">
                VER FLOW BJJ
              </Button>
            </div>
          </Reveal>

          <Reveal dir="right" className="grid grid-cols-2 gap-3">
            <StreetImage
              src=""
              alt="Isaque treinando jiu-jítsu"
              kind="video"
              accent="pink"
              label="TREINO"
              className="col-span-2 aspect-video w-full"
            />
            {clips.slice(1).map((v) => (
              <StreetImage
                key={v.id}
                src=""
                alt={v.title}
                kind="video"
                accent={v.accent}
                label={v.title}
                className="aspect-video w-full"
              />
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

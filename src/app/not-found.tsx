import { Button } from "@/components/ui/Button";
import { SmileyCross, Splatter, Crown } from "@/components/ui/Graphics";

export default function NotFound() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-street tex-noise px-4 text-center">
      <Splatter className="pointer-events-none absolute -left-10 top-20 h-72 w-72 text-brand-pink/20" />
      <Splatter className="pointer-events-none absolute -right-10 bottom-10 h-80 w-80 text-brand-cyan/20" />
      <div className="relative">
        <SmileyCross className="mx-auto h-24 w-24 text-brand-yellow" />
        <div className="relative mt-6 inline-block">
          <Crown className="absolute -right-6 -top-8 h-8 w-12 rotate-12 text-brand-pink" />
          <h1 className="headline text-7xl text-white md:text-9xl">
            4<span className="text-brand-pink">0</span>4
          </h1>
        </div>
        <p className="mt-4 font-brush text-3xl">
          Essa página seguiu outro <span className="text-brand-yellow">flow.</span>
        </p>
        <p className="mx-auto mt-2 max-w-md text-white/60">
          O caminho que você procurava não existe — mas o propósito continua. Volte pro movimento.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button href="/" variant="pink">VOLTAR PRA HOME</Button>
          <Button href="/colecao" variant="outline">VER COLEÇÃO</Button>
        </div>
      </div>
    </section>
  );
}

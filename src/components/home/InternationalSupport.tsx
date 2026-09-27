import { Globe, ArrowUpRight } from "lucide-react";

export function InternationalSupport() {
  return (
    <section
      id="apoio-internacional"
      aria-labelledby="international-support-title"
      className="border-t border-white/10 bg-street py-16 md:py-24"
    >
      <div className="mx-auto grid max-w-container items-center gap-10 px-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:gap-12 md:px-8">
        <div className="min-w-0">
          <p className="mb-4 font-display text-xs tracking-[0.25em] text-brand-cyan">
            APOIO INTERNACIONAL
          </p>
          <h2 id="international-support-title" className="headline text-4xl leading-tight sm:text-5xl lg:text-6xl">
            APOIE A FLOWJESUS <span className="text-brand-yellow">DO EXTERIOR 🌎</span>
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg">
            Mora fora do Brasil e quer apoiar nosso propósito? Você pode contribuir internacionalmente. Os valores ajudam nos custos de campeonatos e na continuidade do projeto FlowJesus.
          </p>
        </div>

        <div className="min-w-0 border border-brand-yellow/40 bg-black p-6 shadow-card sm:p-8">
          <Globe aria-hidden="true" className="mb-5 h-8 w-8 text-brand-cyan" />
          <ul className="space-y-3 text-sm leading-relaxed text-white/80 sm:text-base">
            <li>Estados Unidos e outros países</li>
            <li>Pagamento internacional via Wise</li>
            <li>Recebimento no Brasil</li>
          </ul>
          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="text-sm leading-relaxed text-white/80">
              <span className="font-semibold text-brand-yellow">Pedidos internacionais com envio de camiseta:</span>{" "}
              o frete internacional é calculado separadamente de acordo com o endereço de entrega e é pago pelo cliente antes do envio.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-white/60">
              Entre em contato conosco após o pagamento para informar o endereço completo e calcular o frete internacional.
            </p>
          </div>
          <a
            href="https://wise.com/pay/me/thiagoo817"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="APOIAR PELA WISE 🌎 (abre em nova aba)"
            className="btn btn-yellow mt-8 w-full justify-center text-center"
          >
            <span>APOIAR PELA WISE 🌎</span>
            <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" />
          </a>
          <p className="mt-4 text-center text-xs leading-relaxed text-white/60">
            Você será direcionado para a página segura de pagamento da Wise.
          </p>
        </div>
      </div>
    </section>
  );
}

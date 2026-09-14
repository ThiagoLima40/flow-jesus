"use client";

import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Lock, PartyPopper } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatBRL } from "@/data/products";
import { Button } from "@/components/ui/Button";
import { StreetImage } from "@/components/ui/StreetImage";
import { Cross } from "@/components/ui/Graphics";

const steps = ["Identificação", "Endereço", "Entrega", "Pagamento", "Confirmação"];

function Field({ label, type = "text", full = false }: { label: string; type?: string; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="mb-1 block font-display text-xs tracking-[0.15em] text-white/60">{label.toUpperCase()}</label>
      <input type={type} className="h-11 w-full border border-white/20 bg-transparent px-3 text-sm outline-none focus:border-brand-cyan" />
    </div>
  );
}

export function CheckoutClient() {
  const { items, getProduct, subtotal } = useCart();
  const [step, setStep] = useState(0);
  const [ship, setShip] = useState("normal");
  const [pay, setPay] = useState("pix");
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const shipCost = ship === "expressa" ? 34.9 : subtotal > 250 ? 0 : 19.9;
  const total = subtotal + shipCost;

  if (items.length === 0 && step < 4) {
    return (
      <div className="flex flex-col items-center gap-4 py-32 text-center">
        <Cross className="h-14 w-11 text-white/20" />
        <h1 className="headline text-3xl">Nada para finalizar ainda</h1>
        <Button href="/colecao" variant="pink">VER COLEÇÃO</Button>
      </div>
    );
  }

  const next = async () => {
    if (step === 3) {
      if (submitting) return;
      setSubmitting(true);
      setCheckoutError("");
      try {
        const response = await fetch("/api/mercadopago/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items, shipping: ship }),
        });
        const result = await response.json();
        if (!response.ok || typeof result.checkout_url !== "string") {
          throw new Error(result.error || "Não foi possível iniciar o pagamento.");
        }
        window.location.assign(result.checkout_url);
      } catch (error) {
        setCheckoutError(error instanceof Error ? error.message : "Não foi possível iniciar o pagamento.");
        setSubmitting(false);
      }
      return;
    }
    setStep((s) => Math.min(steps.length - 1, s + 1));
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div className="mx-auto max-w-container px-4 py-12 md:px-8">
      <h1 className="headline text-4xl md:text-5xl">
        <span className="text-white">CHECK</span>
        <span className="text-brand-yellow">OUT</span>
      </h1>

      {/* stepper */}
      <div className="no-scrollbar mt-8 flex gap-2 overflow-x-auto">
        {steps.map((s, i) => (
          <div key={s} className="flex shrink-0 items-center gap-2">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-display ${
                i < step ? "bg-brand-cyan text-ink" : i === step ? "bg-brand-pink text-white" : "border border-white/20 text-white/40"
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span className={`text-xs tracking-[0.12em] ${i === step ? "text-white" : "text-white/40"}`}>{s.toUpperCase()}</span>
            {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-white/15" />}
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
        <div className="min-h-[280px] border border-white/10 bg-black/30 p-6 md:p-8">
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome completo" full />
              <Field label="E-mail" type="email" />
              <Field label="CPF" />
              <Field label="Telefone / WhatsApp" full />
            </div>
          )}
          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="CEP" />
              <Field label="Cidade" />
              <Field label="Endereço" full />
              <Field label="Número" />
              <Field label="Complemento" />
              <Field label="Bairro" />
              <Field label="Estado" />
            </div>
          )}
          {step === 2 && (
            <div className="space-y-3">
              {[
                { id: "normal", t: "Entrega padrão", d: "3 a 10 dias úteis", c: subtotal > 250 ? "Grátis" : "R$ 19,90" },
                { id: "expressa", t: "Entrega expressa", d: "1 a 3 dias úteis", c: "R$ 34,90" },
              ].map((o) => (
                <label
                  key={o.id}
                  className={`flex cursor-pointer items-center justify-between border p-4 ${ship === o.id ? "border-brand-pink" : "border-white/15"}`}
                >
                  <div className="flex items-center gap-3">
                    <input type="radio" name="ship" checked={ship === o.id} onChange={() => setShip(o.id)} className="accent-brand-pink" />
                    <div>
                      <p className="font-display text-sm tracking-wide">{o.t}</p>
                      <p className="text-xs text-white/50">{o.d}</p>
                    </div>
                  </div>
                  <span className="text-brand-yellow">{o.c}</span>
                </label>
              ))}
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex gap-2">
                {[
                  { id: "pix", t: "Pix" },
                  { id: "cartao", t: "Cartão" },
                  { id: "boleto", t: "Boleto" },
                ].map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setPay(o.id)}
                    className={`flex-1 border py-3 font-display text-sm tracking-wide ${pay === o.id ? "border-brand-pink bg-brand-pink/10 text-white" : "border-white/15 text-white/60"}`}
                  >
                    {o.t}
                  </button>
                ))}
              </div>
              <p className="text-sm text-white/60">Você será redirecionado ao Mercado Pago para escolher e concluir o pagamento com segurança.</p>
              <p className="flex items-center gap-2 text-xs text-white/40">
                <Lock className="h-3.5 w-3.5" /> Ambiente seguro · nenhum dado de cartão é armazenado.
              </p>
            </div>
          )}
          {step === 4 && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <PartyPopper className="h-14 w-14 text-brand-yellow" />
              <h2 className="headline text-3xl">
                <span className="text-white">Pedido </span>
                <span className="text-brand-pink">confirmado!</span>
              </h2>
              <p className="max-w-md text-white/60">
                Obrigado por fazer parte do movimento. Você receberá os detalhes por e-mail. Fé no
                processo — sua encomenda está a caminho.
              </p>
              <Button href="/colecao" variant="pink">CONTINUAR COMPRANDO</Button>
            </div>
          )}

          {step < 4 && (
            <div className="mt-8 flex items-center justify-between">
              <button onClick={back} disabled={step === 0} className="flex items-center gap-1 text-sm text-white/60 disabled:opacity-30">
                <ChevronLeft className="h-4 w-4" /> Voltar
              </button>
              <button onClick={next} disabled={submitting} className="btn btn-pink disabled:opacity-50">
                {submitting ? "AGUARDE..." : step === 3 ? "FINALIZAR PEDIDO" : "CONTINUAR"} <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
          {checkoutError && <p role="alert" className="mt-4 text-sm text-brand-pink">{checkoutError}</p>}
        </div>

        {/* resumo */}
        <aside className="h-fit border border-white/10 bg-black/30 p-6">
          <h2 className="font-brush text-2xl">Seu pedido</h2>
          <div className="mt-4 space-y-3">
            {items.map((item) => {
              const p = getProduct(item.productId);
              if (!p) return null;
              return (
                <div key={`${item.productId}-${item.size}-${item.color}`} className="flex items-center gap-3">
                  <StreetImage src={p.images[0]} alt={p.name} kind="product" accent={p.accent} label={p.name} className="h-14 w-12 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{p.name}</p>
                    <p className="text-xs text-white/45">{item.size} · {item.qty}x</p>
                  </div>
                  <span className="text-sm text-brand-yellow">{formatBRL(p.price * item.qty)}</span>
                </div>
              );
            })}
          </div>
          <dl className="mt-5 space-y-2 border-t border-white/10 pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-white/60">Subtotal</dt><dd>{formatBRL(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-white/60">Frete</dt><dd>{shipCost === 0 ? "Grátis" : formatBRL(shipCost)}</dd></div>
            <div className="flex justify-between border-t border-white/10 pt-2"><dt className="font-display tracking-[0.15em]">TOTAL</dt><dd className="font-brush text-xl text-brand-yellow">{formatBRL(total)}</dd></div>
          </dl>
        </aside>
      </div>
    </div>
  );
}

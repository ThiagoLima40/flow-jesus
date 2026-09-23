"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Minus, Plus, Trash2 } from "lucide-react";
import { pixDiscountCents } from "@/lib/pricing";
import { useCart } from "@/context/CartContext";
import { formatBRL, getProductImages } from "@/data/products";
import { StreetImage } from "@/components/ui/StreetImage";
import { Button } from "@/components/ui/Button";
import { Cross } from "@/components/ui/Graphics";
import { brazilianStates, parseOrderContact, validCheckoutId, type Customer } from "@/lib/order-input";

export function CartPage() {
  const { items, getProduct, updateQuantity, removeItem, subtotal, count, clearCart } = useCart();
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"other" | "pix">("other");
  const [customer, setCustomer] = useState<Customer>({ name: "", email: "", phone: "" });
  const [address, setAddress] = useState({ street: "", number: "", complement: "", neighborhood: "", city: "", state: "" });
  const [orderNumber, setOrderNumber] = useState("");
  const subtotalCents = items.reduce((sum, item) => sum + Math.round((getProduct(item.productId)?.price ?? 0) * 100) * item.qty, 0);
  const couponDiscount = appliedCoupon === "FLOW10" ? Math.round(subtotalCents / 10) : 0;
  const pixDiscount = paymentMethod === "pix" ? pixDiscountCents(subtotalCents) : 0;
  const discount = (couponDiscount + pixDiscount) / 100;
  const checkoutAttempt = useRef<{ key: string; id: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [shippingOptions, setShippingOptions] = useState<Array<{ id: number; name: string; company: string | null; price: number; delivery_time: number }>>([]);
  const [selectedShipping, setSelectedShipping] = useState<number | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState("");
  const checkoutPending = useRef(false);
  const quoteKey = JSON.stringify({ postalCode, items });
  const currentQuoteKey = useRef(quoteKey);
  currentQuoteKey.current = quoteKey;
  const requestId = useRef(0);
  const [quotedKey, setQuotedKey] = useState("");
  useEffect(() => {
    requestId.current += 1;
    setShippingOptions([]);
    setSelectedShipping(null);
    setQuotedKey("");
    setShippingError("");
    setShippingLoading(false);
  }, [quoteKey]);
  const selectedOption = quotedKey === quoteKey ? shippingOptions.find((option) => option.id === selectedShipping) : undefined;
  const shipping = selectedOption?.price ?? 0;
  const total = (subtotalCents - couponDiscount - pixDiscount + Math.round(shipping * 100)) / 100;

  const applyCoupon = () => {
    setAppliedCoupon(coupon.trim().toUpperCase() === "FLOW10" ? "FLOW10" : "");
  };

  const calculateShipping = async () => {
    if (postalCode.length !== 8 || !items.length) return;
    const id = ++requestId.current;
    const key = quoteKey;
    setShippingOptions([]); setSelectedShipping(null); setQuotedKey("");
    setShippingLoading(true); setShippingError("");
    try {
      const response = await fetch("https://flowjesus-melhor-envio.flowjesusoficial.workers.dev/api/melhor-envio/quote", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(20000),
        body: JSON.stringify({ toPostalCode: postalCode, products: items.map((item) => {
          const product = getProduct(item.productId);
          return { id: item.productId, width: 25, height: 8, length: 30, weight: 0.3, insuranceValue: product?.price ?? 0, quantity: item.qty };
        }) }),
      });
      const result = await response.json();
      if (!response.ok || !Array.isArray(result.services) || result.services.length === 0) throw new Error(result.error || "Nenhuma modalidade disponível para este CEP.");
      if (id !== requestId.current || key !== currentQuoteKey.current) return;
      setShippingOptions(result.services); setQuotedKey(key);
    } catch (error) { if (id === requestId.current && key === currentQuoteKey.current) setShippingError(error instanceof Error ? error.message : "Não foi possível calcular o frete."); }
    finally { if (id === requestId.current) setShippingLoading(false); }
  };

  const startCheckout = async () => {
    if (checkoutPending.current || shippingLoading || !selectedOption) return;
    const contact = parseOrderContact(customer, { ...address, postalCode, country: "BR" });
    if (!contact) { setCheckoutError("Confira nome, e-mail, telefone com DDD e endereço completo para entrega."); return; }
    checkoutPending.current = true;
    setSubmitting(true);
    setCheckoutError("");
    try {
      const intent = { items, ...contact, paymentMethod,
        shipping: { amountCents: Math.round(shipping * 100), serviceId: selectedOption.id, postalCode },
        coupon: appliedCoupon, discountCents: Math.round(discount * 100), totalCents: Math.round(total * 100) };
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(intent)));
      const attemptKey = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
      // Store only an opaque attempt ID and digest, never the delivery/contact data.
      if (!checkoutAttempt.current) {
        try {
          const saved = JSON.parse(sessionStorage.getItem("flowjesus.checkout-attempt.v1") || "null");
          if (saved && typeof saved.key === "string" && validCheckoutId(saved.id)) checkoutAttempt.current = saved;
        } catch { /* Storage may be disabled. The in-page ref still protects retries. */ }
      }
      if (checkoutAttempt.current?.key !== attemptKey) {
        checkoutAttempt.current = { key: attemptKey, id: crypto.randomUUID() };
      }
      try { sessionStorage.setItem("flowjesus.checkout-attempt.v1", JSON.stringify(checkoutAttempt.current)); } catch { /* Optional retry aid. */ }
      const response = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...intent, checkoutRequestId: checkoutAttempt.current.id,
        }),
      });
      const result = await response.json();
      setOrderNumber(typeof result.order_number === "string" ? result.order_number : "");
      if (!response.ok || typeof result.checkout_url !== "string" || typeof result.order_number !== "string") {
        throw new Error(result.error || "Não foi possível iniciar o pagamento.");
      }
      window.location.assign(result.checkout_url);
    } catch (error) {
      setSelectedShipping(null);
      setQuotedKey("");
      setShippingOptions([]);
      setCheckoutError(error instanceof Error ? error.message : "Não foi possível iniciar o pagamento.");
      checkoutPending.current = false;
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-container flex-col items-center gap-5 px-4 py-32 text-center">
        <Cross className="h-16 w-12 text-white/20" />
        <h1 className="headline text-4xl md:text-5xl">Seu carrinho está vazio</h1>
        <p className="max-w-md text-white/55">
          Ainda não há nada por aqui. Que tal vestir aquilo em que você acredita?
        </p>
        <Button href="/colecao" variant="pink">VER COLEÇÃO</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-container px-4 py-12 md:px-8">
      <h1 className="headline text-4xl md:text-6xl">
        <span className="text-white">MEU </span>
        <span className="text-brand-yellow">CARRINHO</span>
        <span className="ml-3 font-sans text-lg text-white/50">({count})</span>
      </h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        {/* itens */}
        <div className="divide-y divide-white/10 border-y border-white/10">
          {items.map((item) => {
            const p = getProduct(item.productId);
            if (!p) return null;
            return (
              <div key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-4 py-6">
                <StreetImage
                  src={getProductImages(p, item.color)[0]}
                  alt={p.name}
                  kind="product"
                  accent={p.accent}
                  label={p.name}
                  className="h-32 w-24 shrink-0"
                />
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-base tracking-wide">{p.name}</h3>
                      <p className="text-sm text-white/50">
                        {item.size} · {item.color}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId, item.size, item.color)}
                      aria-label="Remover"
                      className="text-white/40 hover:text-brand-pink"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center border border-white/15">
                      <button onClick={() => updateQuantity(item.productId, item.size, item.color, item.qty - 1)} aria-label="Diminuir" className="p-2 hover:text-brand-pink">
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center tabular-nums">{item.qty}</span>
                      <button onClick={() => updateQuantity(item.productId, item.size, item.color, item.qty + 1)} aria-label="Aumentar" className="p-2 hover:text-brand-pink">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="font-display text-lg text-brand-yellow">{formatBRL(p.price * item.qty)}</span>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="flex justify-between py-4">
            <button onClick={clearCart} className="text-sm text-white/40 hover:text-brand-pink">
              Esvaziar carrinho
            </button>
            <Button href="/colecao" variant="outline" arrow={false} className="!px-4 !py-2 text-xs">
              CONTINUAR COMPRANDO
            </Button>
          </div>
          <form id="order-contact" onSubmit={event => { event.preventDefault(); void startCheckout(); }} className="py-6">
            <fieldset disabled={submitting} className="space-y-5">
              <legend className="mb-5 font-brush text-2xl">Dados para entrega</legend>
              <p className="text-sm text-white/60">Informe quem receberá a compra e o endereço completo. Usaremos estes dados para preparar e enviar seu pedido.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {([
                  ["name", "Nome completo", "text", "name", 120],
                  ["email", "E-mail", "email", "email", 254],
                  ["phone", "Telefone com DDD", "tel", "tel", 25],
                ] as const).map(([key, label, type, autoComplete, maxLength]) => <label key={key} className="block text-sm">
                  <span className="mb-2 block text-white/70">{label}</span>
                  <input name={key} type={type} autoComplete={autoComplete} required maxLength={maxLength} value={customer[key]}
                    onChange={event => setCustomer(current => ({ ...current, [key]: event.target.value }))}
                    className="h-11 w-full border border-white/20 bg-transparent px-3 outline-none focus:border-brand-cyan" />
                </label>)}
                <label className="block text-sm"><span className="mb-2 block text-white/70">CEP de entrega</span>
                  <input name="postalCode" autoComplete="shipping postal-code" inputMode="numeric" required pattern="[0-9]{8}" maxLength={8} value={postalCode}
                    onChange={event => setPostalCode(event.target.value.replace(/\D/g, "").slice(0, 8))}
                    className="h-11 w-full border border-white/20 bg-transparent px-3 outline-none focus:border-brand-cyan" />
                </label>
                {([
                  ["street", "Rua / avenida", "shipping address-line1", 160],
                  ["number", "Número (ou S/N)", "off", 20],
                  ["complement", "Complemento (opcional)", "shipping address-line2", 120],
                  ["neighborhood", "Bairro", "shipping address-level3", 100],
                  ["city", "Cidade", "shipping address-level2", 100],
                ] as const).map(([key, label, autoComplete, maxLength]) => <label key={key} className="block text-sm">
                  <span className="mb-2 block text-white/70">{label}</span>
                  <input name={key} autoComplete={autoComplete} required={key !== "complement"} maxLength={maxLength} value={address[key]}
                    onChange={event => setAddress(current => ({ ...current, [key]: event.target.value }))}
                    className="h-11 w-full border border-white/20 bg-transparent px-3 outline-none focus:border-brand-cyan" />
                </label>)}
                <label className="block text-sm"><span className="mb-2 block text-white/70">Estado</span>
                  <select name="state" autoComplete="shipping address-level1" required value={address.state}
                    onChange={event => setAddress(current => ({ ...current, state: event.target.value }))}
                    className="h-11 w-full border border-white/20 bg-ink px-3 outline-none focus:border-brand-cyan">
                    <option value="">Selecione</option>{brazilianStates.map(state => <option key={state} value={state}>{state}</option>)}
                  </select>
                </label>
              </div>
            </fieldset>
          </form>
        </div>

        {/* resumo */}
        <aside className="h-fit border border-white/10 bg-black/30 p-6">
          <h2 className="font-brush text-2xl">Resumo</h2>

          <div className="mt-4 flex gap-2">
            <input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Cupom (ex: FLOW10)"
              className="h-11 flex-1 border border-white/20 bg-transparent px-3 text-sm outline-none focus:border-brand-cyan"
              aria-label="Cupom de desconto"
            />
            <button onClick={applyCoupon} className="border border-white/20 px-4 text-sm hover:border-brand-pink">
              Aplicar
            </button>
          </div>

          <div className="mt-4">
            <label htmlFor="shipping-postal-code" className="mb-2 block text-xs font-display tracking-[0.14em] text-white/70">CEP DE ENTREGA</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input id="shipping-postal-code" value={postalCode} onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="00000-000" inputMode="numeric" autoComplete="postal-code" className="h-11 min-w-0 flex-1 border border-white/20 bg-transparent px-3 text-sm outline-none focus:border-brand-cyan" aria-label="CEP de entrega" />
              <button onClick={calculateShipping} disabled={shippingLoading || postalCode.length !== 8} className="h-11 w-full border border-brand-cyan px-3 text-xs font-display tracking-[0.08em] disabled:opacity-40 sm:w-auto">{shippingLoading ? "CALCULANDO..." : "CALCULAR FRETE"}</button>
            </div>
          </div>
          {shippingError && <p role="alert" className="mt-2 text-xs text-brand-pink">{shippingError}</p>}
          {quotedKey === quoteKey && shippingOptions.length > 0 && <fieldset className="mt-3 space-y-2"><legend className="sr-only">Modalidades disponíveis</legend>{shippingOptions.map((option) => <label key={option.id} className={`flex cursor-pointer items-center justify-between gap-3 border p-3 text-xs ${selectedShipping === option.id ? "border-brand-pink bg-brand-pink/5" : "border-white/10"}`}><span className="flex min-w-0 items-start"><input type="radio" name="shipping-option" checked={selectedShipping === option.id} onChange={() => setSelectedShipping(option.id)} className="mr-2 mt-0.5 shrink-0 accent-brand-pink" /><span className="leading-5">{option.name}{option.company ? ` · ${option.company}` : ""}<br /><span className="text-white/55">Prazo: {option.delivery_time} dias úteis</span></span></span><strong className="shrink-0 text-brand-yellow">{formatBRL(option.price)}</strong></label>)}</fieldset>}

          <fieldset className="mt-6 space-y-3" disabled={submitting}>
            <legend className="mb-2 font-display text-sm tracking-wide">FORMA DE PAGAMENTO</legend>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="payment-method" checked={paymentMethod === "other"} onChange={() => setPaymentMethod("other")} className="accent-brand-pink" />
              Cartão e outros meios
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="payment-method" checked={paymentMethod === "pix"} onChange={() => setPaymentMethod("pix")} className="accent-brand-pink" />
              Pix — 5% OFF nos produtos
            </label>
            {paymentMethod === "pix" && <p className="mt-2 text-xs text-white/55">5% sobre o subtotal dos produtos. O frete não recebe desconto. O Pix usará o e-mail informado nos dados para entrega.</p>}
          </fieldset>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-white/60">Subtotal</dt>
              <dd>{formatBRL(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/60">Frete</dt>
              <dd>{selectedOption ? (shipping === 0 ? "Grátis" : formatBRL(shipping)) : "A calcular"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/60">Desconto do cupom</dt>
              <dd className="text-brand-cyan">{couponDiscount > 0 ? `- ${formatBRL(couponDiscount / 100)}` : "—"}</dd>
            </div>
            {paymentMethod === "pix" && <div className="flex justify-between">
              <dt className="text-white/60">Desconto Pix (5%)</dt>
              <dd className="text-brand-cyan">- {formatBRL(pixDiscount / 100)}</dd>
            </div>}
            <div className="flex justify-between border-t border-white/10 pt-3">
              <dt className="font-display tracking-[0.15em]">{selectedOption ? "TOTAL" : "TOTAL SEM FRETE"}</dt>
              <dd className="font-brush text-2xl text-brand-yellow">{formatBRL(total)}</dd>
            </div>
          </dl>

          <button type="submit" form="order-contact" disabled={submitting || shippingLoading || !selectedOption} aria-busy={submitting} className="btn btn-pink mt-6 w-full justify-center disabled:opacity-50">
            <span>{submitting ? "AGUARDE..." : "FINALIZAR COMPRA"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          {checkoutError && <p role="alert" className="mt-3 text-sm text-brand-pink">{checkoutError}</p>}
          {orderNumber && <p className="mt-3 break-all text-sm text-white/70">Pedido: {orderNumber}. Se precisar de ajuda, <a href="/contato" className="underline">entre em contato</a>.</p>}
          <p className="mt-3 text-center text-xs text-white/40">{selectedOption ? "Compra segura · Pagamento pelo Mercado Pago" : "Calcule o frete e selecione uma opção para finalizar."}</p>
        </aside>
      </div>
    </div>
  );
}

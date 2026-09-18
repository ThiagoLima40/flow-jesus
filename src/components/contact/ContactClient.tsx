"use client";

import { useRef, useState } from "react";
import { MessageCircle, Mail, Instagram, MapPin, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/Button";

const faqs = [
  { q: "Qual o prazo de entrega?", a: "Enviamos para todo o Brasil. O prazo e o valor do frete são calculados de acordo com o CEP e a modalidade de entrega escolhida no carrinho." },
  { q: "Como funcionam as trocas?", a: "Troca fácil em até 7 dias após o recebimento. A peça deve estar sem uso e com etiqueta. Fale com a gente pelo WhatsApp." },
  { q: "Quais as formas de pagamento?", a: "Cartão de crédito em até 3x sem juros, Pix e boleto. O pagamento é 100% seguro." },
  { q: "Como faço para ser um embaixador?", a: "Amamos o movimento crescendo! Envie uma mensagem contando sua história e sua conexão com a fé e o esporte." },
];

const contacts = [
  { icon: MessageCircle, label: "WhatsApp", value: "+55 (11) 94037-5607", href: "https://wa.me/5511940375607", accent: "text-brand-cyan" },
  { icon: Mail, label: "E-mail", value: "flowjesusoficial@gmail.com", href: "mailto:flowjesusoficial@gmail.com", accent: "text-brand-pink" },
  { icon: Instagram, label: "Instagram", value: "@isaquelimajj", href: "https://www.instagram.com/isaquelimajj/", external: true, accent: "text-brand-yellow" },
  { icon: MapPin, label: "Localização", value: "São Paulo • Brasil", accent: "text-brand-cyan" },
];

export function ContactClient() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const sendingRef = useRef(false);
  const [open, setOpen] = useState<number | null>(0);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sendingRef.current) return;

    const form = event.currentTarget;
    const fields = new FormData(form);
    const name = String(fields.get("name") ?? "").trim();
    const email = String(fields.get("email") ?? "").trim();
    const subject = String(fields.get("subject") ?? "").trim();
    const message = String(fields.get("message") ?? "").trim();

    if (!name || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
        !subject || subject.length > 150 || !message || message.length > 5000) {
      setError("Confira nome, e-mail, assunto e mensagem antes de enviar.");
      return;
    }

    sendingRef.current = true;
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || "Não foi possível enviar sua mensagem. Tente novamente.");
      }
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível enviar sua mensagem. Tente novamente.");
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  return (
    <section className="bg-street py-16">
      <div className="mx-auto max-w-container px-4 md:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* contatos */}
          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              {contacts.map(({ icon: Icon, label, value, accent, ...link }) => (
                <div key={label} className="border border-white/10 bg-black/30 p-5">
                  <Icon className={`h-6 w-6 ${accent}`} />
                  <p className="mt-3 font-display text-xs tracking-[0.2em] text-white/50">{label.toUpperCase()}</p>
                  <p className="mt-1 text-white">
                    {"href" in link ? (
                      <a href={link.href} target={"external" in link ? "_blank" : undefined} rel={"external" in link ? "noopener noreferrer" : undefined}>
                        {value}
                      </a>
                    ) : value}
                  </p>
                </div>
              ))}
            </div>

            <h2 className="mt-10 font-brush text-3xl">Perguntas frequentes</h2>
            <div className="mt-4 divide-y divide-white/10 border-y border-white/10">
              {faqs.map((f, i) => (
                <div key={f.q}>
                  <button
                    onClick={() => setOpen(open === i ? null : i)}
                    className="flex w-full items-center justify-between gap-4 py-4 text-left"
                    aria-expanded={open === i}
                  >
                    <span className="font-display text-sm tracking-wide">{f.q}</span>
                    {open === i ? <Minus className="h-4 w-4 shrink-0 text-brand-pink" /> : <Plus className="h-4 w-4 shrink-0" />}
                  </button>
                  {open === i && <p className="pb-4 text-sm text-white/65">{f.a}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* formulário */}
          <div className="border border-white/10 bg-black/30 p-6 md:p-8">
            <h2 className="font-brush text-3xl">
              Envie sua <span className="text-brand-pink">mensagem</span>
            </h2>
            {sent ? (
              <div className="mt-8 border border-brand-cyan/40 bg-brand-cyan/5 p-6 text-center">
                <p className="font-brush text-2xl text-brand-cyan">Mensagem enviada! 🙌</p>
                <p className="mt-1 text-sm text-white/60">Logo entraremos em contato. Fé no processo.</p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                aria-busy={sending}
                className="mt-6 space-y-4"
              >
                <fieldset disabled={sending} className="space-y-4">
                {[
                  { id: "nome", name: "name", label: "Nome", type: "text", maxLength: 100 },
                  { id: "email", name: "email", label: "E-mail", type: "email", maxLength: 254 },
                  { id: "assunto", name: "subject", label: "Assunto", type: "text", maxLength: 150 },
                ].map((f) => (
                  <div key={f.id}>
                    <label htmlFor={f.id} className="mb-1 block font-display text-xs tracking-[0.15em] text-white/60">
                      {f.label.toUpperCase()}
                    </label>
                    <input
                      id={f.id}
                      name={f.name}
                      type={f.type}
                      maxLength={f.maxLength}
                      required
                      className="h-12 w-full border border-white/20 bg-transparent px-4 text-sm outline-none focus:border-brand-cyan"
                    />
                  </div>
                ))}
                <div>
                  <label htmlFor="msg" className="mb-1 block font-display text-xs tracking-[0.15em] text-white/60">
                    MENSAGEM
                  </label>
                  <textarea
                    id="msg"
                    name="message"
                    required
                    maxLength={5000}
                    rows={5}
                    className="w-full border border-white/20 bg-transparent px-4 py-3 text-sm outline-none focus:border-brand-cyan"
                  />
                </div>
                <Button type="submit" variant="pink" className="w-full justify-center">
                  {sending ? "ENVIANDO..." : "ENVIAR MENSAGEM"}
                </Button>
                </fieldset>
                {error && <p role="alert" className="text-sm text-brand-pink">{error}</p>}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { Instagram, Youtube, Music2, ArrowRight } from "lucide-react";
import { footerLinks } from "@/data/navigation";
import { LogoWordmark } from "@/components/ui/LogoWordmark";
import { SmileyCross, Splatter } from "@/components/ui/Graphics";

function Col({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-4 font-display text-sm tracking-[0.2em] text-brand-yellow">{title}</h3>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  );
}

export function Footer() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-ink tex-noise">
      <Splatter className="pointer-events-none absolute -left-16 top-10 h-64 w-64 text-brand-cyan/10" />
      <SmileyCross className="pointer-events-none absolute -bottom-6 right-6 h-40 w-40 text-brand-yellow/80" />

      <div className="mx-auto max-w-container px-4 py-16 md:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-3 lg:grid-cols-6">
          {/* Marca */}
          <div className="col-span-2">
            <LogoWordmark size="md" />
            <p className="mt-5 max-w-xs font-brush text-2xl leading-tight text-white">
              Nada além da graça.
              <br />
              Tudo para a <span className="text-brand-yellow">glória.</span>
            </p>
            <p className="mt-2 font-display text-sm tracking-[0.24em] text-brand-cyan">Romanos 8:31</p>
          </div>

          <Col title="LINKS">
            {footerLinks.links.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="text-sm text-white/65 transition-colors hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </Col>

          <Col title="COMUNIDADE">
            {footerLinks.comunidade.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="text-sm text-white/65 transition-colors hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </Col>

          <Col title="AJUDA">
            {footerLinks.ajuda.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="text-sm text-white/65 transition-colors hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </Col>

          <div>
            <h3 className="mb-4 font-display text-sm tracking-[0.2em] text-brand-yellow">SIGA O FLOW</h3>
            <div className="flex gap-3">
              <a href="https://www.instagram.com/isaquelimajj/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="rounded-full border border-white/15 p-2 transition-colors hover:border-brand-pink hover:text-brand-pink">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://youtube.com/@isaque1317" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="rounded-full border border-white/15 p-2 transition-colors hover:border-brand-pink hover:text-brand-pink">
                <Youtube className="h-5 w-5" />
              </a>
              <a href="https://www.tiktok.com/@isaque.limajj" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="rounded-full border border-white/15 p-2 transition-colors hover:border-brand-pink hover:text-brand-pink">
                <Music2 className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-14 grid gap-6 border-t border-white/10 pt-10 md:grid-cols-2 md:items-center">
          <div>
            <h3 className="font-brush text-3xl">
              Receba novidades e <span className="text-brand-pink">lançamentos.</span>
            </h3>
            <p className="mt-1 text-sm text-white/55">Entre no movimento. Sem spam — só propósito.</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (email) setSent(true);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu e-mail"
              className="h-12 w-full border border-white/20 bg-transparent px-4 text-sm outline-none placeholder:text-white/40 focus:border-brand-cyan"
              aria-label="Seu e-mail"
            />
            <button
              type="submit"
              className="flex h-12 w-12 shrink-0 items-center justify-center bg-brand-pink text-white transition-colors hover:bg-brand-yellow hover:text-ink"
              aria-label="Assinar newsletter"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>
          {sent && <p className="text-sm text-brand-cyan md:col-start-2">Bem-vindo ao movimento! 🙌</p>}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-center text-xs text-white/40 md:flex-row md:text-left">
          <p>© {2025} FLOW JESUS by Isaque Lima. Todos os direitos reservados.</p>
          <p className="font-display tracking-[0.2em] text-white/50">CRISTO NO CENTRO</p>
        </div>
      </div>
    </footer>
  );
}

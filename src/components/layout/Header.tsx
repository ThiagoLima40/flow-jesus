"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, User, ShoppingBag, Menu } from "lucide-react";
import { mainNav } from "@/data/navigation";
import { useCart } from "@/context/CartContext";
import { LogoWordmark } from "@/components/ui/LogoWordmark";
import { Crown } from "@/components/ui/Graphics";
import { MobileMenu } from "./MobileMenu";

export function Header() {
  const pathname = usePathname();
  const { count, open } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-brand-pink focus:px-4 focus:py-2 focus:text-white"
      >
        Pular para o conteúdo
      </a>
      <header
        className={`fixed inset-x-0 top-0 z-[60] transition-all duration-300 ${
          scrolled
            ? "border-b border-white/10 bg-ink/80 backdrop-blur-md"
            : "bg-gradient-to-b from-black/70 to-transparent"
        }`}
      >
        <div className="mx-auto flex h-20 max-w-container items-center justify-between gap-4 px-4 md:px-8">
          <LogoWordmark size="sm" />

          {/* Nav central desktop */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegação principal">
            {mainNav.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-3 py-2 font-display text-sm tracking-[0.12em] transition-colors ${
                    active ? "text-white" : "text-white/70 hover:text-white"
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-3 -bottom-0.5 h-[3px] bg-brand-pink" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Coroa decorativa centro (desktop) */}
          <Crown className="pointer-events-none absolute left-1/2 top-1 hidden h-4 w-6 -translate-x-1/2 text-brand-yellow xl:block" />

          {/* Ações direita */}
          <div className="flex items-center gap-1 md:gap-3">
            <button
              className="rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Buscar"
            >
              <Search className="h-5 w-5" />
            </button>
            <Link
              href="/contato"
              className="rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Minha conta"
            >
              <User className="h-5 w-5" />
            </Link>
            <button
              onClick={open}
              className="relative rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label={`Carrinho com ${count} ${count === 1 ? "item" : "itens"}`}
            >
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-cyan px-1 font-display text-[0.65rem] text-ink">
                  {count}
                </span>
              )}
            </button>
            <button
              onClick={() => setMenuOpen(true)}
              className="rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

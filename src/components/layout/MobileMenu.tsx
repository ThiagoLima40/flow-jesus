"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { mainNav } from "@/data/navigation";
import { LogoWordmark } from "@/components/ui/LogoWordmark";
import { Cross, Crown } from "@/components/ui/Graphics";
import { site } from "@/data/site";

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] bg-street tex-noise lg:hidden"
          initial={{ opacity: 0, x: "100%" }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: "100%" }}
          transition={{ type: "tween", duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex h-20 items-center justify-between px-4">
            <LogoWordmark size="sm" />
            <button onClick={onClose} aria-label="Fechar menu" className="rounded-full p-2 hover:bg-white/10">
              <X className="h-7 w-7" />
            </button>
          </div>

          <nav className="mt-6 flex flex-col gap-1 px-6" aria-label="Menu mobile">
            {mainNav.map((item, i) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * i + 0.1 }}
                >
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="group flex items-center gap-3 border-b border-white/10 py-4"
                  >
                    <Cross
                      className={`h-5 w-4 ${active ? "text-brand-pink" : "text-white/25"} group-hover:text-brand-pink`}
                    />
                    <span
                      className={`font-brush text-4xl ${
                        active ? "text-brand-yellow" : "text-white"
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          <div className="mt-10 px-6">
            <Crown className="h-6 w-9 text-brand-pink" />
            <p className="mt-3 font-brush text-2xl">{site.motto}</p>
            <p className="mt-1 font-display text-sm tracking-[0.2em] text-brand-cyan">Romanos 8:31</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

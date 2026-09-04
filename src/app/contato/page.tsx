import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { ContactClient } from "@/components/contact/ContactClient";

export const metadata: Metadata = {
  title: "Contato",
  description: "Estamos aqui para te ouvir. Fale com a FLOW JESUS pelo WhatsApp, e-mail ou Instagram.",
};

export default function ContatoPage() {
  return (
    <>
      <PageHero
        eyebrow="CONTATO"
        title={
          <>
            <span className="text-white">ESTAMOS AQUI</span>
            <br />
            <span className="text-brand-yellow">PARA TE OUVIR.</span>
          </>
        }
        subtitle="Dúvidas, parcerias ou só um oi? Fala com a gente."
      />
      <ContactClient />
    </>
  );
}

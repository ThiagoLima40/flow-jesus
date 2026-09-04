import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { FlowPlayClient } from "@/components/music/FlowPlayClient";

export const metadata: Metadata = {
  title: "Flow Play",
  description: "Dê o play. Vista a fé. Viva o propósito. Música que inspira, letras que fortalecem.",
};

export default function FlowPlayPage() {
  return (
    <>
      <PageHero
        eyebrow="MÚSICA QUE INSPIRA · LETRAS QUE FORTALECEM"
        title={
          <>
            <span className="text-white">FLOW</span> <span className="text-brand-pink">PLAY</span>
          </>
        }
        subtitle="Dê o play. Vista a fé. Viva o propósito."
        underline="cyan"
      />
      <FlowPlayClient />
    </>
  );
}

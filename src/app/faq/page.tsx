import type { Metadata } from "next";
import { InstitutionalPage } from "@/components/ui/InstitutionalPage";

export const metadata: Metadata = { title: "Perguntas Frequentes (FAQ)" };

const sections = [
  {
    "title": "Sobre os produtos",
    "paragraphs": [
      "Quais produtos a FLOW JESUS vende? Atualmente trabalhamos com camisetas oversized, nas cores preta e branca, com estampas que unem fé, streetwear e propósito.",
      "Quais tamanhos estão disponíveis? P, M, G, GG e XG. Consulte a tabela de medidas na página de cada produto antes de comprar.",
      "As cores e imagens são exatamente iguais às da tela? As fotos são reais, mas pequenas variações de tom podem acontecer dependendo do brilho e da configuração da tela do seu dispositivo."
    ]
  },
  {
    "title": "Sobre pedidos e pagamento",
    "paragraphs": [
      "Quais formas de pagamento vocês aceitam? Pix e cartão de crédito em até 3x. Para clientes fora do Brasil, também aceitamos pagamento internacional via Wise (incluindo Pix internacional, quando disponível para o país do cliente).",
      "Recebo confirmação do meu pedido? Sim, você recebe uma confirmação por e-mail assim que o pagamento é aprovado.",
      "Posso alterar ou cancelar meu pedido depois de finalizado? Entre em contato o quanto antes pelo e-mail flowjesusoficial@gmail.com ou pelo Instagram @isaquelimajj. Se o pedido ainda não tiver sido enviado, conseguimos alterar ou cancelar."
    ]
  },
  {
    "title": "Sobre entrega",
    "paragraphs": [
      "Qual o prazo de entrega? O prazo é calculado no fechamento da compra, de acordo com o seu CEP, e pode variar conforme a transportadora.",
      "Vocês entregam para todo o Brasil? Sim, entregamos para todo o território nacional. O pagamento internacional via Wise é apenas uma forma de pagamento para clientes que estejam fora do país — as entregas são feitas somente dentro do Brasil.",
      "Como acompanho meu pedido? Assim que o pedido for enviado, você recebe o código de rastreio por e-mail."
    ]
  },
  {
    "title": "Sobre trocas e devoluções",
    "paragraphs": [
      "Posso trocar o tamanho da peça? Sim! Veja todos os detalhes na seção \"Trocas e Devoluções\" abaixo.",
      "Quanto tempo tenho para solicitar troca ou devolução? 7 dias corridos para arrependimento (compra online) e até 90 dias em caso de defeito de fabricação."
    ]
  },
  {
    "title": "Fale conosco",
    "paragraphs": [
      "Não encontrou sua resposta? Fale com a gente: flowjesusoficial@gmail.com Instagram: @isaquelimajj +55 11 94037-5607"
    ]
  }
];

export default function Page() {
  return <InstitutionalPage title="Perguntas Frequentes (FAQ)" sections={sections} />;
}

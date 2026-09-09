import type { Metadata } from "next";
import { InstitutionalPage } from "@/components/ui/InstitutionalPage";

export const metadata: Metadata = { title: "Trocas e Devoluções" };

const sections = [
  {
    "title": "",
    "paragraphs": [
      "Queremos que você vista sua fé com confiança. Por isso, seguimos as regras do Código de Defesa do Consumidor (Lei nº 8.078/1990) para garantir uma experiência de compra segura."
    ]
  },
  {
    "title": "1. Direito de arrependimento (compra online)",
    "paragraphs": [
      "Você tem até 7 (sete) dias corridos, contados a partir do recebimento do produto, para desistir da compra sem precisar justificar o motivo, com direito à devolução integral do valor pago (produto + frete).",
      "Como solicitar:",
      "1. Envie um e-mail para flowjesusoficial@gmail.com com o número do pedido e o motivo (opcional).",
      "2. Aguarde nossa confirmação com as instruções de envio.",
      "3. Envie o produto de volta, sem indícios de uso, com etiquetas e embalagem originais.",
      "4. Após recebermos e conferirmos o produto, o reembolso é processado em até 10 dias úteis."
    ]
  },
  {
    "title": "2. Troca por tamanho",
    "paragraphs": [
      "Pediu o tamanho errado? Sem problema.",
      "Prazo para solicitar: até 30 dias corridos após o recebimento. A peça deve estar sem uso, sem lavagem, com etiquetas e embalagem originais.",
      "O custo do frete de reenvio da nova peça é por conta do cliente."
    ]
  },
  {
    "title": "3. Defeito de fabricação",
    "paragraphs": [
      "Encontrou algum defeito na peça?",
      "Prazo para reclamar: até 90 dias corridos após o recebimento, conforme o CDC.",
      "Envie fotos do defeito para flowjesusoficial@gmail.com junto com o número do pedido.",
      "Após análise, oferecemos troca pelo mesmo produto, produto equivalente ou reembolso integral, incluindo o frete."
    ]
  },
  {
    "title": "4. O que NÃO é aceito para troca/devolução",
    "paragraphs": [
      "Produtos usados, lavados ou com sinais de uso.",
      "Produtos sem a etiqueta original.",
      "Produtos personalizados sob encomenda (quando aplicável)."
    ]
  },
  {
    "title": "5. Como enviar o produto de volta",
    "paragraphs": [
      "Após a solicitação aprovada, você receberá por e-mail o endereço para envio. O custo do frete de devolução fica por conta do cliente, exceto em casos de defeito de fabricação (item 3), quando o frete é reembolsado."
    ]
  },
  {
    "title": "6. Dúvidas",
    "paragraphs": [
      "flowjesusoficial@gmail.com Instagram: @isaquelimajj +55 11 94037-5607"
    ]
  }
];

export default function Page() {
  return <InstitutionalPage title="Trocas e Devoluções" sections={sections} />;
}

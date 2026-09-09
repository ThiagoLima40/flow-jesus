import type { Metadata } from "next";
import { InstitutionalPage } from "@/components/ui/InstitutionalPage";

export const metadata: Metadata = { title: "Política de Privacidade" };

const sections = [
  {
    "title": "",
    "paragraphs": [
      "A FLOW JESUS (\"nós\", \"nosso site\") respeita a sua privacidade e está comprometida em proteger os dados pessoais de quem visita e compra em flowjesus.com, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD)."
    ]
  },
  {
    "title": "1. Quais dados coletamos",
    "paragraphs": [
      "Dados de cadastro e compra: nome, e-mail, telefone, CPF, endereço de entrega e cobrança.",
      "Dados de pagamento: processados por parceiros de pagamento (ex: gateway de cartão/pix); a FLOW JESUS não armazena dados completos de cartão de crédito.",
      "Dados de navegação: cookies, endereço IP, páginas visitadas, tempo de navegação.",
      "Dados de contato voluntário: informações enviadas por formulários de contato, newsletter ou redes sociais."
    ]
  },
  {
    "title": "2. Para que usamos seus dados",
    "paragraphs": [
      "Processar e entregar seus pedidos.",
      "Emitir nota fiscal e cumprir obrigações legais e fiscais.",
      "Enviar comunicações sobre pedidos (confirmação, envio, entrega).",
      "Enviar newsletter e novidades, somente se você optar por receber.",
      "Melhorar a experiência de navegação e o desempenho do site.",
      "Prevenir fraudes e garantir a segurança das transações."
    ]
  },
  {
    "title": "3. Com quem compartilhamos seus dados",
    "paragraphs": [
      "Compartilhamos dados apenas quando necessário, com:",
      "Transportadoras e Correios, para entrega dos produtos.",
      "Processadores de pagamento, para viabilizar a compra. Ferramentas de análise e hospedagem do site.",
      "Autoridades públicas, quando exigido por lei.",
      "Não vendemos nem alugamos seus dados pessoais para terceiros."
    ]
  },
  {
    "title": "4. Cookies",
    "paragraphs": [
      "Usamos cookies para lembrar itens no carrinho, preferências de navegação e medir o desempenho do site. Você pode desativar os cookies nas configurações do seu navegador, mas isso pode afetar algumas funcionalidades da loja."
    ]
  },
  {
    "title": "5. Seus direitos como titular dos dados",
    "paragraphs": [
      "Conforme a LGPD, você pode a qualquer momento:",
      "Confirmar se tratamos seus dados.",
      "Solicitar acesso, correção ou atualização dos seus dados.",
      "Solicitar a exclusão dos seus dados (respeitando prazos legais de guarda fiscal).",
      "Revogar o consentimento para receber comunicações de marketing.",
      "Solicitar a portabilidade dos seus dados.",
      "Para exercer esses direitos, entre em contato pelo e-mail: flowjesusoficial@gmail.com"
    ]
  },
  {
    "title": "6. Armazenamento e segurança",
    "paragraphs": [
      "Adotamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, perda ou vazamento. Os dados são armazenados pelo tempo necessário para cumprir as finalidades descritas nesta política e as obrigações legais aplicáveis."
    ]
  },
  {
    "title": "7. Alterações nesta política",
    "paragraphs": [
      "Esta Política de Privacidade pode ser atualizada periodicamente. Recomendamos revisá-la de tempos em tempos. A data da última atualização estará sempre indicada no topo desta página."
    ]
  },
  {
    "title": "8. Contato",
    "paragraphs": [
      "A FLOW JESUS (FlowJesusOficial) é operada por Fabianne Lima, responsável pelo tratamento dos dados coletados neste site, com sede em Jundiaí/SP. Dúvidas sobre esta política ou sobre o tratamento dos seus dados? Fale conosco:",
      "flowjesusoficial@gmail.com @isaquelimajj +55 11 94037-5607"
    ]
  }
];

export default function Page() {
  return <InstitutionalPage title="Política de Privacidade" sections={sections} updatedAt="09/09/2026" />;
}

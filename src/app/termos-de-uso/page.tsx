import type { Metadata } from "next";
import { InstitutionalPage } from "@/components/ui/InstitutionalPage";

export const metadata: Metadata = { title: "Termos de Uso" };

const sections = [
  {
    "title": "",
    "paragraphs": [
      "Ao acessar e utilizar o site flowjesus.com, você concorda com os termos e condições descritos abaixo. Leia com atenção antes de realizar uma compra."
    ]
  },
  {
    "title": "1. Sobre a loja",
    "paragraphs": [
      "A FLOW JESUS (nome fantasia: FlowJesusOficial) é uma marca de streetwear cristão criada por Isaque Lima, que comercializa camisetas e demais produtos por meio do site flowjesus.com. A loja é operada por Fabianne Lima, responsável legal pelas vendas, atendimento e tratamento dos dados dos clientes, com sede em Jundiaí/SP, até a eventual formalização de um CNPJ."
    ]
  },
  {
    "title": "2. Cadastro e uso do site",
    "paragraphs": [
      "Ao se cadastrar ou realizar uma compra, você declara que as informações fornecidas são verdadeiras, completas e atualizadas.",
      "É proibido usar o site para fins ilegais, fraudulentos ou que violem direitos de terceiros.",
      "Reservamo-nos o direito de suspender ou cancelar cadastros que violem estes termos."
    ]
  },
  {
    "title": "3. Produtos e preços",
    "paragraphs": [
      "As imagens dos produtos são meramente ilustrativas; pequenas variações de cor podem ocorrer devido à tela do dispositivo utilizado.",
      "Os preços exibidos no site podem ser alterados sem aviso prévio, mas o valor cobrado será sempre o vigente no momento da confirmação do pedido.",
      "Reservamo-nos o direito de limitar quantidades por cliente e de recusar pedidos suspeitos de fraude."
    ]
  },
  {
    "title": "4. Pagamento",
    "paragraphs": [
      "Os pagamentos são processados por parceiros especializados. A FLOW JESUS não tem acesso nem armazena os dados completos do seu cartão de crédito."
    ]
  },
  {
    "title": "5. Prazo de entrega e frete",
    "paragraphs": [
      "O prazo de entrega é estimado no momento da compra e pode variar conforme a localidade e a transportadora. Atrasos causados por terceiros (Correios, transportadoras) fogem do controle da FLOW JESUS, mas faremos o possível para mantê-lo informado."
    ]
  },
  {
    "title": "6. Trocas, devoluções e arrependimento",
    "paragraphs": [
      "Conforme o Código de Defesa do Consumidor (Lei nº 8.078/1990):",
      "Você tem até 7 (sete) dias corridos, a partir do recebimento do produto, para exercer o direito de arrependimento em compras feitas pela internet, com devolução integral do valor pago.",
      "Trocas por defeito de fabricação podem ser solicitadas em até 90 dias após o recebimento.",
      "O produto deve ser devolvido sem indícios de uso, com etiquetas e embalagem originais.",
      "Para solicitar troca ou devolução, entre em contato pelo e-mail flowjesusoficial@gmail.com informando o número do pedido."
    ]
  },
  {
    "title": "7. Propriedade intelectual",
    "paragraphs": [
      "Todo o conteúdo do site — nome, logotipo, imagens, textos e artes das estampas — pertence à FLOW JESUS e é protegido por leis de propriedade intelectual. É proibida a reprodução sem autorização prévia."
    ]
  },
  {
    "title": "8. Limitação de responsabilidade",
    "paragraphs": [
      "A FLOW JESUS não se responsabiliza por:",
      "Indisponibilidade temporária do site por motivos técnicos ou de manutenção.",
      "Uso indevido do site por terceiros.",
      "Atrasos causados por transportadoras terceirizadas."
    ]
  },
  {
    "title": "9. Alterações destes termos",
    "paragraphs": [
      "Estes Termos de Uso podem ser atualizados a qualquer momento. A versão vigente é sempre a publicada no site, com a data de atualização indicada no topo."
    ]
  },
  {
    "title": "10. Foro e legislação aplicável",
    "paragraphs": [
      "Este documento é regido pelas leis brasileiras. Fica eleito o foro da comarca do domicílio do consumidor para dirimir eventuais controvérsias, conforme o Código de Defesa do Consumidor."
    ]
  },
  {
    "title": "11. Contato",
    "paragraphs": [
      "flowjesusoficial@gmail.com @isaquelimajj +55 11 94037-5607"
    ]
  }
];

export default function Page() {
  return <InstitutionalPage title="Termos de Uso" sections={sections} updatedAt="09/09/2026" />;
}

export type NavItem = { label: string; href: string };

export const mainNav: NavItem[] = [
  { label: "HOME", href: "/" },
  { label: "COLEÇÃO", href: "/colecao" },
  { label: "HISTÓRIA", href: "/historia" },
  { label: "FLOW PLAY", href: "/flow-play" },
  { label: "FLOW BJJ", href: "/flow-bjj" },
  { label: "GALERIA", href: "/galeria" },
  { label: "CONTATO", href: "/contato" },
];

export const footerLinks = {
  links: [
    { label: "Home", href: "/" },
    { label: "Coleção", href: "/colecao" },
    { label: "História", href: "/historia" },
    { label: "Flow BJJ", href: "/flow-bjj" },
    { label: "Flow Play", href: "/flow-play" },
    { label: "Galeria", href: "/galeria" },
    { label: "Contato", href: "/contato" },
  ],
  comunidade: [
    { label: "#FlowJesus", href: "/sobre" },
    { label: "Depoimentos", href: "/flow-bjj" },
    { label: "Eventos", href: "/sobre" },
    { label: "Parcerias", href: "/contato" },
    { label: "Seja um embaixador", href: "/contato" },
  ],
  ajuda: [
    { label: "Perguntas Frequentes", href: "/contato" },
    { label: "Trocas e Devoluções", href: "/contato" },
    { label: "Política de Privacidade", href: "/sobre" },
    { label: "Termos de Uso", href: "/sobre" },
  ],
};

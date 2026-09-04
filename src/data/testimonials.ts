export type Testimonial = {
  id: string;
  name: string;
  role: string;
  quote: string;
  accent: "pink" | "cyan" | "yellow" | "mono";
};

export const testimonials: Testimonial[] = [
  {
    id: "d1",
    name: "Gabriel L.",
    role: "Atleta · 19 anos",
    quote: "O jiu-jítsu me ensinou a confiar no processo e em Deus todos os dias.",
    accent: "pink",
  },
  {
    id: "d2",
    name: "Julia M.",
    role: "Faixa Branca · 16 anos",
    quote: "Aqui encontrei família, propósito e a certeza de que não estou só.",
    accent: "cyan",
  },
  {
    id: "d3",
    name: "Matheus S.",
    role: "Faixa Azul · 21 anos",
    quote: "Cada treino é uma chance de ser melhor para Deus e para as pessoas.",
    accent: "yellow",
  },
  {
    id: "d4",
    name: "Sime Flow",
    role: "Comunidade",
    quote: "Não somos só alunos. Somos um exército de fé no tatame e na vida.",
    accent: "pink",
  },
];

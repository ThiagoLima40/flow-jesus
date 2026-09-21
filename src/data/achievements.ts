/**
 * VALORES PLACEHOLDER — claramente editáveis.
 * Ajuste conforme os números reais do atleta.
 */
export type Achievement = {
  id: string;
  value: string;
  label: string;
  sub: string;
  icon: "trophy" | "medal" | "clock" | "crown" | "users" | "cross";
  accent: "pink" | "cyan" | "yellow" | "white";
};

export const achievements: Achievement[] = [
  { id: "a1", value: "+200", label: "CAMPEONATOS", sub: "Nacionais e internacionais", icon: "trophy", accent: "yellow" },
  { id: "a2", value: "+500", label: "MEDALHAS", sub: "Ouro, prata e bronze", icon: "medal", accent: "pink" },
  { id: "a4", value: "1", label: "PROPÓSITO", sub: "Glorificar a Deus em tudo", icon: "crown", accent: "yellow" },
];

export const bjjStats = [
  { value: "28", label: "CAMPEONATOS", icon: "trophy", accent: "yellow" as const },
  { value: "4.500+", label: "HORAS DE TREINO", icon: "clock", accent: "cyan" as const },
  { value: "1.000+", label: "ALUNOS IMPACTADOS", icon: "users", accent: "pink" as const },
  { value: "1", label: "PROPÓSITO", icon: "cross", accent: "yellow" as const },
];

export const pillars = [
  { word: "FÉ", sub: "ME SUSTENTA", accent: "yellow" as const },
  { word: "FOCO", sub: "ME MOVE", accent: "cyan" as const },
  { word: "DISCIPLINA", sub: "ME TRANSFORMA", accent: "pink" as const },
  { word: "IDENTIDADE", sub: "ME DEFINE", accent: "cyan" as const },
];

export const timeline = [
  { key: "COMEÇO", text: "Tudo começou com um sonho e uma promessa.", accent: "pink" as const },
  { key: "TREINO", text: "Disciplina diária. Renúncias que ninguém vê.", accent: "cyan" as const },
  { key: "COMPETIÇÃO", text: "Coragem para enfrentar gigantes e não desistir.", accent: "pink" as const },
  { key: "VITÓRIAS", text: "Deus honra quem permanece fiel no processo.", accent: "cyan" as const },
  { key: "FAMÍLIA", text: "A base que ora, apoia e celebra cada conquista.", accent: "yellow" as const },
];

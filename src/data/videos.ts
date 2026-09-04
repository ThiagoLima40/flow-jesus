export type Video = {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: "treinos" | "campeonatos" | "bastidores" | "oracao" | "testemunho" | "viagens" | "preparacao";
  youtubeId?: string; // preparado para integração futura
  accent: "pink" | "cyan" | "yellow" | "mono";
};

export const videoCategories = [
  { key: "todos", label: "TODOS" },
  { key: "treinos", label: "TREINOS" },
  { key: "campeonatos", label: "CAMPEONATOS" },
  { key: "bastidores", label: "BASTIDORES" },
  { key: "oracao", label: "ORAÇÃO" },
  { key: "testemunho", label: "TESTEMUNHO" },
  { key: "viagens", label: "VIAGENS" },
  { key: "preparacao", label: "PREPARAÇÃO" },
] as const;

export const videos: Video[] = [
  { id: "v1", title: "Fé que Move", description: "Treino com propósito", duration: "08:45", category: "treinos", accent: "pink" },
  { id: "v2", title: "Disciplina Diária", description: "Pequenas escolhas, grandes mudanças", duration: "06:12", category: "preparacao", accent: "cyan" },
  { id: "v3", title: "Vitória com Propósito", description: "Deus honra quem persiste", duration: "10:33", category: "campeonatos", accent: "yellow" },
  { id: "v4", title: "Mente Forte, Coração Firme", description: "O combate é aqui fora também", duration: "07:21", category: "testemunho", accent: "pink" },
  { id: "v5", title: "Testemunho no Tatame", description: "Como o jiu-jítsu mudou minha vida", duration: "06:58", category: "testemunho", accent: "cyan" },
  { id: "v6", title: "Antes da Luta", description: "Oração e preparação nos bastidores", duration: "04:30", category: "oracao", accent: "yellow" },
  { id: "v7", title: "Estrada e Propósito", description: "Viagem de campeonato", duration: "12:04", category: "viagens", accent: "cyan" },
  { id: "v8", title: "Bastidores do Drop", description: "Como nasce uma coleção", duration: "05:47", category: "bastidores", accent: "pink" },
  { id: "v9", title: "Rotina de Campeão", description: "Um dia inteiro de preparação", duration: "09:16", category: "preparacao", accent: "yellow" },
];

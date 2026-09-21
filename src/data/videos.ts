export type Video = {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: "treinos" | "campeonatos" | "bastidores" | "oracao" | "testemunho" | "viagens" | "preparacao";
  instagramUrl?: string;
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
  { id: "v1", instagramUrl: "https://www.instagram.com/reel/DY8ozd7kyoJ/?stkn=cXlsdzY0Z2FrOGs0", title: "Fé que Move", description: "Treino com propósito", duration: "08:45", category: "treinos", accent: "pink" },
  { id: "v2", instagramUrl: "https://www.instagram.com/reel/DVRc_5ljvpP/?stkn=MW5rdGx0c2pjNjJkZA==", title: "Disciplina Diária", description: "Pequenas escolhas, grandes mudanças", duration: "06:12", category: "preparacao", accent: "cyan" },
  { id: "v3", instagramUrl: "https://www.instagram.com/reel/DPuDowrEZZi/?stkn=cWplM3E1eGYxMHB3", title: "Vitória com Propósito", description: "Deus honra quem persiste", duration: "10:33", category: "campeonatos", accent: "yellow" },
  { id: "v4", instagramUrl: "https://www.instagram.com/reel/DUOifj3jjPY/?stkn=MXFjYjNmYWQ1Y3I2", title: "Mente Forte, Coração Firme", description: "O combate é aqui fora também", duration: "07:21", category: "testemunho", accent: "pink" },
  { id: "v5", instagramUrl: "https://www.instagram.com/reel/DNEcSw1xSh9/?stkn=MXFycnRtN3g5ejNjZw==", title: "Testemunho no Tatame", description: "Como o jiu-jítsu mudou minha vida", duration: "06:58", category: "testemunho", accent: "cyan" },
  { id: "v6", instagramUrl: "https://www.instagram.com/reel/DIG_almRGT0/?stkn=cm0yOTU0eWhsMHV3", title: "Antes da Luta", description: "Oração e preparação nos bastidores", duration: "04:30", category: "oracao", accent: "yellow" },
  { id: "v7", instagramUrl: "https://www.instagram.com/reel/DaEbQEbOws5/?stkn=MXhyb24xYjA5ZG0waA==", title: "Estrada e Propósito", description: "Viagem de campeonato", duration: "12:04", category: "viagens", accent: "cyan" },
  { id: "v8", title: "Bastidores do Drop", description: "Como nasce uma coleção", duration: "05:47", category: "bastidores", accent: "pink" },
  { id: "v9", title: "Rotina de Campeão", description: "Um dia inteiro de preparação", duration: "09:16", category: "preparacao", accent: "yellow" },
];

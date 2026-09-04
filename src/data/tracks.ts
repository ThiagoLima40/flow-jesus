export type Track = {
  id: string;
  title: string;
  artist: string;
  duration: number; // segundos
  playlist: string;
  accent: "pink" | "cyan" | "yellow" | "mono";
  src?: string; // vazio => player simulado (placeholder claramente indicado)
};

/**
 * DADOS PLACEHOLDER — substituir por faixas reais.
 * Sem `src`, o player roda em modo simulado (timeline avança, sem áudio).
 */
export const playlists = [
  "LOUVOR",
  "RAP CRISTÃO",
  "WORSHIP",
  "TREINO",
  "FOCO",
  "CONCENTRAÇÃO",
] as const;

export const tracks: Track[] = [
  { id: "t1", title: "Mais que Vencedor", artist: "Isaque Lima", duration: 225, playlist: "LOUVOR", accent: "pink" },
  { id: "t2", title: "Fé que Move", artist: "Isaque Lima", duration: 198, playlist: "RAP CRISTÃO", accent: "yellow" },
  { id: "t3", title: "Propósito Maior", artist: "Flow Jesus", duration: 241, playlist: "WORSHIP", accent: "cyan" },
  { id: "t4", title: "Nada Além da Graça", artist: "Isaque Lima", duration: 212, playlist: "LOUVOR", accent: "pink" },
  { id: "t5", title: "Deus é Fiel", artist: "Flow Jesus", duration: 187, playlist: "WORSHIP", accent: "cyan" },
  { id: "t6", title: "Tatame Santo", artist: "Isaque Lima", duration: 203, playlist: "TREINO", accent: "yellow" },
  { id: "t7", title: "Foco no Reino", artist: "Flow Jesus", duration: 176, playlist: "FOCO", accent: "cyan" },
  { id: "t8", title: "Renúncia", artist: "Isaque Lima", duration: 234, playlist: "CONCENTRAÇÃO", accent: "mono" },
  { id: "t9", title: "Coroa de Vitória", artist: "Flow Jesus", duration: 219, playlist: "RAP CRISTÃO", accent: "pink" },
  { id: "t10", title: "No Centro", artist: "Isaque Lima", duration: 208, playlist: "WORSHIP", accent: "cyan" },
  { id: "t11", title: "Disciplina", artist: "Flow Jesus", duration: 191, playlist: "TREINO", accent: "yellow" },
  { id: "t12", title: "Ele Vive", artist: "Isaque Lima", duration: 246, playlist: "LOUVOR", accent: "pink" },
];

export function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

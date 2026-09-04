/**
 * FLOW JESUS — Sistema gráfico da marca (SVG).
 * Coroas, cruzes, smiley-cross, mão da paz, leão, pinceladas e spray
 * recriados a partir da arte de referência. Todos aceitam className.
 */
import { CSSProperties } from "react";

type G = { className?: string; style?: CSSProperties };

/* ---- Coroa (assinatura da marca) ---- */
export function Crown({ className, style }: G) {
  return (
    <svg viewBox="0 0 100 62" className={className} style={style} fill="none" aria-hidden>
      <path
        d="M6 54 L2 14 L26 34 L50 4 L74 34 L98 14 L94 54 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="2" cy="12" r="4" fill="currentColor" />
      <circle cx="50" cy="2" r="4.5" fill="currentColor" />
      <circle cx="98" cy="12" r="4" fill="currentColor" />
    </svg>
  );
}

/* ---- Cruz pincelada ---- */
export function Cross({ className, style }: G) {
  return (
    <svg viewBox="0 0 60 80" className={className} style={style} aria-hidden>
      <path
        d="M25 4 h10 l-1 24 h20 v10 h-20 l-2 38 h-10 l-2-38 h-19 v-10 h19 z"
        fill="currentColor"
      />
    </svg>
  );
}

/* ---- Smiley com olhos de cruz (ícone-selo da marca) ---- */
export function SmileyCross({ className, style }: G) {
  return (
    <svg viewBox="0 0 120 120" className={className} style={style} aria-hidden>
      <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="7" />
      {/* olhos-cruz */}
      <path d="M40 34v22M31 45h18" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <path d="M84 34v22M75 45h18" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      {/* sorriso */}
      <path
        d="M34 72c6 16 46 16 52 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {/* pingo de tinta */}
      <path d="M60 114c-5 0-8-4-8-9s8-13 8-13 8 8 8 13-3 9-8 9z" fill="currentColor" />
    </svg>
  );
}

/* ---- Mão da paz (halftone-ish) ---- */
export function PeaceHand({ className, style }: G) {
  return (
    <svg viewBox="0 0 90 130" className={className} style={style} aria-hidden>
      <path
        d="M30 60V18c0-6 10-6 10 0v34m0 0V10c0-6 10-6 10 0v42m0-8c0-6 10-6 10 0v22c0 26-8 44-30 44-14 0-24-10-28-26l-6-24c-2-8 8-11 11-4l7 16"
        fill="currentColor"
        stroke="#000"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---- Cabeça de leão coroado (silhueta estilizada) ---- */
export function Lion({ className, style }: G) {
  return (
    <svg viewBox="0 0 120 120" className={className} style={style} aria-hidden>
      <path
        d="M60 8l7 12 13-6-3 14 14 2-9 11 12 8-13 6 6 13-14-3 1 14-11-8-9 12-9-12-11 8 1-14-14 3 6-13-13-6 12-8-9-11 14-2-3-14 13 6z"
        fill="currentColor"
        opacity="0.9"
      />
      <circle cx="60" cy="62" r="26" fill="#050505" />
      <path d="M50 58c0 4 3 7 10 7s10-3 10-7" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="52" cy="52" r="3" fill="currentColor" />
      <circle cx="68" cy="52" r="3" fill="currentColor" />
    </svg>
  );
}

/* ---- Pincelada larga (fundo de destaque) ---- */
export function BrushStroke({ className, style }: G) {
  return (
    <svg viewBox="0 0 300 60" className={className} style={style} preserveAspectRatio="none" aria-hidden>
      <path
        d="M4 34c40-14 80-20 130-16s90 18 162 6c-30 16-70 20-120 16S60 24 4 40z"
        fill="currentColor"
      />
    </svg>
  );
}

/* ---- Traço de pincel fino (underline pintado) ---- */
export function PaintUnderline({ className, style }: G) {
  return (
    <svg viewBox="0 0 320 26" className={className} style={style} preserveAspectRatio="none" aria-hidden>
      <path
        d="M2 16C60 6 120 4 180 10s110 2 138-4c-6 12-40 16-96 14S70 14 4 22z"
        fill="currentColor"
      />
    </svg>
  );
}

/* ---- Splatter / respingo de spray ---- */
export function Splatter({ className, style }: G) {
  return (
    <svg viewBox="0 0 200 200" className={className} style={style} aria-hidden>
      <g fill="currentColor">
        <path d="M100 40c26 0 54 20 54 56s-30 60-60 58-56-26-52-62 34-52 58-52z" opacity="0.9" />
        <circle cx="42" cy="52" r="9" />
        <circle cx="160" cy="60" r="7" />
        <circle cx="168" cy="132" r="11" />
        <circle cx="36" cy="140" r="6" />
        <circle cx="150" cy="176" r="5" />
        <circle cx="70" cy="182" r="8" />
        <circle cx="24" cy="96" r="4" />
        <circle cx="182" cy="98" r="4" />
      </g>
    </svg>
  );
}

/* ---- Seta manual ---- */
export function HandArrow({ className, style }: G) {
  return (
    <svg viewBox="0 0 80 40" className={className} style={style} fill="none" aria-hidden>
      <path
        d="M4 22c18-6 40-8 66-6M56 6l16 10-16 12"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---- Selo circular com smiley-cross e drip (usado no hero/história) ---- */
export function StampSeal({ className, style }: G) {
  return (
    <svg viewBox="0 0 160 190" className={className} style={style} aria-hidden>
      <circle cx="80" cy="80" r="72" fill="currentColor" />
      <path d="M64 150c0 18 8 34 16 34s16-16 16-34-16 26-32 0z" fill="currentColor" />
      <g stroke="#050505" strokeWidth="7" strokeLinecap="round" fill="none">
        <path d="M58 56v26M45 69h26" />
        <path d="M102 56v26M89 69h26" />
        <path d="M52 96c6 16 50 16 56 0" strokeWidth="8" />
      </g>
    </svg>
  );
}

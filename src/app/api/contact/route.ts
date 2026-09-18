import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const runtime = "nodejs";

const destination = "flowjesusoficial@gmail.com";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Preencha todos os campos e tente novamente." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Preencha todos os campos e tente novamente." }, { status: 400 });
  }

  const fields = body as Record<string, unknown>;
  const name = typeof fields.name === "string" ? fields.name.trim() : "";
  const email = typeof fields.email === "string" ? fields.email.trim() : "";
  const subject = typeof fields.subject === "string" ? fields.subject.trim() : "";
  const message = typeof fields.message === "string" ? fields.message.trim() : "";

  if (!name || name.length > 100 || !emailPattern.test(email) || email.length > 254 ||
      !subject || subject.length > 150 || !message || message.length > 5000) {
    return NextResponse.json({ error: "Confira nome, e-mail, assunto e mensagem antes de enviar." }, { status: 400 });
  }

  let apiKey = process.env.RESEND_API_KEY;
  let fromEmail = process.env.CONTACT_FROM_EMAIL;
  try {
    const env = getCloudflareContext().env as { RESEND_API_KEY?: string; CONTACT_FROM_EMAIL?: string };
    apiKey = env.RESEND_API_KEY || apiKey;
    fromEmail = env.CONTACT_FROM_EMAIL || fromEmail;
  } catch {
    // Fora do Cloudflare, as variáveis vêm do ambiente do servidor Next.js.
  }

  if (!apiKey) {
    return NextResponse.json({ error: "O formulário está indisponível no momento. Tente novamente mais tarde." }, { status: 503 });
  }

  fromEmail ||= "Contato FlowJesus <contato@flowjesus.com>";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromEmail,
        to: [destination],
        reply_to: email,
        subject: `Contato FlowJesus: ${subject}`,
        text: `Nome: ${name}\nE-mail: ${email}\nAssunto: ${subject}\n\nMensagem:\n${message}`,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Não foi possível enviar sua mensagem. Tente novamente." }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível enviar sua mensagem. Tente novamente." }, { status: 502 });
  }
}

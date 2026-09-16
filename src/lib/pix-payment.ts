type PixPaymentInput = {
  amountCents: number;
  email: string;
  requestId: string;
  order: unknown;
};

/** Creates only PIX: a discounted payment must never offer card or account balance. */
export async function createPixPayment(token: string, input: PixPaymentInput, fetchImpl: typeof fetch = fetch) {
  // Bind retries to the verified order, amount and payer, not just a client-provided key.
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(input)));
  const idempotencyKey = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  const response = await fetchImpl("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "X-Idempotency-Key": idempotencyKey },
    body: JSON.stringify({
      transaction_amount: input.amountCents / 100,
      description: "FLOW JESUS — compra no Pix (5% de desconto nos produtos)",
      payment_method_id: "pix",
      payer: { email: input.email },
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error("Não foi possível gerar o Pix. Tente novamente.");
  const payment = await response.json();
  const transaction = payment?.point_of_interaction?.transaction_data;
  if (payment?.payment_method_id !== "pix" || payment?.currency_id !== "BRL" ||
      typeof payment.transaction_amount !== "number" || Math.round(payment.transaction_amount * 100) !== input.amountCents ||
      payment.status !== "pending" || payment.status_detail !== "pending_waiting_transfer" ||
      typeof transaction?.qr_code !== "string" || !transaction.qr_code ||
      typeof transaction.ticket_url !== "string" ||
      !/^https:\/\/(?:[\w-]+\.)?mercadopago\.com\.br\//i.test(transaction.ticket_url)) {
    throw new Error("Não foi possível confirmar o Pix. Tente novamente.");
  }
  return transaction.ticket_url as string;
}

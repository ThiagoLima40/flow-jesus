type PixPaymentInput = {
  amountCents: number;
  email: string;
  orderNumber: string;
};
const mercadoPagoWebhookUrl = "https://www.flowjesus.com/api/mercadopago/webhook";

/** Creates only PIX: a discounted payment must never offer card or account balance. */
export async function createPixPayment(token: string, input: PixPaymentInput, fetchImpl: typeof fetch = fetch) {
  const response = await fetchImpl("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "X-Idempotency-Key": input.orderNumber },
    body: JSON.stringify({
      transaction_amount: input.amountCents / 100,
      description: "FLOW JESUS — compra no Pix (5% de desconto nos produtos)",
      payment_method_id: "pix",
      payer: { email: input.email },
      external_reference: input.orderNumber,
      notification_url: mercadoPagoWebhookUrl,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error("Não foi possível gerar o Pix. Tente novamente.");
  const payment = await response.json();
  const transaction = payment?.point_of_interaction?.transaction_data;
  if (!((typeof payment?.id === "number" && Number.isSafeInteger(payment.id) && payment.id > 0) || (typeof payment?.id === "string" && /^\d+$/.test(payment.id))) ||
      payment?.payment_method_id !== "pix" || payment?.currency_id !== "BRL" ||
      typeof payment.transaction_amount !== "number" || Math.round(payment.transaction_amount * 100) !== input.amountCents ||
      payment.status !== "pending" || payment.status_detail !== "pending_waiting_transfer" ||
      typeof transaction?.qr_code !== "string" || !transaction.qr_code ||
      typeof transaction.ticket_url !== "string" ||
      !/^https:\/\/(?:[\w-]+\.)?mercadopago\.com\.br\//i.test(transaction.ticket_url)) {
    throw new Error("Não foi possível confirmar o Pix. Tente novamente.");
  }
  return { url: transaction.ticket_url as string, id: String(payment.id) };
}

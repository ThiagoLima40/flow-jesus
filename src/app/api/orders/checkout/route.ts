import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { pixDiscountCents } from "@/lib/pricing";
import { createPixPayment } from "@/lib/pix-payment";
import { products } from "@/data/products";
import { parseOrderContact, validCheckoutId } from "@/lib/order-input";
import { OrderStore, orderRequestHash, type OrdersDatabase, type OrderSnapshot, type StoredOrder } from "@/lib/order-store";

export const runtime = "nodejs";
export const maxDuration = 60;

const mercadoPagoCheckoutEndpoint = "https://api.mercadopago.com/checkout/preferences";

type CheckoutItem = { productId: string; size: string; color: string; qty: number };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
function existingCheckout(order: StoredOrder, hash: string) {
  if (order.request_hash !== hash) return json({ error: "Esta tentativa pertence a outro pedido. Atualize a página e confira seus dados." }, 409);
  if (order.status !== "aguardando pagamento") return json({ error: "Este pedido já foi processado. Entre em contato com a loja.", order_number: order.order_number }, 409);
  if (order.payment_setup_status === "ready" && order.checkout_url) return json({ checkout_url: order.checkout_url, order_number: order.order_number });
  if (order.payment_setup_status !== "not_started") return json({
    error: order.payment_setup_status === "creating"
      ? "O pagamento deste pedido está sendo preparado. Aguarde e tente novamente. Se persistir, contate a loja com o número do pedido."
      : "Seu pedido foi registrado, mas o pagamento precisa ser conferido. Contate a loja com o número do pedido antes de tentar uma nova compra.",
    order_number: order.order_number,
  }, 409);
  return null;
}

export async function POST(request: NextRequest) {
  // O secret permanece no Worker; a Vercel encaminha somente o pedido.
  if (process.env.VERCEL === "1") {
    try {
      const response = await fetch("https://flow-jesus.flowjesusoficial.workers.dev/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: await request.text(),
        cache: "no-store",
        signal: AbortSignal.timeout(55000),
      });
      const result = await response.json();
      if (response.ok && (typeof result.order_number !== "string" || typeof result.checkout_url !== "string")) {
        return json({ error: "Não foi possível confirmar o registro do pedido. Tente novamente." }, 502);
      }
      return json(result, response.status);
    } catch {
      return NextResponse.json({ error: "Não foi possível iniciar o pagamento. Tente novamente." }, { status: 502 });
    }
  }
  let token: string | undefined;
  let database: OrdersDatabase | undefined;
  try {
    const env = getCloudflareContext().env as { MERCADOPAGO_ACCESS_TOKEN?: string; ORDERS_DB?: OrdersDatabase };
    token = env.MERCADOPAGO_ACCESS_TOKEN;
    database = env.ORDERS_DB;
  } catch {
    // O Next.js fora do Cloudflare não tem bindings; usa a variável local.
    token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  }
  if (!database) return json({ error: "Registro de pedidos indisponível no momento. Nenhum pagamento foi iniciado." }, 503);
  const store = new OrderStore(database);
  if (!token) {
    console.error("Mercado Pago checkout unavailable", {
      endpoint: mercadoPagoCheckoutEndpoint,
      reason: "MERCADOPAGO_ACCESS_TOKEN is missing or empty",
    });
    return NextResponse.json({ error: "Pagamento indisponível no momento." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const { items, shipping, coupon, discountCents, totalCents, paymentMethod, customer, address, checkoutRequestId } = body as {
    items?: unknown; shipping?: unknown; coupon?: unknown; discountCents?: unknown; totalCents?: unknown;
    paymentMethod?: unknown; customer?: unknown; address?: unknown; checkoutRequestId?: unknown;
  };
  const contact = parseOrderContact(customer, address);
  if (!contact || !validCheckoutId(checkoutRequestId)) return json({ error: "Confira nome, e-mail, telefone e endereço completo para entrega." }, 400);
  const isPix = paymentMethod === "pix";
  if (paymentMethod !== "other" && !isPix) {
    return NextResponse.json({ error: "Forma de pagamento inválida." }, { status: 400 });
  }
  const cartCheckout = shipping !== null && typeof shipping === "object" && !Array.isArray(shipping);
  if (!Array.isArray(items) || items.length === 0 || items.length > 50 ||
      !cartCheckout) {
    return NextResponse.json({ error: "Itens ou entrega inválidos." }, { status: 400 });
  }

  let subtotalCents = 0;
  let orderItems = [];
  const savedItems: OrderSnapshot["items"] = [];
  for (const raw of items) {
    const item = raw as Partial<CheckoutItem> | null;
    if (!item || typeof item.productId !== "string" || typeof item.size !== "string" ||
        typeof item.color !== "string" || !Number.isSafeInteger(item.qty) ||
        (item.qty as number) < 1 || (item.qty as number) > 100) {
      return NextResponse.json({ error: "Item inválido." }, { status: 400 });
    }

    const product = products.find((p) => p.id === item.productId);
    if (!product || !product.sizes.includes(item.size) || !product.colors.some((c) => c.name === item.color)) {
      return NextResponse.json({ error: "Produto ou variação inválida." }, { status: 400 });
    }

    const unitCents = Math.round(product.price * 100);
    subtotalCents += unitCents * (item.qty as number);
    savedItems.push({ productId: product.id, name: product.name, color: item.color, size: item.size,
      quantity: item.qty as number, unitPriceCents: unitCents, subtotalCents: unitCents * (item.qty as number) });
    orderItems.push({
      id: product.id,
      title: `${product.name} - ${item.size} - ${item.color}`,
      quantity: item.qty as number,
      currency_id: "BRL",
      unit_price: unitCents / 100,
    });
  }

  let shippingCents = 0;
  let verifiedShipping: OrderSnapshot["shipping"] | undefined;
  let requestHash = "";
  if (cartCheckout) {
    const { amountCents, serviceId, postalCode } = shipping as { amountCents?: unknown; serviceId?: unknown; postalCode?: unknown };
    if (!Number.isSafeInteger(serviceId) || typeof postalCode !== "string" || !/^\d{8}$/.test(postalCode) || postalCode !== contact.address.postalCode) {
      return NextResponse.json({ error: "Calcule o frete e selecione uma modalidade." }, { status: 400 });
    }
    const expectedDiscount = (coupon === "FLOW10" ? Math.round(subtotalCents / 10) : 0) + (isPix ? pixDiscountCents(subtotalCents) : 0);
    if (!Number.isSafeInteger(amountCents) || (amountCents as number) < 0 ||
        !["", "FLOW10"].includes(coupon as string) || discountCents !== expectedDiscount ||
        !Number.isSafeInteger(totalCents) || (totalCents as number) <= 0 || totalCents !== subtotalCents - expectedDiscount + (amountCents as number)) {
      return NextResponse.json({ error: "Total, frete ou desconto inválido. Atualize o carrinho." }, { status: 400 });
    }
    // Canonical, validated client intent: retries reuse a stored payment even
    // if the carrier later changes its quote. No PII is used as a lookup key.
    try {
      requestHash = await orderRequestHash({ ...contact, items: savedItems, shipping: { amountCents, serviceId, postalCode }, coupon, totalCents, paymentMethod });
      const previous = await store.find(checkoutRequestId);
      if (previous) {
        const response = existingCheckout(previous, requestHash);
        if (response) return response;
      }
    } catch {
      return json({ error: "Não foi possível registrar o pedido. Nenhum pagamento foi iniciado. Tente novamente." }, 503);
    }
    try {
      const quoteResponse = await fetch("https://flowjesus-melhor-envio.flowjesusoficial.workers.dev/api/melhor-envio/quote", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toPostalCode: postalCode, products: (items as CheckoutItem[]).map(item => ({
          id: item.productId, width: 25, height: 8, length: 30, weight: 0.3,
          insuranceValue: products.find(p => p.id === item.productId)!.price, quantity: item.qty,
        })) }),
        cache: "no-store", signal: AbortSignal.timeout(20000),
      });
      const quote = await quoteResponse.json();
      if (!quoteResponse.ok || !Array.isArray(quote.services)) throw new Error("quote unavailable");
      const service = quote.services.find((option: { id: number }) => option.id === serviceId);
      if (!service || typeof service.price !== "number" || !Number.isFinite(service.price) || service.price < 0 || Math.round(service.price * 100) !== amountCents ||
          typeof service.name !== "string" || !service.name.trim() || service.name.length > 120 ||
          (service.company != null && (typeof service.company !== "string" || service.company.length > 120))) {
        return NextResponse.json({ error: "O frete mudou ou está indisponível. Calcule novamente e selecione uma opção." }, { status: 409 });
      }
      verifiedShipping = { serviceId: serviceId as number, name: service.name, company: service.company ?? null, amountCents: amountCents as number };
    } catch {
      return NextResponse.json({ error: "Não foi possível confirmar o frete. Calcule novamente." }, { status: 502 });
    }
    shippingCents = amountCents as number;
    // Rateia o desconto em centavos, preservando os produtos e as quantidades.
    // Divide uma linha somente quando o arredondamento exige preços diferentes.
    let accumulatedCents = 0;
    let allocatedCents = 0;
    orderItems = orderItems.flatMap((item) => {
      accumulatedCents += Math.round(item.unit_price * 100) * item.quantity;
      const targetCents = Math.round(accumulatedCents * (subtotalCents - expectedDiscount) / subtotalCents);
      const lineCents = targetCents - allocatedCents;
      allocatedCents = targetCents;
      const unitCents = Math.floor(lineCents / item.quantity);
      const remainder = lineCents % item.quantity;
      return [
        { ...item, quantity: item.quantity - remainder, unit_price: unitCents / 100 },
        { ...item, quantity: remainder, unit_price: (unitCents + 1) / 100 },
      ].filter((line) => line.quantity > 0);
    });
  }
  if (shippingCents) {
    orderItems.push({
      id: "shipping",
      title: "Frete",
      quantity: 1,
      currency_id: "BRL",
      unit_price: shippingCents / 100,
    });
  }

  if (!verifiedShipping) return json({ error: "Calcule o frete novamente." }, 400);
  let order: StoredOrder;
  try {
    order = await store.create(checkoutRequestId, requestHash, {
      ...contact, items: savedItems, subtotalCents, coupon: coupon as string,
      couponDiscountCents: coupon === "FLOW10" ? Math.round(subtotalCents / 10) : 0,
      pixDiscountCents: isPix ? pixDiscountCents(subtotalCents) : 0,
      shipping: verifiedShipping, totalCents: totalCents as number, paymentMethod: isPix ? "pix" : "other",
    });
    const response = existingCheckout(order, requestHash);
    if (response) return response;
    if (!await store.claim(order.order_number)) return json({ error: "Este pedido está sendo processado. Aguarde e tente novamente.", order_number: order.order_number }, 409);
  } catch {
    return json({ error: "Não foi possível registrar o pedido. Nenhum pagamento foi iniciado. Tente novamente." }, 503);
  }

  let providerFailureStatus: number | undefined;
  try {
    if (isPix) {
      // Use the server-priced products and the verified, undiscounted freight.
      const couponDiscount = coupon === "FLOW10" ? Math.round(subtotalCents / 10) : 0;
      const payment = await createPixPayment(token, {
        amountCents: subtotalCents - couponDiscount - pixDiscountCents(subtotalCents) + shippingCents,
        email: contact.customer.email,
        orderNumber: order.order_number,
      });
      await store.attachPayment(order.order_number, { ...payment, kind: "payment" });
      return json({ checkout_url: payment.url, order_number: order.order_number });
    }
    const response = await fetch(mercadoPagoCheckoutEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": order.order_number,
      },
      body: JSON.stringify({
        items: orderItems,
        external_reference: order.order_number,
        payer: { email: contact.customer.email },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      // Provider bodies, headers and exception messages may contain credentials.
      providerFailureStatus = response.status;
      throw new Error("Payment setup failed");
    }

    const preference: unknown = await response.json();
    const checkoutUrl = (preference as { init_point?: unknown })?.init_point;
    const preferenceId = (preference as { id?: unknown })?.id;
    if (typeof preferenceId !== "string" || !preferenceId || typeof checkoutUrl !== "string" || !/^https:\/\/(?:[\w-]+\.)?mercadopago\.com(?:\.[a-z]{2})?\//i.test(checkoutUrl)) {
      throw new Error("Invalid payment response");
    }
    await store.attachPayment(order.order_number, { id: preferenceId, url: checkoutUrl, kind: "preference" });
    return json({ checkout_url: checkoutUrl, order_number: order.order_number });
  } catch {
    // A timeout may occur after the provider accepted a charge. Never create
    // another automatically; retain the order for reconciliation via its reference.
    try { await store.requireReview(order.order_number); } catch { /* The persisted 'creating' state also blocks duplicates. */ }
    console.error("Mercado Pago checkout request exception", {
      endpoint: isPix ? "https://api.mercadopago.com/v1/payments" : mercadoPagoCheckoutEndpoint,
      ...(providerFailureStatus === undefined ? {} : { status: providerFailureStatus }),
    });
    return json({ error: "Seu pedido foi registrado, mas não foi possível confirmar a criação do pagamento. Contate a loja com o número do pedido antes de tentar uma nova compra.", order_number: order.order_number }, 502);
  }
}

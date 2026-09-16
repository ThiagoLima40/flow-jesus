/** Discounts are rounded once on the product subtotal, never on shipping. */
export function pixDiscountCents(subtotalCents: number): number {
  return Math.round(subtotalCents / 20);
}

export function productPixPrice(price: number): number {
  const cents = Math.round(price * 100);
  return (cents - pixDiscountCents(cents)) / 100;
}

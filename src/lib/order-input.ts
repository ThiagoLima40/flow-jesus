export type Customer = { name: string; email: string; phone: string };
export type DeliveryAddress = {
  street: string; number: string; complement: string; neighborhood: string;
  city: string; state: string; postalCode: string; country: "BR";
};
export const brazilianStates = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function field(value: unknown, min: number, max: number): string | null {
  if (typeof value !== "string" || /[\u0000-\u001f\u007f]/.test(value)) return null;
  const result = value.trim();
  return result.length >= min && result.length <= max ? result : null;
}
export function parseOrderContact(customerInput: unknown, addressInput: unknown): { customer: Customer; address: DeliveryAddress } | null {
  const c = record(customerInput), a = record(addressInput);
  const name = field(c.name, 2, 120), email = field(c.email, 3, 254);
  const rawPhone = field(c.phone, 10, 25);
  const phone = rawPhone && /^[+\d\s().-]+$/.test(rawPhone) ? rawPhone.replace(/\D/g, "") : "";
  const street = field(a.street, 2, 160), number = field(a.number, 1, 20);
  const complement = field(a.complement ?? "", 0, 120), neighborhood = field(a.neighborhood, 2, 100);
  const city = field(a.city, 2, 100), state = field(a.state, 2, 2)?.toUpperCase();
  const postalCode = field(a.postalCode, 8, 9)?.replace(/-/g, "");
  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !/^(?:55)?[1-9]\d\d{8,9}$/.test(phone) || !street || !number || complement === null ||
      !neighborhood || !city || !state || !brazilianStates.includes(state) ||
      !postalCode || !/^\d{8}$/.test(postalCode) || /^0{8}$/.test(postalCode) ||
      (a.country !== undefined && a.country !== "BR")) return null;
  return { customer: { name, email, phone }, address: { street, number, complement, neighborhood, city, state, postalCode, country: "BR" } };
}

export const validCheckoutId = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

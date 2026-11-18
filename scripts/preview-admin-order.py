#!/usr/bin/env python3
"""Render a private, offline order preview from read-only JSON exports.

No credentials, network requests, database writes, email sends or deployments.
Keep the input and generated HTML outside the repository: they contain PII.
"""

import argparse
from datetime import datetime
from decimal import Decimal
from html import escape
import json
from pathlib import Path
from zoneinfo import ZoneInfo


def html(value):
    return escape(str(value), quote=True)


def money(cents):
    if type(cents) is not int or cents < 0:
        raise ValueError("Valor em centavos inválido.")
    integer, fraction = divmod(cents, 100)
    return f"R$ {integer:,}".replace(",", ".") + f",{fraction:02d}"


def load_order(path):
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, list):
        if not data or any(part.get("success") is not True for part in data):
            raise ValueError("A exportação do D1 não indica sucesso.")
        rows = [row for part in data for row in part.get("results", [])]
        if len(rows) != 1:
            raise ValueError("A prévia exige exatamente um pedido.")
        return rows[0]
    if not isinstance(data, dict):
        raise ValueError("Pedido inválido.")
    return data


def render(order, payment=None):
    items = json.loads(order["items_json"])
    if not isinstance(items, list) or not items:
        raise ValueError("O pedido não contém itens.")
    for item in items:
        if type(item["quantity"]) is not int or item["quantity"] <= 0:
            raise ValueError("Quantidade inválida.")
        money(item["unitPriceCents"])
        money(item["subtotalCents"])
        if item["unitPriceCents"] * item["quantity"] != item["subtotalCents"]:
            raise ValueError("Subtotal do item inconsistente.")
    for key in ["subtotal_cents", "coupon_discount_cents", "pix_discount_cents", "shipping_cents", "total_cents"]:
        money(order[key])
    if sum(item["subtotalCents"] for item in items) != order["subtotal_cents"]:
        raise ValueError("Subtotal do pedido inconsistente.")
    expected = order["subtotal_cents"] - order["coupon_discount_cents"] - order["pix_discount_cents"] + order["shipping_cents"]
    if expected != order["total_cents"]:
        raise ValueError("Total do pedido inconsistente.")
    if order["shipping_mode"] not in ("pickup", "delivery"):
        raise ValueError("Forma de recebimento desconhecida.")
    if order["shipping_mode"] == "pickup" and order["shipping_cents"] != 0:
        raise ValueError("A retirada deve ter frete zero.")

    paid = False
    payment_label = "Não consultado nesta prévia"
    if payment is not None:
        if str(payment["id"]) != str(order["mercado_pago_payment_id"]) or payment["external_reference"] != order["order_number"]:
            raise ValueError("Pagamento não corresponde ao pedido.")
        if payment["currency_id"] != "BRL" or payment.get("live_mode") is not True:
            raise ValueError("Pagamento não é de produção em BRL.")
        if Decimal(str(payment["transaction_amount"])) * 100 != order["total_cents"]:
            raise ValueError("Valor do pagamento não corresponde ao pedido.")
        paid = payment["status"] == "approved"
        payment_label = {
            "approved": "Aprovado", "pending": "Pendente", "in_process": "Em análise",
            "rejected": "Rejeitado", "cancelled": "Cancelado", "refunded": "Estornado",
            "charged_back": "Contestado",
        }.get(payment["status"], payment["status"])

    count = sum(item["quantity"] for item in items)
    receipt = "Retirada no local" if order["shipping_mode"] == "pickup" else "Entrega"
    rows = []
    checklist = []
    for index, item in enumerate(items):
        values = [item["name"], item["color"], item["size"], item["quantity"], money(item["unitPriceCents"]), money(item["subtotalCents"])]
        labels = ["Produto", "Cor", "Tamanho", "Quantidade", "Valor unitário", "Subtotal"]
        rows.append('<tr>' + ''.join(f'<td data-label="{label}">{html(value)}</td>' for label, value in zip(labels, values)) + '</tr>')
        checklist.append(f'<li><label for="item-{index}"><input id="item-{index}" type="checkbox"><span><strong>{item["quantity"]} × {html(item["name"])}</strong><small>{html(item["color"])} · tamanho {html(item["size"])}</small></span></label></li>')
    note = ""
    if paid and order["status"] != "pago":
        note = '<p class="note">O Mercado Pago confirma o pagamento, mas o pedido no D1 ainda consta como <strong>' + html(order["status"]) + '</strong>. Esta prévia apenas exibe os dados; não sincroniza nem altera o pedido.</p>'
    timestamp = datetime.now(ZoneInfo("America/Sao_Paulo")).strftime("%d/%m/%Y às %H:%M")
    coupon = f'<div><dt>Desconto do cupom</dt><dd>− {money(order["coupon_discount_cents"])}</dd></div>' if order["coupon_discount_cents"] else ""
    return f'''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<meta name="robots" content="noindex,nofollow"><title>Resumo administrativo — {html(order["order_number"])}</title>
<style>
*{{box-sizing:border-box}}body{{margin:0;background:#080b0c;color:#f7f7f7;font:16px/1.5 system-ui,sans-serif}}main{{max-width:1120px;margin:auto;padding:42px 24px}}.brand{{color:#00d9ff;letter-spacing:.18em;font-weight:800;font-size:13px}}h1{{font-size:clamp(28px,5vw,42px);margin:12px 0}}h2{{font-size:20px;margin:0 0 20px}}.muted,small{{color:#afbac0}}.id{{overflow-wrap:anywhere;font-size:14px}}.head{{display:flex;justify-content:space-between;align-items:center;gap:24px}}.count{{color:#ffc400;font-size:20px;font-weight:700;white-space:nowrap}}.grid{{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:26px 0}}.card{{border:1px solid #303c40;background:#101619;padding:24px;border-radius:12px;min-width:0}}.statuses{{display:flex;flex-wrap:wrap;gap:12px;margin-top:20px}}.status{{border:1px solid #46545a;border-radius:8px;padding:10px 14px;font-size:14px}}.approved{{color:#85edbc;border-color:#327555}}.note{{border-left:3px solid #ffc400;background:#201d11;padding:14px 18px;font-size:14px;margin:20px 0 0}}.details{{margin:0}}.details div{{margin-bottom:12px}}dt{{color:#afbac0;font-size:14px}}dd{{margin:3px 0 0;overflow-wrap:anywhere}}table{{border-collapse:collapse;width:100%;font-size:14px}}th{{text-align:left;color:#afbac0;font-weight:500;padding:12px 10px;border-bottom:1px solid #46545a}}td{{padding:16px 10px;border-bottom:1px solid #293438}}td:first-child{{font-weight:650;width:37%}}td:nth-child(n+4),th:nth-child(n+4){{text-align:right;white-space:nowrap}}.totals{{margin:0}}.totals div{{display:flex;justify-content:space-between;gap:16px;padding:9px 0}}.totals dd{{margin:0;white-space:nowrap}}.total{{border-top:1px solid #46545a;margin-top:12px;padding-top:20px!important}}.total dt,.total dd{{color:#ffc400;font-size:22px;font-weight:750}}ul{{padding:0;list-style:none;margin:0}}li+li{{margin-top:14px}}label{{display:flex;gap:12px;align-items:flex-start;cursor:pointer}}input{{accent-color:#00d9ff;width:20px;height:20px;margin:3px 0;flex-shrink:0}}small{{display:block;margin-top:3px}}footer{{font-size:12px;color:#afbac0;margin-top:28px}}.full{{margin-top:24px}}
@media(max-width:700px){{main{{padding:24px 16px}}.head{{display:block}}.count{{margin-top:12px}}.grid{{grid-template-columns:1fr;gap:16px}}.card{{padding:20px}}thead{{display:none}}table,tbody,tr,td{{display:block;width:100%}}tr+tr{{margin-top:18px}}tr{{border:1px solid #344249;border-radius:8px;padding:12px}}td,td:first-child{{width:auto;border:0;padding:4px 0}}td:first-child{{font-size:16px;margin-bottom:8px}}td:not(:first-child){{display:flex;justify-content:space-between;gap:12px;text-align:right;white-space:normal}}td:not(:first-child)::before{{content:attr(data-label);color:#afbac0;text-align:left;font-weight:400}}.statuses{{flex-direction:column}}}}
@media print{{body{{background:white;color:black;font-size:12px}}main{{padding:0}}.card{{background:white;border-color:#bbb;break-inside:avoid;padding:16px}}.brand,.count,.total dt,.total dd,.approved{{color:black}}dt,small,.muted,footer,th{{color:#444}}.note{{background:white}}input{{appearance:auto}}}}
</style></head><body><main>
<header><div class="brand">FLOWJESUS · RESUMO ADMINISTRATIVO</div><div class="head"><h1>Pedido para separação</h1><div class="count">{count} camisetas</div></div>
<div class="id">Pedido <strong>{html(order["order_number"])}</strong></div><div class="id muted">Pagamento Mercado Pago {html(order["mercado_pago_payment_id"])}</div>
<div class="statuses"><div class="status {'approved' if paid else ''}">Mercado Pago: <strong>{html(payment_label)}</strong></div><div class="status">Pedido no D1: <strong>{html(order["status"])}</strong></div></div>{note}</header>
<div class="grid"><section class="card"><h2>Cliente</h2><dl class="details"><div><dt>Nome</dt><dd>{html(order["customer_name"])}</dd></div><div><dt>Telefone</dt><dd>{html(order["customer_phone"])}</dd></div><div><dt>E-mail</dt><dd>{html(order["customer_email"])}</dd></div></dl></section>
<section class="card"><h2>Recebimento</h2><p class="count">{receipt}</p><p class="muted">Frete: {money(order["shipping_cents"])}</p></section></div>
<section class="card"><h2>Produtos do pedido</h2><table><thead><tr><th scope="col">Produto</th><th scope="col">Cor</th><th scope="col">Tamanho</th><th scope="col">Qtd.</th><th scope="col">Unitário</th><th scope="col">Subtotal</th></tr></thead><tbody>{''.join(rows)}</tbody></table></section>
<div class="grid"><section class="card"><h2>Lista para separação</h2><ul>{''.join(checklist)}</ul></section>
<section class="card"><h2>Valores</h2><dl class="totals"><div><dt>Subtotal</dt><dd>{money(order["subtotal_cents"])}</dd></div>{coupon}<div><dt>Desconto Pix</dt><dd>− {money(order["pix_discount_cents"])}</dd></div><div><dt>Frete</dt><dd>{money(order["shipping_cents"])}</dd></div><div class="total"><dt>{'Total pago' if paid else 'Total do pedido'}</dt><dd>{money(order["total_cents"])}</dd></div></dl></section></div>
<footer>Prévia local gerada em {timestamp} (Brasília), a partir de consultas de leitura. Não envia e-mail nem altera o pedido. As marcações da lista são apenas visuais e não são salvas.</footer>
</main></body></html>'''


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path, help="Exportação JSON de leitura do D1")
    parser.add_argument("--payment", type=Path, help="Consulta JSON de leitura do pagamento")
    parser.add_argument("--output", required=True, type=Path, help="HTML privado fora do repositório")
    args = parser.parse_args()
    repo = Path(__file__).resolve().parents[1]
    if args.output.resolve().is_relative_to(repo):
        parser.error("Salve a prévia fora do repositório para não publicar dados pessoais.")
    try:
        order = load_order(args.input)
        payment = json.loads(args.payment.read_text(encoding="utf-8")) if args.payment else None
        document = render(order, payment)
        args.output.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        args.output.touch(mode=0o600, exist_ok=True)
        args.output.chmod(0o600)
        args.output.write_text(document, encoding="utf-8")
    except (ValueError, KeyError, TypeError, OSError) as error:
        parser.error(str(error))
    print(f"Prévia local gerada: {args.output}")


if __name__ == "__main__":
    main()

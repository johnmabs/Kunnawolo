import type { SaleCart, SaleFinalization, SaleLine } from "@/modules/sales/domain/sale-cart";
import type { SalePayment } from "@/modules/sales/domain/sale-payment";

function toLineDto(line: SaleLine) {
  return {
    currency: line.unitPrice.currency,
    discountMinor: line.discount.amountMinor,
    id: line.id.value,
    isBelowCost: line.isBelowCost(),
    lineTotalMinor: line.unitPrice.amountMinor * line.quantity.value - line.discount.amountMinor,
    productId: line.productId.value,
    productName: line.productNameSnapshot,
    quantity: line.quantity.value,
    unitCostMinor: line.unitCost.amountMinor,
    unitPriceMinor: line.unitPrice.amountMinor,
  };
}

function totals(lines: readonly SaleLine[]) {
  const subtotalMinor = lines.reduce((total, line) => total + line.unitPrice.amountMinor * line.quantity.value, 0);
  const discountMinor = lines.reduce((total, line) => total + line.discount.amountMinor, 0);
  return { discountMinor, subtotalMinor, totalMinor: subtotalMinor - discountMinor };
}

export function toSaleCartDto(cart: SaleCart) {
  return { id: cart.id.value, shopId: cart.shopId.value, lines: cart.lines.map(toLineDto), ...totals(cart.lines) };
}

export function toSaleFinalizationDto(finalization: SaleFinalization) {
  return { cartId: finalization.cartId.value, lines: finalization.lines.map(toLineDto), ...totals(finalization.lines) };
}

export function toSalePaymentDto(payment: SalePayment) {
  return {
    amountMinor: payment.amount.amountMinor,
    businessReference: payment.businessReference,
    cartId: payment.cartId.value,
    currency: payment.amount.currency,
    method: payment.method,
  };
}

export function formatMoney(
  amountMinor: number,
  currency: string,
  locale = "fr-FR",
): string {
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "code",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  const fractionDigits =
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2;

  return formatter.format(amountMinor / 10 ** fractionDigits);
}

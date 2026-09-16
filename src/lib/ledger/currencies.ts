import type { CurrencyCode } from "./types";

export const CURRENCIES: {
  code: CurrencyCode;
  label: string;
  symbol: string;
  locale: string;
}[] = [
  { code: "INR", label: "Indian rupee", symbol: "₹", locale: "en-IN" },
  { code: "USD", label: "US dollar", symbol: "$", locale: "en-US" },
  { code: "EUR", label: "Euro", symbol: "€", locale: "en-IE" },
  { code: "GBP", label: "British pound", symbol: "£", locale: "en-GB" },
  { code: "AED", label: "UAE dirham", symbol: "AED", locale: "en-AE" },
  { code: "SGD", label: "Singapore dollar", symbol: "S$", locale: "en-SG" },
  { code: "AUD", label: "Australian dollar", symbol: "A$", locale: "en-AU" },
  { code: "CAD", label: "Canadian dollar", symbol: "C$", locale: "en-CA" },
  { code: "JPY", label: "Japanese yen", symbol: "¥", locale: "ja-JP" },
  { code: "MYR", label: "Malaysian ringgit", symbol: "RM", locale: "en-MY" },
];

const byCode = new Map(CURRENCIES.map((c) => [c.code, c]));

export function currencyMeta(code: CurrencyCode) {
  return byCode.get(code) ?? CURRENCIES[0]!;
}

export function isCurrencyCode(value: string): value is CurrencyCode {
  return byCode.has(value as CurrencyCode);
}

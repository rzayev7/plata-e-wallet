import type { Currency } from "@/types/api";

/** The backend stores balances as a `long` of minor units; AZN/USD/EUR all have 2. */
export const MINOR_UNIT_DIGITS = 2;

const MINOR_UNIT_FACTOR = 10 ** MINOR_UNIT_DIGITS;

/* A fixed locale, so the server and the browser render the same string and hydration matches. */
const LOCALE = "en-US";

const AMOUNT_PATTERN = /^(-?)(\d+)(?:[.,](\d{1,2}))?$/;

/**
 * Parses a human amount ("12", "12.5", "12.34") into minor units.
 *
 * Done with string arithmetic rather than `value * 100`, because 19.99 * 100
 * is 1998.9999999999998 in binary floating point. Returns null when the input
 * is not a well-formed positive amount.
 */
export function parseAmountToMinor(input: string): number | null {
  const match = AMOUNT_PATTERN.exec(input.trim());
  if (!match) {
    return null;
  }

  const [, sign, whole, fraction = ""] = match;
  const minor = Number(whole) * MINOR_UNIT_FACTOR + Number(fraction.padEnd(MINOR_UNIT_DIGITS, "0"));

  if (sign === "-" || minor <= 0 || !Number.isSafeInteger(minor)) {
    return null;
  }
  return minor;
}

/**
 * Converts the major-unit string that `GET /accounts` returns ("5.00") into
 * minor units, so the rest of the app only ever deals in minor units.
 */
export function majorStringToMinor(value: string): number {
  return parseAmountToMinor(value) ?? (value.trim() === "0.00" || value.trim() === "0" ? 0 : Number.NaN);
}

/** "₼1,234.56" — currency-aware, for display only. */
export function formatMinor(minor: number, currency: Currency): string {
  if (!Number.isFinite(minor)) {
    return "—";
  }
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
    minimumFractionDigits: MINOR_UNIT_DIGITS,
    maximumFractionDigits: MINOR_UNIT_DIGITS,
  }).format(minor / MINOR_UNIT_FACTOR);
}

/** "1,234.56" — no symbol, for inputs and tables that label the currency separately. */
export function formatMinorPlain(minor: number): string {
  if (!Number.isFinite(minor)) {
    return "—";
  }
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: MINOR_UNIT_DIGITS,
    maximumFractionDigits: MINOR_UNIT_DIGITS,
  }).format(minor / MINOR_UNIT_FACTOR);
}

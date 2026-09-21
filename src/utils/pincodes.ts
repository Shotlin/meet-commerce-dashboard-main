/**
 * Service-area PIN parsing for the dashboard.
 *
 * The backend matches customer PINs against `shops.serviceable_pincodes` by
 * exact string equality, so the list must be clean before it is sent:
 * separators handled, whitespace removed, blanks dropped, duplicates removed
 * (e.g. "201301, 201301" is stored once). The API normalises the same way
 * (backend src/utils/pincode.js) — this keeps the admin's text box honest and
 * reports typos before saving instead of silently storing a PIN that can
 * never match.
 */

/** A valid Indian PIN: 6 digits, first digit 1-9 (same rule as the backend). */
export const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

export interface ParsedPincodes {
  /** Valid, de-duplicated PINs in first-seen order. */
  pincodes: string[];
  /** Entries that are not valid 6-digit PINs (de-duplicated). */
  invalid: string[];
}

/**
 * Parse free text such as "700016, 201301,201301  110001" into a clean list.
 * Splits on commas, semicolons and any whitespace.
 */
export function parsePincodeInput(text: string): ParsedPincodes {
  const seen = new Set<string>();
  const seenInvalid = new Set<string>();
  const pincodes: string[] = [];
  const invalid: string[] = [];

  for (const token of text.split(/[\s,;]+/)) {
    if (!token) continue;
    if (PINCODE_REGEX.test(token)) {
      if (!seen.has(token)) {
        seen.add(token);
        pincodes.push(token);
      }
    } else if (!seenInvalid.has(token)) {
      seenInvalid.add(token);
      invalid.push(token);
    }
  }

  return { pincodes, invalid };
}

/** Human-readable error for {@link ParsedPincodes.invalid}, or null when clean. */
export function describeInvalidPincodes(invalid: string[]): string | null {
  if (invalid.length === 0) return null;
  return `Not a valid 6-digit PIN code: ${invalid.join(', ')}. Fix or remove ${
    invalid.length === 1 ? 'it' : 'them'
  } before saving.`;
}

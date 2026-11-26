/**
 * Repair Thai text corrupted by UTF-8 bytes mis-decoded as TIS-620/Windows-874,
 * then stored again as UTF-8 (classic รพ → เธฃเธ).
 */

function isBrokenThaiMojibake(s: string): boolean {
  if (!s) return false;
  if (/[\u0080-\u009F]/.test(s)) return true;
  if (s.includes("\uFFFD") && /เ[ธน]/.test(s)) return true;
  const triples = (s.match(/เธ./g) || []).length;
  const thaiChars = (s.match(/[\u0E00-\u0E7F]/g) || []).length;
  if (thaiChars >= 6 && triples >= 2 && triples * 2 >= thaiChars * 0.5) {
    return true;
  }
  return false;
}

function encodeWin874Loose(str: string): Buffer {
  const out: number[] = [];
  for (const ch of str) {
    const cp = ch.codePointAt(0)!;
    if (cp === 0xfffd) {
      // Byte 0xA0 is undefined in TIS-620 and often became U+FFFD.
      // In UTF-8 Thai this is almost always the 3rd byte of ภ (E0 B8 A0) or ๐ (E0 B9 A0).
      const prev1 = out[out.length - 1];
      const prev2 = out[out.length - 2];
      if (prev2 === 0xe0 && (prev1 === 0xb8 || prev1 === 0xb9)) {
        out.push(0xa0);
      } else {
        out.push(0xa0);
      }
      continue;
    }
    if (cp <= 0x9f) {
      out.push(cp);
      continue;
    }
    if (cp >= 0x0e01 && cp <= 0x0e5b) {
      out.push(cp - 0x0e00 + 0xa0);
      continue;
    }
    // Already-valid Unicode outside the mojibake alphabet — keep UTF-8 bytes
    const utf8 = Buffer.from(ch, "utf8");
    for (const b of utf8) out.push(b);
  }
  return Buffer.from(out);
}

export function fixThaiMojibake(input: string | null | undefined): string | null | undefined {
  if (input == null || input === "") return input;
  if (!isBrokenThaiMojibake(input)) return input;

  const fixed = encodeWin874Loose(input).toString("utf8");
  if (!fixed || fixed.includes("\uFFFD")) {
    // Partial recovery still better than leaving full mojibake when mostly valid
    const cleaned = fixed.replace(/\uFFFD/g, "");
    if (cleaned && /[\u0E00-\u0E7F]/.test(cleaned) && !isBrokenThaiMojibake(cleaned)) {
      return cleaned;
    }
    return input;
  }
  // Avoid double-fixing good text that merely looked suspicious
  if (isBrokenThaiMojibake(fixed)) return input;
  return fixed;
}

export function needsThaiMojibakeFix(input: string | null | undefined): boolean {
  if (input == null || input === "") return false;
  return isBrokenThaiMojibake(input);
}

/** Parse JSON string array and repair Thai mojibake in each message. */
export function parseThaiJsonList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const text = fixThaiMojibake(raw) ?? raw;
  try {
    const parsed = JSON.parse(text) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map((item) => {
        const s = String(item);
        return fixThaiMojibake(s) ?? s;
      });
    }
  } catch {
    /* fall through */
  }
  return [fixThaiMojibake(text) ?? text];
}

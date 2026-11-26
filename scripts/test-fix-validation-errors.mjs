import fs from "fs";
import { createRequire } from "module";

// inline copy of fix logic
function isBrokenThaiMojibake(s) {
  if (!s) return false;
  if (/[\u0080-\u009F]/.test(s)) return true;
  if (s.includes("\uFFFD") && /เ[ธน]/.test(s)) return true;
  const triples = (s.match(/เธ./g) || []).length;
  const thaiChars = (s.match(/[\u0E00-\u0E7F]/g) || []).length;
  if (thaiChars >= 6 && triples >= 2 && triples * 2 >= thaiChars * 0.5) return true;
  return false;
}

function encodeWin874Loose(str) {
  const out = [];
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    if (cp === 0xfffd) {
      out.push(0xa0);
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
    const utf8 = Buffer.from(ch, "utf8");
    for (const b of utf8) out.push(b);
  }
  return Buffer.from(out);
}

function fixThaiMojibake(input) {
  if (input == null || input === "") return input;
  if (!isBrokenThaiMojibake(input)) return { skipped: true, input };
  const fixed = encodeWin874Loose(input).toString("utf8");
  return {
    broken: true,
    fixed,
    hasFFFD: fixed.includes("\uFFFD"),
    stillBroken: isBrokenThaiMojibake(fixed),
    wouldKeepOriginal: !fixed || fixed.includes("\uFFFD") || isBrokenThaiMojibake(fixed),
  };
}

const sample = JSON.parse(
  fs.readFileSync("scripts/import-error-encoding.json", "utf8"),
).errs[0].validationErrors;

const result = fixThaiMojibake(sample);
fs.writeFileSync(
  "scripts/test-fix-validation-result.json",
  JSON.stringify({ sample, result }, null, 2),
  "utf8",
);
console.log("done");

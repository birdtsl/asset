import { createHash, randomBytes } from "crypto";
import QRCode from "qrcode";

export function createQrToken(assetId: string) {
  const salt = randomBytes(8).toString("hex");
  return createHash("sha256")
    .update(`${assetId}:${salt}:${Date.now()}`)
    .digest("hex")
    .slice(0, 32);
}

export function buildAssetQrUrl(token: string) {
  const base = (process.env.APP_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  return `${base}/q/${token}`;
}

export async function generateQrDataUrl(url: string) {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
    color: {
      dark: "#134e4a",
      light: "#ffffff",
    },
  });
}

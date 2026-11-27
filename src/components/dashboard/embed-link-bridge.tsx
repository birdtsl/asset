"use client";

import { useEffect } from "react";

const FALLBACK_ORIGIN = "http://183.89.210.168:3004";

/**
 * Origin ที่ผู้ใช้กำลังเปิดอยู่ (iframe / แท็บ)
 * ใช้ host เดียวกับหน้าที่เห็น — ไม่บังคับ IP วง LAN
 */
function resolvePublicOrigin(): string {
  if (typeof window !== "undefined") {
    const o = window.location.origin.replace(/\/+$/, "");
    if (o && !/localhost|127\.0\.0\.1/i.test(o)) return o;
  }

  const fromEnv = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "");
  if (fromEnv && !/localhost|127\.0\.0\.1/i.test(fromEnv)) return fromEnv;

  return FALLBACK_ORIGIN;
}

/** host ของ Smart Asset ที่ถือว่าเป็นแอปเดียวกัน (จะ rewrite ไป origin ที่ผู้ใช้เปิด) */
const SAME_APP_HOST =
  /^(183\.89\.210\.168|192\.168\.1\.45|localhost|127\.0\.0\.1)$/i;

function sameSmartAssetHost(url: URL, publicOrigin: string): boolean {
  if (url.origin === publicOrigin) return true;
  return SAME_APP_HOST.test(url.hostname);
}

/**
 * ในหน้า embed ของ MIS — คลิกลิงก์ภายในให้เปิดผ่าน SSO (top-level)
 * ใช้ host เดียวกับที่เปิด embed อยู่ เพื่อให้เห็นข้อมูลได้ทันที (ไม่ต้องเข้าวง LAN)
 */
export function EmbedLinkBridge({ ssoToken }: { ssoToken: string }) {
  useEffect(() => {
    if (!ssoToken) return;

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;

      const publicOrigin = resolvePublicOrigin();
      let url: URL;
      try {
        url = new URL(href, publicOrigin);
      } catch {
        return;
      }

      if (!sameSmartAssetHost(url, publicOrigin)) return;
      if (url.pathname.startsWith("/embed/sso") || url.pathname.startsWith("/login")) return;
      if (url.pathname.startsWith("/api/")) return;

      event.preventDefault();
      event.stopPropagation();

      const enter = new URL("/embed/sso/enter", publicOrigin);
      enter.searchParams.set("token", ssoToken);
      enter.searchParams.set("next", `${url.pathname}${url.search}${url.hash}`);
      window.open(enter.toString(), "_blank", "noopener,noreferrer");
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [ssoToken]);

  return null;
}

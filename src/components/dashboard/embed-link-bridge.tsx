"use client";

import { useEffect } from "react";

const LAN_FALLBACK = "http://192.168.1.45:3004";

function resolvePublicOrigin(): string {
  const fromEnv = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "");
  if (fromEnv && !/localhost|127\.0\.0\.1/i.test(fromEnv)) return fromEnv;

  if (typeof window !== "undefined") {
    const o = window.location.origin;
    // iframe / แท็บที่เด้งมา localhost ทั้งที่บริการจริงอยู่ที่เครื่อง .45
    if (/localhost|127\.0\.0\.1/i.test(o)) return fromEnv || LAN_FALLBACK;
    return o;
  }
  return fromEnv || LAN_FALLBACK;
}

/**
 * ในหน้า embed ของ MIS — คลิกลิงก์ภายในให้เปิดผ่าน SSO (top-level)
 * ใช้ host วง LAN จริง ไม่ใช้ localhost:3004
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

      let url: URL;
      try {
        url = new URL(href, resolvePublicOrigin());
      } catch {
        return;
      }

      // ยอมรับลิงก์ไป host เดิมหรือ localhost ที่ต้อง rewrite
      const publicOrigin = resolvePublicOrigin();
      const sameApp =
        url.origin === publicOrigin ||
        /localhost|127\.0\.0\.1/i.test(url.hostname);
      if (!sameApp) return;
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

"use client";

import { useEffect } from "react";

/**
 * ในหน้า embed ของ MIS — คลิกลิงก์ภายในให้เปิดผ่าน SSO (top-level)
 * เพื่อให้ cookie SameSite=Lax ติด (iframe ข้าม origin ตั้ง cookie ไม่ได้)
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
        url = new URL(href, window.location.origin);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      // ไม่แย่งลิงก์ SSO / login เอง
      if (url.pathname.startsWith("/embed/sso") || url.pathname.startsWith("/login")) return;
      if (url.pathname.startsWith("/api/")) return;

      event.preventDefault();
      event.stopPropagation();
      const enter = new URL("/embed/sso/enter", window.location.origin);
      enter.searchParams.set("token", ssoToken);
      enter.searchParams.set("next", `${url.pathname}${url.search}${url.hash}`);
      window.open(enter.toString(), "_blank", "noopener,noreferrer");
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [ssoToken]);

  return null;
}

import { redirect } from "next/navigation";

/** คง path /login ไว้เพื่อลิงก์เก่า — ส่งไปหน้าแรกที่เป็นหน้า login */
export default async function LoginAliasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") q.set(key, value);
    else if (Array.isArray(value)) {
      for (const v of value) q.append(key, v);
    }
  }
  const qs = q.toString();
  redirect(qs ? `/?${qs}` : "/");
}

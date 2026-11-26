import "dotenv/config";

const base = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");

async function check(path, expectStatus = 200) {
  const res = await fetch(`${base}${path}`, { redirect: "manual" });
  const ok =
    res.status === expectStatus ||
    (expectStatus === 302 && [301, 302, 303, 307, 308].includes(res.status));
  return { path, status: res.status, ok, expectStatus };
}

async function main() {
  const checks = await Promise.all([
    check("/api/health", 200),
    check("/login", 200),
    check("/dashboard", 307), // auth redirect
    check("/q/invalid-token-smoke", 404),
  ]);

  const healthRes = await fetch(`${base}/api/health`);
  const health = await healthRes.json();

  const failed = checks.filter((c) => !c.ok);
  console.log(
    JSON.stringify(
      {
        ok: failed.length === 0 && health.ok,
        base,
        checks,
        health: {
          ok: health.ok,
          db: health.database?.ok,
          counts: health.database?.counts,
          security: health.security,
        },
      },
      null,
      2,
    ),
  );
  if (failed.length > 0 || !health.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

#!/usr/bin/env bash
# รันบนเซิร์ฟ: bash scripts/fix-prod-urls-and-restart.sh
# ตั้ง URL สาธารณะ / กัน redirect ไป localhost แล้ว rebuild + pm2 restart
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PUBLIC_URL="${PUBLIC_URL:-http://183.89.210.168:3004}"
ENV_FILE="$ROOT/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ไม่พบ .env — คัดลอกจาก .env.example ก่อน"
  exit 1
fi

python3 - <<'PY' "$ENV_FILE" "$PUBLIC_URL"
import re, sys
path, url = sys.argv[1], sys.argv[2].rstrip("/")
keys = {
    "APP_URL": f'APP_URL="{url}"',
    "AUTH_URL": f'AUTH_URL="{url}"',
    "NEXT_PUBLIC_APP_URL": f'NEXT_PUBLIC_APP_URL="{url}"',
    "PORT": "PORT=3004",
    "AUTH_TRUST_HOST": 'AUTH_TRUST_HOST="true"',
}
text = open(path, encoding="utf-8").read()
for key, line in keys.items():
    pat = re.compile(rf"(?m)^{re.escape(key)}=.*$")
    if pat.search(text):
        text = pat.sub(line, text)
    else:
        text = text.rstrip() + "\n" + line + "\n"
open(path, "w", encoding="utf-8").write(text)
print("updated", path, "->", url)
PY

git pull --ff-only
npm ci
npx prisma generate
npm run build

if command -v pm2 >/dev/null 2>&1; then
  pm2 restart tslasset || pm2 start "npx next start -p 3004" --name tslasset --cwd "$ROOT"
  pm2 save
  pm2 status tslasset
else
  echo "ไม่มี pm2 — รัน: npx next start -p 3004"
fi

echo "เปิด: $PUBLIC_URL"

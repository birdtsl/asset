import fs from "fs/promises";
import path from "path";

export function getStorageRoot() {
  const configured = process.env.STORAGE_ROOT;
  if (configured) {
    return path.isAbsolute(configured)
      ? configured
      : path.join(/*turbopackIgnore: true*/ process.cwd(), configured);
  }
  return path.join(/*turbopackIgnore: true*/ process.cwd(), "storage");
}

export async function ensureStorageDirs() {
  const root = getStorageRoot();
  await fs.mkdir(path.join(root, "imports"), { recursive: true });
  await fs.mkdir(path.join(root, "uploads"), { recursive: true });
  return root;
}

export async function saveImportFile(
  fileName: string,
  buffer: Buffer,
): Promise<{ storedPath: string; absolutePath: string }> {
  const root = await ensureStorageDirs();
  const safeName = fileName.replace(/[^\w.\-ก-๙() ]+/g, "_");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const finalName = `${stamp}_${safeName}`;
  const absolutePath = path.join(root, "imports", finalName);
  await fs.writeFile(absolutePath, buffer);
  return {
    storedPath: path.join("storage", "imports", finalName).replace(/\\/g, "/"),
    absolutePath,
  };
}

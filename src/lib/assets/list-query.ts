export const UNCATEGORIZED = "__none__";

export type AssetListQuery = {
  q?: string;
  category?: string;
  status?: string;
  item?: string;
};

export function buildAssetListHref(
  basePath: string,
  opts: AssetListQuery,
) {
  const sp = new URLSearchParams();
  if (opts.q) sp.set("q", opts.q);
  if (opts.category) sp.set("category", opts.category);
  if (opts.status) sp.set("status", opts.status);
  if (opts.item) sp.set("item", opts.item);
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

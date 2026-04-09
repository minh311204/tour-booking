import { API_BASE_URL } from "./env";

/**
 * Chuẩn hoá URL ảnh từ API / DB để hiển thị trong `<img>` hoặc `next/image`.
 *
 * - URL đầy đủ `https://...` → giữ nguyên (CDN, Unsplash, S3 public, …).
 * - Đường dẫn tương đối `/uploads/...` hoặc `uploads/...` → nối với `NEXT_PUBLIC_API_URL`
 *   (backend phải phục vụ file tĩnh tại host đó).
 */
export function resolvePublicImageUrl(
  url: string | null | undefined,
): string | null {
  const u = url?.trim();
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  const base = API_BASE_URL.replace(/\/$/, "");
  const path = u.startsWith("/") ? u : `/${u}`;
  return `${base}${path}`;
}

export const WORKER_MEDIA_BUCKET = "worker-media";

export const WORKER_MEDIA_ALLOWED_MIME_TYPES = [
  "image/avif",
  "image/webp",
  "image/jpeg",
  "image/png",
] as const;

export const WORKER_MEDIA_FILE_SIZE_LIMIT_BYTES = 2 * 1024 * 1024;
export const WORKER_MEDIA_MAX_FILES_PER_UPLOAD = 12;

export type WorkerMediaKind = "profile" | "portfolio";

const imageExtensions: Record<string, string> = {
  "image/avif": "avif",
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
};

export function isWorkerMediaKind(value: FormDataEntryValue | null): value is WorkerMediaKind {
  return value === "profile" || value === "portfolio";
}

export function isAllowedWorkerMediaMimeType(
  mimeType: string,
): mimeType is (typeof WORKER_MEDIA_ALLOWED_MIME_TYPES)[number] {
  return WORKER_MEDIA_ALLOWED_MIME_TYPES.includes(
    mimeType as (typeof WORKER_MEDIA_ALLOWED_MIME_TYPES)[number],
  );
}

export function getWorkerMediaExtension(mimeType: string) {
  return imageExtensions[mimeType] ?? "bin";
}

export function slugifyStorageSegment(value: string, fallback = "draft-worker") {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug || fallback;
}

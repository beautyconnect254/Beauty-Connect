import { randomUUID } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import {
  getWorkerMediaExtension,
  isAllowedWorkerMediaMimeType,
  isWorkerMediaKind,
  slugifyStorageSegment,
  WORKER_MEDIA_ALLOWED_MIME_TYPES,
  WORKER_MEDIA_BUCKET,
  WORKER_MEDIA_FILE_SIZE_LIMIT_BYTES,
  WORKER_MEDIA_MAX_FILES_PER_UPLOAD,
  type WorkerMediaKind,
} from "@/lib/worker-media";

export const runtime = "nodejs";

const bucketOptions = {
  public: true,
  allowedMimeTypes: [...WORKER_MEDIA_ALLOWED_MIME_TYPES],
  fileSizeLimit: WORKER_MEDIA_FILE_SIZE_LIMIT_BYTES,
};

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function shouldCreateBucket(error: { message?: string; status?: number | string } | null) {
  if (!error) {
    return false;
  }

  const message = error.message?.toLowerCase() ?? "";

  return (
    message.includes("not found") ||
    message.includes("does not exist") ||
    String(error.status) === "404"
  );
}

function isAlreadyExistsError(error: { message?: string; status?: number | string }) {
  const message = error.message?.toLowerCase() ?? "";

  return message.includes("already exists") || String(error.status) === "409";
}

function hasExpectedMimeTypes(mimeTypes: string[] | null | undefined) {
  if (!Array.isArray(mimeTypes)) {
    return false;
  }

  return (
    mimeTypes.length === WORKER_MEDIA_ALLOWED_MIME_TYPES.length &&
    WORKER_MEDIA_ALLOWED_MIME_TYPES.every((mimeType) => mimeTypes.includes(mimeType))
  );
}

async function ensureWorkerMediaBucket(
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>,
) {
  const { data: bucket, error: bucketError } =
    await supabase.storage.getBucket(WORKER_MEDIA_BUCKET);

  if (bucket) {
    if (
      bucket.public !== bucketOptions.public ||
      bucket.file_size_limit !== bucketOptions.fileSizeLimit ||
      !hasExpectedMimeTypes(bucket.allowed_mime_types)
    ) {
      const { error: updateError } = await supabase.storage.updateBucket(
        WORKER_MEDIA_BUCKET,
        bucketOptions,
      );

      if (updateError) {
        throw new Error(`Could not update storage bucket: ${updateError.message}`);
      }
    }

    return;
  }

  if (bucketError && !shouldCreateBucket(bucketError)) {
    throw new Error(`Could not inspect storage bucket: ${bucketError.message}`);
  }

  const { error: createError } = await supabase.storage.createBucket(
    WORKER_MEDIA_BUCKET,
    bucketOptions,
  );

  if (createError && !isAlreadyExistsError(createError)) {
    throw new Error(`Could not create storage bucket: ${createError.message}`);
  }
}

function getUploadFolder(kind: WorkerMediaKind) {
  return kind === "profile" ? "profile-photos" : "catalog";
}

function getStoragePath(kind: WorkerMediaKind, workerName: string, mimeType: string) {
  const workerSlug = slugifyStorageSegment(workerName);
  const extension = getWorkerMediaExtension(mimeType);

  return `${getUploadFolder(kind)}/${workerSlug}/${Date.now()}-${randomUUID()}.${extension}`;
}

function getFiles(formData: FormData) {
  return formData
    .getAll("files")
    .filter((value): value is File => value instanceof File && value.size > 0);
}

export async function POST(request: NextRequest) {
  const adminSession = await getAdminSession();

  if (!adminSession) {
    return errorResponse("Admin session required.", 401);
  }

  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return errorResponse(
      "SUPABASE_SERVICE_ROLE_KEY is required for secure admin media uploads.",
      503,
    );
  }

  const formData = await request.formData().catch(() => null);

  if (!formData) {
    return errorResponse("Upload form data is invalid.", 400);
  }

  const kind = formData.get("kind");
  const workerNameEntry = formData.get("workerName");
  const workerName = typeof workerNameEntry === "string" ? workerNameEntry : "";
  const files = getFiles(formData);

  if (!isWorkerMediaKind(kind)) {
    return errorResponse("Upload kind must be profile or portfolio.", 400);
  }

  if (files.length === 0) {
    return errorResponse("Choose at least one image to upload.", 400);
  }

  if (kind === "profile" && files.length > 1) {
    return errorResponse("Upload one profile photo at a time.", 400);
  }

  if (files.length > WORKER_MEDIA_MAX_FILES_PER_UPLOAD) {
    return errorResponse(
      `Upload ${WORKER_MEDIA_MAX_FILES_PER_UPLOAD} images or fewer at a time.`,
      400,
    );
  }

  for (const file of files) {
    if (!isAllowedWorkerMediaMimeType(file.type)) {
      return errorResponse("Only JPEG, PNG, WebP, and AVIF images are supported.", 400);
    }

    if (file.size > WORKER_MEDIA_FILE_SIZE_LIMIT_BYTES) {
      return errorResponse(
        "Compressed image is too large for the worker-media bucket.",
        400,
      );
    }
  }

  try {
    await ensureWorkerMediaBucket(supabase);

    const uploads = await Promise.all(
      files.map(async (file) => {
        const path = getStoragePath(kind, workerName, file.type);
        const bytes = Buffer.from(await file.arrayBuffer());
        const { error: uploadError } = await supabase.storage
          .from(WORKER_MEDIA_BUCKET)
          .upload(path, bytes, {
            cacheControl: "31536000",
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const { data } = supabase.storage.from(WORKER_MEDIA_BUCKET).getPublicUrl(path);

        return {
          path,
          publicUrl: data.publicUrl,
          contentType: file.type,
          size: file.size,
        };
      }),
    );

    return NextResponse.json({ uploads });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Worker media upload failed.";

    return errorResponse(message, 500);
  }
}

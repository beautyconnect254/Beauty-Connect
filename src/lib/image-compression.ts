import {
  getWorkerMediaExtension,
  isAllowedWorkerMediaMimeType,
  WORKER_MEDIA_FILE_SIZE_LIMIT_BYTES,
} from "@/lib/worker-media";

export interface ImageCompressionOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  maxBytes?: number;
}

const maxSourceImageBytes = 15 * 1024 * 1024;

function fileBaseName(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, "") || "image";
}

function blobToFile(blob: Blob, sourceFile: File) {
  const extension = getWorkerMediaExtension(blob.type);

  return new File([blob], `${fileBaseName(sourceFile.name)}.${extension}`, {
    type: blob.type,
    lastModified: Date.now(),
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mimeType, quality);
  });
}

async function loadImage(file: File) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.decoding = "async";
    image.src = objectUrl;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function compressImageFile(
  file: File,
  {
    maxWidth,
    maxHeight,
    quality,
    maxBytes = WORKER_MEDIA_FILE_SIZE_LIMIT_BYTES,
  }: ImageCompressionOptions,
) {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    throw new Error("Upload a JPEG, PNG, WebP, or AVIF image.");
  }

  if (file.size > maxSourceImageBytes) {
    throw new Error("Choose an image smaller than 15 MB before compression.");
  }

  const image = await loadImage(file).catch(() => {
    throw new Error("That image could not be read. Try a different file.");
  });

  if (!image.naturalWidth || !image.naturalHeight) {
    throw new Error("That image has invalid dimensions.");
  }

  const scale = Math.min(
    1,
    maxWidth / image.naturalWidth,
    maxHeight / image.naturalHeight,
  );
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { alpha: false });

  if (!context) {
    throw new Error("Image compression is not available in this browser.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const webpBlob = await canvasToBlob(canvas, "image/webp", quality);
  const fallbackBlob =
    webpBlob && webpBlob.type === "image/webp"
      ? webpBlob
      : await canvasToBlob(canvas, "image/jpeg", quality);

  if (!fallbackBlob || !isAllowedWorkerMediaMimeType(fallbackBlob.type)) {
    throw new Error("Image compression failed. Try a JPEG or PNG image.");
  }

  const compressedFile = blobToFile(fallbackBlob, file);
  const originalCanBeStored =
    isAllowedWorkerMediaMimeType(file.type) && file.size <= maxBytes;

  if (originalCanBeStored && file.size <= compressedFile.size) {
    return file;
  }

  if (compressedFile.size > maxBytes) {
    throw new Error("Compressed image is still too large. Try a smaller image.");
  }

  return compressedFile;
}

import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

function getSupabaseStorageHostname() {
  if (!supabaseUrl) {
    return null;
  }

  try {
    return new URL(supabaseUrl).hostname;
  } catch {
    return null;
  }
}

const supabaseStorageHostname = getSupabaseStorageHostname();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      ...(supabaseStorageHostname
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseStorageHostname,
              pathname: "/storage/v1/object/public/worker-media/**",
            },
          ]
        : []),
    ],
  },
  turbopack: {
    root: dirname,
  },
};

export default nextConfig;

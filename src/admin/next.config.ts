import type { NextConfig } from "next";
import path from "path";

/** Host phục vụ ảnh tĩnh từ cùng origin API (uploads). */
function remotePatternFromApiUrl(): {
  protocol: "http" | "https";
  hostname: string;
  pathname: string;
  port?: string;
} | null {
  const raw =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  try {
    const u = new URL(raw);
    const protocol = u.protocol.replace(":", "") as "http" | "https";
    const port =
      u.port && u.port !== "80" && u.port !== "443" ? u.port : undefined;
    return {
      protocol,
      hostname: u.hostname,
      pathname: "/**",
      ...(port ? { port } : {}),
    };
  } catch {
    return null;
  }
}

const apiPattern = remotePatternFromApiUrl();

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "plus.unsplash.com", pathname: "/**" },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      /** Bucket virtual-hosted: *.s3.*.amazonaws.com */
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
        pathname: "/**",
      },
      ...(apiPattern ? [apiPattern] : []),
    ],
  },
};

export default nextConfig;

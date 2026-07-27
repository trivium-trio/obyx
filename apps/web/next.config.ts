import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
    // Ensure no trailing slash so /:path* appends correctly
    const cleanBaseUrl = apiBaseUrl.replace(/\/$/, "");

    if (!/^https?:\/\//.test(cleanBaseUrl)) {
    throw new Error(
      `NEXT_PUBLIC_API_URL must start with http:// or https:// — got: "${cleanBaseUrl}"`
    );
  }

    return [
      {
        source: "/api/v1/:path*",
        destination: `${cleanBaseUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;

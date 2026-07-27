import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    let apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
    if (!apiBaseUrl.startsWith("http://") && !apiBaseUrl.startsWith("https://") && !apiBaseUrl.startsWith("/")) {
      apiBaseUrl = `https://${apiBaseUrl}`;
    }
    // Ensure no trailing slash so /:path* appends correctly
    const cleanBaseUrl = apiBaseUrl.replace(/\/$/, "");

    return [
      {
        source: "/api/v1/:path*",
        destination: `${cleanBaseUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;

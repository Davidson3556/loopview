import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/login", destination: "/auth?mode=signin", permanent: false },
      { source: "/sign-in", destination: "/auth?mode=signin", permanent: false },
      { source: "/signup", destination: "/auth?mode=signup", permanent: false },
      { source: "/sign-up", destination: "/auth?mode=signup", permanent: false },
      { source: "/auth/signin", destination: "/auth?mode=signin", permanent: false },
      { source: "/auth/signup", destination: "/auth?mode=signup", permanent: false },
    ];
  },
};

export default nextConfig;

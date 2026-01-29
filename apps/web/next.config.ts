import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    reactCompiler: true,
    transpilePackages: ["@repo/db"],
    images: {
        remotePatterns: [
            { hostname: "uploadthing.com" },
            { hostname: "z4hrk2n1pd.ufs.sh" },
        ],
    },
};

export default nextConfig;

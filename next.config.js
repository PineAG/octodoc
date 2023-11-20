/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "export",
    basePath: process.env["NEXT_BASEPATH"],
    webpack: (config, { isServer }) => {
        if (!isServer) {
          config.resolve.fallback = { fs: false };
        }
        return config;
    },
}

module.exports = nextConfig

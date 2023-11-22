const BasePath = process.env["NEXT_BASEPATH"]
const EnableExport = !!process.env["NEXT_EXPORT"]

/** @type {import('next').NextConfig} */
const nextConfig = {
    basePath: BasePath,
    output: EnableExport ? "export" : undefined,
    swcMinify: false,
    webpack: (config, { isServer }) => {
        if (!isServer) {
          config.resolve.fallback = { fs: false };
        }
        return config;
    },
}

module.exports = nextConfig

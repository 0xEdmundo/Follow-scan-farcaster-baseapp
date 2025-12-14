/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
    eslint: {
        // Disable ESLint during builds
        ignoreDuringBuilds: true,
    },
    typescript: {
        // Temporarily ignore type errors during build
        ignoreBuildErrors: true,
    },
}

module.exports = nextConfig

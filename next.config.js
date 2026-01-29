/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    reactStrictMode: false,
    images: {
        domains: ['utfs.io'],
    },
}

module.exports = nextConfig

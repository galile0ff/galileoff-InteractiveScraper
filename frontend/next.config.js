/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    images: {
        unoptimized: true, // Docker içinde sorunsuzca çalışması için
    },
}

module.exports = nextConfig

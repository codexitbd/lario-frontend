import type { NextConfig } from 'next'
import { MEDIA_ORIGIN } from './lario.config'

const media = new URL(MEDIA_ORIGIN)

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    // A local backend (Herd, *.test) resolves to 127.0.0.1, which next/image
    // refuses by default. Production serves media from a public host.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== 'production',
    remotePatterns: [
      // Admin uploads, served by the backend (lario.config.ts → backendUrl).
      {
        protocol: media.protocol.replace(':', '') as 'http' | 'https',
        hostname: media.hostname,
        ...(media.port ? { port: media.port } : {}),
        pathname: '/storage/**',
      },
      // Stand-in photography for shots the client has not supplied yet
      // (docs/content-gaps.md, gap 8). Remove with lib/placeholders.ts.
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
    ],
  },
}

export default nextConfig

import type { NextConfig } from 'next'
import { MEDIA_ORIGIN } from './lario.config'

const media = new URL(MEDIA_ORIGIN)

const nextConfig: NextConfig = {
  cacheComponents: true,
  // No "X-Powered-By: Next.js" on every response (QA round 2, B-17).
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    // One level, so every image uses it. 100 because the client wants no
    // visible compression: this resize is the only time a photo is re-saved
    // (the API hands over the uploaded file itself).
    qualities: [100],
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

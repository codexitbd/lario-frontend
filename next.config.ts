import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Stand-in photography only, for the fourteen shots the client has not
    // supplied (docs/content-gaps.md, gap 8). Remove this entry together with
    // lib/placeholders.ts once the real shoot lands — leaving a third-party
    // image host allowlisted in production is a needless open door.
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
    ],
  },
}

export default nextConfig

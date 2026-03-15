import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://opsale.app'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/admin', '/api', '/pos', '/test', '/simple', '/test-session'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

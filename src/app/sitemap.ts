import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://leeztruestyles.com'

  const staticRoutes: MetadataRoute.Sitemap = [
    '/',
    '/products',
    '/about',
    '/contact',
    '/faq',
    '/shipping',
    '/returns',
    '/privacy',
    '/terms',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '/' ? 1 : 0.8,
  }))

  // Fetch all products dynamically
  let productRoutes: MetadataRoute.Sitemap = []
  try {
    const supabase = await createClient()
    const { data: products } = await supabase
      .from('products')
      .select('id, updated_at')

    if (products) {
      productRoutes = products.map((product) => ({
        url: `${baseUrl}/products/${product.id}`,
        lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.6,
      }))
    }
  } catch (error) {
    logger.error('Error fetching products for sitemap:', error)
  }

  return [...staticRoutes, ...productRoutes]
}

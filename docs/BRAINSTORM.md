# Project Brainstorm: Load Time & SEO Optimization

## Problem Statement
Leeztruestyles.com customer portal has slow load times due to sequential database queries and a redirect on the root URL, and poor SEO due to missing metadata, sitemap, robots.txt, and structured data across almost all pages.

## Target Users
Customers browsing the fashion marketplace, and search engine crawlers indexing the site.

## Core Value Proposition
Faster page loads improve conversion rates and reduce bounce. Proper SEO ensures products are discoverable on Google, driving organic traffic to the store.

## MVP Features (Implemented)
- [x] Parallelize home page Supabase queries with Promise.all()
- [x] Add ISR (revalidate = 60) to home page for Vercel caching
- [x] Eliminate root `/` redirect — serve content directly
- [x] Add dynamic sitemap.ts with all static + product pages
- [x] Add robots.ts with proper crawl rules
- [x] Add metadata to all marketplace pages (title, description, OG tags)
- [x] Add generateMetadata to product detail page for per-product SEO
- [x] Add loading.tsx skeleton screens for marketplace pages

## Nice-to-Have (Implemented)
- [x] JSON-LD structured data on product detail pages
- [x] Reduce home page query scope (fetch 20 not 200 for new arrivals)
- [x] Remove verbose debug logging from production code paths
- [x] Deduplicate inventory fetches on home page

## Out of Scope
- Image CDN / format optimization (Next.js Image already handles this)
- Database query optimization at Supabase level (indexes, RPC functions)
- Third-party script optimization (analytics, chat widgets)
- Core Web Vitals fine-tuning (CLS, FID)

## Tech Stack
| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Next.js 14 (App Router) | Already in use, supports ISR + SSR |
| Backend | Supabase | Already in use |
| Hosting | Vercel | ISR, Edge caching, image optimization |
| SEO | Next.js Metadata API + JSON-LD | Native framework support |

## Key Risks & Unknowns
- ISR revalidation may show slightly stale data (60s window)
- Product pages without generateStaticParams won't be pre-rendered at build time
- Structured data accuracy depends on product data completeness in Supabase

## Next Step
Run `/plan` to create a detailed implementation plan from this brainstorm.

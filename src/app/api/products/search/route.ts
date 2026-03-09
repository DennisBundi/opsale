import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20));
    const offset = (page - 1) * limit;

    const supabase = await createClient();

    let productsQuery = supabase
      .from('products')
      .select('*, categories(*)', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Search by name or description
    if (query) {
      // Sanitize query to prevent PostgREST filter injection
      const sanitized = query.replace(/[%_,().*]/g, '');
      if (sanitized.length > 0) {
        const searchTerm = `%${sanitized}%`;
        productsQuery = productsQuery.or(
          `name.ilike.${searchTerm},description.ilike.${searchTerm}`
        );
      }
    }

    // Filter by category
    if (category) {
      productsQuery = productsQuery.eq('category_id', category);
    }

    // Filter by price range
    if (minPrice) {
      productsQuery = productsQuery.gte('price', parseFloat(minPrice));
    }
    if (maxPrice) {
      productsQuery = productsQuery.lte('price', parseFloat(maxPrice));
    }

    // Pagination
    productsQuery = productsQuery.range(offset, offset + limit - 1);

    const { data: products, error, count } = await productsQuery;

    if (error) {
      logger.error('Product search error:', error);
      return NextResponse.json(
        { error: 'Failed to search products' },
        { status: 500 }
      );
    }

    // Get inventory for products with error handling
    if (products && products.length > 0) {
      const productIds = products.map((p) => p.id);
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory')
        .select('product_id, stock_quantity, reserved_quantity')
        .in('product_id', productIds);

      if (inventoryError) {
        logger.error('Error fetching inventory in search:', inventoryError);
      }

      const inventoryMap = new Map(
        inventory?.map((inv) => [
          inv.product_id,
          Math.max(0, (inv.stock_quantity || 0) - (inv.reserved_quantity || 0)),
        ]) || []
      );

      // Add stock availability to products
      // If inventory is missing, leave available_stock as undefined
      // Filter out products with 0 stock - only show products with stock > 0
      const productsWithStock = products
        .map((product) => {
        const stock = inventoryMap.get(product.id);
        return {
          ...product,
          available_stock: stock !== undefined ? stock : undefined,
        };
        })
        .filter((product) => {
          // Filter out products with 0 stock
          // Keep products with undefined stock (inventory not set up yet) or stock > 0
          return product.available_stock === undefined || product.available_stock > 0;
      });

      return NextResponse.json({
        products: productsWithStock,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      });
    }

    return NextResponse.json({
      products: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    });
  } catch (error) {
    logger.error('Product search error:', error);
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    );
  }
}


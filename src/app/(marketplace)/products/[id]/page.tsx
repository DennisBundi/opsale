import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';
import ReviewSummary from '@/components/reviews/ReviewSummary';
import ReviewList from '@/components/reviews/ReviewList';
import ReviewForm from '@/components/reviews/ReviewForm';

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  // Fetch product from Supabase
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', params.id)
    .single();

  if (productError || !product) {
    notFound();
  }

  // Fetch inventory with error handling
  const { data: inventory, error: inventoryError } = await supabase
    .from('inventory')
    .select('stock_quantity, reserved_quantity')
    .eq('product_id', params.id)
    .single();

  if (inventoryError && inventoryError.code !== 'PGRST116') {
    // PGRST116 is "not found" which is okay if inventory doesn't exist yet
    console.error('Error fetching inventory:', inventoryError);
  }

  // Fetch category
  let categoryName = 'Uncategorized';
  if (product.category_id) {
    const { data: category } = await supabase
      .from('categories')
      .select('name')
      .eq('id', product.category_id)
      .single();
    
    if (category) {
      categoryName = category.name;
    }
  }

  // Fetch product colors
  const { data: productColors } = await supabase
    .from('product_colors')
    .select('color')
    .eq('product_id', params.id);

  // Fetch product sizes with stock
  const { data: productSizes } = await supabase
    .from('product_sizes')
    .select('size, stock_quantity, reserved_quantity')
    .eq('product_id', params.id)
    .order('size', { ascending: true });

  // Calculate available stock - use undefined if inventory doesn't exist
  const availableStock = inventory
    ? Math.max(0, (inventory.stock_quantity || 0) - (inventory.reserved_quantity || 0))
    : undefined;

  // Format sizes with available stock
  const sizes = productSizes ? productSizes.map((ps: any) => ({
    size: ps.size,
    available: Math.max(0, (ps.stock_quantity || 0) - (ps.reserved_quantity || 0)),
  })) : [];

  // Format colors
  const colors = productColors ? productColors.map((pc: any) => pc.color) : [];

  // Prepare product data for client component
  const productData = {
    ...product,
    available_stock: availableStock,
    categories: { name: categoryName },
    colors: colors,
    sizes: sizes,
  };

  return (
    <>
      <ProductDetailClient product={productData} />
      {/* Reviews Section */}
      <section className="container mx-auto px-4 py-12 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Customer Reviews</h2>
        <ReviewSummary productId={params.id} />
        <div className="mt-8">
          <ReviewForm productId={params.id} />
        </div>
        <div className="mt-8">
          <ReviewList productId={params.id} />
        </div>
      </section>
    </>
  );
}

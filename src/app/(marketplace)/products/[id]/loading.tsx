export default function ProductDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Image skeleton */}
        <div className="aspect-square bg-gray-200 rounded" />

        {/* Details skeleton */}
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-6 bg-gray-100 rounded w-1/4" />
          <div className="h-10 bg-gray-200 rounded w-1/3" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-100 rounded" />
            <div className="h-4 bg-gray-100 rounded w-5/6" />
            <div className="h-4 bg-gray-100 rounded w-4/6" />
          </div>
          <div className="flex gap-2 mt-4">
            <div className="h-10 w-10 bg-gray-200 rounded-full" />
            <div className="h-10 w-10 bg-gray-200 rounded-full" />
            <div className="h-10 w-10 bg-gray-200 rounded-full" />
          </div>
          <div className="h-12 bg-gray-300 rounded w-full mt-6" />
        </div>
      </div>
    </div>
  );
}

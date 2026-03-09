export default function ProductsLoading() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 animate-pulse">
      <div className="mb-12 text-center">
        <div className="h-10 bg-gray-200 rounded w-56 mx-auto mb-4" />
        <div className="h-4 bg-gray-100 rounded w-80 mx-auto" />
      </div>

      {/* Search/filter skeleton */}
      <div className="mb-8 space-y-4">
        <div className="h-10 bg-gray-200 rounded max-w-md mx-auto" />
        <div className="flex gap-4 justify-center">
          <div className="h-10 w-32 bg-gray-100 rounded" />
          <div className="h-10 w-32 bg-gray-100 rounded" />
          <div className="h-10 w-32 bg-gray-100 rounded" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-square bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

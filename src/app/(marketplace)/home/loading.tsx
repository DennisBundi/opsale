export default function HomeLoading() {
  return (
    <div className="min-h-screen animate-pulse">
      {/* Hero skeleton */}
      <section className="bg-gradient-to-br from-pink-200 to-pink-300 py-24 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="h-12 bg-white/30 rounded-2xl w-3/4 mx-auto mb-6" />
          <div className="h-6 bg-white/20 rounded w-1/2 mx-auto mb-10" />
          <div className="flex gap-4 justify-center">
            <div className="h-12 w-36 bg-white/30 rounded" />
            <div className="h-12 w-36 bg-white/20 rounded" />
          </div>
        </div>
      </section>

      {/* Products skeleton */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4" />
          <div className="h-4 bg-gray-100 rounded w-64 mx-auto mb-12" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-square bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

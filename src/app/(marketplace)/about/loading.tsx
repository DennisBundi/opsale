export default function AboutLoading() {
  return (
    <div className="container mx-auto px-4 py-16 animate-pulse">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <div className="h-12 bg-gray-200 rounded w-80 mx-auto mb-4" />
          <div className="h-5 bg-gray-100 rounded w-64 mx-auto" />
        </div>
        <div className="bg-gray-100 rounded-2xl h-64 mb-16" />
        <div className="bg-gray-100 rounded-2xl h-48 mb-16" />
        <div className="grid md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-40" />
          ))}
        </div>
      </div>
    </div>
  );
}

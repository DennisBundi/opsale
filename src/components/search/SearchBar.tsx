'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, FormEvent } from 'react';

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query) {
      params.set('q', query);
    } else {
      params.delete('q');
    }
    params.set('page', '1');
    router.push(`/products?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-2 border-2 border-gray-200 rounded-xl bg-white shadow-sm px-3 py-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
        <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products, styles, brands..."
          className="flex-1 min-w-0 py-2 text-sm sm:text-base bg-transparent focus:outline-none text-gray-900 placeholder:text-gray-400"
        />
        <button
          type="submit"
          className="shrink-0 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-all"
        >
          Search
        </button>
      </div>
    </form>
  );
}


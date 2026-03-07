"use client";

import { useEffect, useState } from "react";
import ReviewCard, { type ReviewData } from "@/components/reviews/ReviewCard";

interface ReviewListProps {
  productId: string;
}

const PAGE_SIZE = 5;

export default function ReviewList({ productId }: ReviewListProps) {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch(`/api/reviews/product/${productId}`);
        if (!res.ok) return;
        const data = await res.json();
        setReviews(data.reviews || data || []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, [productId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-5">
            <div className="animate-pulse flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-4 bg-gray-200 rounded w-16" />
              </div>
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return null;
  }

  const visibleReviews = reviews.slice(0, visibleCount);
  const hasMore = visibleCount < reviews.length;

  return (
    <div className="flex flex-col gap-4">
      {visibleReviews.map((review, i) => (
        <ReviewCard key={review.id || i} review={review} />
      ))}

      {hasMore && (
        <div className="text-center mt-2">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            className="px-6 py-2 border border-gray-300 rounded-none font-semibold text-sm text-gray-700 hover:border-[#f472b6] hover:text-[#f472b6] transition-colors"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}

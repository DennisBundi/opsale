"use client";

import { useEffect, useState } from "react";
import StarRating from "@/components/reviews/StarRating";

interface ReviewSummaryData {
  average_rating: number;
  total_reviews: number;
  breakdown: Record<string, number>;
}

interface ReviewSummaryProps {
  productId: string;
}

export default function ReviewSummary({ productId }: ReviewSummaryProps) {
  const [data, setData] = useState<ReviewSummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch(`/api/reviews/product/${productId}/summary`);
        if (!res.ok) return;
        const json = await res.json();
        setData(json);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, [productId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse flex flex-col gap-3">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="flex flex-col gap-2 mt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-3 bg-gray-200 rounded w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.total_reviews === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <p className="text-gray-500">No reviews yet. Be the first to review!</p>
      </div>
    );
  }

  const breakdown = data.breakdown || {};

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-start gap-6">
        {/* Average Rating */}
        <div className="flex flex-col items-center">
          <span className="text-4xl font-bold text-gray-900">
            {data.average_rating.toFixed(1)}
          </span>
          <StarRating
            rating={Math.round(data.average_rating)}
            size="md"
            readonly
          />
          <span className="text-sm text-gray-500 mt-1">
            {data.total_reviews} review{data.total_reviews !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Breakdown Bars */}
        <div className="flex-1 flex flex-col gap-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = breakdown[String(star)] || 0;
            const pct =
              data.total_reviews > 0
                ? Math.round((count / data.total_reviews) * 100)
                : 0;

            return (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="w-3 text-gray-600 text-right">{star}</span>
                <svg
                  className="w-4 h-4 text-yellow-400 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-gray-500 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

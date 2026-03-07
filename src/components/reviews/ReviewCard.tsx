"use client";

import { useState } from "react";
import StarRating from "@/components/reviews/StarRating";
import TierBadge from "@/components/loyalty/TierBadge";

export interface ReviewData {
  id?: string;
  reviewer_name: string;
  reviewer_tier: string;
  rating: number;
  text: string;
  image_urls: string[];
  created_at: string;
}

interface ReviewCardProps {
  review: ReviewData;
}

function formatReviewerName(name: string): string {
  if (!name) return "Anonymous";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 text-sm">
            {formatReviewerName(review.reviewer_name)}
          </span>
          {review.reviewer_tier && (
            <TierBadge tier={review.reviewer_tier as "bronze" | "silver" | "gold"} size="sm" />
          )}
          <StarRating rating={review.rating} size="sm" readonly />
        </div>
        <span className="text-xs text-gray-400">
          {formatDate(review.created_at)}
        </span>
      </div>

      {/* Verified Badge */}
      <div className="flex items-center gap-1 mb-2">
        <svg
          className="w-4 h-4 text-green-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-xs text-green-600 font-medium">
          Verified Purchase
        </span>
      </div>

      {/* Review Text */}
      <p className="text-sm text-gray-700 leading-relaxed mb-3">
        {review.text}
      </p>

      {/* Image Thumbnails */}
      {review.image_urls && review.image_urls.length > 0 && (
        <div className="flex gap-2 mt-3">
          {review.image_urls.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() =>
                setExpandedImage(expandedImage === url ? null : url)
              }
              className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 hover:border-[#f472b6] transition-colors"
            >
              <img
                src={url}
                alt={`Review photo ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Expanded Image */}
      {expandedImage && (
        <div className="mt-3">
          <div className="relative inline-block">
            <img
              src={expandedImage}
              alt="Expanded review photo"
              className="max-w-full max-h-80 rounded-lg object-contain"
            />
            <button
              type="button"
              onClick={() => setExpandedImage(null)}
              className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center text-xs hover:bg-black/70"
            >
              X
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

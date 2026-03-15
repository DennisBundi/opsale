"use client";

import ReferralCard from "@/components/loyalty/ReferralCard";
import Link from "next/link";

export default function ReferPage() {
  return (
    <div className="min-h-screen bg-navy">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/profile/rewards"
            className="text-primary-dark hover:text-primary font-medium inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Leez Rewards
          </Link>
        </div>
        <ReferralCard />
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { useLoyaltyStore } from "@/store/loyaltyStore";
import TierBadge from "./TierBadge";

export default function NavbarLoyaltyBadge() {
  const { account, fetchAccount } = useLoyaltyStore();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchAccount();
    }
  }, [fetchAccount]);

  if (!account) return null;

  return (
    <Link
      href="/profile/rewards"
      className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
    >
      <TierBadge tier={account.tier} size="sm" />
      <span className="text-sm font-semibold text-secondary">
        {account.current_points.toLocaleString()}
      </span>
    </Link>
  );
}

"use client";

import { useState } from "react";

const GOODS_CATEGORIES = [
  "Clothing",
  "Footwear",
  "Accessories",
  "Home Goods",
  "Electronics",
  "Other",
];
const ORDER_VALUE_RANGES = [
  "Under KES 50k",
  "KES 50k–100k",
  "KES 100k–500k",
  "Over KES 500k",
];

interface Props {
  onClose: () => void;
}

type FormState = {
  full_name: string;
  email: string;
  phone: string;
  business_name: string;
  goods_category: string;
  monthly_order_value: string;
};

export default function WaitlistModal({ onClose }: Props) {
  const [form, setForm] = useState<FormState>({
    full_name: "",
    email: "",
    phone: "",
    business_name: "",
    goods_category: "",
    monthly_order_value: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function update(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/importation/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Something went wrong. Please try again.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-secondary-dark to-secondary px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-xl">Join the Waitlist</h2>
            <p className="text-white/75 text-sm mt-1">
              Connect your business with Chinese suppliers
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {success ? (
          /* Success state */
          <div className="px-6 py-10 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">You&apos;re on the list!</h3>
            <p className="text-gray-600 mb-2">
              We&apos;ve received your application for{" "}
              <strong>{form.business_name}</strong>.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              You can check your application status anytime at{" "}
              <a href="/importation/status" className="text-secondary underline">
                leeztruestyles.com/importation/status
              </a>{" "}
              using <strong>{form.email}</strong>.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-secondary text-white font-semibold hover:bg-secondary-dark transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          /* Form state */
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => update("full_name", e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
                  placeholder="Jane Wanjiku"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.business_name}
                  onChange={(e) => update("business_name", e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
                  placeholder="Wanjiku Styles"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
                  placeholder="jane@business.co.ke"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
                  placeholder="0712 345 678"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Goods Category *
              </label>
              <select
                required
                value={form.goods_category}
                onChange={(e) => update("goods_category", e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
              >
                <option value="">Select a category</option>
                {GOODS_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Monthly Order Value *
              </label>
              <select
                required
                value={form.monthly_order_value}
                onChange={(e) => update("monthly_order_value", e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
              >
                <option value="">Select a range</option>
                {ORDER_VALUE_RANGES.map((range) => (
                  <option key={range} value={range}>
                    {range}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-secondary text-white font-semibold hover:bg-secondary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting…" : "Join Waitlist"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

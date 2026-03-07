"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Copy, Check, Gift } from "lucide-react";
import { useLoyaltyStore } from "@/store/loyaltyStore";

interface RedeemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const REDEMPTION_OPTIONS = [
  { points: 500, discount: 50 },
  { points: 1000, discount: 100 },
  { points: 2000, discount: 250 },
];

type Step = "select" | "confirm" | "success";

export default function RedeemModal({ isOpen, onClose }: RedeemModalProps) {
  const { account, loading, redeemPoints } = useLoyaltyStore();
  const [step, setStep] = useState<Step>("select");
  const [selected, setSelected] = useState<{ points: number; discount: number } | null>(null);
  const [result, setResult] = useState<{ code: string; discount_amount: number } | null>(null);
  const [copied, setCopied] = useState(false);

  const currentPoints = account?.current_points ?? 0;

  const handleSelect = (option: { points: number; discount: number }) => {
    setSelected(option);
    setStep("confirm");
  };

  const handleConfirm = async () => {
    if (!selected) return;
    const data = await redeemPoints(selected.points);
    if (data) {
      setResult(data);
      setStep("success");
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleClose = () => {
    setStep("select");
    setSelected(null);
    setResult(null);
    setCopied(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Redeem Points
                </h2>
                <p className="text-sm text-gray-500">
                  Balance:{" "}
                  <span className="font-semibold text-pink-500">
                    {currentPoints.toLocaleString()} pts
                  </span>
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Select Step */}
              {step === "select" && (
                <div className="space-y-3">
                  {REDEMPTION_OPTIONS.map((option) => {
                    const available = currentPoints >= option.points;
                    const deficit = option.points - currentPoints;
                    return (
                      <div
                        key={option.points}
                        className={`rounded-lg p-4 border-2 transition-all ${
                          available
                            ? "border-pink-300 bg-white hover:border-pink-400 cursor-pointer"
                            : "border-gray-200 bg-gray-50"
                        }`}
                        onClick={() => available && handleSelect(option)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-800">
                              {option.points.toLocaleString()} pts
                            </p>
                            <p
                              className={`text-sm ${
                                available ? "text-pink-500" : "text-gray-400"
                              }`}
                            >
                              KSh {option.discount} off
                            </p>
                          </div>
                          {available ? (
                            <button className="bg-pink-400 hover:bg-pink-500 text-white font-semibold px-4 py-2 rounded-none hover:scale-105 transition-all text-sm">
                              Redeem
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">
                              Need {deficit} more points
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Confirm Step */}
              {step === "confirm" && selected && (
                <div className="text-center space-y-6">
                  <Gift className="w-12 h-12 text-pink-400 mx-auto" />
                  <div>
                    <p className="text-lg font-semibold text-gray-800">
                      Use {selected.points.toLocaleString()} points for KSh{" "}
                      {selected.discount} off?
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      This action cannot be undone.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setStep("select");
                        setSelected(null);
                      }}
                      className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-none hover:scale-105 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={loading}
                      className="flex-1 bg-pink-400 hover:bg-pink-500 text-white font-semibold py-3 rounded-none hover:scale-105 transition-all disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      ) : (
                        "Confirm"
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Success Step */}
              {step === "success" && result && (
                <div className="text-center space-y-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                  >
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                  </motion.div>
                  <div>
                    <p className="text-lg font-semibold text-gray-800 mb-1">
                      Reward Code Generated!
                    </p>
                    <p className="text-sm text-gray-500">
                      KSh {result.discount_amount} off your next order
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg py-4 px-6">
                    <p className="text-2xl font-bold tracking-widest text-gray-800">
                      {result.code}
                    </p>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="bg-pink-400 hover:bg-pink-500 text-white font-semibold py-3 px-6 rounded-none hover:scale-105 transition-all flex items-center justify-center gap-2 w-full"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Code
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleClose}
                    className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

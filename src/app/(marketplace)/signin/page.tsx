
'use client'

import React, { useState, useRef, Suspense, useTransition } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { login } from '@/app/auth/actions';
import OpSaleLogo from '@/components/ui/OpSaleLogo';

function SignInContent() {
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const errorParam = searchParams.get('error');
  const [error, setError] = useState<string | null>(errorParam ? decodeURIComponent(errorParam) : null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await login(formData);
      } catch (err: any) {
        // Next.js redirect() throws NEXT_REDIRECT error - this is expected
        if (err?.digest?.startsWith('NEXT_REDIRECT')) {
          throw err;
        }
        setError(err?.message || 'An error occurred during login. Please try again.');
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-80px] left-[-80px] w-80 h-80 rounded-full pointer-events-none" style={{ background: 'rgba(0,200,150,0.18)', filter: 'blur(60px)' }} />
      <div className="absolute bottom-[-60px] right-[-60px] w-64 h-64 rounded-full pointer-events-none" style={{ background: 'rgba(245,166,35,0.12)', filter: 'blur(60px)' }} />

      <div className="w-full max-w-md px-4 py-8 relative z-10" style={{ isolation: 'isolate' }}>
        <div className="glass-strong p-8 sm:p-10">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-4">
              <OpSaleLogo size="md" showTagline />
            </div>
            <p className="mt-3 text-[#F4F8FF]/60 font-body tracking-wide">Welcome back</p>
          </div>

          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="space-y-6 relative z-[60]"
            style={{ isolation: 'isolate', position: 'relative', zIndex: 60 }}
          >
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-[#F4F8FF]/70 ml-1 mb-2"
              >
                Email address
              </label>
              <div className="relative group">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full px-5 py-3.5 rounded-2xl border border-white/10 bg-white/5 focus:bg-white/10 text-[#F4F8FF] placeholder-[#F4F8FF]/30 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all duration-200 ease-in-out shadow-sm group-hover:shadow-md"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-[#F4F8FF]/70 ml-1 mb-2"
              >
                Password
              </label>
              <div className="relative group">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full px-5 py-3.5 rounded-2xl border border-white/10 bg-white/5 focus:bg-white/10 text-[#F4F8FF] placeholder-[#F4F8FF]/30 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all duration-200 ease-in-out shadow-sm group-hover:shadow-md"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}


            <div className="relative z-[70]" style={{ pointerEvents: 'auto', isolation: 'isolate', position: 'relative' }}>
              <button
                ref={buttonRef}
                type="submit"
                disabled={isPending}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                onMouseUp={(e) => {
                  e.stopPropagation();
                }}
                style={{
                  pointerEvents: 'auto',
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  zIndex: 70,
                  position: 'relative',
                  isolation: 'isolate',
                  width: '100%'
                }}
                className="w-full flex justify-center py-3.5 px-4 rounded-none text-base font-bold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg shadow-primary/30 transform transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 relative z-[70]"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-transparent px-4 text-[#F4F8FF]/40 font-medium">
                  New to OpSale?
                </span>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center font-bold text-primary hover:text-primary-light transition-colors"
              >
                Create an account
                <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}

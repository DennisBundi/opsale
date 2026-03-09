import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In - Leeztruestyles',
  description: 'Sign in to your Leeztruestyles account to track orders, earn rewards, and shop faster.',
};

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}

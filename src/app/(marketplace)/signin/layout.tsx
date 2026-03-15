import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In - OpSale',
  description: 'Sign in to your OpSale account to track orders, earn rewards, and shop faster.',
};

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}

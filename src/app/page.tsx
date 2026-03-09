import { redirect } from 'next/navigation';

// Root path is rewritten to /home via next.config.js rewrites.
// This redirect is a fallback for direct navigation.
export default function Home() {
  redirect('/home');
}

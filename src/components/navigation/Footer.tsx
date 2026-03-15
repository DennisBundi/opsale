'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import OpSaleLogo from '@/components/ui/OpSaleLogo';

export default function Footer() {
  const pathname = usePathname();

  // Don't render footer on admin routes
  if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/pos')) {
    return null;
  }
  return (
    <footer className="bg-navy border-t border-white/10 text-[#F4F8FF] mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div>
            <div className="mb-4">
              <OpSaleLogo size="sm" showTagline />
            </div>
            <p className="text-[#F4F8FF]/50">
              The operating system for modern sellers worldwide.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-[#F4F8FF] font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-[#F4F8FF]/50 hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-[#F4F8FF]/50 hover:text-primary transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-[#F4F8FF]/50 hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-[#F4F8FF]/50 hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-[#F4F8FF] font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/shipping" className="text-[#F4F8FF]/50 hover:text-primary transition-colors">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-[#F4F8FF]/50 hover:text-primary transition-colors">
                  Returns
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-[#F4F8FF]/50 hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[#F4F8FF] font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-[#F4F8FF]/50 hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-[#F4F8FF]/50 hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-[#F4F8FF] font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-2 text-[#F4F8FF]/50">
              <li>
                Email:{' '}
                <a
                  href="mailto:support@opsale.app"
                  className="hover:text-primary transition-colors"
                >
                  support@opsale.app
                </a>
              </li>
              <li>
                Phone:{' '}
                <a
                  href="tel:+254797877254"
                  className="hover:text-primary transition-colors"
                >
                  +254 797 877 254
                </a>
              </li>
              <li>Nairobi, Kenya</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-center text-[#F4F8FF]/30">
          <p>&copy; {new Date().getFullYear()} OpSale. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

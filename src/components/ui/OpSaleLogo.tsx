import Link from 'next/link';

interface OpSaleLogoProps {
  href?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export default function OpSaleLogo({ href = '/', size = 'md', showTagline = false }: OpSaleLogoProps) {
  const sizes = {
    sm: { mark: 36, markRadius: 9, font: 'text-xl', tagFont: 'text-[8px]' },
    md: { mark: 44, markRadius: 11, font: 'text-2xl', tagFont: 'text-[9px]' },
    lg: { mark: 56, markRadius: 14, font: 'text-4xl', tagFont: 'text-[10px]' },
  };
  const s = sizes[size];

  const logo = (
    <div className="flex items-center gap-3">
      {/* Mark */}
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: s.mark,
          height: s.mark,
          background: 'linear-gradient(135deg, #00C896, #009970)',
          borderRadius: s.markRadius,
          boxShadow: '0 0 20px rgba(0,200,150,0.35)',
        }}
      >
        <svg width={s.mark * 0.5} height={s.mark * 0.5} viewBox="0 0 28 28" fill="none">
          <rect x="3" y="3" width="9" height="9" rx="2.5" fill="#080F1E" />
          <rect x="16" y="3" width="9" height="9" rx="2.5" fill="#080F1E" opacity="0.55" />
          <rect x="3" y="16" width="9" height="9" rx="2.5" fill="#080F1E" opacity="0.55" />
          <circle cx="20.5" cy="20.5" r="4.5" fill="#F5A623" />
          <path d="M20.5 18v2.5l1.5 1.5" stroke="#080F1E" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Wordmark */}
      <div>
        <div className={`font-display font-extrabold leading-none text-[#F4F8FF] tracking-tight ${s.font}`}>
          Op<span className="text-primary">Sale</span>
        </div>
        <div className={`uppercase tracking-[2.5px] text-[#F4F8FF]/35 mt-0.5 font-body ${s.tagFont}`}>
          Business Operating System
        </div>
        {showTagline && (
          <div className={`text-primary/80 tracking-wide font-body mt-0.5 ${s.tagFont}`}>
            Sell. Retain. Grow.
          </div>
        )}
      </div>
    </div>
  );

  if (!href) return logo;
  return (
    <Link href={href} className="hover:opacity-90 transition-opacity inline-flex">
      {logo}
    </Link>
  );
}

'use client';

import { useState } from 'react';
import OpSaleLogo from '@/components/ui/OpSaleLogo';

const CATEGORIES = ['Retail', 'Fashion', 'Food & Beverage', 'Services', 'Other'];
const TEAM_SIZES = ['Solo', '2–5', '6–20', '20+'];

const PRICING = [
  {
    name: 'Starter',
    price: '$19',
    period: '/mo',
    target: 'Get your first store off the ground',
    features: ['Up to 50 products', '200 orders/mo', 'Transaction history', 'Customer loyalty rewards'],
    highlight: false,
  },
  {
    name: 'Growth',
    price: '$49',
    period: '/mo',
    target: 'Scale with your team and keep customers coming back',
    features: ['Unlimited products', '2,000 orders/mo', 'Full records', 'Advanced loyalty tiers', 'Staff accounts'],
    highlight: true,
  },
  {
    name: 'Pro',
    price: '$99',
    period: '/mo',
    target: 'Full control for serious retailers',
    features: ['Everything in Growth', 'Custom domain', 'Priority support', 'API access', 'White-glove onboarding'],
    highlight: false,
  },
];

const PILLARS = [
  { icon: '📦', title: 'Record-first', desc: 'Know exactly what sold, when, and to who — no spreadsheets' },
  { icon: '⭐', title: 'Loyalty built-in', desc: 'Turn one-time buyers into regulars on autopilot' },
  { icon: '📊', title: 'Smart admin', desc: 'Run your whole business from one screen' },
  { icon: '🌍', title: 'Global-ready', desc: 'Works in your currency and your market' },
];

const PROBLEMS = [
  { problem: '"I have no idea what sold last week"', solution: 'Every sale, product, and customer logged automatically. Find anything in seconds — no notebook required.' },
  { problem: '"Customers buy once and never come back"', solution: 'Built-in rewards that bring customers back automatically — no extra app needed.' },
  { problem: '"I\'m making decisions based on gut feel"', solution: 'Live dashboard showing your sales, stock, and customers — so every decision is backed by real data.' },
];

export default function LandingPage() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    business_name: '',
    category: '',
    team_size: '',
    country: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMsg(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Network error. Please try again.');
    }
  };

  const updateForm = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-navy text-[#F4F8FF] font-body overflow-x-hidden">

      {/* Atmospheric background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-[-80px] left-[-80px] w-96 h-96 rounded-full" style={{ background: 'rgba(0,200,150,0.12)', filter: 'blur(80px)' }} />
        <div className="absolute top-1/3 right-[-60px] w-72 h-72 rounded-full" style={{ background: 'rgba(245,166,35,0.08)', filter: 'blur(70px)' }} />
        <div className="absolute bottom-[-60px] left-1/3 w-64 h-64 rounded-full" style={{ background: 'rgba(0,120,255,0.07)', filter: 'blur(60px)' }} />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/5">
        <OpSaleLogo size="md" showTagline />
        <a
          href="#get-started"
          className="bg-primary hover:bg-primary-dark text-navy font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
        >
          Get Your Store
        </a>
      </nav>

      {/* Hero */}
      <section className="relative z-10 text-center px-6 pt-6 pb-28 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 glass-teal px-4 py-1.5 rounded-full text-sm text-primary mb-3">
          <span>✓</span> 47 businesses already on the waitlist
        </div>
        <h1 className="font-display font-extrabold text-4xl md:text-5xl leading-tight tracking-tight mb-3">
          One tool to run your store,<br />
          <span className="text-primary">reward your customers,</span><br />
          and see your numbers.
        </h1>
        <p className="text-[#F4F8FF]/60 text-base md:text-lg max-w-2xl mx-auto mb-5 leading-relaxed">
          Built for independent retailers, boutiques, and growing businesses who are done duct-taping their operations together.
        </p>
        <a
          href="#get-started"
          className="inline-block bg-primary hover:bg-primary-dark text-navy font-bold px-8 py-3 rounded-2xl text-lg transition-all hover:-translate-y-0.5"
          style={{ boxShadow: '0 0 24px rgba(0,200,150,0.35)' }}
        >
          Get Your Store →
        </a>
        <p className="text-[#F4F8FF]/35 text-sm mt-3">We set up your store together. Usually live within 48 hours.</p>
      </section>

      {/* Brand pillars */}
      <section className="relative z-10 px-6 pb-20 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {PILLARS.map(p => (
            <div key={p.title} className="glass p-5">
              <div className="text-2xl mb-3">{p.icon}</div>
              <div className="text-primary font-semibold text-sm mb-1">{p.title}</div>
              <div className="text-[#F4F8FF]/50 text-xs leading-relaxed">{p.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Problem / solution */}
      <section className="relative z-10 px-6 py-20 max-w-4xl mx-auto text-center">
        <p className="text-[#F4F8FF]/35 uppercase tracking-[2.5px] text-xs mb-4">The Problem</p>
        <h2 className="font-display font-bold text-3xl md:text-4xl mb-10">
          Running a business shouldn&apos;t mean<br />
          <span className="text-primary">juggling five different apps.</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-6 text-left">
          {PROBLEMS.map(item => (
            <div key={item.problem} className="glass p-6">
              <div className="text-[#F4F8FF]/40 line-through text-sm mb-2">{item.problem}</div>
              <div className="text-[#F4F8FF]/80 text-sm leading-relaxed">{item.solution}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="relative z-10 px-6 py-20 max-w-5xl mx-auto">
        <p className="text-[#F4F8FF]/35 uppercase tracking-[2.5px] text-xs text-center mb-4">Pricing</p>
        <h2 className="font-display font-bold text-3xl md:text-4xl text-center mb-12">
          Simple pricing. Real outcomes.
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {PRICING.map(plan => (
            <div
              key={plan.name}
              className={`${plan.highlight ? 'glass-strong' : 'glass'} p-7 relative`}
              style={plan.highlight ? { borderColor: 'rgba(0,200,150,0.3)' } : {}}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-navy text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  Most Popular
                </div>
              )}
              <div className="text-[#F4F8FF]/50 text-sm mb-1">{plan.name}</div>
              <div className="font-display font-extrabold text-4xl text-[#F4F8FF] mb-1">
                {plan.price}<span className="text-lg text-[#F4F8FF]/40">{plan.period}</span>
              </div>
              <div className="text-[#F4F8FF]/40 text-xs mb-6">{plan.target}</div>
              <ul className="space-y-2 mb-8">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[#F4F8FF]/70">
                    <span className="text-primary flex-shrink-0">✓</span> {f}
                  </li>
                ))}
              </ul>
              <a
                href="#get-started"
                className={`block text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
                  plan.highlight
                    ? 'bg-primary hover:bg-primary-dark text-navy'
                    : 'glass-teal text-primary hover:bg-primary/20'
                }`}
              >
                Get Started
              </a>
            </div>
          ))}
        </div>
        <p className="text-center text-[#F4F8FF]/30 text-sm mt-6">
          Enterprise?{' '}
          <a href="#get-started" className="text-primary underline">
            Talk to us
          </a>{' '}
          for custom pricing.
        </p>
      </section>

      {/* Interest form */}
      <section id="get-started" className="relative z-10 px-6 py-20 max-w-2xl mx-auto">
        <p className="text-[#F4F8FF]/35 uppercase tracking-[2.5px] text-xs text-center mb-4">Get Started</p>
        <h2 className="font-display font-bold text-3xl md:text-4xl text-center mb-4">
          Get your store set up
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10 text-sm text-[#F4F8FF]/60">
          <div className="flex items-center gap-2"><span className="text-primary font-bold">1.</span> Fill in your details (2 min)</div>
          <div className="flex items-center gap-2"><span className="text-primary font-bold">2.</span> We call to understand your business (15 min)</div>
          <div className="flex items-center gap-2"><span className="text-primary font-bold">3.</span> Your store goes live within 48 hours</div>
        </div>

        {status === 'success' ? (
          <div className="glass-teal p-8 text-center rounded-2xl">
            <div className="text-5xl mb-4">✓</div>
            <h3 className="font-display font-bold text-xl text-primary mb-2">You&apos;re in — we&apos;ll be in touch soon.</h3>
            <p className="text-[#F4F8FF]/60">
              We&apos;ll reach out to <strong className="text-[#F4F8FF]">{form.email}</strong> within 24 hours
              to get your store set up.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass-strong p-8 space-y-5">
            {/* Text fields */}
            {[
              { label: 'Full name', name: 'full_name', type: 'text', placeholder: 'Jane Doe' },
              { label: 'Email address', name: 'email', type: 'email', placeholder: 'jane@example.com' },
              { label: 'Business name', name: 'business_name', type: 'text', placeholder: 'My Awesome Store' },
            ].map(field => (
              <div key={field.name}>
                <label className="block text-xs text-[#F4F8FF]/50 uppercase tracking-wider mb-2">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  required
                  placeholder={field.placeholder}
                  value={form[field.name as keyof typeof form]}
                  onChange={e => updateForm(field.name, e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[#F4F8FF] placeholder-[#F4F8FF]/25 focus:outline-none focus:border-primary/50 transition-colors text-sm"
                />
              </div>
            ))}

            {/* Category */}
            <div>
              <label className="block text-xs text-[#F4F8FF]/50 uppercase tracking-wider mb-2">
                Business category
              </label>
              <select
                required
                value={form.category}
                onChange={e => updateForm('category', e.target.value)}
                className="w-full bg-navy border border-white/10 rounded-xl px-4 py-3 text-[#F4F8FF] focus:outline-none focus:border-primary/50 transition-colors text-sm"
              >
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Team size */}
            <div>
              <label className="block text-xs text-[#F4F8FF]/50 uppercase tracking-wider mb-2">
                Team size
              </label>
              <div className="grid grid-cols-4 gap-2">
                {TEAM_SIZES.map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => updateForm('team_size', size)}
                    className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                      form.team_size === size
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'bg-white/5 border-white/10 text-[#F4F8FF]/60 hover:border-white/20'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Country */}
            <div>
              <label className="block text-xs text-[#F4F8FF]/50 uppercase tracking-wider mb-2">
                Country
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Kenya, UK, Philippines"
                value={form.country}
                onChange={e => updateForm('country', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[#F4F8FF] placeholder-[#F4F8FF]/25 focus:outline-none focus:border-primary/50 transition-colors text-sm"
              />
            </div>

            {status === 'error' && (
              <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl p-3">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-primary hover:bg-primary-dark text-navy font-bold py-4 rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 text-base"
              style={{ boxShadow: '0 0 24px rgba(0,200,150,0.35)' }}
            >
              {status === 'loading' ? 'Registering...' : 'Register My Business →'}
            </button>
            <p className="text-center text-[#F4F8FF]/30 text-xs">
              No spam. We only reach out to set up your store.
            </p>
          </form>
        )}
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-10 text-center">
        <div className="flex justify-center mb-4">
          <OpSaleLogo size="sm" showTagline />
        </div>
        <p className="text-[#F4F8FF]/30 text-sm">© 2026 OpSale. All rights reserved.</p>
      </footer>
    </div>
  );
}

import { Link } from 'react-router-dom';
import kaamyabLogo from '@/assets/kaamyab-logo-clean.png';

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedInIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Learn', href: '/learn' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Help', href: '/help' },
  { label: 'Contact', href: '/contact' },
];

const legalLinks = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Refund Policy', href: '/refund-policy' },
];

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <footer className={`mt-auto ${className || ''}`}>
      {/* Main footer — dark charcoal */}
      <div className="bg-[#0F0F0F] text-[#A1A1A1]">
        <div className="container max-w-6xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
                <img
                  src={kaamyabLogo}
                  alt="KAMYAAB"
                  className="w-10 h-10 rounded-lg object-contain transition-transform group-hover:scale-105"
                />
                <span className="text-sm font-bold tracking-[0.2em] uppercase text-white">
                  KAMYAAB
                </span>
              </Link>
              <p className="text-xs tracking-wide text-[#6B6B6B] leading-relaxed">
                Execution Intelligence System
              </p>
            </div>

            {/* Navigation */}
            <div>
              <h4 className="text-xs font-semibold tracking-[0.15em] uppercase text-[#6B6B6B] mb-5">
                Navigation
              </h4>
              <ul className="space-y-3">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-sm text-[#A1A1A1] hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-semibold tracking-[0.15em] uppercase text-[#6B6B6B] mb-5">
                Legal
              </h4>
              <ul className="space-y-3">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-sm text-[#A1A1A1] hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social */}
            <div>
              <h4 className="text-xs font-semibold tracking-[0.15em] uppercase text-[#6B6B6B] mb-5">
                Connect
              </h4>
              <div className="flex items-center gap-5">
                <a
                  href="https://x.com/kaamyab"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X (Twitter)"
                  className="text-[#6B6B6B] hover:text-white transition-colors duration-200"
                >
                  <XIcon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
                </a>
                <a
                  href="https://linkedin.com/company/kaamyab"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="text-[#6B6B6B] hover:text-white transition-colors duration-200"
                >
                  <LinkedInIcon className="w-[18px] h-[18px]" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#1A1A1A]">
          <div className="container max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-[#4A4A4A]">
              © 2026 KAMYAAB. All rights reserved.
            </p>
            <p className="text-xs text-[#3A3A3A] italic">
              Built for consistency, not inspiration.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

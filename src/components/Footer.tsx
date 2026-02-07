import { Link } from 'react-router-dom';
import { Instagram, Github } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

/**
 * Custom X (Twitter) Icon
 * The current X logo differs from the old Twitter bird
 */
const XIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

/**
 * Custom LinkedIn Icon
 * Lucide doesn't include the LinkedIn brand icon
 */
const LinkedInIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const productLinks = [
  { label: 'Home', href: '/home' },
  { label: 'Plan', href: '/plan' },
  { label: 'Review', href: '/review' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Help Center', href: '/help' },
];

const companyLinks = [
  { label: 'About Kaamyab', href: '/about' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Contact', href: '/contact' },
];

const socialLinks = [
  { icon: XIcon, href: 'https://x.com/kaamyab', label: 'X (Twitter)' },
  { icon: LinkedInIcon, href: 'https://linkedin.com/company/kaamyab', label: 'LinkedIn' },
  { icon: Instagram, href: 'https://instagram.com/kaamyab', label: 'Instagram' },
  { icon: Github, href: 'https://github.com/kaamyab', label: 'GitHub' },
];

interface FooterProps {
  /** Optional extra bottom padding for pages with BottomNav */
  className?: string;
}

/**
 * Global Footer Component
 * 
 * Professional, minimal footer appearing on all public and authenticated pages.
 * Communicates brand legitimacy and trust without marketing language.
 */
export function Footer({ className }: FooterProps) {
  return (
    <footer className={`mt-auto border-t border-border/50 bg-muted/30 print:bg-white print:text-black ${className || ''}`}>
      <div className="container max-w-6xl mx-auto px-4 py-12">
        {/* Grid: Brand + Navigation + Social */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Section */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/home" className="inline-block mb-3">
              <h3 className="text-lg font-semibold text-foreground">Kaamyab</h3>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Plan better. Execute calmly. Reflect honestly.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-4">Product</h4>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-4">Company</h4>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-4">Follow Us</h4>
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <Separator className="mb-6 bg-border/30" />

        {/* Footer Statement */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">
            Made in Pakistan 🇵🇰 with ❤️
          </p>
          <p className="text-xs text-muted-foreground/60">
            © 2026 Kaamyab. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

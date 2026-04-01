import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AnimatePresence, motion } from 'framer-motion';
import kaamyabLogo from '@/assets/kaamyab-logo-clean.png';

export const LandingHeader = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const scrollToFeatures = () => {
    setMobileOpen(false);
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  const navLinks = (
    <>
      <button
        onClick={scrollToFeatures}
        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        Features
      </button>
      <Link
        to="/learn"
        onClick={() => setMobileOpen(false)}
        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        Learn
      </Link>
      <Link
        to="/pricing"
        onClick={() => setMobileOpen(false)}
        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        Pricing
      </Link>
      <Link
        to="/contact"
        onClick={() => setMobileOpen(false)}
        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        Contact
      </Link>
    </>
  );

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 backdrop-blur-xl ${
        scrolled
          ? 'bg-background/80 shadow-[var(--shadow-soft)] border-b border-border/50'
          : 'bg-transparent'
      }`}
    >
      <div className="container max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-0.5 group">
          <img src={kaamyabLogo} alt="Kamyaab logo" className="w-14 h-14 rounded-xl object-contain transition-transform group-hover:scale-105" />
          <span className="text-lg font-bold tracking-[0.2em] uppercase text-primary">
            Kamyaab
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-6">
          {navLinks}
        </nav>

        {/* Desktop actions */}
        <div className="hidden sm:flex items-center gap-3">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="text-sm px-4">
            <Link to="/auth">Sign In</Link>
          </Button>
          <Button asChild size="sm" className="text-sm px-5">
            <Link to="/auth?mode=signup">
              Start Free <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </div>

        {/* Mobile actions */}
        <div className="flex sm:hidden items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden overflow-hidden border-t border-border/50 bg-background/95 backdrop-blur-xl"
          >
            <nav className="flex flex-col gap-1 px-4 py-4">
              <button
                onClick={scrollToFeatures}
                className="text-left py-2.5 px-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                Features
              </button>
              <Link
                to="/pricing"
                onClick={() => setMobileOpen(false)}
                className="py-2.5 px-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                Pricing
              </Link>
              <Link
                to="/contact"
                onClick={() => setMobileOpen(false)}
                className="py-2.5 px-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                Contact
              </Link>
              <div className="border-t border-border/50 mt-2 pt-3 flex flex-col gap-2">
                <Button asChild variant="outline" size="sm" className="w-full justify-center">
                  <Link to="/auth" onClick={() => setMobileOpen(false)}>Sign In</Link>
                </Button>
                <Button asChild size="sm" className="w-full justify-center">
                  <Link to="/auth?mode=signup" onClick={() => setMobileOpen(false)}>
                    Start Free <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

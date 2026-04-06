/**
 * Learn / Blog Index
 * Lists all published articles from database + static articles for SEO.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Loader2 } from 'lucide-react';
import { LandingHeader } from '@/components/LandingHeader';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import SEO from '@/components/SEO';

interface Article {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  created_at: string;
}

// Legacy static articles (still routed via hardcoded components)
const staticArticles = [
  {
    slug: 'stay-consistent-with-goals',
    title: 'How to Stay Consistent With Your Goals',
    description: 'Why consistency beats motivation, and how structured systems keep you on track when willpower runs out.',
  },
  {
    slug: 'execute-plans-without-burnout',
    title: 'Best Way to Execute Plans Without Burning Out',
    description: 'Overplanning kills momentum. Learn how daily execution systems outperform motivation-based approaches.',
  },
  {
    slug: 'why-people-fail-at-execution',
    title: 'Why Most People Fail at Execution (And How to Fix It)',
    description: 'The three structural mistakes that doom plans before they start — and what high performers do instead.',
  },
];

export default function Learn() {
  const [dbArticles, setDbArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('articles')
      .select('id, title, slug, description, cover_image, created_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setDbArticles((data as Article[]) || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Learn to Execute Better | Kamyaab"
        description="Learn how to execute better, stay consistent, and actually finish what you start. Practical guides on structured execution."
      />
      <LandingHeader />

      <main className="flex-1">
        <section className="py-16 md:py-24">
          <div className="container max-w-4xl mx-auto px-4">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
                <BookOpen className="w-4 h-4" />
                Execution Insights
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Learn to Execute Better
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Learn how to execute better, stay consistent, and actually finish what you start. Practical guides on structured execution.
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="grid gap-6">
                {/* Dynamic articles from DB */}
                {dbArticles.map((article) => (
                  <Link
                    key={article.id}
                    to={`/learn/${article.slug}`}
                    className="group block rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-6 md:p-8 hover:border-primary/30 hover:bg-primary/5 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {article.cover_image && (
                        <img src={article.cover_image} alt={article.title} className="w-20 h-20 rounded-lg object-cover shrink-0 hidden sm:block" />
                      )}
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                          {article.title}
                        </h2>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                          {article.description}
                        </p>
                        <span className="text-xs text-muted-foreground/60">
                          {new Date(article.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                    </div>
                  </Link>
                ))}

                {/* Static articles */}
                {staticArticles.map((article) => (
                  <Link
                    key={article.slug}
                    to={`/learn/${article.slug}`}
                    className="group block rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-6 md:p-8 hover:border-primary/30 hover:bg-primary/5 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                          {article.title}
                        </h2>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {article.description}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div className="text-center mt-12">
              <p className="text-muted-foreground text-sm mb-4">
                Ready to put these principles into practice?
              </p>
              <Button asChild size="lg">
                <Link to="/auth?mode=signup">
                  Start Free with KAMYAAB <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

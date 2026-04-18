/**
 * Learn / Blog Index
 * Lists all published articles from database + static articles for SEO.
 *
 * SSG strategy:
 *  - A module-level cache (`_ssrArticles`) is populated during the SSG build
 *    by the sibling `prefetchLearnArticles()` export, which App.tsx calls from
 *    the /learn route's `loader` before vite-react-ssg renders the page.
 *  - On the client the same cache is seeded from the first paint so there is
 *    no loading flicker, then a background re-fetch keeps data fresh.
 */

import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen } from 'lucide-react';
import { LandingHeader } from '@/components/LandingHeader';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import SEO from '@/components/SEO';

export interface LearnArticle {
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
    description:
      'Why consistency beats motivation, and how structured systems keep you on track when willpower runs out.',
  },
  {
    slug: 'execute-plans-without-burnout',
    title: 'Best Way to Execute Plans Without Burning Out',
    description:
      'Overplanning kills momentum. Learn how daily execution systems outperform motivation-based approaches.',
  },
  {
    slug: 'why-people-fail-at-execution',
    title: 'Why Most People Fail at Execution (And How to Fix It)',
    description:
      'The three structural mistakes that doom plans before they start — and what high performers do instead.',
  },
];

// ---------- module-level SSG cache ----------
// Populated by App.tsx loader before the component renders during SSG.
// On the browser it is initialised empty and filled by useEffect.
export let _ssrArticles: LearnArticle[] | null = null;

export function setSSRArticles(articles: LearnArticle[]) {
  _ssrArticles = articles;
}

/** Called by App.tsx route loader so SSG has data before render. */
export async function prefetchLearnArticles(): Promise<LearnArticle[]> {
  if (_ssrArticles !== null) return _ssrArticles;
  const { data } = await supabase
    .from('articles')
    .select('id, title, slug, description, cover_image, created_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  _ssrArticles = (data as LearnArticle[]) ?? [];
  return _ssrArticles;
}
// -------------------------------------------

function ArticleCard({ href, title, description, date, coverImage }: {
  href: string;
  title: string;
  description: string | null;
  date?: string;
  coverImage?: string | null;
}) {
  return (
    <a
      href={href}
      className="group block rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-6 md:p-8 hover:border-primary/30 hover:bg-primary/5 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        {coverImage && (
          <img
            src={coverImage}
            alt={title}
            className="w-20 h-20 rounded-lg object-cover shrink-0 hidden sm:block"
          />
        )}
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
            {title}
          </h2>
          {description && (
            <p className="text-muted-foreground text-sm leading-relaxed mb-3">{description}</p>
          )}
          {date && (
            <span className="text-xs text-muted-foreground/60">
              {new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
        </div>
        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
      </div>
    </a>
  );
}

export default function Learn() {
  // 1. Synchronous State Initialization as requested
  const [articles, setArticles] = useState<LearnArticle[]>(_ssrArticles || []);
  
  // 2. SSR-Aware Rendering Guard
  // During SSR (build phase), we MUST render the article list, never the skeleton.
  const isSSR = import.meta.env.SSR;

  useEffect(() => {
    // Re-fetch to keep client data fresh regardless of SSR cache.
    supabase
      .from('articles')
      .select('id, title, slug, description, cover_image, created_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setArticles((data as LearnArticle[]) ?? []);
      });
  }, []);

  // On client (!isSSR), show loading only if we have NO articles at all (fresh hit).
  // In SSR, we always render the container to ensure links are captured.
  const showLoading = !isSSR && articles.length === 0 && _ssrArticles === null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Productivity & Execution Intelligence Library | KAMYAAB AI"
        description="Master the science of finishing what you start. Explore our deep-dive guides on ADHD productivity, solopreneur systems, and execution intelligence."
        canonical="/learn"
        keywords="KAMYAAB AI, Execution Intelligence, ADHD productivity, solopreneur systems, structured execution, deep work, productivity guides"
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
                Learn how to execute better, stay consistent, and actually finish what you start.
                Practical guides on structured execution.
              </p>
            </div>

            {showLoading ? (
              // Skeleton cards — only shown on client when no data is available
              <div className="grid gap-6">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="rounded-xl border border-border/50 bg-card/60 p-6 md:p-8 animate-pulse h-28"
                  />
                ))}
              </div>
            ) : (
              <div className="grid gap-6">
                {/* Dynamic articles from DB — native <a> for Googlebot */}
                {articles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    href={`/learn/${article.slug}`}
                    title={article.title}
                    description={article.description}
                    date={article.created_at}
                    coverImage={article.cover_image}
                  />
                ))}

                {/* Static articles — native <a> for Googlebot */}
                {staticArticles.map((article) => (
                  <ArticleCard
                    key={article.slug}
                    href={`/learn/${article.slug}`}
                    title={article.title}
                    description={article.description}
                  />
                ))}
              </div>
            )}

            <div className="text-center mt-12">
              <p className="text-muted-foreground text-sm mb-4">
                Ready to put these principles into practice?
              </p>
              <Button asChild size="lg">
                <a href="/auth?mode=signup">
                  Start Free with KAMYAAB AI <ArrowRight className="w-4 h-4 ml-1" />
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

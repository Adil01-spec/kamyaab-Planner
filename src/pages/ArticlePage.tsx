import { useEffect, useState, useRef, useCallback, type MouseEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LandingHeader } from '@/components/LandingHeader';
import { Footer } from '@/components/Footer';
import { Loader2, ArrowLeft, Calendar } from 'lucide-react';
import SEO from '@/components/SEO';

interface Article {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  cover_image: string | null;
  tags: string[];
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  secondary_keywords?: string[] | null;
}

// ---------- module-level SSG cache ----------
// Maps slug -> Article object.
export let _ssrArticleCache: Record<string, Article> = {};

export async function prefetchArticle(slug: string): Promise<Article | null> {
  if (_ssrArticleCache[slug]) return _ssrArticleCache[slug];
  
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (data && !error) {
    _ssrArticleCache[slug] = data as Article;
    return _ssrArticleCache[slug];
  }
  return null;
}
// -------------------------------------------

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);

  // Seed state from SSG cache if available (populated by route loader).
  const [article, setArticle] = useState<Article | null>(slug ? (_ssrArticleCache[slug] || null) : null);
  const [loading, setLoading] = useState(article === null);
  const [notFound, setNotFound] = useState(false);

  const handleArticleBodyClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor || !contentRef.current?.contains(anchor)) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      if (href.startsWith('mailto:') || href.startsWith('tel:')) return;

      try {
        const url = new URL(href, window.location.origin);
        const isSameOrigin = url.origin === window.location.origin;
        if (isSameOrigin) {
          e.preventDefault();
          navigate(`${url.pathname}${url.search}${url.hash}`);
          return;
        }
        e.preventDefault();
        window.open(url.href, '_blank', 'noopener,noreferrer');
      } catch {
        if (href.startsWith('/')) {
          e.preventDefault();
          navigate(href);
        }
      }
    },
    [navigate]
  );

  useEffect(() => {
    if (!slug) return;
    
    // Background re-fetch to keep data fresh and handle transitions
    supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          if (!article) setNotFound(true);
        } else {
          setArticle(data as Article);
          setNotFound(false);
        }
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <LandingHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Article Not Found</h1>
            <Link to="/learn" className="text-primary hover:underline">← Back to Learn</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title={article.meta_title || `${article.title} | KAMYAAB AI`}
        description={article.meta_description || article.description || ''}
        ogImage={article.cover_image || undefined}
        keywords={article.secondary_keywords?.join(', ') || ''}
        canonical={`/learn/${article.slug}`}
      />
      <LandingHeader />
      <main className="flex-1">
        <article className="max-w-3xl mx-auto px-4 py-12">
          <a href="/learn" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Learn
          </a>

          {article.cover_image && (
            <img
              src={article.cover_image}
              alt={(article as any).cover_image_alt || article.title}
              className="w-full rounded-xl mb-8 max-h-96 object-cover"
              loading="lazy"
            />
          )}

          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{article.title}</h1>

          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-8">
            <Calendar className="w-4 h-4" />
            {new Date(article.created_at).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric'
            })}
          </div>

          <div
            ref={contentRef}
            className="prose prose-sm sm:prose dark:prose-invert max-w-none prose-a:text-primary prose-a:underline"
            dangerouslySetInnerHTML={{ __html: article.content || '' }}
            onClick={handleArticleBodyClick}
          />

          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-border">
              {article.tags.map((tag, i) => (
                <span key={i} className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </article>
      </main>
      <Footer />
    </div>
  );
}

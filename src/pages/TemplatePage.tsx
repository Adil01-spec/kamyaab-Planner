import { useParams, Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Clock, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LandingHeader } from '@/components/LandingHeader';
import { Footer } from '@/components/Footer';
import SEO from '@/components/SEO';
import { getTemplateBySlug, executionTemplates } from '@/lib/executionTemplates';
import NotFound from './NotFound';

const TemplatePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const template = slug ? getTemplateBySlug(slug) : undefined;

  if (!template) return <NotFound />;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title={`Free ${template.name} Execution Plan | Kamyaab AI`}
        description={template.description}
        canonical={`/templates/${template.slug}`}
      />
      <LandingHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 md:py-24 gradient-subtle">
          <div className="container max-w-4xl mx-auto px-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
              {template.category}
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight mb-4">
              {template.name}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mb-8">
              {template.description}
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground mb-10">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> {template.weeks} weeks
              </span>
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4" /> {template.tasks.length} tasks
              </span>
            </div>
            <Button asChild size="lg" className="text-base px-8">
              <Link to={`/auth?mode=signup&template=${template.slug}`}>
                Start Executing This Plan <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Tasks */}
        <section className="py-16 bg-background">
          <div className="container max-w-4xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
              Execution Breakdown
            </h2>
            <div className="space-y-4">
              {template.tasks.map((task, i) => (
                <div key={i} className="glass-card rounded-xl p-5 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-sm font-bold text-primary">{i + 1}</span>
                  </div>
                  <p className="text-foreground leading-relaxed">{task}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Milestones */}
        <section className="py-16 gradient-subtle">
          <div className="container max-w-4xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
              Key Milestones
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {template.milestones.map((m, i) => (
                <div key={i} className="glass-card rounded-xl p-5 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-foreground font-medium">{m}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-background">
          <div className="container max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Execute This Plan?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              Sign up for free and start executing with Kamyaab's AI-powered execution intelligence system.
            </p>
            <Button asChild size="lg" className="text-base px-10">
              <Link to={`/auth?mode=signup&template=${template.slug}`}>
                Start Executing This Plan <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <p className="text-muted-foreground text-sm mt-4">No credit card required.</p>
          </div>
        </section>

        {/* Other templates */}
        <section className="py-16 gradient-subtle">
          <div className="container max-w-4xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              More Execution Templates
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {executionTemplates
                .filter((t) => t.slug !== template.slug)
                .slice(0, 4)
                .map((t) => (
                  <Link
                    key={t.slug}
                    to={`/templates/${t.slug}`}
                    className="glass-card rounded-xl p-5 hover:border-primary/30 transition-all group"
                  >
                    <span className="text-xs text-primary font-medium">{t.category}</span>
                    <h3 className="text-foreground font-semibold mt-1 group-hover:text-primary transition-colors">
                      {t.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{t.description}</p>
                  </Link>
                ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default TemplatePage;

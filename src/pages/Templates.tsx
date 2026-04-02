import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Layers } from 'lucide-react';
import { LandingHeader } from '@/components/LandingHeader';
import { Footer } from '@/components/Footer';
import SEO from '@/components/SEO';
import { executionTemplates } from '@/lib/executionTemplates';

const Templates = () => (
  <div className="min-h-screen bg-background flex flex-col">
    <SEO
      title="Free Execution Plan Templates | Kamyaab AI"
      description="Browse free AI-powered execution plan templates for SaaS launches, learning, fitness, freelancing, and exam preparation. Start executing with structure."
      canonical="/templates"
    />
    <LandingHeader />

    <main className="flex-1">
      <section className="py-16 md:py-24 gradient-subtle">
        <div className="container max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight mb-4">
            Free Execution Plan Templates
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Browse structured execution plans for common goals. Pick a template and start executing with AI-powered tracking.
          </p>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {executionTemplates.map((t) => (
              <Link
                key={t.slug}
                to={`/templates/${t.slug}`}
                className="glass-card rounded-xl p-6 hover:border-primary/30 transition-all group"
              >
                <span className="text-xs font-medium text-primary">{t.category}</span>
                <h2 className="text-lg font-bold text-foreground mt-1 group-hover:text-primary transition-colors">
                  {t.name}
                </h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{t.description}</p>
                <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {t.weeks} weeks</span>
                  <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> {t.tasks.length} tasks</span>
                </div>
                <span className="text-primary text-sm font-medium mt-4 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  View plan <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>

    <Footer />
  </div>
);

export default Templates;

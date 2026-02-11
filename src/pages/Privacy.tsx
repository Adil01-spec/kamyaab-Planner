import { ArrowLeft, Database, Brain, Server, Mail, Globe, UserCheck, MessageSquare, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Footer } from '@/components/Footer';

const Privacy = () => {
  const navigate = useNavigate();
  const lastUpdated = "February 11, 2026";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Privacy Policy</h1>
            <p className="text-xs text-muted-foreground">Last updated: {lastUpdated}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        <div className="prose prose-slate dark:prose-invert max-w-none">

          <section className="mb-10">
            <p className="text-lg text-muted-foreground leading-relaxed">
              Your privacy matters to us. This policy explains what information we collect, how we use it,
              and what choices you have. We believe in transparency without unnecessary complexity.
            </p>
          </section>

          <Separator className="my-8" />

          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold m-0">Information We Collect</h2>
            </div>
            <p className="text-muted-foreground">When you use Kaamyab, we collect information that you provide directly:</p>
            <ul className="space-y-2 text-muted-foreground mt-4">
              <li><strong className="text-foreground">Account information:</strong> Your name, email address, and profession details</li>
              <li><strong className="text-foreground">Planning data:</strong> Projects, tasks, and goals you create within the platform</li>
              <li><strong className="text-foreground">Task history:</strong> Completion records, time tracking, and execution patterns</li>
              <li><strong className="text-foreground">Subscription status:</strong> Your current plan tier and billing period</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              We also collect basic usage data such as device type, browser, and how you interact with features
              to improve the experience.
            </p>
          </section>

          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold m-0">How We Use Your Data</h2>
            </div>
            <ul className="space-y-2 text-muted-foreground mt-4">
              <li><strong className="text-foreground">Plan generation:</strong> Your project details and preferences are used to create personalised plans</li>
              <li><strong className="text-foreground">Personalisation:</strong> We tailor insights, nudges, and suggestions based on your usage patterns</li>
              <li><strong className="text-foreground">AI improvement:</strong> Aggregated, anonymised data helps us improve the quality of AI-generated outputs</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              We never sell your personal data to third parties. Your planning data belongs to you.
            </p>
          </section>

          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Server className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold m-0">Data Storage</h2>
            </div>
            <p className="text-muted-foreground">
              Your data is stored on secure cloud infrastructure with industry-standard protections:
            </p>
            <ul className="space-y-2 text-muted-foreground mt-4">
              <li>Encryption at rest and in transit</li>
              <li>Regular security audits and monitoring</li>
              <li>Access controls limiting who can view raw data</li>
            </ul>
          </section>

          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-xl font-semibold m-0">Email Communications</h2>
            </div>
            <p className="text-muted-foreground">We send emails only for essential purposes:</p>
            <ul className="space-y-2 text-muted-foreground mt-4">
              <li>Email verification during signup</li>
              <li>Account security notifications</li>
              <li>Subscription-related updates (billing confirmations, plan changes)</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              We do not send marketing emails or share your email address with advertisers.
            </p>
          </section>

          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold m-0">Third-Party Services</h2>
            </div>
            <p className="text-muted-foreground">
              We use trusted third-party services to operate Kaamyab:
            </p>
            <ul className="space-y-2 text-muted-foreground mt-4">
              <li><strong className="text-foreground">Cloud hosting provider:</strong> For data storage and application delivery</li>
              <li><strong className="text-foreground">Email service provider:</strong> For transactional emails</li>
              <li><strong className="text-foreground">Payment processor:</strong> For subscription billing (when connected)</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              These providers only access the minimum data needed to perform their function and are bound
              by their own privacy and security commitments.
            </p>
          </section>

          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-teal-600" />
              </div>
              <h2 className="text-xl font-semibold m-0">Your Rights</h2>
            </div>
            <p className="text-muted-foreground">You have the right to:</p>
            <ul className="space-y-2 text-muted-foreground mt-4">
              <li><strong className="text-foreground">Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong className="text-foreground">Correction:</strong> Ask us to update inaccurate information</li>
              <li><strong className="text-foreground">Deletion:</strong> Request that we permanently delete your account and associated data</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              To exercise any of these rights, contact us at the email below.
            </p>
          </section>

          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-rose-600" />
              </div>
              <h2 className="text-xl font-semibold m-0">Contact for Privacy Concerns</h2>
            </div>
            <p className="text-muted-foreground">
              If you have questions or concerns about your privacy, reach out to us at:
            </p>
            <div className="bg-muted/50 rounded-xl p-4 mt-4">
              <p className="text-sm text-muted-foreground m-0">
                <strong className="text-foreground">Email:</strong> privacy@kamyaab-ai.com
              </p>
            </div>
          </section>

          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-xl font-semibold m-0">Changes to This Policy</h2>
            </div>
            <p className="text-muted-foreground">
              We may update this policy as our service evolves. For significant changes, we'll notify you
              via email or in-app notification at least 14 days before they take effect. Continued use
              after changes means you accept the updated policy.
            </p>
          </section>

          <div className="bg-muted/30 rounded-xl p-6 mt-12 text-center">
            <p className="text-sm text-muted-foreground m-0">
              We respect your data because we respect you. If anything here is unclear, just ask.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;

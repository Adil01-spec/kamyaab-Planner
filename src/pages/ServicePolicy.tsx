import { ArrowLeft, Sparkles, UserCog, AlertTriangle, Wifi, Layers, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Footer } from '@/components/Footer';

const ServicePolicy = () => {
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
            <h1 className="text-lg font-semibold">Service Policy</h1>
            <p className="text-xs text-muted-foreground">Last updated: {lastUpdated}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        <div className="prose prose-slate dark:prose-invert max-w-none">

          <section className="mb-10">
            <p className="text-lg text-muted-foreground leading-relaxed">
              This policy describes what Kaamyab provides, what you can expect from the service,
              and the shared responsibility between us and you as a user.
            </p>
          </section>

          <Separator className="my-8" />

          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold m-0">What Kaamyab Provides</h2>
            </div>
            <p className="text-muted-foreground">
              Kaamyab is an AI-powered structured planning tool. It helps you organise goals, break them
              into actionable tasks, track execution, and reflect on your patterns over time.
            </p>
            <p className="text-muted-foreground mt-4">
              Our AI generates plans, insights, and suggestions based on the information you provide.
              These are designed to support your decision-making—not replace it.
            </p>
          </section>

          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <UserCog className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold m-0">User Responsibility</h2>
            </div>
            <p className="text-muted-foreground">
              The value you get from Kaamyab depends on the quality of your input and your commitment
              to execution. We provide the structure and intelligence—you bring the effort and judgment.
            </p>
            <ul className="space-y-2 text-muted-foreground mt-4">
              <li>Review AI-generated plans before acting on them</li>
              <li>Provide accurate project details for better results</li>
              <li>Use your own professional judgment alongside our suggestions</li>
            </ul>
          </section>

          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-xl font-semibold m-0">No Outcome Guarantees</h2>
            </div>
            <p className="text-muted-foreground">
              Kaamyab does not guarantee specific financial, business, or personal outcomes. Our tool
              helps you plan and track—but success depends on many factors beyond our control, including
              your execution, market conditions, and external circumstances.
            </p>
          </section>

          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Wifi className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold m-0">Platform Availability</h2>
            </div>
            <p className="text-muted-foreground">
              We aim for high availability but cannot guarantee uninterrupted access. Occasional
              downtime may occur for maintenance, updates, or unforeseen technical issues.
            </p>
            <p className="text-muted-foreground mt-4">
              We will make reasonable efforts to notify users of planned maintenance in advance.
            </p>
          </section>

          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Layers className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold m-0">Feature Availability</h2>
            </div>
            <p className="text-muted-foreground">
              Certain features may be available only on specific subscription tiers. We reserve the right
              to modify, add, or retire features as the product evolves. Changes to paid features will
              be communicated in advance.
            </p>
          </section>

          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold m-0">Abuse Prevention</h2>
            </div>
            <p className="text-muted-foreground">
              To maintain a fair and reliable service for all users, we monitor for misuse including:
            </p>
            <ul className="space-y-2 text-muted-foreground mt-4">
              <li>Creating multiple accounts to circumvent usage limits</li>
              <li>Automated or scripted access that strains our systems</li>
              <li>Sharing account credentials with others</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Accounts found in violation may be restricted or terminated. We always aim to communicate
              before taking action, except in severe cases.
            </p>
          </section>

          <div className="bg-muted/30 rounded-xl p-6 mt-12 text-center">
            <p className="text-sm text-muted-foreground m-0">
              We're building Kaamyab to be a tool you can rely on. These policies reflect our commitment
              to transparency and fairness.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ServicePolicy;

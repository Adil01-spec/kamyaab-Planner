import { ArrowLeft, CreditCard, Clock, CalendarX, XCircle, Mail, Timer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Footer } from '@/components/Footer';

const RefundPolicy = () => {
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
            <h1 className="text-lg font-semibold">Refund Policy</h1>
            <p className="text-xs text-muted-foreground">Last updated: {lastUpdated}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        <div className="prose prose-slate dark:prose-invert max-w-none">

          <section className="mb-10">
            <p className="text-lg text-muted-foreground leading-relaxed">
              We want you to feel confident about your subscription. This policy explains how refunds
              work so there are no surprises.
            </p>
          </section>

          <Separator className="my-8" />

          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold m-0">Subscription Model</h2>
            </div>
            <p className="text-muted-foreground">
              Kaamyab operates as a subscription-based service. Paid plans are billed on a recurring basis
              (monthly or annually) and provide access to premium features for the duration of the billing period.
            </p>
          </section>

          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold m-0">Refund Eligibility</h2>
            </div>
            <p className="text-muted-foreground">
              If you're not satisfied with your subscription, you may request a full refund within
              <strong className="text-foreground"> 7 days</strong> of your initial purchase. This applies to
              first-time subscriptions only.
            </p>
            <div className="bg-muted/50 rounded-xl p-4 mt-4">
              <p className="text-sm text-muted-foreground m-0">
                Renewal charges are not eligible for refund, as you have the option to cancel before
                each renewal date.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <CalendarX className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-xl font-semibold m-0">Partial Billing Cycles</h2>
            </div>
            <p className="text-muted-foreground">
              We do not offer refunds for partially used billing periods. If you cancel mid-cycle,
              you retain full access to your paid features until the current period ends.
            </p>
          </section>

          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold m-0">Cancellation</h2>
            </div>
            <p className="text-muted-foreground">
              You can cancel your subscription at any time from your account settings. Upon cancellation:
            </p>
            <ul className="space-y-2 text-muted-foreground mt-4">
              <li>Your premium access continues until the end of the current billing period</li>
              <li>Your account reverts to the free Standard tier after that</li>
              <li>All your data, plans, and history remain intact</li>
            </ul>
          </section>

          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold m-0">How to Request a Refund</h2>
            </div>
            <p className="text-muted-foreground">
              To request a refund within the eligibility window, send an email with your account details to:
            </p>
            <div className="bg-muted/50 rounded-xl p-4 mt-4">
              <p className="text-sm text-muted-foreground m-0">
                <strong className="text-foreground">Email:</strong> support@kamyaab-ai.com
              </p>
            </div>
            <p className="text-muted-foreground mt-4">
              Please include the email address associated with your account and a brief reason for the refund.
            </p>
          </section>

          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                <Timer className="w-5 h-5 text-teal-600" />
              </div>
              <h2 className="text-xl font-semibold m-0">Processing Timeline</h2>
            </div>
            <p className="text-muted-foreground">
              Approved refunds are processed within <strong className="text-foreground">5–10 business days</strong>.
              The refund will be returned to your original payment method. Processing times may vary depending
              on your financial institution.
            </p>
          </section>

          <div className="bg-muted/30 rounded-xl p-6 mt-12 text-center">
            <p className="text-sm text-muted-foreground m-0">
              We believe in fair policies. If you have questions about billing, reach out and we'll help.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RefundPolicy;

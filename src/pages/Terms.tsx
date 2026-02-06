import { ArrowLeft, Shield, Scale, AlertTriangle, CreditCard, UserX, Cpu, MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const Terms = () => {
  const navigate = useNavigate();
  const lastUpdated = "February 6, 2026";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Terms of Service</h1>
            <p className="text-xs text-muted-foreground">Last updated: {lastUpdated}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-4xl mx-auto px-4 py-8 pb-20">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          
          {/* Introduction */}
          <section className="mb-10">
            <p className="text-lg text-muted-foreground leading-relaxed">
              Welcome to Kaamyab. These terms explain how you can use our service in a way that works for everyone. 
              We've written them to be clear and straightforward—no complicated legal language where it's not needed.
            </p>
            <p className="text-muted-foreground">
              By creating an account or using Kaamyab, you agree to these terms. If something doesn't sit right with you, 
              please reach out before continuing.
            </p>
          </section>

          <Separator className="my-8" />

          {/* What Kaamyab Is */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold m-0">What Kaamyab Is</h2>
            </div>
            <p className="text-muted-foreground">
              Kaamyab is an AI-powered planning and execution tool designed to help you organize your work, 
              track progress, and reflect on your patterns. Think of it as a structured companion for getting things done.
            </p>
            <div className="bg-muted/50 rounded-xl p-4 mt-4">
              <p className="text-sm text-muted-foreground m-0">
                <strong className="text-foreground">Important:</strong> Kaamyab provides observational insights and 
                planning assistance—not professional advice. We help you see patterns and organize tasks, but we 
                don't guarantee outcomes or replace professional judgment in specialized fields.
              </p>
            </div>
          </section>

          {/* AI Disclaimer */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-xl font-semibold m-0">About Our AI Features</h2>
            </div>
            <p className="text-muted-foreground">
              Parts of Kaamyab use artificial intelligence to generate plans, insights, and suggestions. 
              While we work to make these helpful, you should know:
            </p>
            <ul className="space-y-2 text-muted-foreground mt-4">
              <li>
                <strong className="text-foreground">AI outputs may be inaccurate.</strong> Generated content can contain errors, 
                miss important context, or suggest approaches that don't fit your situation.
              </li>
              <li>
                <strong className="text-foreground">You remain responsible.</strong> Review AI-generated plans and insights 
                before acting on them. The final decisions are yours.
              </li>
              <li>
                <strong className="text-foreground">We're improving continuously.</strong> AI quality evolves over time. 
                What works well today may change, and vice versa.
              </li>
            </ul>
            <p className="text-muted-foreground mt-4">
              We're transparent about what's AI-generated within the app where it matters most.
            </p>
          </section>

          {/* Your Account */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Scale className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold m-0">Your Account</h2>
            </div>
            <p className="text-muted-foreground">
              When you create an account, you agree to:
            </p>
            <ul className="space-y-2 text-muted-foreground mt-4">
              <li>Provide accurate information about yourself</li>
              <li>Keep your login credentials secure</li>
              <li>Notify us if you suspect unauthorized access</li>
              <li>Use only one account per person (no duplicate accounts)</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              You're responsible for all activity under your account. If someone else accesses your account 
              due to your negligence, that's on you.
            </p>
          </section>

          {/* Acceptable Use */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold m-0">Acceptable Use</h2>
            </div>
            <p className="text-muted-foreground">
              We trust you to use Kaamyab responsibly. That means:
            </p>
            <ul className="space-y-2 text-muted-foreground mt-4">
              <li><strong className="text-foreground">Do:</strong> Use Kaamyab for personal productivity, work planning, and self-improvement</li>
              <li><strong className="text-foreground">Do:</strong> Share feedback to help us improve</li>
              <li><strong className="text-foreground">Don't:</strong> Attempt to reverse-engineer, copy, or misuse our systems</li>
              <li><strong className="text-foreground">Don't:</strong> Use Kaamyab for anything illegal or harmful</li>
              <li><strong className="text-foreground">Don't:</strong> Share your account access with others</li>
              <li><strong className="text-foreground">Don't:</strong> Overwhelm our systems with automated requests</li>
            </ul>
          </section>

          {/* Subscriptions & Payments */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold m-0">Subscriptions & Payments</h2>
            </div>
            
            <h3 className="text-base font-medium mt-6">Free Tier</h3>
            <p className="text-muted-foreground">
              Our Standard tier is free and includes core planning and execution features. 
              We may display non-intrusive advertisements on free accounts.
            </p>

            <h3 className="text-base font-medium mt-6">Paid Subscriptions</h3>
            <p className="text-muted-foreground">
              Paid plans (Student, Pro, Business) are billed monthly or annually as selected. 
              Subscriptions auto-renew unless cancelled before the renewal date.
            </p>

            <h3 className="text-base font-medium mt-6">Cancellations</h3>
            <p className="text-muted-foreground">
              You can cancel anytime from your account settings. After cancellation:
            </p>
            <ul className="space-y-2 text-muted-foreground mt-2">
              <li>You retain access until the end of your current billing period</li>
              <li>Your account reverts to the free Standard tier</li>
              <li>Your data remains accessible (we don't delete your plans)</li>
              <li>No partial refunds for unused time</li>
            </ul>

            <h3 className="text-base font-medium mt-6">Price Changes</h3>
            <p className="text-muted-foreground">
              We may adjust prices with 30 days' notice. Existing subscriptions continue at the old rate 
              until renewal.
            </p>
          </section>

          {/* Termination */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <UserX className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold m-0">Account Termination</h2>
            </div>
            
            <h3 className="text-base font-medium mt-6">By You</h3>
            <p className="text-muted-foreground">
              You can delete your account anytime from settings. This permanently removes your data. 
              We can't recover deleted accounts.
            </p>

            <h3 className="text-base font-medium mt-6">By Us</h3>
            <p className="text-muted-foreground">
              We may suspend or terminate accounts that:
            </p>
            <ul className="space-y-2 text-muted-foreground mt-2">
              <li>Violate these terms or our acceptable use policies</li>
              <li>Engage in fraudulent activity</li>
              <li>Attempt to harm our service or other users</li>
              <li>Remain inactive for extended periods (with prior notice)</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              For violations, we typically warn first unless the issue is severe. We aim to be fair, 
              but protecting the community comes first.
            </p>
          </section>

          {/* Liability */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Scale className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-xl font-semibold m-0">Limitation of Liability</h2>
            </div>
            
            <h3 className="text-base font-medium mt-6">For Free Users</h3>
            <p className="text-muted-foreground">
              Kaamyab is provided "as is" for free users. We're not liable for any damages arising from 
              your use of the free service, including but not limited to: missed deadlines, incorrect 
              AI suggestions, data loss, or service interruptions.
            </p>

            <h3 className="text-base font-medium mt-6">For Paid Users</h3>
            <p className="text-muted-foreground">
              For paid subscribers, our liability is limited to the amount you've paid us in the 
              12 months preceding any claim. We're not liable for indirect, consequential, or 
              punitive damages.
            </p>

            <h3 className="text-base font-medium mt-6">What We Don't Guarantee</h3>
            <ul className="space-y-2 text-muted-foreground mt-2">
              <li>Continuous, uninterrupted service availability</li>
              <li>That AI features will meet your specific needs</li>
              <li>Specific outcomes from following generated plans</li>
              <li>Complete accuracy of any AI-generated content</li>
            </ul>
          </section>

          {/* Governing Law */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-teal-600" />
              </div>
              <h2 className="text-xl font-semibold m-0">Governing Law</h2>
            </div>
            <p className="text-muted-foreground">
              These terms are governed by the laws of Pakistan. Any disputes will be resolved in 
              the courts of Pakistan. By using Kaamyab, you consent to this jurisdiction.
            </p>
          </section>

          {/* Changes */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold">Changes to These Terms</h2>
            <p className="text-muted-foreground">
              We may update these terms as our service evolves. For significant changes, we'll notify 
              you via email or in-app notification at least 14 days before they take effect. 
              Continued use after changes means you accept the new terms.
            </p>
          </section>

          {/* Contact */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold">Questions?</h2>
            <p className="text-muted-foreground">
              If anything here is unclear or you have concerns, we're happy to help. 
              Reach out through the app's feedback option or contact us at support.
            </p>
          </section>

          {/* Closing Note */}
          <div className="bg-muted/30 rounded-xl p-6 mt-12 text-center">
            <p className="text-sm text-muted-foreground m-0">
              We built Kaamyab to help people accomplish more with clarity. These terms exist to 
              protect both you and us while we do that together.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Terms;

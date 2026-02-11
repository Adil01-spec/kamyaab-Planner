import { ArrowLeft, HelpCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Footer } from '@/components/Footer';

const planningFaqs = [
  {
    q: "How does Kaamyab create my plan?",
    a: "You describe your project, set a deadline, and our AI generates a structured weekly plan tailored to your goals. Each plan breaks work into manageable tasks across realistic timeframes."
  },
  {
    q: "Can I edit my plan after it's generated?",
    a: "Yes. You can add, remove, reorder, and split tasks at any time. Your plan is fully editable — the AI gives you a starting point, but you stay in control."
  },
  {
    q: "What happens when my plan ends?",
    a: "You'll see a completion summary with insights on your execution. You can then start a new plan whenever you're ready — previous plans are saved in your history."
  },
  {
    q: "Can I have more than one plan at a time?",
    a: "Currently, Kaamyab supports one active plan at a time. This is intentional — focused execution on a single project leads to better outcomes."
  },
  {
    q: "How does the Today view work?",
    a: "The Today view surfaces tasks scheduled for the current day, letting you focus on execution without the noise of your full plan. You can start timers, mark tasks complete, and track daily progress."
  },
];

const subscriptionFaqs = [
  {
    q: "What tiers are available?",
    a: "Kaamyab offers four tiers: Standard (Free), Student (PKR 299/mo), Pro (PKR 999/mo), and Business (PKR 2,499/mo). Each tier unlocks additional features like advanced insights, collaboration, and professional exports."
  },
  {
    q: "How do I upgrade my plan?",
    a: "Visit the Pricing page from the menu. Since automated payments are being set up, upgrades are currently handled manually — contact support@kamyaab-ai.com with your preferred tier."
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. You can cancel your subscription at any time. Your access continues until the end of your current billing period — no partial-month charges."
  },
  {
    q: "Is there a refund policy?",
    a: "Yes. We offer a 7-day refund window from your initial purchase. See our Refund Policy page for full details."
  },
  {
    q: "What's included in the free tier?",
    a: "The Standard (Free) tier includes core planning, task execution, the Today view, daily reflections, and basic plan history. It's fully functional for individual use."
  },
];

const aiFaqs = [
  {
    q: "How does the AI personalize my experience?",
    a: "Kaamyab learns from your planning patterns, task completion rates, and reflection inputs to offer increasingly relevant guidance — like realistic task estimates and smarter scheduling."
  },
  {
    q: "Is my data used to train AI models?",
    a: "No. Your personal data is never used to train external AI models. AI features operate on your data only to serve you, within the platform."
  },
  {
    q: "What AI features require a paid tier?",
    a: "Advanced insights like Diagnosis, Pattern Analysis, and Operating Style summaries are available on paid tiers. Basic plan generation and daily nudges are available on all tiers."
  },
  {
    q: "Can I use Kaamyab without the AI features?",
    a: "Absolutely. The core planning and execution tools work independently. AI features enhance your experience but are never required."
  },
];

const generalFaqs = [
  {
    q: "How do I contact support?",
    a: "Email us at support@kamyaab-ai.com. We aim to respond within 48 hours. You can also use the Contact page to send a message directly."
  },
  {
    q: "Is my data secure?",
    a: "Yes. All data is stored on secure cloud infrastructure with encryption at rest and in transit. See our Privacy Policy for full details."
  },
  {
    q: "Can I export my plan or progress?",
    a: "Paid tiers offer PDF exports of your plan reviews and progress reports. We're working on expanding export options."
  },
  {
    q: "Does Kaamyab work on mobile?",
    a: "Yes. Kaamyab is fully responsive and designed for comfortable use on phones, tablets, and desktops."
  },
];

interface FaqSectionProps {
  title: string;
  items: { q: string; a: string }[];
  idPrefix: string;
}

const FaqSection = ({ title, items, idPrefix }: FaqSectionProps) => (
  <section className="mb-10">
    <h2 className="text-xl font-semibold mb-4">{title}</h2>
    <Accordion type="single" collapsible className="w-full">
      {items.map((item, i) => (
        <AccordionItem key={i} value={`${idPrefix}-${i}`}>
          <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
            {item.q}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            {item.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </section>
);

const Help = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
            <h1 className="text-lg font-semibold">Help Center</h1>
            <p className="text-xs text-muted-foreground">Frequently asked questions</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        <div className="prose prose-slate dark:prose-invert max-w-none">

          <section className="mb-10">
            <p className="text-lg text-muted-foreground leading-relaxed">
              Find answers to common questions about planning, subscriptions, AI features, and more. 
              Can't find what you're looking for? <Link to="/contact" className="text-primary hover:underline">Contact us</Link>.
            </p>
          </section>

          <Separator className="my-8" />

          <FaqSection title="Planning & Execution" items={planningFaqs} idPrefix="plan" />
          <Separator className="my-8" />
          <FaqSection title="Subscriptions & Pricing" items={subscriptionFaqs} idPrefix="sub" />
          <Separator className="my-8" />
          <FaqSection title="AI Features" items={aiFaqs} idPrefix="ai" />
          <Separator className="my-8" />
          <FaqSection title="General" items={generalFaqs} idPrefix="gen" />

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Help;

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqItems = [
  {
    q: 'How does Kamyaab compare to traditional planners and to-do apps?',
    a: 'Traditional planners and to-do apps give you a blank space to list tasks. Kamyaab is an execution intelligence system — it generates structured, week-by-week plans from your objective, tracks deterministic completion speed, and uses adaptive behavioral memory to refine future plans based on how you actually execute.',
  },
  {
    q: 'How is Kamyaab different from Notion or project management tools?',
    a: 'Notion and project management tools are general-purpose workspaces where you build your own structure. Kamyaab eliminates that overhead: describe your goal, and AI generates a locked execution plan with milestone-driven task sequencing, 4-state time tracking, and automatic risk assessment — no templates or manual setup required.',
  },
  {
    q: 'Can Kamyaab help me stay consistent with long-term goals?',
    a: 'Yes. Kamyaab is built specifically for consistency. Its plan-locking mechanism prevents scope creep, the execution timer creates accountability on every task, and behavioral memory injection learns your patterns over time to generate plans that match your real capacity — not just your ambition.',
  },
  {
    q: 'How does AI-powered goal tracking work in Kamyaab?',
    a: 'When you define an objective, Kamyaab\'s AI breaks it into milestones and tasks distributed across weeks. Each task has a 4-state execution timer (idle → doing → paused → done). The system calculates your completion speed, consistency score, and plan lock rate — giving you quantifiable execution data instead of subjective feelings.',
  },
  {
    q: 'Is Kamyaab free to use? What do paid plans offer?',
    a: 'The Standard tier is completely free and includes AI-generated plans, execution tracking, and behavioral memory. Pro and Business tiers unlock unlimited strategic mode with risk assessment, team collaboration features, advisor sharing, and advanced execution analytics for serious executors and teams.',
  },
];

export const FAQSection = () => {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <section className="py-20 bg-background">
      <div className="container max-w-3xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-center">
          Frequently Asked Questions
        </h2>
        <p className="text-muted-foreground text-lg text-center mb-10 max-w-xl mx-auto">
          Everything you need to know about Kamyaab's execution intelligence system.
        </p>

        <Accordion type="single" collapsible className="w-full">
          {faqItems.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-foreground font-medium">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </div>
    </section>
  );
};

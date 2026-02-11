import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Footer } from '@/components/Footer';
const Ownership = () => {
  const navigate = useNavigate();
  const lastUpdated = "February 11, 2026";
  return <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Ownership & Operator Information</h1>
            <p className="text-xs text-muted-foreground">Last updated: {lastUpdated}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        <div className="prose prose-slate dark:prose-invert max-w-none">

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">Operator</h2>
            <p className="text-muted-foreground leading-relaxed">Kaamyab AI is owned and operated by Adil Zia, an independent software developer based in Pakistan.</p>
          </section>

          <Separator className="my-8" />

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">Platform Description</h2>
            <p className="text-muted-foreground leading-relaxed">
              Kaamyab AI is a digital software-as-a-service (SaaS) platform that provides AI-powered planning and productivity tools. 
              All services are delivered electronically through the Kaamyab AI web application.
            </p>
          </section>

          <Separator className="my-8" />

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">
              For official correspondence and support inquiries:
            </p>
            <ul className="list-none pl-0 space-y-2 text-muted-foreground">
              <li><strong>Email:</strong> support@kamyaab-ai.com</li>
              <li><strong>Phone:</strong>Phone: +923175799089</li>
            </ul>
          </section>

          <Separator className="my-8" />

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">All platform content, software, AI systems, branding, and intellectual property are the exclusive property of Adil Zia, unless otherwise stated.</p>
          </section>

          <Separator className="my-8" />

          <section className="mb-10">
            <p className="text-muted-foreground leading-relaxed italic">
              We are committed to operating Kaamyab AI with transparency, integrity, and long-term value for our users.
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </div>;
};
export default Ownership;
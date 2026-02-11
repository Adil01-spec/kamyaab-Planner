import { ArrowLeft, Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Footer } from '@/components/Footer';
import { toast } from '@/hooks/use-toast';

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be under 100 characters'),
  email: z.string().trim().email('Please enter a valid email address').max(255, 'Email must be under 255 characters'),
  message: z.string().trim().min(1, 'Message is required').max(1000, 'Message must be under 1000 characters'),
});

type ContactForm = z.infer<typeof contactSchema>;

const Contact = () => {
  const navigate = useNavigate();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = (_data: ContactForm) => {
    toast({
      title: "Message sent",
      description: "Thank you for reaching out. We'll get back to you within 48 hours.",
    });
    reset();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Contact Us</h1>
            <p className="text-xs text-muted-foreground">We'd love to hear from you</p>
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        <div className="prose prose-slate dark:prose-invert max-w-none">

          <section className="mb-10">
            <p className="text-lg text-muted-foreground leading-relaxed">
              Have a question, feedback, or need support? Reach out through any of the channels below
              or use the contact form. We typically respond within 48 hours.
            </p>
          </section>

          <Separator className="my-8" />

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            <div className="bg-muted/50 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-base font-medium m-0">Email</h3>
              </div>
              <p className="text-sm text-muted-foreground m-0">support@kamyaab-ai.com</p>
            </div>

            <div className="bg-muted/50 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-base font-medium m-0">Phone</h3>
              </div>
              <p className="text-sm text-muted-foreground m-0">+92 XXX XXXXXXX</p>
            </div>

            <div className="bg-muted/50 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-green-600" />
                </div>
                <h3 className="text-base font-medium m-0">Address</h3>
              </div>
              <p className="text-sm text-muted-foreground m-0">Kaamyab HQ, Lahore, Pakistan</p>
            </div>

            <div className="bg-muted/50 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="text-base font-medium m-0">Response Time</h3>
              </div>
              <p className="text-sm text-muted-foreground m-0">Within 48 hours</p>
            </div>
          </div>

          {/* Contact Form */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-6">Send Us a Message</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 not-prose">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Your name" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="your@email.com" {...register('email')} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="How can we help?"
                  rows={5}
                  {...register('message')}
                />
                {errors.message && <p className="text-sm text-destructive">{errors.message.message}</p>}
              </div>

              <Button type="submit" disabled={isSubmitting} className="gap-2">
                <Send className="w-4 h-4" />
                Send Message
              </Button>
            </form>
          </section>

          <div className="bg-muted/30 rounded-xl p-6 mt-12 text-center">
            <p className="text-sm text-muted-foreground m-0">
              We read every message and value your feedback. It helps us build a better product.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;

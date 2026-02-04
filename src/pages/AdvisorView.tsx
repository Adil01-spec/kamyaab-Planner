import { useParams } from 'react-router-dom';
import { useSharedReview } from '@/hooks/useSharedReview';
import { AdvisorViewContent } from '@/components/AdvisorViewContent';
import { AdvisorFeedbackForm } from '@/components/AdvisorFeedbackForm';
import { isShareExpired, formatExpiryDate } from '@/lib/shareReview';
import { Loader2, FileX, AlertTriangle, Clock, Briefcase } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';

/**
 * Advisor View Page
 * 
 * Professional, read-only view for mentors/advisors to review plans.
 * No authentication required. No indexable by search engines.
 * 
 * Key characteristics:
 * - Calm, professional executive tone
 * - No timers, no execution controls, no editing
 * - Print-friendly layout
 * - No animations or calls to action
 */
export default function AdvisorView() {
  const { shareId } = useParams<{ shareId: string }>();
  const { data, loading, error } = useSharedReview(shareId);

  // Add noindex meta tag to prevent search engine indexing
  useEffect(() => {
    const metaRobots = document.createElement('meta');
    metaRobots.name = 'robots';
    metaRobots.content = 'noindex, nofollow';
    document.head.appendChild(metaRobots);

    return () => {
      document.head.removeChild(metaRobots);
    };
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center print:bg-white">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading review...</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <FileX className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-xl font-semibold mb-2">Review Not Found</h1>
            <p className="text-muted-foreground mb-6">
              This review link doesn't exist or has been removed.
            </p>
            <Link to="/">
              <Button variant="outline">
                <Briefcase className="w-4 h-4 mr-2" />
                Visit Kaamyab
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Revoked state
  if (data.revoked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-xl font-semibold mb-2">Access Revoked</h1>
            <p className="text-muted-foreground mb-6">
              The plan owner has revoked access to this review.
            </p>
            <Link to="/">
              <Button variant="outline">
                <Briefcase className="w-4 h-4 mr-2" />
                Visit Kaamyab
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Expired state
  if (isShareExpired(data.expires_at)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-xl font-semibold mb-2">Link Expired</h1>
            <p className="text-muted-foreground mb-6">
              This review link expired on {formatExpiryDate(data.expires_at)}.
            </p>
            <Link to="/">
              <Button variant="outline">
                <Briefcase className="w-4 h-4 mr-2" />
                Visit Kaamyab
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid advisor view
  return (
    <div className="min-h-screen bg-background print:bg-white">
      {/* Header - Professional, understated */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 print:static print:border-b-2 print:border-foreground/20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center print:bg-foreground/10">
              <Briefcase className="w-5 h-5 text-primary print:text-foreground" />
            </div>
            <div>
              <span className="font-semibold text-foreground">Plan Review</span>
              <p className="text-xs text-muted-foreground">Advisor View</p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground print:hidden">Read-Only</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 print:py-4">
        <AdvisorViewContent
          planSnapshot={data.plan_snapshot}
          expiresAt={data.expires_at}
        />
        
        {/* Advisor Feedback Form */}
        <AdvisorFeedbackForm sharedReviewId={data.id} />
      </main>

      {/* Footer - Minimal */}
      <footer className="border-t mt-12 print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          Powered by{' '}
          <a href="/" className="text-primary hover:underline">
            Kaamyab
          </a>
        </div>
      </footer>
    </div>
  );
}

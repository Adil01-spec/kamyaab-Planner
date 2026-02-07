import { useParams } from 'react-router-dom';
import { useSharedReview } from '@/hooks/useSharedReview';
import { SharedReviewContent } from '@/components/SharedReviewContent';
import { SharedReviewFeedbackForm } from '@/components/SharedReviewFeedbackForm';
import { Footer } from '@/components/Footer';
import { isShareExpired, formatExpiryDate } from '@/lib/shareReview';
import { Loader2, FileX, AlertTriangle, Clock, Rocket } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

/**
 * Public shared review page
 * Accessible without authentication at /shared-review/:token
 */
export default function SharedReview() {
  const { token } = useParams<{ token: string }>();
  const { data, loading, error } = useSharedReview(token);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
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
                <Rocket className="w-4 h-4 mr-2" />
                Try Kaamyab
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
            <h1 className="text-xl font-semibold mb-2">Link Revoked</h1>
            <p className="text-muted-foreground mb-6">
              The owner has revoked access to this review.
            </p>
            <Link to="/">
              <Button variant="outline">
                <Rocket className="w-4 h-4 mr-2" />
                Try Kaamyab
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
                <Rocket className="w-4 h-4 mr-2" />
                Try Kaamyab
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid shared review
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Rocket className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Kaamyab</span>
          </div>
          <span className="text-xs text-muted-foreground">Shared Review</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto px-4 py-8 w-full">
        <SharedReviewContent
          planSnapshot={data.plan_snapshot}
        />
        <SharedReviewFeedbackForm sharedReviewId={data.id} />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { ProFeatureIndicator } from '@/components/ProFeatureIndicator';
import { ShareReviewModal } from '@/components/ShareReviewModal';
import { toast } from '@/hooks/use-toast';

interface ShareReviewButtonProps {
  planId: string;
  planData: any;
  className?: string;
}

export function ShareReviewButton({ planId, planData, className }: ShareReviewButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const { hasAccess, trackInterest } = useFeatureAccess('share-review', planData);

  const handleClick = () => {
    if (!hasAccess) {
      trackInterest('attempted');
      toast({
        title: 'Pro Feature',
        description: 'Share Review is available with Strategic Planning. Create professional shareable reviews of your plans.',
      });
      return;
    }
    setModalOpen(true);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        className={className}
      >
        <Share2 className="w-4 h-4 mr-2" />
        Share
        {!hasAccess && <ProFeatureIndicator featureId="share-review" variant="star" className="ml-1.5" />}
      </Button>

      <ShareReviewModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        planId={planId}
        planData={planData}
      />
    </>
  );
}

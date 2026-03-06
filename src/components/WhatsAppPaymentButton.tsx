import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

const WHATSAPP_NUMBER = '923001234567'; // Replace with actual number

interface WhatsAppPaymentButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
}

export function WhatsAppPaymentButton({ className, variant = 'outline', size = 'sm' }: WhatsAppPaymentButtonProps) {
  const message = encodeURIComponent(
    'Hi, I just paid for my Kaamyab subscription. Here is my payment screenshot.'
  );
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => window.open(url, '_blank')}
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      Submit via WhatsApp
    </Button>
  );
}

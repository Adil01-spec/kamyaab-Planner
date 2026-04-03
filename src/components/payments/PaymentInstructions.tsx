import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

interface PaymentInstructionsProps {
  method: 'bank_transfer' | 'jazzcash' | 'easypaisa';
}

const INSTRUCTIONS = {
  bank_transfer: {
    title: 'Bank Transfer Details',
    fields: [
      { label: 'Bank Name', value: 'Meezan Bank' },
      { label: 'Account Title', value: 'Adil Zia' },
      { label: 'Account Number', value: '03370106510144' },
      { label: 'IBAN', value: 'PK61MEZN0003370106510144' },
    ],
  },
  jazzcash: {
    title: 'JazzCash Details',
    fields: [
      { label: 'JazzCash Number', value: '030051499089' },
      { label: 'Receiver Name', value: 'Adil Zia' },
    ],
  },
  easypaisa: {
    title: 'Easypaisa Details',
    fields: [
      { label: 'Easypaisa Number', value: '03416077869' },
      { label: 'Receiver Name', value: 'Adil Zia' },
    ],
  },
};

const copyToClipboard = (text: string, label: string) => {
  navigator.clipboard.writeText(text);
  toast({ title: `${label} copied`, description: text });
};

export function PaymentInstructions({ method }: PaymentInstructionsProps) {
  const [open, setOpen] = useState(true);
  const info = INSTRUCTIONS[method];

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border border-border/40 bg-muted/30">
      <CollapsibleTrigger asChild>
        <button className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground">
          {info.title}
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4 space-y-2.5">
        {info.fields.map((f) => (
          <div key={f.label} className="flex items-center justify-between gap-2 rounded-md bg-background/60 px-3 py-2">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{f.label}</p>
              <p className="text-sm font-medium text-foreground truncate">{f.value}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8"
              onClick={() => copyToClipboard(f.value, f.label)}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        <p className="text-xs text-muted-foreground pt-1">
          After sending payment, enter your transaction ID and upload a screenshot below.
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Ban } from 'lucide-react';

interface CancelBookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  bookingReference?: string;
  isPriest?: boolean;
}

const DEVOTEE_COMMON_REASONS = [
  'Booked mistakenly / accidental appointment',
  'Need to change ceremony date or Muhurat time',
  'Need to change ritual or samagri details',
  'Family emergency or unexpected travel',
  'Other personal reason',
];

const PRIEST_COMMON_REASONS = [
  'Schedule clash or personal emergency',
  'Devotee requested rescheduling',
  'Unforeseen travel or health issue',
  'Location distance unreachable',
  'Other reason',
];

export const CancelBookingDialog: React.FC<CancelBookingDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  bookingReference,
  isPriest = false,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setIsSubmitting(true);
    try {
      await onConfirm(reason.trim());
      setReason('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="pr-10 sm:pr-12 text-left">
          <div className="flex items-center gap-2 text-destructive font-semibold">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="truncate">{isPriest ? 'Decline Puja Request' : 'Cancel Ceremony Appointment'}</span>
          </div>
          <DialogTitle className="text-base break-words">
            {bookingReference ? `Booking: ${bookingReference}` : 'Confirm Action'}
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed">
            {isPriest
              ? 'Please provide a clear reason to notify the devotee. The reserved slot will be released.'
              : 'If you booked this appointment mistakenly or need to cancel, please select a reason below. The Pandit Ji will be notified immediately.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="flex flex-wrap gap-1.5">
            {(isPriest ? PRIEST_COMMON_REASONS : DEVOTEE_COMMON_REASONS).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`px-2.5 py-1 rounded-md text-[11px] border text-left transition-colors ${
                  reason === r
                    ? 'bg-primary text-primary-foreground border-primary font-medium'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <Textarea
            placeholder="Type specific reason..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="text-xs min-h-20"
          />
        </div>

        <DialogFooter className="flex flex-row items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting} className="flex-1 sm:flex-initial sm:w-auto">
            Keep Booking
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleSubmit}
            disabled={!reason.trim() || isSubmitting}
            className="flex-1 sm:flex-initial sm:w-auto gap-1.5"
          >
            <Ban className="w-3.5 h-3.5 shrink-0" />
            {isSubmitting ? 'Processing...' : isPriest ? 'Decline' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

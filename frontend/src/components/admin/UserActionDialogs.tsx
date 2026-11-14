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
import { DevoteeRecord } from '@/components/admin/UserManagementTable';
import { Ban, AlertTriangle } from 'lucide-react';

interface SuspendUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  user: DevoteeRecord | null;
}

export const SuspendUserDialog: React.FC<SuspendUserDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  user,
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
          <DialogTitle className="text-base flex items-center gap-2 text-destructive">
            <Ban className="w-4 h-4 shrink-0" />
            <span>Suspend Devotee Account</span>
          </DialogTitle>
          <DialogDescription className="text-xs break-words leading-relaxed">
            Suspension revokes platform booking privileges for <strong>{user?.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-3">
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-red-800">
              <AlertTriangle className="w-3.5 h-3.5 text-red-700 shrink-0" />
              Automatic Cancellation & Notification:
            </p>
            <p className="text-[11px] leading-relaxed text-red-700">
              Suspending this devotee will <strong>automatically cancel all of their active and pending bookings on the priest side</strong>, and a notification email stating the reason will be sent to the devotee.
            </p>
          </div>

          <Textarea
            placeholder="E.g., Repeated booking cancellations, payment disputes..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="text-xs min-h-20"
          />
        </div>

        <DialogFooter className="flex flex-row items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting} className="flex-1 sm:flex-initial sm:w-auto">
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleSubmit}
            disabled={!reason.trim() || isSubmitting}
            className="flex-1 sm:flex-initial sm:w-auto"
          >
            {isSubmitting ? 'Suspending...' : 'Confirm Suspension'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

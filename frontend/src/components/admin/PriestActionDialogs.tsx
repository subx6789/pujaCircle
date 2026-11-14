import React, { useState, useEffect } from 'react';
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
import { Priest } from '@/types/priest.types';
import { Ban, Trash2, XCircle, AlertTriangle } from 'lucide-react';

interface RejectPriestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  priest: Priest | null;
}

export const RejectPriestDialog: React.FC<RejectPriestDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  priest,
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
            <XCircle className="w-4 h-4 shrink-0" />
            <span>Reject Purohit Application</span>
          </DialogTitle>
          <DialogDescription className="text-xs wrap-break-word">
            Provide specific feedback for <strong>{priest?.fullName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <Textarea
            placeholder="E.g., Incomplete Vedic qualifications documentation, unverified phone number..."
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
            {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface BanPriestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  priest: Priest | null;
}

export const BanPriestDialog: React.FC<BanPriestDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  priest,
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
            <span>Ban Purohit Account</span>
          </DialogTitle>
          <DialogDescription className="text-xs wrap-break-word leading-relaxed">
            Banning <strong>{priest?.fullName}</strong> will hide their profile from public searches and block incoming bookings.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-3">
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-red-800">
              <AlertTriangle className="w-3.5 h-3.5 text-red-700 shrink-0" />
              Automatic Cancellation & Email Notification:
            </p>
            <p className="text-[11px] leading-relaxed text-red-700">
              Banning this Purohit will <strong>automatically cancel all of their active and pending bookings</strong>, and email notifications explaining the ban reason will be sent to the Purohit and all booked devotees.
            </p>
          </div>

          <Textarea
            placeholder="E.g., Repeated conduct violations, devotee complaints regarding punctuality..."
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
            {isSubmitting ? 'Banning...' : 'Confirm Account Ban'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<void>;
  title: string;
  description: string;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReason('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(reason.trim());
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
            <Trash2 className="w-4 h-4 shrink-0" />
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed wrap-break-word">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-3">
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-red-800">
              <AlertTriangle className="w-3.5 h-3.5 text-red-700 shrink-0" />
              Automatic Cancellation & Notification:
            </p>
            <p className="text-[11px] leading-relaxed text-red-700">
              Permanently deleting this account will <strong>automatically cancel all associated active and pending bookings</strong>, and dispatch notification emails to the account owner and all booked devotees.
            </p>
          </div>

          <Textarea
            placeholder="Reason for deletion (e.g., Unverified credentials, policy violations, user request)..."
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
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial sm:w-auto"
          >
            {isSubmitting ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

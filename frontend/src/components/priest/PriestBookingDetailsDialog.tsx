import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BookingStatusBadge } from '@/components/booking/BookingStatusBadge';
import { Booking } from '@/types/booking.types';
import { formatINR, formatDate } from '@/lib/utils';
import { Calendar, Clock, MapPin, Phone, User, Sparkles, Ban, AlertCircle, FileText, CheckCircle2, Star } from 'lucide-react';

interface PriestBookingDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
}

export const PriestBookingDetailsDialog: React.FC<PriestBookingDetailsDialogProps> = ({
  isOpen,
  onClose,
  booking,
}) => {
  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-white border-2 border-amber-300">
        <DialogHeader className="space-y-1.5 text-left pr-10 sm:pr-12">
          <div className="flex items-start gap-2.5">
            <div className="h-9 w-9 rounded-md bg-amber-100 border border-amber-300 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-[#780016]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-base sm:text-lg font-serif font-bold text-stone-900 leading-tight">
                  Ceremony Appointment
                </DialogTitle>
                <BookingStatusBadge status={booking.status} cancelledBy={booking.cancelledBy} />
              </div>
              <DialogDescription className="text-[11px] font-mono text-stone-500 mt-0.5 text-left">
                Ref: {booking.bookingReference || booking.id}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 py-1 text-xs">
          {/* Puja & Price Banner */}
          <div className="p-3 sm:p-3.5 rounded-lg bg-amber-50/80 border border-amber-200/90 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm text-stone-900 truncate">{booking.serviceName || 'Puja Ceremony'}</p>
              <p className="text-stone-500 text-[11px]">Cash on completion</p>
            </div>
            <span className="text-lg sm:text-xl font-bold font-serif text-[#780016] shrink-0">
              {formatINR(booking.servicePrice || booking.dakshinaAmount || 2100)}
            </span>
          </div>

          {/* Schedule Flex Row */}
          <div className="grid grid-cols-2 gap-3 p-3 sm:p-3.5 rounded-lg bg-amber-50/50 border border-amber-200">
            <div className="space-y-1">
              <span className="text-stone-500 text-[11px] flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                Date
              </span>
              <p className="font-bold text-stone-900 text-xs sm:text-sm">{formatDate(booking.bookingDate)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-stone-500 text-[11px] flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                Muhurat Time
              </span>
              <p className="font-bold text-stone-900 text-xs sm:text-sm truncate">
                {booking.slot ? `${booking.slot.startTime} - ${booking.slot.endTime}` : 'Morning Slot'}
              </p>
            </div>
          </div>

          {/* Devotee Info & Address */}
          <div className="space-y-2 p-3 sm:p-3.5 rounded-lg bg-stone-50 border border-stone-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-stone-900 flex items-center gap-1.5 text-xs">
                <User className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                {booking.user?.name || 'Devotee'}
              </span>
              {booking.user?.phoneNumber && (
                <a
                  href={`tel:${booking.user.phoneNumber}`}
                  className="font-mono text-stone-700 hover:text-[#780016] flex items-center gap-1 text-[11px] font-semibold"
                >
                  <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                  {booking.user.phoneNumber}
                </a>
              )}
            </div>

            {booking.address && (
              <div className="flex items-start gap-1.5 text-stone-600 pt-2 border-t border-stone-200/80 text-[11px] leading-relaxed">
                <MapPin className="w-3.5 h-3.5 text-[#780016] shrink-0 mt-0.5" />
                <span>
                  {booking.address.houseNo && `${booking.address.houseNo}, `}
                  {booking.address.street && `${booking.address.street}, `}
                  {booking.address.locality && `${booking.address.locality}, `}
                  {booking.address.villageTown && `${booking.address.villageTown}, `}
                  {booking.address.city}, {booking.address.state} - {booking.address.pincode}
                </span>
              </div>
            )}
          </div>

          {/* Devotee Requirements & Gotra */}
          {(booking.specialInstructions || booking.notes || booking.userNotes) && (
            <div className="p-3.5 rounded-lg bg-amber-50/90 border border-amber-300 space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-1.5 font-bold text-stone-900">
                <FileText className="w-4 h-4 text-[#780016]" />
                <span>Devotee Special Requirements & Gotra:</span>
              </div>
              <p className="pl-5 text-stone-800 text-xs font-medium leading-relaxed">
                "{booking.specialInstructions || booking.notes || booking.userNotes}"
              </p>
            </div>
          )}

          {/* Completed Ceremony Status */}
          {booking.status === 'COMPLETED' && (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-300 text-xs space-y-1.5 text-emerald-950">
              <strong className="font-bold flex items-center gap-1.5 text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                Ceremony Successfully Conducted & Dakshina Received
              </strong>
              {booking.completedAt && (
                <p className="text-[11px] text-emerald-800 pl-5">
                  Completed on: <strong>{formatDate(booking.completedAt)}</strong>
                </p>
              )}
              {booking.rating && (
                <div className="pl-5 pt-1 flex flex-wrap items-center gap-2 text-stone-800">
                  <span className="font-bold">Devotee Rating:</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    {booking.rating} / 5
                  </span>
                  {booking.review && <span className="italic text-stone-700 break-words">"{booking.review}"</span>}
                </div>
              )}
            </div>
          )}

          {/* Rejection / Cancellation Notes if applicable */}
          {booking.rejectionReason && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-900 text-xs space-y-1">
              <strong className="font-bold flex items-center gap-1.5">
                <Ban className="w-4 h-4 text-red-700" />
                Declined by You (Priest):
              </strong>
              <p className="pl-5 text-stone-700 font-medium">{booking.rejectionReason}</p>
            </div>
          )}
          {booking.cancellationReason && (
            <div className={`p-3.5 rounded-lg border text-xs space-y-1.5 ${
              booking.cancelledBy === 'USER'
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-muted border-border text-foreground'
            }`}>
              <strong className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-[#780016]" />
                {booking.cancelledBy === 'USER' ? 'Devotee Cancelled Appointment:' : 'Cancellation Reason:'}
              </strong>
              <p className="pl-5 text-stone-800 font-medium">
                "{booking.cancellationReason}"
              </p>
              {booking.cancelledBy === 'USER' && (
                <p className="pl-5 text-[11px] text-stone-500 italic">
                  The devotee {booking.user?.name ? `(${booking.user.name})` : ''} cancelled this booking. Your calendar Muhurat slot has been automatically released.
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="w-full sm:w-auto h-10 sm:h-9 border-amber-300 hover:bg-amber-50 text-stone-700 font-bold"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

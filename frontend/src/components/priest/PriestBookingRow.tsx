import React from 'react';
import { Booking } from '@/types/booking.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookingStatusBadge } from '@/components/booking/BookingStatusBadge';
import { CountdownTimer } from '@/components/common/CountdownTimer';
import { formatINR, formatDate } from '@/lib/utils';
import { Calendar, Clock, MapPin, Check, Ban, Eye, CheckCircle2, Phone, AlertCircle, User, FileText } from 'lucide-react';

interface PriestBookingRowProps {
  booking: Booking;
  onViewDetails: (booking: Booking) => void;
  onAccept: (bookingId: string) => void;
  onOpenReject: (booking: Booking) => void;
  onComplete: (booking: Booking) => void;
  isProcessing?: boolean;
}

/**
 * PriestBookingRow
 * Auspicious ceremony row item for Purohit appointment management.
 * 100% Flexbox, pure solid white canvas, Haldi gold borders, zero grids.
 */
export const PriestBookingRow: React.FC<PriestBookingRowProps> = ({
  booking,
  onViewDetails,
  onAccept,
  onOpenReject,
  onComplete,
  isProcessing = false,
}) => {
  const devoteeName = booking.user?.name || booking.userName || 'Devotee';
  const devoteePhone = booking.user?.phoneNumber || booking.userPhone;

  return (
    <div className="p-4 sm:p-5 rounded-lg border-2 border-amber-200 hover:border-amber-400 bg-white shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 puja-card-lift">
      {/* Left Details */}
      <div className="space-y-2 flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-extrabold text-sm sm:text-base text-stone-950 font-serif">
            {booking.serviceName || 'Sacred Puja Ceremony'}
          </span>
          <BookingStatusBadge status={booking.status} cancelledBy={booking.cancelledBy} />
          <Badge variant="outline" className="font-mono text-[11px] sm:text-xs font-bold border-amber-300 bg-white text-stone-800">
            {booking.bookingReference || booking.id.slice(0, 8)}
          </Badge>
          {booking.status === 'PENDING' && booking.responseDeadline && (
            <CountdownTimer targetDate={booking.responseDeadline} compact />
          )}
          {booking.status === 'COMPLETED' && booking.rating && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold">
              ★ {booking.rating}/5
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-5 gap-y-1.5 text-xs text-stone-700">
          <div className="flex items-center gap-1.5 font-bold text-stone-900">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-700 shrink-0" />
            <span>{formatDate(booking.bookingDate)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 shrink-0" />
            <span>{booking.slot ? `${booking.slot.startTime} - ${booking.slot.endTime}` : 'Morning Shubh Muhurat'}</span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-700 shrink-0" />
            <span className="truncate max-w-[200px] sm:max-w-xs font-medium">
              {booking.address ? `${booking.address.villageTown || booking.address.city}, ${booking.address.city}` : 'Devotee Residence'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-5 gap-y-1.5 pt-1 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-stone-900 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-sm">
            <User className="w-3.5 h-3.5 text-[#780016]" />
            <span className="text-stone-700 font-semibold">Devotee:</span>
            <span className="text-[#780016] font-extrabold">{devoteeName}</span>
          </div>
          <span className="text-stone-600">
            Dakshina: <strong className="text-red-800 font-serif font-bold text-sm">{formatINR(booking.servicePrice || booking.dakshinaAmount || 2100)}</strong> {booking.status === 'COMPLETED' ? '(Received in Cash)' : '(Cash on Completion)'}
          </span>
          {devoteePhone && (
            <div className="flex items-center gap-1.5 text-stone-700">
              <span>Contact:</span>
              <strong className="text-stone-900 font-mono font-bold">{devoteePhone}</strong>
              {booking.status === 'CONFIRMED' && (
                <a
                  href={`tel:${devoteePhone}`}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 ml-1"
                >
                  <Phone className="w-3 h-3" /> Call
                </a>
              )}
            </div>
          )}
        </div>

        {(booking.specialInstructions || booking.notes || booking.userNotes) && (
          <div className="p-2 sm:p-2.5 rounded-md bg-amber-50/90 border border-amber-300 text-xs flex items-start gap-2 shadow-2xs">
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-800 shrink-0 mt-0.5" />
            <div className="space-y-0.5 min-w-0">
              <span className="font-bold text-amber-950">Devotee Requirements / Gotra:</span>
              <p className="text-[11px] text-stone-800 font-medium leading-relaxed break-words">
                "{booking.specialInstructions || booking.notes || booking.userNotes}"
              </p>
            </div>
          </div>
        )}

        {booking.status === 'CANCELLED' && (
          <div className="p-2 sm:p-2.5 rounded-md bg-amber-50 border border-amber-300 text-xs flex items-start gap-2 shadow-2xs">
            <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#780016] shrink-0 mt-0.5" />
            <div className="space-y-0.5 min-w-0">
              <span className="font-bold text-[#780016]">
                {booking.cancelledBy === 'USER' ? `Devotee Cancelled Appointment: ${devoteeName}` : 'Appointment Cancelled:'}
              </span>
              <p className="text-[11px] text-stone-800 leading-normal break-words">
                Reason: <strong className="text-stone-950 font-medium">"{booking.cancellationReason || 'Cancelled by devotee'}"</strong>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex flex-row md:flex-col lg:flex-row items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 w-full md:w-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails(booking)}
          className="flex-1 md:flex-initial gap-1.5 text-xs h-9 sm:h-10 px-3 sm:px-4 rounded-md border-stone-300 hover:border-amber-400 font-bold cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          Details
        </Button>

        {booking.status === 'PENDING' && (
          <>
            <Button
              size="sm"
              onClick={() => onAccept(booking.id)}
              disabled={isProcessing}
              className="flex-1 md:flex-initial gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white h-9 sm:h-10 px-4 rounded-md font-bold shadow-xs cursor-pointer puja-btn-tap"
            >
              <Check className="w-3.5 h-3.5" />
              Accept
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenReject(booking)}
              disabled={isProcessing}
              className="flex-1 md:flex-initial gap-1.5 text-xs text-red-700 hover:bg-red-50 border-red-200 h-9 sm:h-10 px-3.5 rounded-md font-bold cursor-pointer"
            >
              <Ban className="w-3.5 h-3.5" />
              Decline
            </Button>
          </>
        )}

        {booking.status === 'CONFIRMED' && (
          <Button
            size="sm"
            onClick={() => onComplete(booking)}
            disabled={isProcessing}
            className="flex-1 md:flex-initial gap-1.5 text-xs bg-[#780016] hover:bg-red-800 text-white border border-amber-400 h-9 sm:h-10 px-4 rounded-md font-bold shadow-xs cursor-pointer puja-btn-tap"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Mark Complete
          </Button>
        )}
      </div>
    </div>
  );
};

export default PriestBookingRow;

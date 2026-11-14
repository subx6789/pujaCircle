import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { bookingApi } from "@/api/booking.api";
import { Booking } from "@/types/booking.types";
import { PriestBookingRow } from "@/components/priest/PriestBookingRow";
import { PriestBookingDetailsDialog } from "@/components/priest/PriestBookingDetailsDialog";
import { CompleteBookingModal } from "@/components/priest/CompleteBookingModal";
import { CancelBookingDialog } from "@/components/booking/CancelBookingDialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BOOKING_STATUS_CONFIG } from "@/lib/constants";
import { Search, Calendar } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type TabFilter = "PENDING" | "CONFIRMED" | "COMPLETED" | "HISTORY";

/**
 * PriestBookingsPage
 * Purohit appointment roster with filterable tabs and direct booking actions.
 * 100% Flexbox, zero CSS grids, zero gradients, pure solid white canvas, Haldi gold trims.
 */
export const PriestBookingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const priestId = user?.id || '';

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<TabFilter>("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Dialog states
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [rejectBookingTarget, setRejectBookingTarget] =
    useState<Booking | null>(null);
  const [completeBookingTarget, setCompleteBookingTarget] =
    useState<Booking | null>(null);

  const fetchBookings = async () => {
    try {
      const data = await bookingApi.getPriestBookings(priestId);
      setBookings(data);
    } catch {
      toast.error("Failed to load appointments.");
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [priestId]);

  // Handlers
  const handleAccept = async (bookingId: string) => {
    setIsProcessing(true);
    try {
      const res = await bookingApi.acceptBooking(bookingId);
      if (res.success) {
        toast.success("Booking confirmed! Auspicious preparation begins.");
        fetchBookings();
      } else {
        toast.error(res.message || "Failed to accept booking.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectBookingTarget) return;
    setIsProcessing(true);
    try {
      const res = await bookingApi.rejectBooking(rejectBookingTarget.id, reason);
      if (res.success) {
        toast.success("Booking declined. Slot has been freed.");
        setRejectBookingTarget(null);
        fetchBookings();
      } else {
        toast.error(res.message || "Failed to decline booking.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteConfirm = async (completionCode: string) => {
    if (!completeBookingTarget) return;
    setIsProcessing(true);
    try {
      const res = await bookingApi.completeBooking(
        completeBookingTarget.id,
        completionCode
      );
      if (res.success) {
        toast.success("Puja marked as COMPLETED! Cash Dakshina verified.");
        setCompleteBookingTarget(null);
        fetchBookings();
      } else {
        toast.error(res.message || "Failed to mark completion.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter bookings by active status tab and search query
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === "PENDING" && b.status !== "PENDING") return false;
    if (activeTab === "CONFIRMED" && b.status !== "CONFIRMED") return false;
    if (activeTab === "COMPLETED" && b.status !== "COMPLETED") return false;
    if (
      activeTab === "HISTORY" &&
      !["CANCELLED", "REJECTED", "EXPIRED"].includes(b.status)
    )
      return false;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const refMatch = (b.bookingReference || b.id)
        .toLowerCase()
        .includes(query);
      const nameMatch = (b.serviceName || "").toLowerCase().includes(query);
      const userMatch = (b.user?.name || "").toLowerCase().includes(query);
      return refMatch || nameMatch || userMatch;
    }
    return true;
  });

  // Calculate status counts for tab badges
  const counts = {
    pending: bookings.filter((b) => b.status === "PENDING").length,
    confirmed: bookings.filter((b) => b.status === "CONFIRMED").length,
    completed: bookings.filter((b) => b.status === "COMPLETED").length,
    history: bookings.filter((b) =>
      ["CANCELLED", "REJECTED", "EXPIRED"].includes(b.status),
    ).length,
  };

  return (
    <div className="space-y-6 pb-12 w-full max-w-7xl text-stone-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl border-2 border-amber-300 bg-white shadow-sm">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-md bg-amber-400 text-stone-950 flex items-center justify-center font-serif font-black text-2xl shadow-md shrink-0 select-none">
            ॐ
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-stone-950">
              Ceremony Appointments
            </h1>
            <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
              Manage incoming requests, confirmed Shubh Muhurat schedules, and
              log ritual completions.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-4">
        <div className="overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as TabFilter)}
          >
            <TabsList className="inline-flex h-11 items-center justify-start rounded-md bg-white p-1 border-2 border-amber-300 min-w-max gap-1.5 shadow-xs">
              <TabsTrigger
                value="PENDING"
                className="text-xs px-4 py-2 h-9 gap-1.5 rounded-sm data-[state=active]:bg-[#780016] data-[state=active]:text-white font-bold transition-all"
              >
                <span>Pending</span>
                {counts.pending > 0 ? (
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-sm text-[10px] font-bold",
                      BOOKING_STATUS_CONFIG.PENDING.pillClass,
                    )}
                  >
                    {counts.pending}
                  </span>
                ) : null}
              </TabsTrigger>

              <TabsTrigger
                value="CONFIRMED"
                className="text-xs px-4 py-2 h-9 gap-1.5 rounded-sm data-[state=active]:bg-[#780016] data-[state=active]:text-white font-bold transition-all"
              >
                <span>Confirmed</span>
                {counts.confirmed > 0 ? (
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-sm text-[10px] font-bold",
                      BOOKING_STATUS_CONFIG.CONFIRMED.pillClass,
                    )}
                  >
                    {counts.confirmed}
                  </span>
                ) : null}
              </TabsTrigger>

              <TabsTrigger
                value="COMPLETED"
                className="text-xs px-4 py-2 h-9 gap-1.5 rounded-sm data-[state=active]:bg-[#780016] data-[state=active]:text-white font-bold transition-all"
              >
                <span>Completed</span>
                {counts.completed > 0 ? (
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-sm text-[10px] font-bold",
                      BOOKING_STATUS_CONFIG.COMPLETED.pillClass,
                    )}
                  >
                    {counts.completed}
                  </span>
                ) : null}
              </TabsTrigger>

              <TabsTrigger
                value="HISTORY"
                className="text-xs px-4 py-2 h-9 gap-1.5 rounded-sm data-[state=active]:bg-[#780016] data-[state=active]:text-white font-bold transition-all"
              >
                <span>Cancelled / Expired</span>
                {counts.history > 0 ? (
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-sm text-[10px] font-bold",
                      BOOKING_STATUS_CONFIG.CANCELLED.pillClass,
                    )}
                  >
                    {counts.history}
                  </span>
                ) : null}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            placeholder="Search by puja name, devotee name, or reference ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 text-xs h-11 rounded-md border-2 border-stone-200 focus:ring-amber-500 bg-white"
          />
        </div>
      </div>

      {/* Appointment List */}
      {filteredBookings.length > 0 ? (
        <div className="space-y-3.5">
          {filteredBookings.map((b) => (
            <PriestBookingRow
              key={b.id}
              booking={b}
              onViewDetails={(booking) => {
                setSelectedBooking(booking);
                setIsDetailsOpen(true);
              }}
              onAccept={handleAccept}
              onOpenReject={(booking) => setRejectBookingTarget(booking)}
              onComplete={(booking) => setCompleteBookingTarget(booking)}
              isProcessing={isProcessing}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-xl border-2 border-amber-300 bg-white space-y-3">
          <Calendar className="h-12 w-12 mx-auto text-amber-500/50" />
          <h3 className="text-base font-bold font-serif text-stone-900">
            No Appointments Found
          </h3>
          <p className="text-xs text-stone-600">
            {searchQuery
              ? "No appointments match your search criteria."
              : "No appointments in this category right now."}
          </p>
        </div>
      )}

      {/* Modals */}
      <PriestBookingDetailsDialog
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        booking={selectedBooking}
      />

      <CancelBookingDialog
        isOpen={!!rejectBookingTarget}
        onClose={() => setRejectBookingTarget(null)}
        onConfirm={handleRejectConfirm}
        bookingReference={
          rejectBookingTarget?.bookingReference || rejectBookingTarget?.id
        }
        isPriest={true}
      />

      <CompleteBookingModal
        isOpen={!!completeBookingTarget}
        onClose={() => setCompleteBookingTarget(null)}
        onConfirm={handleCompleteConfirm}
        booking={completeBookingTarget}
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default PriestBookingsPage;

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Booking } from "@/types/booking.types";
import { formatINR } from "@/lib/utils";
import { KeyRound, ShieldCheck, Banknote } from "lucide-react";

interface CompleteBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (completionCode: string) => Promise<void> | void;
  booking: Booking | null;
  isProcessing?: boolean;
}

export const CompleteBookingModal: React.FC<CompleteBookingModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  booking,
  isProcessing = false,
}) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setCode("");
      setError("");
    }
  }, [isOpen]);

  if (!booking) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim();
    if (cleanCode.length !== 4) {
      setError("Please enter a valid 4-digit verification code.");
      return;
    }
    setError("");
    onConfirm(cleanCode);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white border-2 border-amber-300">
        <form onSubmit={handleSubmit} className="w-full min-w-0 space-y-3 sm:space-y-4">
          <DialogHeader className="pr-10 sm:pr-12 text-left w-full min-w-0">
            <div className="flex items-center gap-2.5 min-w-0 w-full">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-md bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center shrink-0">
                <KeyRound className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-sm sm:text-base font-serif font-bold text-stone-900 leading-snug break-words">
                  Verify & Complete Ceremony
                </DialogTitle>
                <DialogDescription className="text-[11px] sm:text-xs text-stone-600 leading-normal break-words mt-0.5">
                  {booking.serviceName || "Puja Ceremony"} • Ref:{" "}
                  {booking.bookingReference || booking.id}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="w-full min-w-0 space-y-2.5 sm:space-y-3.5 py-0.5">
            {/* Dakshina notice */}
            <div className="w-full px-3 py-2 sm:p-3 rounded-md bg-amber-50 border border-amber-200 text-xs text-stone-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Banknote className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-medium text-xs">Cash Dakshina Due:</span>
              </div>
              <strong className="text-sm font-serif font-bold text-red-800 shrink-0">
                {formatINR(
                  booking.servicePrice || booking.dakshinaAmount || 2100,
                )}
              </strong>
            </div>

            {/* Input field */}
            <div className="w-full min-w-0 space-y-1 sm:space-y-1.5">
              <Label
                htmlFor="completionCode"
                className="text-xs font-bold text-stone-900"
              >
                Devotee 4-Digit Verification Code
              </Label>
              <p className="text-[10px] sm:text-[11px] text-stone-500 leading-tight">
                Ask the devotee for the code shown in their active booking screen.
              </p>
              <Input
                id="completionCode"
                type="text"
                inputMode="numeric"
                maxLength={4}
                autoFocus
                placeholder="••••"
                value={code}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setCode(val);
                  if (error) setError("");
                }}
                className="w-full text-center font-mono font-bold text-xl sm:text-2xl tracking-[0.4em] sm:tracking-[0.5em] h-10 sm:h-12 border-2 border-stone-300 bg-stone-50/50"
              />
              {error && (
                <p className="text-xs text-rose-600 font-medium">{error}</p>
              )}
            </div>

            <div className="w-full flex items-start gap-2 p-2 sm:p-2.5 rounded bg-stone-50 border border-stone-200 text-[10px] sm:text-[11px] text-stone-600">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span className="leading-snug">
                Entering this code confirms you have conducted the rituals and
                received the cash Dakshina from the devotee.
              </span>
            </div>
          </div>

          <DialogFooter className="w-full flex flex-row items-center justify-end gap-2 pt-2 border-t border-stone-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isProcessing}
              className="px-3.5 sm:px-4 text-xs h-9 shrink-0 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isProcessing || code.trim().length !== 4}
              className="flex-1 sm:flex-initial sm:w-auto text-xs font-bold bg-[#780016] hover:bg-red-800 text-white h-9 px-3 sm:px-4 cursor-pointer"
            >
              {isProcessing ? "Verifying..." : "Confirm Completion"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

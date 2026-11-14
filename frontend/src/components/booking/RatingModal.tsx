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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";

import { RatingInput } from "@/schemas/booking.schema";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  priestName?: string;
  serviceName?: string;
  initialRating?: number;
  initialReview?: string;
  onSubmit: (data: RatingInput) => Promise<void>;
  isLoading?: boolean;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  priestName = "Pandit Ji",
  serviceName = "Ceremony",
  initialRating = 0,
  initialReview = "",
  onSubmit,
  isLoading = false,
}) => {
  const [selectedRating, setSelectedRating] = useState<number>(initialRating || 0);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [review, setReview] = useState<string>(initialReview || "");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedRating(initialRating || 0);
      setHoverRating(null);
      setReview(initialReview || "");
    }
  }, [isOpen, bookingId, initialRating, initialReview]);

  const handleStarClick = (score: number) => {
    setSelectedRating(score);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId) return;
    if (!selectedRating || selectedRating < 1 || selectedRating > 5) {
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({
        bookingId,
        rating: selectedRating,
        review: review.trim(),
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="pr-10 sm:pr-12 text-center">
          <DialogTitle className="font-serif text-lg sm:text-xl">
            Rate Vedic Ceremony
          </DialogTitle>
          <DialogDescription className="text-xs">
            How was your experience with <strong>{priestName}</strong> for{" "}
            <em>{serviceName}</em>?
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleFormSubmit}
          className="space-y-4 pt-2 text-left"
        >
          {/* Star Rating Input */}
          <div className="flex flex-col items-center justify-center gap-2 py-2">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => {
                const currentScore = hoverRating !== null ? hoverRating : selectedRating;
                const isFilled = currentScore > 0 && currentScore >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleStarClick(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 rounded-md hover:scale-110 transition-transform focus:outline-hidden cursor-pointer"
                    aria-label={`${star} star`}
                  >
                    <Star
                      className={`h-8 w-8 ${
                        isFilled
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/40"
                      } transition-colors`}
                    />
                  </button>
                );
              })}
            </div>
            <span className="text-xs font-semibold text-foreground">
              {selectedRating === 5 && "Outstanding & Divine (5/5)"}
              {selectedRating === 4 && "Very Good (4/5)"}
              {selectedRating === 3 && "Satisfactory (3/5)"}
              {selectedRating === 2 && "Needs Improvement (2/5)"}
              {selectedRating === 1 && "Disappointing (1/5)"}
              {selectedRating === 0 && "Click a star to rate (1 to 5)"}
            </span>
          </div>

          {/* Manual Review Box */}
          <div className="space-y-1.5">
            <Label htmlFor="manual-review-input" className="text-xs font-medium">
              Review & Feedback (Write your experience manually)
            </Label>
            <Textarea
              id="manual-review-input"
              placeholder="Share details about punctuality, Vedic pronunciation, samagri guidance, etc."
              rows={4}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="text-xs resize-none"
            />
          </div>

          <DialogFooter className="pt-2 flex flex-row items-center gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isLoading || isSubmitting}
              className="flex-1 sm:flex-initial sm:w-auto text-xs h-9 px-4 rounded-md border border-amber-300 text-stone-800 hover:bg-amber-50 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || isSubmitting || !selectedRating || selectedRating < 1}
              className="flex-1 sm:flex-initial sm:w-auto text-xs font-bold bg-[#780016] hover:bg-[#600012] text-white h-9 px-6 rounded-md shadow-xs border border-amber-400 cursor-pointer disabled:opacity-50"
            >
              {isLoading || isSubmitting ? "Submitting..." : "Submit Review"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};


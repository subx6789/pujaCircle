import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Ban,
  ShieldCheck,
  Phone,
  Award,
  Star,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Calendar,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import { priestApi } from "@/api/priest.api";
import { adminApi } from "@/api/admin.api";
import { Priest, PriestApprovalStatus } from "@/types/priest.types";
import { Booking } from "@/types/booking.types";
import { formatDate, formatLocalityName } from "@/lib/utils";

/**
 * AdminPriestDetailsPage
 * Scholar dossier audit and administrative lifecycle management.
 * 100% Flexbox, zero CSS grids, zero gradients, pure solid white canvas, Haldi gold trims.
 */
export const AdminPriestDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [priest, setPriest] = useState<Priest | null>(null);
  const [priestBookings, setPriestBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal dialog states
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [reasonInput, setReasonInput] = useState("");

  useEffect(() => {
    async function loadPriestDossier() {
      if (!id) return;
      setIsLoading(true);
      try {
        const [priestData, allBookings] = await Promise.all([
          priestApi.getPriestById(id),
          adminApi.getAllBookings().catch(() => []),
        ]);

        if (priestData) {
          setPriest(priestData);
          if (Array.isArray(allBookings)) {
            const matched = allBookings.filter(
              (b) =>
                b.priestId === priestData.id ||
                b.priestId === priestData.userId ||
                b.priestId === id,
            );
            setPriestBookings(matched);
          }
        }
      } catch {
        toast.error("Failed to load priest profile.");
      } finally {
        setIsLoading(false);
      }
    }
    loadPriestDossier();
  }, [id]);

  if (isLoading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center bg-white text-xs text-stone-500 font-medium gap-2">
        <div className="w-8 h-8 rounded-full border-2 border-amber-600 border-t-transparent animate-spin" />
        <span>Loading Purohit scholar dossier...</span>
      </div>
    );
  }

  if (!priest) {
    return (
      <div className="container max-w-3xl py-12 space-y-6 text-stone-900">
        <Link
          to="/admin/priests"
          className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-red-700 font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Manage Priests
        </Link>
        <div className="text-center p-10 space-y-4 rounded-xl border-2 border-amber-300 bg-white shadow-sm">
          <div className="w-14 h-14 rounded-md bg-amber-100 flex items-center justify-center mx-auto text-amber-700 border border-amber-300">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold font-serif text-stone-900">
              Priest Record Not Found
            </h2>
            <p className="text-xs text-stone-600">
              No Vedic priest or applicant matches ID "{id}".
            </p>
          </div>
          <Link to="/admin/priests">
            <Button
              size="sm"
              className="text-xs mt-2 bg-[#780016] hover:bg-red-800 text-white font-bold rounded-md border border-amber-400 h-10 px-5"
            >
              Return to Priests Roster
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleApprove = async () => {
    const res = await adminApi.approvePriest(priest.id);
    if (res.success) {
      setPriest({
        ...priest,
        approvalStatus: "APPROVED",
        rejectionReason: undefined,
      });
      toast.success(res.message);
    } else {
      toast.error(res.message || "Failed to approve application.");
    }
  };

  const handleConfirmReject = async () => {
    if (!reasonInput.trim()) {
      toast.error("Please enter a rejection reason.");
      return;
    }
    const res = await adminApi.rejectPriest(priest.id, reasonInput.trim());
    if (res.success) {
      setPriest({
        ...priest,
        approvalStatus: "REJECTED",
        rejectionReason: reasonInput.trim(),
      });
      toast.success(res.message);
      setIsRejectDialogOpen(false);
      setReasonInput("");
    } else {
      toast.error(res.message || "Failed to reject application.");
    }
  };

  const handleConfirmBan = async () => {
    if (!reasonInput.trim()) {
      toast.error("Please enter a ban justification.");
      return;
    }
    const res = await adminApi.banPriest(priest.id, reasonInput.trim());
    if (res.success) {
      setPriest({
        ...priest,
        accountStatus: "BANNED",
        banReason: reasonInput.trim(),
      });
      toast.success(res.message);
      setIsBanDialogOpen(false);
      setReasonInput("");
    } else {
      toast.error(res.message || "Failed to ban priest.");
    }
  };

  const handleLiftBan = async () => {
    const res = await adminApi.unbanPriest(priest.id);
    if (res.success) {
      setPriest({ ...priest, accountStatus: "ACTIVE", banReason: undefined });
      toast.success(res.message);
    } else {
      toast.error(res.message || "Failed to unban priest.");
    }
  };

  const handleReopen = async () => {
    const res = await adminApi.reopenPriestApplication(priest.id);
    if (res.success) {
      setPriest({
        ...priest,
        approvalStatus: "PENDING",
        rejectionReason: undefined,
      });
      toast.success(res.message);
    } else {
      toast.error(res.message || "Failed to re-open application.");
    }
  };

  const handleConfirmDelete = async (reason?: string) => {
    try {
      const res = await adminApi.deletePriest(priest.id, reason);
      if (res.success) {
        toast.success(`Priest ${priest.fullName} record deleted permanently.`);
        setIsDeleteDialogOpen(false);
        navigate("/admin/priests");
      } else {
        toast.error(res.message || "Failed to delete priest profile.");
      }
    } catch {
      toast.error("Failed to delete priest profile.");
    }
  };

  const getStatusBadge = (
    approvalStatus: PriestApprovalStatus,
    accountStatus: string,
  ) => {
    return (
      <div className="flex items-center gap-1.5">
        {approvalStatus === "APPROVED" && accountStatus === "ACTIVE" && (
          <Badge className="bg-emerald-600 text-white text-xs px-3 py-1 gap-1 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved & Active
          </Badge>
        )}
        {approvalStatus === "PENDING" && (
          <Badge
            variant="outline"
            className="border-amber-400 text-amber-900 bg-amber-100 text-xs px-3 py-1 gap-1 font-bold"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
            Pending Review
          </Badge>
        )}
        {approvalStatus === "REJECTED" && (
          <Badge
            variant="destructive"
            className="text-xs px-3 py-1 gap-1 font-bold bg-rose-600"
          >
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </Badge>
        )}
        {accountStatus === "BANNED" && (
          <Badge
            variant="destructive"
            className="text-xs px-3 py-1 gap-1 font-bold bg-stone-800 text-white"
          >
            <Ban className="w-3.5 h-3.5" />
            Suspended / Banned
          </Badge>
        )}
      </div>
    );
  };

  const avatarSrc =
    priest.profileImageUrl ||
    (priest as any).avatarUrl ||
    (typeof window !== "undefined"
      ? localStorage.getItem(`priest_avatar_${priest.id}`) ||
        localStorage.getItem(`priest_avatar_${(priest as any).userId}`)
      : null);
  const ratingValue = Number(priest.rating || 0);

  return (
    <div className="container max-w-5xl py-4 sm:py-8 px-2 sm:px-6 space-y-4 sm:space-y-6 pb-16 text-stone-900">
      {/* Top Back Navigation */}
      <Link
        to="/admin/priests"
        className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-[#780016] font-bold transition-colors"
      >
        <ArrowLeft className="w-4 h-4 shrink-0" />
        <span>Back to Manage Priests Directory</span>
      </Link>

      {/* Main Scholar Header Profile Card */}
      <div className="border-2 border-amber-400 bg-white shadow-md rounded-xl sm:rounded-2xl overflow-hidden p-4 sm:p-7 relative">
        <div className="flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left justify-between gap-4 sm:gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-3.5 sm:gap-4 min-w-0 w-full sm:w-auto">
            <div className="relative shrink-0">
              <div className="relative block p-1 rounded-full ring-4 ring-amber-400 bg-amber-100 shadow-sm">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={priest.fullName}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-white shadow-xs shrink-0 bg-amber-50"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#780016] text-amber-300 border-2 border-white flex items-center justify-center font-bold text-xl sm:text-2xl font-serif shrink-0 shadow-xs">
                    {priest.fullName
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                )}
              </div>
              {priest.approvalStatus === "APPROVED" && (
                <div
                  className="absolute bottom-0 right-0 bg-emerald-600 text-white rounded-full p-1 border-2 border-white shadow-xs pointer-events-none"
                  title="Approved Vedic Scholar"
                >
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
              )}
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-3xl font-extrabold font-serif text-stone-950 wrap-break-word">
                  {priest.fullName}
                </h1>
                {getStatusBadge(priest.approvalStatus, priest.accountStatus)}
              </div>
              <p className="text-xs text-stone-600 font-medium">
                Title / Honorific:{" "}
                <span className="font-bold text-stone-900">
                  {priest.displayName || priest.fullName}
                </span>
              </p>
              <p className="text-[11px] text-stone-500 font-mono break-all">
                Scholar ID: {priest.id} • Registered:{" "}
                {new Date(priest.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto flex flex-col sm:flex-col justify-center items-center sm:items-end gap-2 text-xs">
            {ratingValue > 0 ? (
              <div className="flex items-center gap-1.5 font-bold text-amber-950 bg-amber-100 px-3 py-1 rounded-md border border-amber-300">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500 shrink-0" />
                <span>{ratingValue.toFixed(1)}</span>
                <span className="text-[11px] font-normal text-stone-600">
                  ({priest.reviewCount || 0} reviews)
                </span>
              </div>
            ) : (
              <span className="text-[11px] font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                ⭐ New Scholar (No ratings)
              </span>
            )}
            <span className="text-xs text-stone-700 font-bold">
              Vedic Experience: {priest.experienceYears} Years
            </span>
          </div>
        </div>
      </div>

      {/* Administrative Status Banner */}
      {(priest.accountStatus === "BANNED" ||
        priest.approvalStatus === "REJECTED" ||
        priest.approvalStatus === "PENDING") && (
        <div
          className={`p-5 rounded-xl border-2 flex items-start gap-3.5 ${
            priest.accountStatus === "BANNED"
              ? "border-rose-300 bg-rose-50/80 text-rose-950"
              : "border-amber-300 bg-amber-50/80 text-amber-950"
          }`}
        >
          <AlertTriangle
            className={`w-5 h-5 shrink-0 mt-0.5 ${
              priest.accountStatus === "BANNED"
                ? "text-rose-700"
                : "text-amber-700"
            }`}
          />
          <div className="space-y-1 text-xs">
            <p className="font-bold">
              Administrative Status ({priest.approvalStatus} /{" "}
              {priest.accountStatus})
            </p>
            <p className="text-stone-700">
              {priest.banReason ||
                priest.rejectionReason ||
                (priest.approvalStatus === "PENDING"
                  ? "Priest registration is currently awaiting verification council signoff."
                  : "No special administrative notes recorded.")}
            </p>
          </div>
        </div>
      )}

      {/* Quick Stats Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 w-full">
        <div className="p-3.5 sm:p-4 rounded-xl border-2 border-amber-300 bg-white shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Rituals Offered
          </span>
          <p className="text-xl sm:text-2xl font-bold font-serif text-stone-900 mt-1">
            {priest.services?.length || 0} Pujas
          </p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl border-2 border-amber-300 bg-white shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Assigned Bookings
          </span>
          <p className="text-xl sm:text-2xl font-bold font-serif text-stone-900 mt-1">
            {priestBookings.length}
          </p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl border-2 border-amber-300 bg-white shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Experience
          </span>
          <p className="text-xl sm:text-2xl font-bold font-serif text-stone-900 mt-1">
            {priest.experienceYears} Yrs
          </p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl border-2 border-amber-300 bg-white shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Primary Hub
          </span>
          <p className="text-sm sm:text-base font-bold font-serif text-stone-900 mt-1 sm:mt-2 truncate">
            {priest.city || "Kolkata"}
          </p>
        </div>
      </div>

      {/* Details Flexbox Deck */}
      <div className="flex flex-col md:flex-row gap-4 sm:gap-6 w-full">
        {/* Contact & Verification Info */}
        <div className="w-full md:w-1/2 border-2 border-amber-300 bg-white shadow-sm rounded-xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-amber-200">
            <Phone className="w-4 h-4 text-[#780016] shrink-0" />
            <h3 className="text-base font-serif font-bold text-stone-950">
              Contact & Direct Verification
            </h3>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between border-b pb-2 border-stone-100 gap-2">
              <span className="text-stone-600 font-medium">Mobile Phone:</span>
              <span className="font-mono font-bold text-stone-900 break-all">
                {priest.phoneNumber}
              </span>
            </div>
            <div className="flex items-center justify-between border-b pb-2 border-stone-100 gap-2">
              <span className="text-stone-600 font-medium">Email Address:</span>
              <span className="font-medium text-stone-900 break-all text-right">
                {priest.email || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between border-b pb-2 border-stone-100 gap-2">
              <span className="text-stone-600 font-medium">City & State:</span>
              <span className="font-bold text-stone-900 text-right">
                {priest.city}, {priest.state}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-stone-600 font-medium shrink-0">
                Service Localities:
              </span>
              <span className="font-medium text-stone-900 text-right truncate">
                {priest.serviceAreas
                  ?.map(formatLocalityName)
                  .filter(Boolean)
                  .join(", ") || priest.city}
              </span>
            </div>
          </div>
        </div>

        {/* Vedic Credentials & Lineage */}
        <div className="w-full md:w-1/2 border-2 border-amber-300 bg-white shadow-sm rounded-xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-amber-200">
            <Award className="w-4 h-4 text-amber-700 shrink-0" />
            <h3 className="text-base font-serif font-bold text-stone-950">
              Vedic Bio & Lineage
            </h3>
          </div>
          <div className="space-y-3 text-xs">
            <p className="text-stone-700 leading-relaxed font-medium">
              {priest.bio || "No detailed biographical notes provided."}
            </p>
            <div className="border-t border-stone-100 pt-2 space-y-1">
              <span className="text-stone-600 font-bold">
                Spoken Languages:
              </span>
              <p className="font-bold text-stone-900">
                {priest.languages?.join(", ") || "Bengali, Sanskrit, Hindi"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Offered Ceremonies & Shastric Dakshina Rates Card */}
      <div className="border-2 border-amber-400 bg-white shadow-sm rounded-xl p-3.5 sm:p-7 space-y-4">
        <div className="flex items-start gap-2.5 pb-3 border-b border-amber-200">
          <div className="h-8 w-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4 text-amber-700" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base font-serif font-bold text-stone-950 leading-snug wrap-break-word">
              Offered Ceremonies & Shastric Dakshina Rates (
              {priest.services?.length || 0})
            </h3>
            <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5 leading-relaxed">
              Active ritual offerings curated by this Purohit with transparent
              dakshina pricing.
            </p>
          </div>
        </div>

        {priest.services && priest.services.length > 0 ? (
          <div className="flex flex-col gap-3">
            {priest.services.map((service) => (
              <div
                key={service.id}
                className="p-4 rounded-xl border border-stone-200 hover:border-amber-400 bg-stone-50/50 hover:bg-amber-50/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-stone-950 text-sm">
                      {service.serviceName}
                    </span>
                    {service.category && (
                      <Badge className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-bold capitalize">
                        {service.category}
                      </Badge>
                    )}
                    {service.isActive ? (
                      <Badge className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                        Active
                      </Badge>
                    ) : (
                      <Badge className="text-[9px] bg-stone-200 text-stone-700 border border-stone-300 font-bold">
                        Paused
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                      {service.durationMinutes
                        ? `${service.durationMinutes} mins`
                        : "60 mins"}
                    </span>
                    {service.samagriList && service.samagriList.length > 0 && (
                      <span className="text-[11px] text-stone-500">
                        • {service.samagriList.length} samagri items specified
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-bold font-serif text-[#780016]">
                    ₹{Number(service.price || 0).toLocaleString("en-IN")}
                  </div>
                  <span className="text-[10px] text-stone-500 font-medium">
                    Direct Cash Dakshina
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-stone-500 bg-stone-50 rounded-lg border border-stone-200">
            No active ceremonies configured by this priest yet.
          </div>
        )}
      </div>

      {/* Ceremony Appointments & Track Record */}
      <div className="border-2 border-amber-400 bg-white shadow-sm rounded-xl p-3.5 sm:p-7 space-y-4">
        <div className="flex items-start gap-2.5 pb-3 border-b border-amber-200">
          <div className="h-8 w-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0 mt-0.5">
            <Calendar className="w-4 h-4 text-amber-700" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base font-serif font-bold text-stone-950 leading-snug wrap-break-word">
              Assigned Ceremony Appointments ({priestBookings.length})
            </h3>
            <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5 leading-relaxed">
              Family appointments, scheduled dates, and completion status.
            </p>
          </div>
        </div>

        {priestBookings.length > 0 ? (
          <div className="flex flex-col gap-3">
            {priestBookings.map((b) => (
              <div
                key={b.id}
                className="p-3.5 sm:p-4 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2">
                    <span className="font-serif font-bold text-stone-950 text-sm wrap-break-word">
                      {b.serviceName}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold shrink-0 ${
                        b.status === "CONFIRMED"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : b.status === "COMPLETED"
                            ? "bg-blue-50 text-blue-800 border-blue-300"
                            : b.status === "CANCELLED"
                              ? "bg-rose-50 text-rose-800 border-rose-300"
                              : "bg-amber-50 text-amber-800 border-amber-300"
                      }`}
                    >
                      {b.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-stone-600">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>
                        {b.bookingDate
                          ? formatDate(b.bookingDate)
                          : (b as any).scheduledDate
                            ? formatDate((b as any).scheduledDate)
                            : "—"}
                      </span>
                      {b.startTime && (
                        <span className="font-mono text-stone-700">
                          ({b.startTime} - {b.endTime})
                        </span>
                      )}
                    </span>
                    <span className="truncate">
                      Devotee:{" "}
                      <strong className="text-stone-800">
                        {b.userName || "Devotee"}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-200/80 shrink-0">
                  <div className="text-base sm:text-sm font-bold text-[#780016] font-serif">
                    ₹{Number(b.totalPrice || 0).toLocaleString("en-IN")}
                  </div>
                  <span className="text-[10px] text-stone-500 font-mono">
                    Ref: {b.bookingReference}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-stone-500 bg-stone-50 rounded-lg border border-stone-200">
            No booking appointments recorded for this scholar yet.
          </div>
        )}
      </div>

      {/* Administrative Decision Action Bar */}
      <div className="border-2 border-amber-400 bg-white shadow-sm rounded-xl p-4 sm:p-7 space-y-3">
        <div>
          <h3 className="text-base font-serif font-bold text-stone-950">
            Administrative Actions & Lifecycle Control
          </h3>
          <p className="text-xs text-stone-600">
            Manage application verification state, handle disciplinary
            suspensions, or permanently remove profile.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-amber-200">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
            {/* If PENDING: Approve / Reject */}
            {priest.approvalStatus === "PENDING" && (
              <>
                <Button
                  size="sm"
                  onClick={handleApprove}
                  className="w-full sm:w-auto text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-5 rounded-md gap-1.5 shadow-xs cursor-pointer puja-btn-tap"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve Application
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsRejectDialogOpen(true)}
                  className="w-full sm:w-auto text-xs text-red-700 hover:bg-red-50 border-red-200 font-bold h-10 px-4 rounded-md gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Application
                </Button>
              </>
            )}

            {/* If ACTIVE: Ban Option */}
            {priest.accountStatus === "ACTIVE" && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setIsBanDialogOpen(true)}
                className="w-full sm:w-auto text-xs h-10 px-4 rounded-md font-bold gap-1.5 cursor-pointer bg-rose-600 hover:bg-rose-700"
              >
                <Ban className="w-4 h-4" />
                Ban Priest Account
              </Button>
            )}

            {/* If BANNED: Lift Ban Option */}
            {priest.accountStatus === "BANNED" && (
              <Button
                size="sm"
                onClick={handleLiftBan}
                className="w-full sm:w-auto text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-5 rounded-md gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                Lift Ban & Reactivate
              </Button>
            )}

            {/* If REJECTED: Re-open */}
            {priest.approvalStatus === "REJECTED" && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleReopen}
                className="w-full sm:w-auto text-xs gap-1.5 h-10 px-4 rounded-md font-bold border-stone-300"
              >
                <RotateCcw className="w-4 h-4" />
                Re-open Application
              </Button>
            )}
          </div>

          {/* Delete Record Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="w-full sm:w-auto text-xs text-red-700 hover:bg-red-50 gap-1.5 h-10 px-3 rounded-md font-bold cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Delete Priest Profile
          </Button>
        </div>
      </div>

      {/* Reject Application Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-md p-4 sm:p-6 rounded-xl bg-white border-2 border-amber-300 shadow-xl">
          <DialogHeader className="pr-8 sm:pr-10 text-left">
            <DialogTitle className="text-base font-bold font-serif text-red-700">
              Reject Priest Application
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600">
              Provide a clear administrative reason for rejecting{" "}
              {priest.fullName}'s application.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label
              htmlFor="reject-reason"
              className="text-xs font-bold text-stone-800"
            >
              Rejection Justification
            </Label>
            <Textarea
              id="reject-reason"
              placeholder="e.g. Incomplete background certification / Inability to verify Gurukul credentials..."
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              className="text-xs min-h-24 rounded-md border-stone-300 focus:ring-amber-500 bg-white"
            />
          </div>

          <DialogFooter className="gap-2 flex flex-col-reverse sm:flex-row">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRejectDialogOpen(false)}
              className="text-xs rounded-md h-10 px-4 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmReject}
              className="text-xs rounded-md h-10 px-5 font-bold bg-red-700 hover:bg-red-800 text-white w-full sm:w-auto"
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban Account Dialog */}
      <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
        <DialogContent className="sm:max-w-md p-4 sm:p-6 rounded-xl bg-white border-2 border-amber-300 shadow-xl">
          <DialogHeader className="pr-8 sm:pr-10 text-left">
            <DialogTitle className="text-base font-bold font-serif text-red-700">
              Ban Priest Account
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600">
              Revoke platform access for {priest.fullName}. Please state the
              infraction or reason.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-red-800">
                <AlertTriangle className="w-3.5 h-3.5 text-red-700 shrink-0" />
                Automatic Cancellation & Email Notification:
              </p>
              <p className="text-[11px] leading-relaxed text-red-700">
                Banning this Purohit will <strong>automatically cancel all of their active and pending bookings</strong>, and an email notification explaining the ban reason will be sent to their registered email address.
              </p>
            </div>

            <div className="space-y-1">
              <Label
                htmlFor="ban-reason"
                className="text-xs font-bold text-stone-800"
              >
                Reason for Ban
              </Label>
              <Textarea
                id="ban-reason"
                placeholder="e.g. Multiple unannounced ritual cancellations / Infraction of platform conduct..."
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                className="text-xs min-h-24 rounded-md border-stone-300 focus:ring-amber-500 bg-white"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 flex flex-col-reverse sm:flex-row">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBanDialogOpen(false)}
              className="text-xs rounded-md h-10 px-4 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmBan}
              className="text-xs rounded-md h-10 px-5 font-bold bg-red-700 hover:bg-red-800 text-white w-full sm:w-auto"
            >
              Confirm Ban
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Record Confirmation Alert Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="p-6 rounded-lg bg-white border-2 border-amber-300 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold font-serif text-red-700 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Permanently Delete Priest Profile?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-stone-600 space-y-2">
              <p>
                Are you sure you want to permanently remove{" "}
                <span className="font-bold text-stone-900">
                  {priest.fullName}
                </span>{" "}
                from the platform roster?
              </p>
              <span className="block p-2.5 rounded bg-red-50 border border-red-200 text-[11px] text-red-800 font-semibold">
                ⚠️ All active and pending ceremony bookings will be automatically cancelled, and notification emails will be sent to the priest and all booked devotees. This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel className="text-xs rounded-md h-10 px-4">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleConfirmDelete()}
              className="bg-red-700 text-white hover:bg-red-800 text-xs rounded-md h-10 px-5 font-bold"
            >
              Delete Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPriestDetailsPage;

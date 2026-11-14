import React, { useState, useEffect } from "react";
import { adminApi } from "@/api/admin.api";
import { Priest, PriestApprovalStatus } from "@/types/priest.types";
import { PriestApprovalTable } from "@/components/admin/PriestApprovalTable";
import {
  RejectPriestDialog,
  BanPriestDialog,
  DeleteConfirmDialog,
} from "@/components/admin/PriestActionDialogs";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/common/EmptyState";
import { Search, UserCheck } from "lucide-react";
import { toast } from "sonner";

type StatusFilter = "ALL" | PriestApprovalStatus | "BANNED";

/**
 * AdminPriestsPage
 * Priest applications and scholar roster management for administrators.
 * 100% Flexbox, zero CSS grids, zero gradients, pure solid white canvas, Haldi gold trims.
 */
export const AdminPriestsPage: React.FC = () => {
  const [priests, setPriests] = useState<Priest[]>([]);
  const [activeTab, setActiveTab] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Dialog targets
  const [rejectTarget, setRejectTarget] = useState<Priest | null>(null);
  const [banTarget, setBanTarget] = useState<Priest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Priest | null>(null);

  const fetchPriests = async () => {
    try {
      const data = await adminApi.getAllPriests({ status: "ALL" });
      setPriests(data || []);
    } catch {
      toast.error("Failed to load priest roster.");
    }
  };

  useEffect(() => {
    fetchPriests();
  }, []);

  const handleApprove = async (priestId: string) => {
    setIsProcessing(true);
    try {
      const res = await adminApi.approvePriest(priestId);
      if (res.success) {
        toast.success(res.message);
        fetchPriests();
      } else {
        toast.error(res.message || "Failed to approve priest.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectTarget) return;
    const res = await adminApi.rejectPriest(rejectTarget.id, reason);
    if (res.success) {
      toast.success(res.message);
      fetchPriests();
    } else {
      toast.error(res.message || "Failed to reject application.");
    }
  };

  const handleBanConfirm = async (reason: string) => {
    if (!banTarget) return;
    const res = await adminApi.banPriest(banTarget.id, reason);
    if (res.success) {
      toast.success(res.message);
      fetchPriests();
    } else {
      toast.error(res.message || "Failed to ban priest.");
    }
  };

  const handleUnban = async (priestId: string) => {
    const res = await adminApi.reactivatePriest(priestId);
    if (res.success) {
      toast.success(res.message);
      fetchPriests();
    } else {
      toast.error(res.message || "Failed to reactivate priest.");
    }
  };

  const handleDeleteConfirm = async (reason?: string) => {
    if (!deleteTarget) return;
    try {
      const res = await adminApi.deletePriest(deleteTarget.id, reason);
      if (res.success) {
        toast.success(`Priest record for ${deleteTarget.fullName} permanently deleted.`);
        fetchPriests();
      } else {
        toast.error(res.message || "Failed to delete priest record.");
      }
    } catch {
      toast.error("Failed to delete priest record.");
    } finally {
      setDeleteTarget(null);
    }
  };

  // Status counts
  const pendingCount = priests.filter(
    (p) => p.approvalStatus === "PENDING",
  ).length;
  const approvedCount = priests.filter(
    (p) => p.approvalStatus === "APPROVED" && p.accountStatus !== "BANNED",
  ).length;
  const rejectedCount = priests.filter(
    (p) => p.approvalStatus === "REJECTED",
  ).length;
  const bannedCount = priests.filter(
    (p) => p.accountStatus === "BANNED",
  ).length;

  // Filter priests
  const filteredPriests = priests.filter((p) => {
    if (activeTab === "PENDING" && p.approvalStatus !== "PENDING") return false;
    if (
      activeTab === "APPROVED" &&
      (p.approvalStatus !== "APPROVED" || p.accountStatus === "BANNED")
    )
      return false;
    if (activeTab === "REJECTED" && p.approvalStatus !== "REJECTED")
      return false;
    if (activeTab === "BANNED" && p.accountStatus !== "BANNED") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.fullName?.toLowerCase().includes(q);
      const matchCity = p.city?.toLowerCase().includes(q);
      const matchPhone = p.phoneNumber?.toLowerCase().includes(q);
      const matchEmail = p.email?.toLowerCase().includes(q);
      return matchName || matchCity || matchPhone || matchEmail;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12 w-full max-w-7xl text-stone-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-xl border-2 border-amber-300 bg-white shadow-sm">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-md bg-amber-400 text-stone-950 flex items-center justify-center font-serif font-black text-2xl shadow-md shrink-0 select-none">
            ॐ
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-stone-950">
              Priest Applications & Directory
            </h1>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              Review onboarding requests, verify Gurukul credentials, and
              moderate Vedic scholar profiles.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="overflow-x-auto pb-1 max-w-full">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as StatusFilter)}
            className="w-full sm:w-auto min-w-max"
          >
            <TabsList className="inline-flex h-11 items-center justify-start rounded-md bg-white p-1 border-2 border-amber-300 min-w-max gap-1 shadow-xs">
              <TabsTrigger
                value="ALL"
                className="text-xs px-3.5 py-1.5 h-9 rounded-sm font-bold data-[state=active]:bg-[#780016] data-[state=active]:text-white transition-all"
              >
                All ({priests.length})
              </TabsTrigger>
              <TabsTrigger
                value="PENDING"
                className="text-xs px-3.5 py-1.5 h-9 rounded-sm font-bold data-[state=active]:bg-[#780016] data-[state=active]:text-white transition-all"
              >
                Pending ({pendingCount})
              </TabsTrigger>
              <TabsTrigger
                value="APPROVED"
                className="text-xs px-3.5 py-1.5 h-9 rounded-sm font-bold data-[state=active]:bg-[#780016] data-[state=active]:text-white transition-all"
              >
                Approved ({approvedCount})
              </TabsTrigger>
              <TabsTrigger
                value="REJECTED"
                className="text-xs px-3.5 py-1.5 h-9 rounded-sm font-bold data-[state=active]:bg-[#780016] data-[state=active]:text-white transition-all"
              >
                Rejected ({rejectedCount})
              </TabsTrigger>
              <TabsTrigger
                value="BANNED"
                className="text-xs px-3.5 py-1.5 h-9 rounded-sm font-bold data-[state=active]:bg-[#780016] data-[state=active]:text-white transition-all"
              >
                Banned ({bannedCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            placeholder="Search by name, city, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 text-xs h-11 rounded-md border-2 border-stone-200 focus:ring-amber-500 bg-white"
          />
        </div>
      </div>

      {/* Main Table or Empty State */}
      {filteredPriests.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title={
            activeTab === "PENDING"
              ? "No pending applications"
              : "No priests match the selected filter"
          }
          description="Try adjusting your search criteria or switching status tabs."
        />
      ) : (
        <div className="rounded-xl border-2 border-amber-300 bg-white shadow-sm overflow-hidden">
          <PriestApprovalTable
            priests={filteredPriests}
            onApprove={handleApprove}
            onOpenReject={(p) => setRejectTarget(p)}
            onOpenBan={(p) => setBanTarget(p)}
            onUnban={handleUnban}
            onOpenDelete={(p) => setDeleteTarget(p)}
            isProcessing={isProcessing}
          />
        </div>
      )}

      {/* Action Dialogs */}
      <RejectPriestDialog
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        priest={rejectTarget}
        onConfirm={handleRejectConfirm}
      />

      <BanPriestDialog
        isOpen={!!banTarget}
        onClose={() => setBanTarget(null)}
        priest={banTarget}
        onConfirm={handleBanConfirm}
      />

      <DeleteConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={`Delete Record for ${deleteTarget?.fullName}?`}
        description={`This will permanently remove ${deleteTarget?.fullName} from the platform. All active and pending ceremony bookings will be automatically cancelled, and a notification email will be sent to the priest.`}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default AdminPriestsPage;

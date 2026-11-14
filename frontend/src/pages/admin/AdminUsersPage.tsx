import React, { useState, useEffect } from "react";
import { adminApi } from "@/api/admin.api";
import {
  UserManagementTable,
  DevoteeRecord,
} from "@/components/admin/UserManagementTable";
import { SuspendUserDialog } from "@/components/admin/UserActionDialogs";
import { DeleteConfirmDialog } from "@/components/admin/PriestActionDialogs";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/common/EmptyState";
import { Search, Users, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";

type DevoteeFilter = "ALL" | "ACTIVE" | "SUSPENDED";

/**
 * AdminUsersPage
 * Devotee registry management and account moderation for platform administrators.
 * 100% Flexbox, zero CSS grids, zero gradients, pure solid white canvas, Haldi gold trims.
 */
export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<DevoteeRecord[]>([]);
  const [activeTab, setActiveTab] = useState<DevoteeFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog targets
  const [suspendTarget, setSuspendTarget] = useState<DevoteeRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DevoteeRecord | null>(null);

  const fetchUsers = async () => {
    try {
      const userList = await adminApi.getAllUsers();
      setUsers(
        (userList || []).map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phoneNumber: u.phoneNumber,
          avatarUrl: u.avatarUrl,
          status:
            u.accountStatus === "BANNED" || u.status === "BANNED"
              ? "SUSPENDED"
              : "ACTIVE",
          bookingCount: u.bookingCount || 0,
          createdAt: u.createdAt || "2026-01-15",
          banReason: u.banReason,
        })),
      );
    } catch {
      toast.error("Failed to load devotee directory.");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSuspendConfirm = async (reason: string) => {
    if (!suspendTarget) return;
    const res = await adminApi.suspendUser(suspendTarget.id, reason);
    if (res.success) {
      toast.success(`Account for ${suspendTarget.name} suspended.`);
      fetchUsers();
    } else {
      toast.error(res.message || "Failed to suspend account.");
    }
  };

  const handleReactivate = async (userId: string, name: string) => {
    const res = await adminApi.unsuspendUser(userId);
    if (res.success) {
      toast.success(`Account for ${name} reactivated.`);
      fetchUsers();
    } else {
      toast.error(res.message || "Failed to reactivate.");
    }
  };

  const handleDeleteConfirm = async (reason?: string) => {
    if (!deleteTarget) return;
    try {
      const res = await adminApi.deleteUser(deleteTarget.id, reason);
      if (res.success) {
        toast.success(`User account for ${deleteTarget.name} deleted permanently.`);
        fetchUsers();
      } else {
        toast.error(res.message || "Failed to delete user account.");
      }
    } catch {
      toast.error("Failed to delete user account.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const activeCount = users.filter((u) => u.status === "ACTIVE").length;
  const suspendedCount = users.filter((u) => u.status === "SUSPENDED").length;

  const filteredUsers = users.filter((u) => {
    if (activeTab === "ACTIVE" && u.status !== "ACTIVE") return false;
    if (activeTab === "SUSPENDED" && u.status !== "SUSPENDED") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = u.name?.toLowerCase().includes(q);
      const matchEmail = u.email?.toLowerCase().includes(q);
      const matchPhone = u.phoneNumber?.toLowerCase().includes(q);
      return matchName || matchEmail || matchPhone;
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
              Devotee Accounts Directory
            </h1>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              Platform registered user accounts, ceremony booking history, and
              account moderation.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row (100% Flexbox, Zero CSS Grids) */}
      <div className="flex flex-wrap gap-4 w-full">
        <div className="w-full sm:w-[calc(33.333%-11px)] p-5 border-2 border-amber-300 border-t-4 border-t-red-700 bg-white shadow-xs rounded-lg flex flex-col justify-between">
          <div className="flex flex-row items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
              Total Devotees
            </span>
            <div className="h-8 w-8 rounded-md bg-red-100 text-red-700 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-serif text-stone-900 mt-2">
            {users.length}
          </div>
        </div>

        <div className="w-full sm:w-[calc(33.333%-11px)] p-5 border-2 border-amber-300 border-t-4 border-t-emerald-600 bg-white shadow-xs rounded-lg flex flex-col justify-between">
          <div className="flex flex-row items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
              Active Profiles
            </span>
            <div className="h-8 w-8 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-serif text-emerald-700 mt-2">
            {activeCount}
          </div>
        </div>

        <div className="w-full sm:w-[calc(33.333%-11px)] p-5 border-2 border-amber-300 border-t-4 border-t-stone-700 bg-white shadow-xs rounded-lg flex flex-col justify-between">
          <div className="flex flex-row items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
              Suspended
            </span>
            <div className="h-8 w-8 rounded-md bg-stone-200 text-stone-700 flex items-center justify-center font-bold">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-serif text-stone-800 mt-2">
            {suspendedCount}
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as DevoteeFilter)}
        >
          <TabsList className="inline-flex h-11 items-center justify-start rounded-md bg-white p-1 border-2 border-amber-300 min-w-max gap-1 shadow-xs">
            <TabsTrigger
              value="ALL"
              className="text-xs px-4 py-2 rounded-sm font-bold data-[state=active]:bg-[#780016] data-[state=active]:text-white transition-all cursor-pointer"
            >
              All ({users.length})
            </TabsTrigger>
            <TabsTrigger
              value="ACTIVE"
              className="text-xs px-4 py-2 rounded-sm font-bold data-[state=active]:bg-[#780016] data-[state=active]:text-white transition-all cursor-pointer"
            >
              Active ({activeCount})
            </TabsTrigger>
            <TabsTrigger
              value="SUSPENDED"
              className="text-xs px-4 py-2 rounded-sm font-bold data-[state=active]:bg-[#780016] data-[state=active]:text-white transition-all cursor-pointer"
            >
              Suspended ({suspendedCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            placeholder="Search by devotee name, email, or mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 text-xs h-11 rounded-md border-2 border-stone-200 focus:ring-amber-500 bg-white"
          />
        </div>
      </div>

      {/* Table Container */}
      {filteredUsers.length > 0 ? (
        <UserManagementTable
          users={filteredUsers}
          onOpenSuspend={(u) => setSuspendTarget(u)}
          onReactivate={handleReactivate}
          onOpenDelete={(u) => setDeleteTarget(u)}
        />
      ) : (
        <EmptyState
          icon={Users}
          title="No Devotees Found"
          description={
            searchQuery
              ? "No profiles match your search criteria."
              : "No profiles in this category."
          }
        />
      )}

      {/* Suspend User Dialog */}
      <SuspendUserDialog
        isOpen={!!suspendTarget}
        onClose={() => setSuspendTarget(null)}
        onConfirm={handleSuspendConfirm}
        user={suspendTarget}
      />

      {/* Delete User Dialog */}
      <DeleteConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Devotee Account"
        description={`Are you sure you want to permanently delete the profile of ${deleteTarget?.name}? All active and pending ceremony bookings will be automatically cancelled on the priest side, and a notification email will be sent to the devotee.`}
      />
    </div>
  );
};

export default AdminUsersPage;

import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { userApi } from "@/api/user.api";
import { addressApi } from "@/api/address.api";
import { bookingApi } from "@/api/booking.api";
import {
  updateUserProfileSchema,
  changePasswordSchema,
} from "@/schemas/user.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Calendar,
  Lock,
  KeyRound,
  Save,
  ChevronRight,
  BookOpen,
  Camera,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

/**
 * ProfilePage
 * Devotee spiritual profile, verified contacts, and security credentials.
 * 100% Flexbox, pure solid white canvas, radiant Haldi gold trims, deep vermilion accents.
 */
export const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuthStore();

  const devoteeId = user?.id || "user-devotee-1";

  const [addressCount, setAddressCount] = useState<number>(0);
  const [bookingCount, setBookingCount] = useState<number>(0);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    return user?.avatarUrl || localStorage.getItem(`devotee_avatar_${devoteeId}`) || null;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState<string>(
    user?.name || "Devotee",
  );
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);

  const email = user?.email || "devotee@pujacircle.com";
  const phoneNumber = user?.phoneNumber || "+91 9876543210";

  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState<boolean>(false);

  useEffect(() => {
    if (user?.name) {
      setFullName(user.name);
    }
    const currentAvatar = user?.avatarUrl || localStorage.getItem(`devotee_avatar_${devoteeId}`);
    if (currentAvatar) {
      setAvatarUrl(currentAvatar);
      if (user && !user.avatarUrl) {
        setUser({ ...user, avatarUrl: currentAvatar });
      }
    }
  }, [user, devoteeId]);

  useEffect(() => {
    async function loadDevoteeStats() {
      try {
        const [addrList, bookList] = await Promise.all([
          addressApi.getAddresses(devoteeId),
          bookingApi.getBookings(devoteeId),
        ]);
        setAddressCount(addrList ? addrList.length : 0);
        setBookingCount(bookList ? bookList.length : 0);
      } catch {
        setAddressCount(0);
        setBookingCount(0);
      }
    }

    loadDevoteeStats();
  }, [devoteeId]);

  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "DV";

  const memberSince = (user as any)?.createdAt
    ? new Date((user as any).createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "January 2026";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      setAvatarUrl(dataUrl);
      localStorage.setItem(`devotee_avatar_${devoteeId}`, dataUrl);
      if (user) {
        setUser({ ...user, avatarUrl: dataUrl });
      }
      try {
        const res = await userApi.updateProfile(devoteeId, { avatarUrl: dataUrl });
        const finalUrl = res?.data?.avatarUrl || dataUrl;
        setAvatarUrl(finalUrl);
        localStorage.setItem(`devotee_avatar_${devoteeId}`, finalUrl);
        if (user) {
          setUser({ ...user, avatarUrl: finalUrl });
        }
        toast.success("Sacred profile photo updated successfully!");
      } catch (err) {
        console.warn("Devotee avatar sync notice:", err);
        toast.error("Failed to update profile photo.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = async () => {
    setAvatarUrl(null);
    localStorage.removeItem(`devotee_avatar_${devoteeId}`);
    if (user) {
      setUser({ ...user, avatarUrl: undefined });
    }
    try {
      await userApi.updateProfile(devoteeId, { avatarUrl: "" });
    } catch (err) {
      console.warn("Devotee avatar remove notice:", err);
    }
    toast.success("Profile picture removed successfully.");
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const parseResult = updateUserProfileSchema.safeParse({
      fullName: fullName.trim(),
      email: email.trim(),
    });

    if (!parseResult.success) {
      toast.error(
        parseResult.error.errors[0]?.message || "Invalid profile information.",
      );
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await userApi.updateProfile(devoteeId, { name: parseResult.data.fullName });

      if (res.success && res.data) {
        setUser({
          ...user!,
          name: res.data.name,
        });
        toast.success("Your profile name has been updated successfully!");
      } else {
        toast.error(res.message || "Failed to update profile.");
      }
    } catch {
      toast.error("An error occurred while updating profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const parseResult = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!parseResult.success) {
      toast.error(
        parseResult.error.errors[0]?.message || "Invalid password format.",
      );
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await userApi.changePassword({
        currentPassword: parseResult.data.currentPassword,
        newPassword: parseResult.data.newPassword,
        confirmPassword: parseResult.data.confirmPassword,
      });

      if (res.success) {
        toast.success("Password changed successfully. Your account is secure.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(res.message || "Failed to update password.");
      }
    } catch {
      toast.error("Error updating password. Please try again.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="w-full text-stone-900 py-6 sm:py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Hidden File Input for Avatar */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
        />

        {/* Top Header & Quick Links (100% Flexbox Responsive) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 p-5 sm:p-7 rounded-xl border-2 border-amber-300 bg-white shadow-sm">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold">
              <span className="text-sm font-serif font-black leading-none">
                ॐ
              </span>
              <span>Devotee Sanctuary Profile</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-stone-950">
              Devotee Settings
            </h1>
            <p className="text-xs sm:text-sm text-stone-600">
              Manage your personal information, verified communication channels,
              and security credentials.
            </p>
          </div>

          {/* Quick Action Navigation Links - Fully Responsive */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto shrink-0">
            <Link to="/user/addresses" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto border-stone-300 hover:border-amber-400 hover:bg-amber-50 h-11 px-4 text-xs font-bold rounded-md shadow-2xs transition-all flex items-center justify-center cursor-pointer"
              >
                <MapPin className="w-4 h-4 mr-1.5 text-amber-600" />
                <span>Manage Addresses</span>
              </Button>
            </Link>
            <Link to="/user/bookings" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-[#780016] hover:bg-red-800 text-white border border-amber-400 h-11 px-4 text-xs font-bold rounded-md shadow-xs transition-all flex items-center justify-center cursor-pointer">
                <BookOpen className="w-4 h-4 mr-1.5 text-amber-300" />
                <span>Puja Bookings</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Hero User Profile Card (Pure White, Zero Gradients, Zero Blurs) */}
        <div className="rounded-xl border-2 border-amber-300 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 w-full">
            {/* Clickable Avatar to Change Photo */}
              <div className="flex flex-col items-center sm:items-start gap-2 shrink-0">
                <div className="relative group shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative block p-1 rounded-full ring-4 ring-amber-400 bg-amber-100 shadow-sm focus:outline-none focus:ring-offset-2 focus:ring-offset-white transition-transform hover:scale-105 cursor-pointer"
                    title="Click to choose a new profile photo"
                  >
                    <Avatar className="w-24 h-24 sm:w-20 sm:h-20 border-2 border-white">
                      {avatarUrl ? (
                        <AvatarImage
                          src={avatarUrl}
                          alt={fullName}
                          className="object-cover"
                        />
                      ) : null}
                      <AvatarFallback className="bg-[#780016] text-white font-serif text-2xl font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    {/* Camera Overlay on Hover */}
                    <div className="absolute inset-1 rounded-full bg-stone-950/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-5 h-5 mb-0.5" />
                      <span className="text-[9px] font-bold tracking-wide uppercase">
                        Change
                      </span>
                    </div>
                  </button>

                  <div
                    className="absolute bottom-0 right-0 bg-emerald-600 text-white rounded-full p-1 border-2 border-white shadow-xs pointer-events-none"
                    title="Active Devotee"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                </div>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="text-[11px] text-stone-500 hover:text-red-700 font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                    title="Remove custom profile photo"
                  >
                    <Trash2 className="w-3 h-3 text-red-600" />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>

              {/* Devotee Info */}
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold font-serif text-stone-950">
                    {fullName}
                  </h2>
                  <Badge className="bg-[#780016] text-white border border-amber-400 text-xs font-bold">
                    Devotee
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-emerald-500 text-emerald-800 bg-emerald-50 text-xs font-bold"
                  >
                    Active
                  </Badge>
                </div>

                {/* Contact Badges */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 text-xs text-stone-600 pt-1">
                  <div
                    className="flex items-center gap-1.5 bg-stone-100 px-2.5 py-1 rounded-sm border border-stone-200"
                    title="Registered Mobile"
                  >
                    <Phone className="w-3.5 h-3.5 text-amber-600" />
                    <span className="font-mono font-bold text-stone-900">
                      {phoneNumber}
                    </span>
                  </div>

                  <div
                    className="flex items-center gap-1.5 bg-stone-100 px-2.5 py-1 rounded-sm border border-stone-200"
                    title="Verified Email"
                  >
                    <Mail className="w-3.5 h-3.5 text-amber-600" />
                    <span className="font-medium text-stone-900">{email}</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 ml-0.5" />
                  </div>
                </div>

                <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-stone-500 pt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    Devotee since {memberSince}
                  </span>
                </div>
              </div>
            </div>

            {/* Devotee Quick Stats Row (100% Flexbox, Zero CSS Grids) */}
          <div className="flex flex-col sm:flex-row items-stretch justify-between gap-3 pt-6 mt-6 border-t border-amber-200">
            <div className="flex-1 p-4 rounded-lg bg-white border-2 border-amber-200 shadow-xs flex flex-col justify-center">
              <span className="text-xs text-stone-600 flex items-center gap-1 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-red-700" />
                Ceremonies Booked
              </span>
              <span className="text-2xl font-bold font-serif text-stone-900 mt-1">
                {bookingCount}
              </span>
            </div>

            <div className="flex-1 p-4 rounded-lg bg-white border-2 border-amber-200 shadow-xs flex flex-col justify-center">
              <span className="text-xs text-stone-600 flex items-center gap-1 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                Saved Addresses
              </span>
              <span className="text-2xl font-bold font-serif text-stone-900 mt-1">
                {addressCount}
              </span>
            </div>

            <div className="flex-1 p-4 rounded-lg bg-white border-2 border-amber-200 shadow-xs flex flex-col justify-center">
              <span className="text-xs text-stone-600 flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Devotee Trust Status
              </span>
              <span className="text-base font-bold text-emerald-700 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Verified
                Member
              </span>
            </div>
          </div>
        </div>

        {/* Main Tabs Section */}
        <Tabs defaultValue="personal" className="w-full space-y-6">
          <TabsList className="flex items-center gap-2 w-full sm:max-w-sm bg-white p-1.5 border-2 border-amber-300 rounded-md shadow-xs">
            <TabsTrigger
              value="personal"
              className="flex-1 text-xs sm:text-sm font-bold data-[state=active]:bg-[#780016] data-[state=active]:text-white rounded-sm data-[state=active]:shadow-sm transition-all"
            >
              <User className="w-4 h-4 mr-1.5 hidden sm:inline-block" />
              Personal Details
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex-1 text-xs sm:text-sm font-bold data-[state=active]:bg-[#780016] data-[state=active]:text-white rounded-sm data-[state=active]:shadow-sm transition-all"
            >
              <KeyRound className="w-4 h-4 mr-1.5 hidden sm:inline-block" />
              Security & Credentials
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Personal Details */}
          <TabsContent
            value="personal"
            className="space-y-6 focus-visible:outline-none"
          >
            <div className="rounded-xl border-2 border-amber-300 bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-900">
                  Personal Information
                </h3>
                <p className="text-xs text-stone-600">
                  Your primary profile details used during ritual bookings and
                  Purohit coordination.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="flex flex-col md:flex-row items-stretch gap-6 w-full">
                  {/* Full Name */}
                  <div className="flex-1 space-y-2">
                    <Label
                      htmlFor="fullName"
                      className="text-xs font-bold uppercase tracking-wider text-stone-700"
                    >
                      Full Name <span className="text-red-700">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Aditi Sharma"
                        className="pl-10 h-11 rounded-md border-stone-300 focus:ring-amber-500 bg-white text-xs font-medium text-stone-900"
                        required
                      />
                    </div>
                  </div>

                  {/* Email Address (Read-Only) */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                        Email Address
                      </Label>
                      <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />{" "}
                        Verified
                      </span>
                    </div>
                    <div className="p-3.5 bg-stone-100 rounded-md border border-stone-200 text-sm text-stone-700 font-medium flex items-center justify-between cursor-not-allowed">
                      <span>{email}</span>
                      <Lock className="w-4 h-4 text-stone-400" />
                    </div>
                  </div>
                </div>

                {/* Phone Number (Read-Only) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                      Primary Mobile Number
                    </Label>
                    <span className="text-[11px] text-stone-500 font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3 text-stone-400" /> Registered
                    </span>
                  </div>
                  <div className="p-3.5 bg-stone-100 rounded-md border border-stone-200 text-sm font-mono font-bold text-stone-900 flex items-center justify-between cursor-not-allowed">
                    <span>{phoneNumber}</span>
                    <Lock className="w-4 h-4 text-stone-400" />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-4 border-t border-stone-200">
                  <Button
                    type="submit"
                    disabled={isSavingProfile}
                    className="bg-[#780016] hover:bg-red-800 text-white font-bold border border-amber-400 w-full sm:w-auto h-10 px-6 text-xs rounded-md shadow-xs cursor-pointer puja-btn-tap flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {isSavingProfile
                        ? "Saving Changes..."
                        : "Save Name Changes"}
                    </span>
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>

          {/* TAB 2: Security & Passwords */}
          <TabsContent
            value="security"
            className="space-y-6 focus-visible:outline-none"
          >
            <div className="rounded-xl border-2 border-amber-300 bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-900">
                  Security & Credentials
                </h3>
                <p className="text-xs text-stone-600">
                  Update your account password and review device authentication
                  protection.
                </p>
              </div>

              <form
                onSubmit={handleUpdatePassword}
                className="space-y-5 max-w-xl"
              >
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="currentPassword"
                      className="text-xs font-bold text-stone-800"
                    >
                      Current Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="pl-3.5 pr-10 h-10 rounded-md border-stone-300 focus:ring-amber-500 bg-white text-xs"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-700 cursor-pointer"
                        aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="newPassword"
                      className="text-xs font-bold text-stone-800"
                    >
                      New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-3.5 pr-10 h-10 rounded-md border-stone-300 focus:ring-amber-500 bg-white text-xs"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-700 cursor-pointer"
                        aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-stone-500">
                      Must be at least 8 characters long with uppercase,
                      lowercase, and special characters.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-xs font-bold text-stone-800"
                    >
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-3.5 pr-10 h-10 rounded-md border-stone-300 focus:ring-amber-500 bg-white text-xs"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-700 cursor-pointer"
                        aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-50/70 rounded-md border border-amber-300 space-y-1.5 text-xs text-stone-700">
                  <div className="flex items-center gap-2 font-bold text-stone-900">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Account Credential Protection
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    All credentials are encrypted with bank-grade security
                    protocols. You will remain logged in on this device after
                    updating.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="bg-[#780016] hover:bg-red-800 text-white font-bold border border-amber-400 w-full sm:w-auto h-11 px-6 text-xs rounded-md shadow-xs cursor-pointer puja-btn-tap"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {isUpdatingPassword
                    ? "Updating Password..."
                    : "Update Password"}
                </Button>
              </form>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Navigation Cards (100% Flexbox) */}
        <div className="flex flex-col sm:flex-row items-stretch gap-4 pt-2 w-full">
          <Link to="/user/addresses" className="flex-1 group">
            <div className="p-6 rounded-xl border-2 border-amber-300 hover:border-amber-500 bg-white shadow-xs hover:shadow-md transition-all flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-md bg-amber-100 text-amber-800 border border-amber-300 group-hover:scale-105 transition-transform">
                  <MapPin className="w-6 h-6 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-bold font-serif text-base text-stone-900 group-hover:text-red-700 transition-colors">
                    Manage Puja Locations
                  </h3>
                  <p className="text-xs text-stone-600">
                    {addressCount} saved location{addressCount !== 1 ? "s" : ""}{" "}
                    for home ceremonies
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-red-700 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          <Link to="/user/bookings" className="flex-1 group">
            <div className="p-6 rounded-xl border-2 border-amber-300 hover:border-amber-500 bg-white shadow-xs hover:shadow-md transition-all flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-md bg-red-100 text-red-800 border border-red-200 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-6 h-6 text-red-700" />
                </div>
                <div>
                  <h3 className="font-bold font-serif text-base text-stone-900 group-hover:text-red-700 transition-colors">
                    Ceremony Bookings & History
                  </h3>
                  <p className="text-xs text-stone-600">
                    {bookingCount} past & upcoming Vedic ritual
                    {bookingCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-red-700 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

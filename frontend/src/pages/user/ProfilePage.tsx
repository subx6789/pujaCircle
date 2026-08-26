import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Lock,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Sparkles,
  Bell,
  Save,
  Eye,
  EyeOff,
  Flame,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuthStore } from '@/store/auth.store';
import { userApi } from '@/api/user.api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/*
  PAGE: Devotee Profile Settings (/profile & /user/profile)
  
  ACCESS:
  - Devotees (USER role only)
  
  PURPOSE:
  - Displays devotee account information (Name, Verified Mobile (+91), Verified Email, Primary City).
  - Quick statistics (Total Bookings, Saved Addresses, Account Status).
  - Profile editing with mock API persistence and instant Zustand store synchronization.
  - Password update form with validation.
  - Ritual notification & auspicious reminder preferences.
  - Quick navigation shortcuts (Manage Addresses, Booking History, Book New Puja).
*/

const CITIES = [
  'Mumbai',
  'Bengaluru',
  'Kolkata',
  'Delhi NCR',
  'Pune',
  'Chennai',
  'Hyderabad',
  'Varanasi',
];

const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuthStore();

  // Loading & stats state
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    bookingCount: 0,
    addressCount: 0,
  });

  // Personal Info Form states
  const [fullName, setFullName] = useState(user?.name || 'Demo User');
  const [email, setEmail] = useState(user?.email || 'user@example.demo');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '+919876543210');
  const [primaryCity, setPrimaryCity] = useState('Mumbai');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Security / Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Preferences states
  const [smsReminders, setSmsReminders] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [panchangUpdates, setPanchangUpdates] = useState(true);
  const [emailReceipts, setEmailReceipts] = useState(true);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  // Load profile and stats from mock API on mount
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const [profile, devoteeStats] = await Promise.all([
          userApi.getProfile(user.id),
          userApi.getStats(user.id),
        ]);

        if (profile) {
          setFullName(profile.name || user.name || '');
          setEmail(profile.email || user.email || '');
          setPhoneNumber(profile.phoneNumber || user.phoneNumber || '');
          if (profile.primaryCity) setPrimaryCity(profile.primaryCity);
        }

        setStats({
          bookingCount: devoteeStats.bookingCount,
          addressCount: devoteeStats.addressCount,
        });
      } catch (err) {
        console.error('Failed to load profile details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  // Handle Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const updated = await userApi.updateProfile(user?.id || 'user-devotee-1', {
        name: fullName.trim(),
        email: email.trim(),
        primaryCity,
      });

      if (user) {
        setUser({
          ...user,
          name: updated.name,
          email: updated.email,
        });
      }

      toast.success('Devotee profile updated successfully!');
    } catch {
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Update Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error('Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await userApi.changePassword(user?.id || 'user-devotee-1', {
        currentPassword,
        newPassword,
      });

      if (res.success) {
        toast.success(res.message);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Failed to change password. Please verify current password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Handle Save Preferences
  const handleSavePreferences = async () => {
    setIsSavingPreferences(true);
    try {
      await userApi.updateProfile(user?.id || 'user-devotee-1', {
        preferences: {
          smsReminders,
          whatsappAlerts,
          panchangUpdates,
          emailReceipts,
        },
      });
      toast.success('Ritual reminder preferences saved!');
    } catch {
      toast.error('Failed to save preferences.');
    } finally {
      setIsSavingPreferences(false);
    }
  };

  // Format initial letters for avatar
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || 'DV';
  };

  if (isLoading && !user) {
    return (
      <div className="container max-w-4xl py-16 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Loading devotee profile...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      {/* 1. SACRED HERO / PROFILE OVERVIEW HEADER */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-brand-ivory/50 to-primary/5 p-6 sm:p-8 shadow-sm">
        {/* Background Vedic Decorative Glow */}
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Devotee Avatar Ring */}
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-maroon to-primary text-2xl font-bold text-white shadow-md ring-4 ring-primary/20">
              {getInitials(fullName)}
              <div className="absolute -bottom-1 -right-1 rounded-full bg-background p-1 shadow-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold font-serif text-foreground">
                  {fullName}
                </h1>
                <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-medium">
                  <Sparkles className="h-3 w-3 mr-1 text-primary" /> Devotee
                </Badge>
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                  Active
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Manage your sacred ritual appointments, verified contacts, and security.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-primary" />
                  {phoneNumber}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  {email}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {primaryCity}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Link to Bookings / Addresses */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Link to="/user/addresses" className="flex-1 sm:flex-initial">
              <Button variant="outline" size="sm" className="w-full gap-1.5 border-border/80 hover:border-primary/50">
                <MapPin className="h-4 w-4 text-primary" /> Saved Addresses
              </Button>
            </Link>
            <Link to="/user/bookings" className="flex-1 sm:flex-initial">
              <Button variant="outline" size="sm" className="w-full gap-1.5 border-border/80 hover:border-primary/50">
                <Calendar className="h-4 w-4 text-primary" /> My Bookings
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/60 hover:border-primary/30 transition-colors shadow-xs">
          <CardContent className="p-4 sm:p-5 flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Bookings</p>
              <h4 className="text-xl font-bold tracking-tight text-foreground">{stats.bookingCount}</h4>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 hover:border-primary/30 transition-colors shadow-xs">
          <CardContent className="p-4 sm:p-5 flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Saved Addresses</p>
              <h4 className="text-xl font-bold tracking-tight text-foreground">{stats.addressCount}</h4>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 hover:border-primary/30 transition-colors shadow-xs">
          <CardContent className="p-4 sm:p-5 flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Mobile Phone</p>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
                +91 Verified
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 hover:border-primary/30 transition-colors shadow-xs">
          <CardContent className="p-4 sm:p-5 flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Account Standing</p>
              <span className="inline-flex items-center text-xs font-semibold text-primary">
                Good Karma
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. STRUCTURED TABS INTERFACE */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md bg-muted/70 p-1">
          <TabsTrigger value="details" className="gap-2">
            <User className="h-4 w-4" /> Personal
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="h-4 w-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Bell className="h-4 w-4" /> Ritual Alerts
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PERSONAL DETAILS */}
        <TabsContent value="details">
          <Card className="border-border/80 shadow-sm">
            <form onSubmit={handleSaveProfile}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-serif">Devotee Information</CardTitle>
                    <CardDescription>
                      Update your display name, registered contact details, and default city.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="border-primary/30 text-primary">
                    Sacred Profile
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-xs font-semibold">
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Aditi Sharma"
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>

                  {/* Primary / Preferred City */}
                  <div className="space-y-2">
                    <Label htmlFor="primaryCity" className="text-xs font-semibold">
                      Primary Puja City
                    </Label>
                    <Select value={primaryCity} onValueChange={setPrimaryCity}>
                      <SelectTrigger id="primaryCity">
                        <SelectValue placeholder="Select City" />
                      </SelectTrigger>
                      <SelectContent>
                        {CITIES.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Phone Number (+91 Verified - Locked) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="phoneNumber" className="text-xs font-semibold">
                        Registered Mobile Number
                      </Label>
                      <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> OTP Verified
                      </span>
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phoneNumber"
                        value={phoneNumber}
                        readOnly
                        disabled
                        className="pl-9 bg-muted/40 cursor-not-allowed text-muted-foreground font-mono text-xs"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Mobile numbers are OTP verified for authentic ritual bookings and cannot be changed directly.
                    </p>
                  </div>

                  {/* Email Address */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email" className="text-xs font-semibold">
                        Email Address
                      </Label>
                      <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Verified
                      </span>
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Notice Banner */}
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3.5 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                  <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p>
                    Your contact details are shared only with the verified purohit assigned to your confirmed puja appointments.
                  </p>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between border-t bg-muted/20 px-6 py-4">
                <p className="text-xs text-muted-foreground">
                  Changes sync immediately with your active session.
                </p>
                <Button type="submit" disabled={isSavingProfile} className="gap-2">
                  {isSavingProfile ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Save Profile
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* TAB 2: SECURITY & PASSWORD */}
        <TabsContent value="security">
          <Card className="border-border/80 shadow-sm">
            <form onSubmit={handleUpdatePassword}>
              <CardHeader>
                <CardTitle className="text-lg font-serif">Security & Password</CardTitle>
                <CardDescription>
                  Ensure your devotee account is protected with a secure password.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="max-w-md space-y-4">
                  {/* Current Password */}
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-xs font-semibold">
                      Current Password <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password (Demo: User@123)"
                        className="pl-9 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-xs font-semibold">
                      New Password <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="pl-9 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-xs font-semibold">
                      Confirm New Password <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="pl-9 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/40 border text-xs text-muted-foreground space-y-1.5">
                  <p className="font-semibold text-foreground">Password Security Guidelines:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Use at least 6 characters with a combination of letters and numbers.</li>
                    <li>Never share your credentials or OTPs with anyone.</li>
                  </ul>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between border-t bg-muted/20 px-6 py-4">
                <p className="text-xs text-muted-foreground">
                  Update regularly for optimal account safety.
                </p>
                <Button type="submit" disabled={isUpdatingPassword} className="gap-2">
                  {isUpdatingPassword ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" /> Updating...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" /> Update Password
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* TAB 3: RITUAL NOTIFICATION PREFERENCES */}
        <TabsContent value="preferences">
          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-serif">Ritual & Notification Preferences</CardTitle>
              <CardDescription>
                Customize how and when you receive auspicious reminders, booking confirmations, and Panchang updates.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-4">
                {/* 1. SMS Reminders */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-border/70 bg-card hover:bg-muted/20 transition-colors">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-foreground">Puja Appointment Reminders (SMS)</p>
                    <p className="text-xs text-muted-foreground">
                      Receive an automated SMS reminder 24 hours and 2 hours before your scheduled ritual.
                    </p>
                  </div>
                  <Switch checked={smsReminders} onCheckedChange={setSmsReminders} />
                </div>

                {/* 2. WhatsApp Updates */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-border/70 bg-card hover:bg-muted/20 transition-colors">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-foreground">WhatsApp Purohit Updates & Samagri List</p>
                    <p className="text-xs text-muted-foreground">
                      Get real-time booking confirmation and priest arrival status on WhatsApp.
                    </p>
                  </div>
                  <Switch checked={whatsappAlerts} onCheckedChange={setWhatsappAlerts} />
                </div>

                {/* 3. Panchang & Muhurat */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-border/70 bg-card hover:bg-muted/20 transition-colors">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-foreground">Vedic Panchang & Auspicious Muhurat Alerts</p>
                    <p className="text-xs text-muted-foreground">
                      Receive notifications for Ekadashi, Purnima, Amavasya, and major auspicious Tithis.
                    </p>
                  </div>
                  <Switch checked={panchangUpdates} onCheckedChange={setPanchangUpdates} />
                </div>

                {/* 4. Digital Receipts */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-border/70 bg-card hover:bg-muted/20 transition-colors">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-foreground">Dakshina Receipts & Invoices by Email</p>
                    <p className="text-xs text-muted-foreground">
                      Automatically receive a digital receipt of completed ritual bookings at your email.
                    </p>
                  </div>
                  <Switch checked={emailReceipts} onCheckedChange={setEmailReceipts} />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between border-t bg-muted/20 px-6 py-4">
              <p className="text-xs text-muted-foreground">
                You can change these notification settings anytime.
              </p>
              <Button onClick={handleSavePreferences} disabled={isSavingPreferences} className="gap-2">
                {isSavingPreferences ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save Preferences
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 4. QUICK HELP & NAVIGATION FOOTER */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-xl border border-border/60 bg-muted/30 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>Need to update your sacred ceremony address or location?</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/user/addresses" className="font-semibold text-primary hover:underline flex items-center gap-1">
            Manage Addresses <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

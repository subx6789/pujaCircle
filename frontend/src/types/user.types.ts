import { Role } from './auth.types';

export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export interface UserPreferences {
  smsReminders?: boolean;
  whatsappAlerts?: boolean;
  panchangUpdates?: boolean;
  emailReceipts?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  role: Role;
  status?: UserStatus;
  primaryCity?: string;
  addressSummary?: string;
  bookingCount?: number;
  createdAt?: string;
  preferences?: UserPreferences;
}

export interface UpdateUserProfileRequest {
  name?: string;
  email?: string;
  phoneNumber?: string;
  status?: UserStatus;
  primaryCity?: string;
  preferences?: UserPreferences;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

import { UserProfile, UpdateUserProfileRequest, ChangePasswordRequest } from '@/types/user.types';
import { mockUsers, mockBookings, mockAddresses } from '@/mocks/db';
import { delay } from '@/mocks/delay';

export const userApi = {
  getProfile: async (userId = 'user-devotee-1'): Promise<UserProfile> => {
    await delay(200);
    const user = mockUsers.find((u) => u.id === userId);
    if (!user) {
      // Fallback for default devotee
      const fallback = mockUsers[0];
      return {
        id: fallback.id,
        name: fallback.name,
        phoneNumber: fallback.phoneNumber,
        email: fallback.email,
        role: fallback.role,
        status: fallback.status || 'ACTIVE',
        primaryCity: fallback.primaryCity || 'Mumbai',
        createdAt: fallback.createdAt || '2026-01-15T00:00:00.000Z',
        bookingCount: mockBookings.filter((b) => b.userId === fallback.id).length,
      };
    }

    const userBookings = mockBookings.filter((b) => b.userId === user.id);

    return {
      id: user.id,
      name: user.name,
      phoneNumber: user.phoneNumber,
      email: user.email,
      role: user.role,
      status: user.status || 'ACTIVE',
      primaryCity: user.primaryCity || 'Mumbai',
      bookingCount: userBookings.length,
      createdAt: user.createdAt || '2026-01-15T00:00:00.000Z',
    };
  },

  updateProfile: async (userId: string, data: UpdateUserProfileRequest): Promise<UserProfile> => {
    await delay(300);
    const index = mockUsers.findIndex((u) => u.id === userId);
    if (index === -1) {
      throw new Error('User not found in mock database.');
    }

    mockUsers[index] = {
      ...mockUsers[index],
      name: data.name ?? mockUsers[index].name,
      email: data.email ?? mockUsers[index].email,
      phoneNumber: data.phoneNumber ?? mockUsers[index].phoneNumber,
      primaryCity: data.primaryCity ?? mockUsers[index].primaryCity,
      status: data.status ?? mockUsers[index].status,
    };

    const user = mockUsers[index];
    const userBookings = mockBookings.filter((b) => b.userId === user.id);

    return {
      id: user.id,
      name: user.name,
      phoneNumber: user.phoneNumber,
      email: user.email,
      role: user.role,
      status: user.status || 'ACTIVE',
      primaryCity: user.primaryCity || 'Mumbai',
      bookingCount: userBookings.length,
      createdAt: user.createdAt || '2026-01-15T00:00:00.000Z',
      preferences: data.preferences,
    };
  },

  changePassword: async (userId: string, data: ChangePasswordRequest): Promise<{ success: boolean; message: string }> => {
    await delay(350);
    const user = mockUsers.find((u) => u.id === userId);
    if (!user) {
      return { success: false, message: 'User account not found.' };
    }

    if (user.password && user.password !== data.currentPassword) {
      return { success: false, message: 'Current password does not match.' };
    }

    user.password = data.newPassword;
    return { success: true, message: 'Password updated successfully!' };
  },

  getStats: async (userId: string) => {
    await delay(150);
    const bookingCount = mockBookings.filter((b) => b.userId === userId).length;
    const addressCount = mockAddresses.filter((a) => a.userId === userId).length;
    return {
      bookingCount,
      addressCount,
    };
  },
};

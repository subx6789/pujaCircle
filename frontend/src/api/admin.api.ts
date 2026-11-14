import { Priest, PriestFilterParams } from '@/types/priest.types';
import { Booking } from '@/types/booking.types';
import { apiClient } from '@/api/client';
import { logAppError, getUserFriendlyErrorMessage } from '@/lib/errorHandler';

/**
 * Admin API (Frontend Layer)
 * Connected directly to live backend (/api/v1/admin)
 */
export const adminApi = {
  // Priest Management
  getAllPriests: async (params?: PriestFilterParams): Promise<Priest[]> => {
    try {
      const res = await apiClient.get('/admin/priests', { params });
      return (res as any).data || res;
    } catch (error) {
      logAppError('adminApi.getAllPriests', error, { params });
      return [];
    }
  },

  getPendingPriests: async (): Promise<Priest[]> => {
    try {
      const res = await apiClient.get('/admin/priests/pending');
      return (res as any).data || res;
    } catch (error) {
      logAppError('adminApi.getPendingPriests', error);
      return [];
    }
  },

  approvePriest: async (priestId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await apiClient.post(`/admin/priests/${priestId}/approve`);
      return res as any;
    } catch (error) {
      logAppError('adminApi.approvePriest', error, { priestId });
      return {
        success: false,
        message: getUserFriendlyErrorMessage(error, 'Failed to approve priest application.'),
      };
    }
  },

  rejectPriest: async (priestId: string, reason?: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await apiClient.post(`/admin/priests/${priestId}/reject`, { reason });
      return res as any;
    } catch (error) {
      logAppError('adminApi.rejectPriest', error, { priestId, reason });
      return {
        success: false,
        message: getUserFriendlyErrorMessage(error, 'Failed to reject priest application.'),
      };
    }
  },

  banPriest: async (priestId: string, reason?: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await apiClient.post(`/admin/priests/${priestId}/ban`, { reason });
      return res as any;
    } catch (error) {
      logAppError('adminApi.banPriest', error, { priestId, reason });
      return {
        success: false,
        message: getUserFriendlyErrorMessage(error, 'Failed to suspend priest account.'),
      };
    }
  },

  reactivatePriest: async (priestId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await apiClient.post(`/admin/priests/${priestId}/unban`);
      return res as any;
    } catch (error) {
      logAppError('adminApi.reactivatePriest', error, { priestId });
      return {
        success: false,
        message: getUserFriendlyErrorMessage(error, 'Failed to reactivate priest account.'),
      };
    }
  },

  unbanPriest: async (priestId: string): Promise<{ success: boolean; message: string }> => {
    return adminApi.reactivatePriest(priestId);
  },

  reopenPriestApplication: async (priestId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await apiClient.post(`/admin/priests/${priestId}/reopen`);
      return res as any;
    } catch (error) {
      logAppError('adminApi.reopenPriestApplication', error, { priestId });
      return {
        success: false,
        message: getUserFriendlyErrorMessage(error, 'Failed to reopen priest application.'),
      };
    }
  },

  deletePriest: async (priestId: string, reason?: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await apiClient.delete(`/admin/priests/${priestId}`, {
        data: reason ? { reason } : undefined,
      });
      return res as any;
    } catch (error) {
      logAppError('adminApi.deletePriest', error, { priestId, reason });
      return {
        success: false,
        message: getUserFriendlyErrorMessage(error, 'Failed to delete priest record.'),
      };
    }
  },

  // Devotee / User Management
  getAllUsers: async (): Promise<any[]> => {
    try {
      const res = await apiClient.get('/admin/users');
      return (res as any).data || res;
    } catch (error) {
      logAppError('adminApi.getAllUsers', error);
      return [];
    }
  },

  getUserById: async (userId: string): Promise<any> => {
    try {
      const res = await apiClient.get(`/admin/users/${userId}`);
      return (res as any).data || res;
    } catch (error) {
      logAppError('adminApi.getUserById', error, { userId });
      return null;
    }
  },

  suspendUser: async (userId: string, reason?: string) => {
    try {
      const res = await apiClient.post(`/admin/users/${userId}/suspend`, { reason });
      return res as any;
    } catch (error) {
      logAppError('adminApi.suspendUser', error, { userId, reason });
      return {
        success: false,
        message: getUserFriendlyErrorMessage(error, 'Failed to suspend user.'),
      };
    }
  },

  unsuspendUser: async (userId: string) => {
    try {
      const res = await apiClient.post(`/admin/users/${userId}/unsuspend`);
      return res as any;
    } catch (error) {
      logAppError('adminApi.unsuspendUser', error, { userId });
      return {
        success: false,
        message: getUserFriendlyErrorMessage(error, 'Failed to unsuspend user.'),
      };
    }
  },

  deleteUser: async (userId: string, reason?: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await apiClient.delete(`/admin/users/${userId}`, {
        data: reason ? { reason } : undefined,
      });
      return res as any;
    } catch (error) {
      logAppError('adminApi.deleteUser', error, { userId, reason });
      return {
        success: false,
        message: getUserFriendlyErrorMessage(error, 'Failed to delete user account.'),
      };
    }
  },

  // Admin Profile Settings
  updateAdminProfile: async (data: { name?: string; avatarUrl?: string | null }): Promise<{ success: boolean; message: string; data?: any }> => {
    try {
      const res = await apiClient.put('/admin/profile', data);
      return res as any;
    } catch (error) {
      logAppError('adminApi.updateAdminProfile', error, data);
      return {
        success: false,
        message: getUserFriendlyErrorMessage(error, 'Failed to update administrator profile.'),
      };
    }
  },

  updateAdminPassword: async (data: { currentPassword?: string; newPassword: string; confirmPassword: string }): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await apiClient.post('/admin/change-password', data);
      return res as any;
    } catch (error) {
      logAppError('adminApi.updateAdminPassword', error);
      return {
        success: false,
        message: getUserFriendlyErrorMessage(error, 'Failed to update administrator password.'),
      };
    }
  },

  // Platform Bookings
  getAllBookings: async (): Promise<Booking[]> => {
    try {
      const res = await apiClient.get('/admin/bookings');
      return (res as any).data || res;
    } catch (error) {
      logAppError('adminApi.getAllBookings', error);
      return [];
    }
  },

  getDashboardStats: async (): Promise<any> => {
    try {
      const res = await apiClient.get('/admin/dashboard/stats');
      return (res as any).data || res;
    } catch (error) {
      logAppError('adminApi.getDashboardStats', error);
      return null;
    }
  },
};

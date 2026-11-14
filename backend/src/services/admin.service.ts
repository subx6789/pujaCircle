import { count, eq, sql, desc, and, or, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/db/index.js';
import { users, priestProfiles, bookings, addresses } from '@/models/index.js';
import { AppError } from '@/utils/AppError.js';
import { getPagination } from '@/utils/pagination.js';
import { cloudinaryService } from '@/services/cloudinary.service.js';
import { cloudinary } from '@/config/cloudinary.js';
import { brevoEmailService } from '@/services/email.service.js';

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalPriests: number;
  approvedPriests: number;
  pendingPriests: number;
  totalBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  revenueEstimate: number;
}

/**
 * [SERVICE] Admin Service
 * Handles platform KPIs, priest approval lifecycle, user moderation, and booking monitoring.
 */
export class AdminService {
  /**
   * Aggregate platform KPIs and statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const [
      [userStats],
      [priestStats],
      [bookingStats],
    ] = await Promise.all([
      db.select({
        totalUsers: sql<number>`count(*) filter (where ${users.role} = 'USER')`,
        activeUsers: sql<number>`count(*) filter (where ${users.role} = 'USER' and ${users.accountStatus} = 'ACTIVE')`,
      }).from(users),
      db.select({
        totalPriests: sql<number>`count(*)`,
        approvedPriests: sql<number>`count(*) filter (where ${priestProfiles.approvalStatus} = 'APPROVED')`,
        pendingPriests: sql<number>`count(*) filter (where ${priestProfiles.approvalStatus} = 'PENDING')`,
      }).from(priestProfiles),
      db.select({
        totalBookings: sql<number>`count(*)`,
        confirmedBookings: sql<number>`count(*) filter (where ${bookings.status} = 'CONFIRMED')`,
        completedBookings: sql<number>`count(*) filter (where ${bookings.status} = 'COMPLETED')`,
        revenueEstimate: sql<number>`coalesce(sum(case when ${bookings.status} = 'COMPLETED' then ${bookings.totalPrice} else 0 end), 0)`,
      }).from(bookings),
    ]);

    return {
      totalUsers: Number(userStats?.totalUsers ?? 0),
      activeUsers: Number(userStats?.activeUsers ?? 0),
      totalPriests: Number(priestStats?.totalPriests ?? 0),
      approvedPriests: Number(priestStats?.approvedPriests ?? 0),
      pendingPriests: Number(priestStats?.pendingPriests ?? 0),
      totalBookings: Number(bookingStats?.totalBookings ?? 0),
      confirmedBookings: Number(bookingStats?.confirmedBookings ?? 0),
      completedBookings: Number(bookingStats?.completedBookings ?? 0),
      revenueEstimate: Number(bookingStats?.revenueEstimate ?? 0),
    };
  }

  // Get all priests joined with user information with optional pagination
  async getAllPriests(pagination?: { page?: number; limit?: number }): Promise<any[]> {
    let query = db
      .select({
        id: priestProfiles.id,
        userId: users.id,
        fullName: users.name,
        displayName: users.name,
        phoneNumber: users.phoneNumber,
        email: users.email,
        approvalStatus: priestProfiles.approvalStatus,
        accountStatus: users.accountStatus,
        banReason: users.banReason,
        rejectionReason: priestProfiles.rejectionReason,
        experienceYears: priestProfiles.experienceYears,
        bio: priestProfiles.bio,
        languages: priestProfiles.languages,
        serviceAreas: priestProfiles.serviceAreas,
        city: priestProfiles.city,
        state: priestProfiles.state,
        profileImageUrl: sql<string | null>`NULLIF(${priestProfiles.profileImageUrl}, '')`,
        avatarUrl: sql<string | null>`COALESCE(NULLIF(${users.avatarUrl}, ''), NULLIF(${priestProfiles.profileImageUrl}, ''))`,
        rating: priestProfiles.rating,
        reviewCount: priestProfiles.reviewCount,
        completedPujas: sql<number>`COALESCE((
          SELECT COUNT(*)::int
          FROM ${bookings}
          WHERE ${bookings.priestId} = ${priestProfiles.id}
            AND ${bookings.status} = 'COMPLETED'
        ), 0)`.mapWith(Number),
        createdAt: priestProfiles.createdAt,
      })
      .from(priestProfiles)
      .innerJoin(users, eq(priestProfiles.userId, users.id));

    if (pagination?.page || pagination?.limit) {
      const { limit, offset } = getPagination(pagination);
      query = query.limit(limit).offset(offset) as any;
    }

    const records = await query;

    return records.map((p) => ({
      ...p,
      isPhoneVerified: true,
      rating: Number(p.rating || 0),
      completedPujas: Number(p.completedPujas || 0),
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
    }));
  }

  // Query pending priest registration applications directly from database
  async getPendingPriests(): Promise<any[]> {
    const records = await db
      .select({
        id: priestProfiles.id,
        userId: users.id,
        fullName: users.name,
        phoneNumber: users.phoneNumber,
        email: users.email,
        approvalStatus: priestProfiles.approvalStatus,
        accountStatus: users.accountStatus,
        experienceYears: priestProfiles.experienceYears,
        bio: priestProfiles.bio,
        languages: priestProfiles.languages,
        serviceAreas: priestProfiles.serviceAreas,
        city: priestProfiles.city,
        state: priestProfiles.state,
        pincode: priestProfiles.pincode,
        profileImageUrl: sql<string | null>`NULLIF(${priestProfiles.profileImageUrl}, '')`,
        avatarUrl: sql<string | null>`COALESCE(NULLIF(${users.avatarUrl}, ''), NULLIF(${priestProfiles.profileImageUrl}, ''))`,
        rating: priestProfiles.rating,
        reviewCount: priestProfiles.reviewCount,
        defaultStartTime: priestProfiles.defaultStartTime,
        defaultEndTime: priestProfiles.defaultEndTime,
        createdAt: priestProfiles.createdAt,
      })
      .from(priestProfiles)
      .innerJoin(users, eq(priestProfiles.userId, users.id))
      .where(eq(priestProfiles.approvalStatus, 'PENDING'));

    return records.map((p) => ({
      ...p,
      isPhoneVerified: true,
      rating: Number(p.rating || 0),
      completedPujas: 0,
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
    }));
  }

  /**
   * Approve a pending priest onboarding application
   */
  async approvePriest(priestId: string): Promise<void> {
    await db
      .update(priestProfiles)
      .set({ approvalStatus: 'APPROVED', rejectionReason: null })
      .where(eq(priestProfiles.id, priestId));
  }

  /**
   * Reject a pending priest onboarding application with an audit reason
   */
  async rejectPriest(priestId: string, reason?: string): Promise<void> {
    await db
      .update(priestProfiles)
      .set({
        approvalStatus: 'REJECTED',
        rejectionReason: reason || 'Application declined by administrator',
      })
      .where(eq(priestProfiles.id, priestId));
  }

  /**
   * Reopen a rejected priest application for reconsideration
   */
  async reopenPriestApplication(priestId: string): Promise<void> {
    await db
      .update(priestProfiles)
      .set({ approvalStatus: 'PENDING', rejectionReason: null })
      .where(eq(priestProfiles.id, priestId));
  }

  /**
   * Ban priest account by priestProfile id.
   * Automatically cancels all active/pending bookings and dispatches a notification email to the priest.
   */
  async banPriest(priestId: string, reason?: string): Promise<void> {
    const [priest] = await db
      .select({
        id: priestProfiles.id,
        userId: priestProfiles.userId,
      })
      .from(priestProfiles)
      .where(eq(priestProfiles.id, priestId))
      .limit(1);

    if (!priest) {
      throw new AppError(404, 'Priest record not found.');
    }

    const [priestUser] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, priest.userId))
      .limit(1);

    const banReason = reason?.trim() || 'Suspended by platform administrator';

    // 1. Cancel all active/pending ceremony bookings associated with this priest
    const activeBookings = await db
      .select({
        id: bookings.id,
        bookingReference: bookings.bookingReference,
        serviceName: bookings.serviceName,
        bookingDate: bookings.bookingDate,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        userId: bookings.userId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .where(
        and(
          eq(bookings.priestId, priest.id),
          inArray(bookings.status, ['PENDING', 'CONFIRMED'])
        )
      );

    if (activeBookings.length > 0) {
      await db
        .update(bookings)
        .set({
          status: 'CANCELLED',
          cancelledBy: 'ADMIN',
          cancelledAt: new Date(),
          cancellationReason: `Cancelled by platform administrator due to Purohit account ban: ${banReason}`,
        })
        .where(
          and(
            eq(bookings.priestId, priest.id),
            inArray(bookings.status, ['PENDING', 'CONFIRMED'])
          )
        );

      // Notify all affected devotees that their ceremony has been cancelled
      for (const b of activeBookings) {
        if (b.userEmail) {
          await brevoEmailService
            .sendBookingCancelledDueToPriestStatusEmail({
              userEmail: b.userEmail,
              userName: b.userName || 'Devotee',
              bookingReference: b.bookingReference || b.id,
              serviceName: b.serviceName || 'Puja Ceremony',
              bookingDate: b.bookingDate ? String(b.bookingDate) : 'Scheduled Date',
              slotTime: b.startTime && b.endTime ? `${b.startTime} - ${b.endTime}` : 'Scheduled Muhurat',
              priestName: priestUser?.name || 'Assigned Purohit',
              action: 'BANNED',
              reason: banReason,
            })
            .catch((err) => {
              console.warn(`[AdminService] Failed to notify devotee ${b.userEmail} of priest ban:`, err);
            });
        }
      }
    }

    // 2. Update priest's user record to BANNED status
    await db
      .update(users)
      .set({
        accountStatus: 'BANNED',
        banReason,
        updatedAt: new Date(),
      })
      .where(eq(users.id, priest.userId));

    // 3. Dispatch notification email to the priest with ban details and cancellation notice
    if (priestUser?.email) {
      await brevoEmailService
        .sendAccountStatusEmail(
          priestUser.email,
          priestUser.name || 'Purohit',
          'BANNED',
          banReason,
          activeBookings.length,
          'PRIEST'
        )
        .catch((err) => {
          console.warn('[AdminService] Failed to dispatch priest ban email notification:', err);
        });
    }
  }

  /**
   * Reactivate / Unban priest account by priestProfile id
   */
  async unbanPriest(priestId: string): Promise<void> {
    const [priest] = await db
      .select({ userId: priestProfiles.userId })
      .from(priestProfiles)
      .where(eq(priestProfiles.id, priestId))
      .limit(1);

    if (!priest) {
      throw new AppError(404, 'Priest record not found.');
    }

    await db
      .update(users)
      .set({
        accountStatus: 'ACTIVE',
        banReason: null,
      })
      .where(eq(users.id, priest.userId));
  }

  // Get all devotee users joined with their booking counts and optional pagination
  async getAllUsers(pagination?: { page?: number; limit?: number }): Promise<any[]> {
    let query = db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phoneNumber: users.phoneNumber,
        role: users.role,
        accountStatus: users.accountStatus,
        banReason: users.banReason,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
        bookingCount: sql<number>`cast(count(${bookings.id}) as int)`,
      })
      .from(users)
      .leftJoin(bookings, eq(users.id, bookings.userId))
      .where(eq(users.role, 'USER'))
      .groupBy(users.id);

    if (pagination?.page || pagination?.limit) {
      const { limit, offset } = getPagination(pagination);
      query = query.limit(limit).offset(offset) as any;
    }

    return await query;
  }

  /**
   * Get single devotee user profile with registered addresses and booking history
   */
  async getUserById(userId: string): Promise<any> {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phoneNumber: users.phoneNumber,
        role: users.role,
        accountStatus: users.accountStatus,
        banReason: users.banReason,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new AppError(404, 'Devotee user not found.');
    }

    const userAddresses = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, userId))
      .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));

    const priestUser = alias(users, 'priest_user');
    const userBookings = await db
      .select({
        id: bookings.id,
        bookingReference: bookings.bookingReference,
        serviceName: bookings.serviceName,
        servicePrice: bookings.servicePrice,
        totalPrice: bookings.totalPrice,
        scheduledDate: bookings.scheduledDate,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        status: bookings.status,
        paymentMethod: bookings.paymentMethod,
        specialInstructions: bookings.specialInstructions,
        completionCode: bookings.completionCode,
        createdAt: bookings.createdAt,
        priestId: bookings.priestId,
        priestName: priestUser.name,
        priestPhone: priestUser.phoneNumber,
      })
      .from(bookings)
      .leftJoin(priestProfiles, eq(bookings.priestId, priestProfiles.id))
      .leftJoin(priestUser, eq(priestProfiles.userId, priestUser.id))
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.createdAt));

    return {
      ...user,
      createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
      addresses: userAddresses,
      bookings: userBookings.map((b) => ({
        ...b,
        createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
      })),
      bookingCount: userBookings.length,
    };
  }

  /**
   * Suspend a devotee user specifically.
   * Automatically cancels all active/pending bookings on the priest side and emails the user.
   */
  async suspendUser(userId: string, reason?: string): Promise<void> {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new AppError(404, 'User record not found.');
    }

    const suspendReason = reason?.trim() || 'Suspended by platform administrator';

    // 1. Cancel all active bookings (PENDING, CONFIRMED) for this devotee
    const activeBookings = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.userId, userId),
          inArray(bookings.status, ['PENDING', 'CONFIRMED'])
        )
      );

    if (activeBookings.length > 0) {
      await db
        .update(bookings)
        .set({
          status: 'CANCELLED',
          cancelledBy: 'ADMIN',
          cancelledAt: new Date(),
          cancellationReason: `Cancelled by platform administrator due to devotee account suspension: ${suspendReason}`,
        })
        .where(
          and(
            eq(bookings.userId, userId),
            inArray(bookings.status, ['PENDING', 'CONFIRMED'])
          )
        );
    }

    // 2. Set devotee user account status to BANNED
    await db
      .update(users)
      .set({
        accountStatus: 'BANNED',
        banReason: suspendReason,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // 3. Dispatch notification email to devotee
    if (user.email) {
      await brevoEmailService
        .sendAccountStatusEmail(
          user.email,
          user.name || 'Devotee',
          'SUSPENDED',
          suspendReason,
          activeBookings.length,
          'DEVOTEE'
        )
        .catch((err) => {
          console.warn('[AdminService] Failed to dispatch user suspension email notification:', err);
        });
    }
  }

  /**
   * Unsuspend / Reactivate a devotee user
   */
  async unsuspendUser(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        accountStatus: 'ACTIVE',
        banReason: null,
      })
      .where(eq(users.id, userId));
  }

  /**
   * Delete a devotee user account permanently.
   * Cancels active bookings first, sends notification email to user,
   * then disassociates booking history and cascades address removal.
   */
  async deleteUser(userId: string, reason?: string, currentAdminId?: string): Promise<void> {
    if (currentAdminId && userId === currentAdminId) {
      throw new AppError(400, 'Security violation: Cannot delete the currently logged-in administrator account.');
    }

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new AppError(404, 'User record not found.');
    }

    if (user.role === 'PRIEST') {
      return this.deletePriest(userId, reason, currentAdminId);
    }

    if (user.role !== 'USER') {
      throw new AppError(400, 'Only devotee accounts can be deleted through this endpoint.');
    }

    const deleteReason = reason?.trim() || 'Account permanently deleted by platform administrator.';

    // 1. Cancel all active bookings (PENDING, CONFIRMED) before account removal
    const activeBookings = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.userId, userId),
          inArray(bookings.status, ['PENDING', 'CONFIRMED'])
        )
      );

    if (activeBookings.length > 0) {
      await db
        .update(bookings)
        .set({
          status: 'CANCELLED',
          cancelledBy: 'ADMIN',
          cancelledAt: new Date(),
          cancellationReason: `Cancelled by platform administrator due to devotee account deletion: ${deleteReason}`,
        })
        .where(
          and(
            eq(bookings.userId, userId),
            inArray(bookings.status, ['PENDING', 'CONFIRMED'])
          )
        );
    }

    // 2. Dispatch notification email to devotee informing them of deletion and booking cancellations
    if (user.email) {
      await brevoEmailService
        .sendAccountStatusEmail(
          user.email,
          user.name || 'Devotee',
          'DELETED',
          deleteReason,
          activeBookings.length,
          'DEVOTEE'
        )
        .catch((err) => {
          console.warn('[AdminService] Failed to dispatch user deletion email notification:', err);
        });
    }

    // Find all address IDs belonging to this user
    const userAddresses = await db
      .select({ id: addresses.id })
      .from(addresses)
      .where(eq(addresses.userId, userId));
    const addressIds = userAddresses.map((a) => a.id);

    // Disassociate bookings from this user and this user's addresses to preserve booking financial/audit history
    await db
      .update(bookings)
      .set({ userId: null, addressId: null })
      .where(eq(bookings.userId, userId));

    if (addressIds.length > 0) {
      await db
        .update(bookings)
        .set({ addressId: null })
        .where(inArray(bookings.addressId, addressIds));
    }

    // Delete user from application users table (cascades cleanly to addresses)
    await db.delete(users).where(eq(users.id, userId));

    // Purge user avatar from Cloudinary if hosted there
    if (user.avatarUrl && user.avatarUrl.startsWith('http')) {
      await cloudinaryService.deleteImageByUrl(user.avatarUrl).catch((err) => {
        console.warn('[AdminService] Failed to clean up user Cloudinary avatar:', err);
      });
    }
  }

  /**
   * Delete a priest profile and associated user account.
   * Accepts priestProfiles.id or linked userId.
   * Cancels active bookings first, sends notification email to priest,
   * then disassociates bookings to preserve financial audit history.
   */
  async deletePriest(priestId: string, reason?: string, currentAdminId?: string): Promise<void> {
    const [priest] = await db
      .select({
        id: priestProfiles.id,
        userId: priestProfiles.userId,
        profileImageUrl: priestProfiles.profileImageUrl,
      })
      .from(priestProfiles)
      .where(or(eq(priestProfiles.id, priestId), eq(priestProfiles.userId, priestId)))
      .limit(1);

    if (!priest) {
      throw new AppError(404, 'Priest record not found.');
    }

    if (currentAdminId && priest.userId === currentAdminId) {
      throw new AppError(400, 'Security violation: Cannot delete your own administrator account.');
    }

    const [priestUser] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, priest.userId))
      .limit(1);

    const deleteReason = reason?.trim() || 'Account permanently deleted by platform administrator.';

    // 1. Cancel all active bookings (PENDING, CONFIRMED) before deletion
    const activeBookings = await db
      .select({
        id: bookings.id,
        bookingReference: bookings.bookingReference,
        serviceName: bookings.serviceName,
        bookingDate: bookings.bookingDate,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        userId: bookings.userId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .where(
        and(
          eq(bookings.priestId, priest.id),
          inArray(bookings.status, ['PENDING', 'CONFIRMED'])
        )
      );

    if (activeBookings.length > 0) {
      await db
        .update(bookings)
        .set({
          status: 'CANCELLED',
          cancelledBy: 'ADMIN',
          cancelledAt: new Date(),
          cancellationReason: `Cancelled by platform administrator due to Purohit account deletion: ${deleteReason}`,
        })
        .where(
          and(
            eq(bookings.priestId, priest.id),
            inArray(bookings.status, ['PENDING', 'CONFIRMED'])
          )
        );

      // Notify all affected devotees that their ceremony has been cancelled
      for (const b of activeBookings) {
        if (b.userEmail) {
          await brevoEmailService
            .sendBookingCancelledDueToPriestStatusEmail({
              userEmail: b.userEmail,
              userName: b.userName || 'Devotee',
              bookingReference: b.bookingReference || b.id,
              serviceName: b.serviceName || 'Puja Ceremony',
              bookingDate: b.bookingDate ? String(b.bookingDate) : 'Scheduled Date',
              slotTime: b.startTime && b.endTime ? `${b.startTime} - ${b.endTime}` : 'Scheduled Muhurat',
              priestName: priestUser?.name || 'Assigned Purohit',
              action: 'DELETED',
              reason: deleteReason,
            })
            .catch((err) => {
              console.warn(`[AdminService] Failed to notify devotee ${b.userEmail} of priest deletion:`, err);
            });
        }
      }
    }

    // 2. Dispatch notification email to priest with deletion and cancellation details
    if (priestUser?.email) {
      await brevoEmailService
        .sendAccountStatusEmail(
          priestUser.email,
          priestUser.name || 'Purohit',
          'DELETED',
          deleteReason,
          activeBookings.length,
          'PRIEST'
        )
        .catch((err) => {
          console.warn('[AdminService] Failed to dispatch priest deletion email notification:', err);
        });
    }

    // 3. Disassociate bookings from this priest to preserve booking audit history
    await db
      .update(bookings)
      .set({ priestId: null, priestServiceId: null })
      .where(eq(bookings.priestId, priest.id));

    // Delete priestProfile (cascades to priest_services and priest_availability_exceptions)
    await db.delete(priestProfiles).where(eq(priestProfiles.id, priest.id));

    // Delete the linked user account
    await db.delete(users).where(eq(users.id, priest.userId));

    // Clean up priest Cloudinary images
    if (priest.profileImageUrl && priest.profileImageUrl.startsWith('http')) {
      await cloudinaryService.deleteImageByUrl(priest.profileImageUrl).catch((err) => {
        console.warn('[AdminService] Failed to clean up priest Cloudinary image:', err);
      });
    }
    if (
      priestUser?.avatarUrl &&
      priestUser.avatarUrl.startsWith('http') &&
      priestUser.avatarUrl !== priest.profileImageUrl
    ) {
      await cloudinaryService.deleteImageByUrl(priestUser.avatarUrl).catch((err) => {
        console.warn('[AdminService] Failed to clean up priest user Cloudinary avatar:', err);
      });
    }
  }

  /**
   * Update admin display name and/or avatar in the users table, syncing avatar with Cloudinary in 'pujacircle/admin'
   */
  async updateAdminProfile(
    userId: string,
    dataOrName: string | { name?: string; avatarUrl?: string | null }
  ): Promise<{ id: string; name: string; avatarUrl: string | null }> {
    const data = typeof dataOrName === 'string' ? { name: dataOrName } : dataOrName;
    const updateData: Record<string, any> = { updatedAt: new Date() };

    if (data.name !== undefined) {
      const trimmedName = data.name.trim();
      if (!trimmedName || trimmedName.length < 2) {
        throw new AppError(400, 'Name must be at least 2 characters long.');
      }
      updateData.name = trimmedName;
    }

    if (data.avatarUrl !== undefined) {
      const [currentUser] = await db
        .select({ avatarUrl: users.avatarUrl })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const oldAvatarUrl = currentUser?.avatarUrl;
      let finalAvatarUrl: string | null = null;

      if (typeof data.avatarUrl === 'string' && data.avatarUrl.trim().length > 0) {
        const trimmed = data.avatarUrl.trim();

        // Case A: Base64 Data URI from file picker -> Upload to Cloudinary in 'pujacircle/admin' folder
        if (trimmed.startsWith('data:image/') || trimmed.startsWith('data:')) {
          try {
            // Ensure 'pujacircle/admin' folder exists in the Cloudinary account
            await cloudinary.api.create_folder('pujacircle/admin').catch(() => { });
            // Clean up any accidentally created root-level 'admin' folder if empty
            await cloudinary.api.delete_folder('admin').catch(() => { });

            const uploadResult = await cloudinaryService.uploadImage(trimmed, 'pujacircle/admin');
            finalAvatarUrl = uploadResult.secure_url || uploadResult.url;
          } catch (uploadError: any) {
            console.error('[AdminService] Cloudinary avatar upload failed:', uploadError);
            throw new AppError(500, 'Failed to upload profile picture to cloud storage.');
          }
        }
        // Case B: Already a hosted URL (e.g. from Cloudinary or external)
        else if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
          finalAvatarUrl = trimmed;
        }

        // Cleanup: Purge previous image from Cloudinary if different
        if (oldAvatarUrl && oldAvatarUrl.startsWith('http') && oldAvatarUrl !== finalAvatarUrl) {
          await cloudinaryService.deleteImageByUrl(oldAvatarUrl).catch((err) => {
            console.warn('[AdminService] Failed to clean up previous Cloudinary asset:', err);
          });
        }
      } else {
        // Case C: Photo removed (empty string or null) -> Clean up Cloudinary
        if (oldAvatarUrl && oldAvatarUrl.startsWith('http')) {
          await cloudinaryService.deleteImageByUrl(oldAvatarUrl).catch((err) => {
            console.warn('[AdminService] Failed to clean up previous Cloudinary asset:', err);
          });
        }
        finalAvatarUrl = null;
      }

      updateData.avatarUrl = finalAvatarUrl;
    }

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({ id: users.id, name: users.name, avatarUrl: users.avatarUrl });

    if (!updated) {
      throw new AppError(404, 'Admin user record not found.');
    }

    return updated;
  }

  // Query platform ceremony bookings with SQL joins and pagination
  async getAllBookings(page = 1, limit = 50): Promise<any[]> {
    const { limit: safeLimit, offset } = getPagination({ page, limit }, 50, 100);

    const results = await db
      .select({
        id: bookings.id,
        bookingReference: bookings.bookingReference,
        userId: bookings.userId,
        priestId: bookings.priestId,
        priestServiceId: bookings.priestServiceId,
        pujaCatalogId: bookings.pujaCatalogId,
        addressId: bookings.addressId,
        serviceName: bookings.serviceName,
        servicePrice: bookings.servicePrice,
        totalPrice: bookings.totalPrice,
        bookingDate: bookings.bookingDate,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        scheduledDate: bookings.scheduledDate,
        status: bookings.status,
        paymentMethod: bookings.paymentMethod,
        paymentStatus: bookings.paymentStatus,
        specialInstructions: bookings.specialInstructions,
        notes: bookings.notes,
        completionCode: bookings.completionCode,
        rejectionReason: bookings.rejectionReason,
        cancellationReason: bookings.cancellationReason,
        cancelledBy: bookings.cancelledBy,
        cancelledAt: bookings.cancelledAt,
        completedAt: bookings.completedAt,
        rating: bookings.rating,
        review: bookings.review,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        userName: users.name,
        userPhone: users.phoneNumber,
        userEmail: users.email,
      })
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .leftJoin(priestProfiles, eq(bookings.priestId, priestProfiles.id))
      .orderBy(desc(bookings.createdAt))
      .limit(safeLimit)
      .offset(offset);

    return results.map((b) => ({
      ...b,
      userName: b.userName || 'Devotee',
      userPhone: b.userPhone || '',
      createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: b.updatedAt ? new Date(b.updatedAt).toISOString() : undefined,
      cancelledAt: b.cancelledAt ? new Date(b.cancelledAt).toISOString() : undefined,
      completedAt: b.completedAt ? new Date(b.completedAt).toISOString() : undefined,
      user: b.userId
        ? {
          id: b.userId,
          name: b.userName || 'Devotee',
          phoneNumber: b.userPhone || '',
          email: b.userEmail || '',
        }
        : undefined,
    }));
  }
}

export const adminService = new AdminService();

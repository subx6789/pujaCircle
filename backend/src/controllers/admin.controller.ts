import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '@/views/response.view.js';
import { adminService } from '@/services/admin.service.js';
import { userService } from '@/services/user.service.js';
import { getPagination } from '@/utils/pagination.js';

// Controller managing platform admin oversight, priest approvals, user moderation, and ceremony logs
export class AdminController {
  // GET /api/v1/admin/dashboard/stats
  async getDashboardStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await adminService.getDashboardStats();
      sendSuccess(res, 'Admin dashboard statistics retrieved.', stats);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/admin/priests
  async getAllPriests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pagination = req.query.page || req.query.limit ? getPagination(req.query) : undefined;
      const priests = await adminService.getAllPriests(pagination);
      sendSuccess(res, 'Priest records retrieved.', priests);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/admin/priests/pending
  async getPendingPriests(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pendingPriests = await adminService.getPendingPriests();
      sendSuccess(res, 'Pending priest applications retrieved.', pendingPriests);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/admin/priests/:id/approve
  async approvePriest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await adminService.approvePriest(req.params.id);
      sendSuccess(res, `Priest application ${req.params.id} has been approved.`);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/admin/priests/:id/reject
  async rejectPriest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await adminService.rejectPriest(req.params.id, req.body?.reason);
      sendSuccess(res, `Priest application ${req.params.id} has been rejected.`);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/admin/priests/:id/ban
  async banPriest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await adminService.banPriest(req.params.id, req.body?.reason);
      sendSuccess(res, `Priest ${req.params.id} has been suspended.`);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/admin/priests/:id/unban
  async unbanPriest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await adminService.unbanPriest(req.params.id);
      sendSuccess(res, `Priest ${req.params.id} account has been reactivated.`);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/admin/priests/:id/reopen
  async reopenPriestApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await adminService.reopenPriestApplication(req.params.id);
      sendSuccess(res, `Priest application ${req.params.id} reopened for review.`);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/admin/users
  async getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pagination = req.query.page || req.query.limit ? getPagination(req.query) : undefined;
      const usersList = await adminService.getAllUsers(pagination);
      sendSuccess(res, 'Devotee user accounts retrieved.', usersList);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/admin/users/:id
  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await adminService.getUserById(req.params.id);
      sendSuccess(res, 'Devotee details retrieved successfully.', user);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/admin/users/:id/suspend
  async suspendUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await adminService.suspendUser(req.params.id, req.body?.reason);
      sendSuccess(res, `User ${req.params.id} has been suspended.`);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/admin/users/:id/unsuspend
  async unsuspendUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await adminService.unsuspendUser(req.params.id);
      sendSuccess(res, `User ${req.params.id} has been unsuspended.`);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/admin/bookings
  async getAllBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = getPagination(req.query, 50, 100);
      const bookingsList = await adminService.getAllBookings(page, limit);
      sendSuccess(res, 'All platform ceremony bookings retrieved.', bookingsList);
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/v1/admin/users/:id
  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await adminService.deleteUser(req.params.id, req.body?.reason, req.user?.id);
      sendSuccess(res, 'User account ' + req.params.id + ' permanently deleted.');
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/v1/admin/priests/:id
  async deletePriest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await adminService.deletePriest(req.params.id, req.body?.reason, req.user?.id);
      sendSuccess(res, 'Priest record ' + req.params.id + ' permanently deleted.');
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/admin/profile
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, 'Admin profile details retrieved.', req.user);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/v1/admin/profile
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const name = req.body?.name || req.body?.fullName;
      const avatarUrl = req.body?.avatarUrl;

      if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
        sendError(res, 'Full name must be at least 2 characters long.', 400);
        return;
      }

      const updated = await adminService.updateAdminProfile(req.user!.id, {
        name: typeof name === 'string' ? name : undefined,
        avatarUrl: typeof avatarUrl === 'string' || avatarUrl === null ? avatarUrl : undefined,
      });
      sendSuccess(res, 'Admin profile updated successfully.', updated);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/admin/change-password
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await userService.changePassword(req.user!.id, req.body);
      sendSuccess(res, 'Administrator password changed successfully.');
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();

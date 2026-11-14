import { Router } from 'express';
import { adminController } from '@/controllers/admin.controller.js';
import { requireAuth } from '@/middlewares/auth.middleware.js';
import { requireAdmin } from '@/middlewares/role.middleware.js';
import { validate } from '@/middlewares/validate.middleware.js';
import { adminActionReasonSchema, updateAdminProfileSchema } from '@/schemas/admin.schema.js';
import { changePasswordSchema } from '@/schemas/user.schema.js';
import { uuidParamSchema } from '@/schemas/common.schema.js';

const router = Router();

/**
 * [ROUTE] /api/v1/admin
 * Protected Admin Console Endpoints (ADMIN role required)
 */
router.use(requireAuth);
router.use(requireAdmin);

// Platform KPIs & Stats
router.get('/dashboard/stats', adminController.getDashboardStats);

// Platform Bookings Monitoring
router.get('/bookings', adminController.getAllBookings);

// Admin Profile Settings & Security
router.get('/profile', adminController.getProfile);
router.put('/profile', validate(updateAdminProfileSchema), adminController.updateProfile);
router.post('/change-password', validate(changePasswordSchema), adminController.changePassword);

// Priest Verification & Lifecycle Management
router.get('/priests', adminController.getAllPriests);
router.get('/priests/pending', adminController.getPendingPriests);
router.post('/priests/:id/approve', validate(uuidParamSchema, 'params'), adminController.approvePriest);
router.post('/priests/:id/reject', validate(uuidParamSchema, 'params'), validate(adminActionReasonSchema), adminController.rejectPriest);
router.post('/priests/:id/ban', validate(uuidParamSchema, 'params'), validate(adminActionReasonSchema), adminController.banPriest);
router.post('/priests/:id/unban', validate(uuidParamSchema, 'params'), adminController.unbanPriest);
router.post('/priests/:id/reopen', validate(uuidParamSchema, 'params'), adminController.reopenPriestApplication);
router.delete('/priests/:id', validate(uuidParamSchema, 'params'), validate(adminActionReasonSchema), adminController.deletePriest);

// Devotee Moderation
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', validate(uuidParamSchema, 'params'), adminController.getUserById);
router.post('/users/:id/suspend', validate(uuidParamSchema, 'params'), validate(adminActionReasonSchema), adminController.suspendUser);
router.post('/users/:id/unsuspend', validate(uuidParamSchema, 'params'), adminController.unsuspendUser);
router.delete('/users/:id', validate(uuidParamSchema, 'params'), validate(adminActionReasonSchema), adminController.deleteUser);

export const adminRoutes = router;

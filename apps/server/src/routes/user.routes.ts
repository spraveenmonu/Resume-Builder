import { Router } from 'express';
import multer from 'multer';
import { UserController } from '../controllers/user.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import {
  updateProfileSchema,
  changePasswordSchema,
  changeEmailSchema,
  deleteAccountSchema,
} from '@careercraft/shared';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

const router = Router();

// All user routes require authentication
router.use(requireAuth);

router.get('/profile', UserController.getProfile);
router.patch('/profile', validateRequest(updateProfileSchema), UserController.updateProfile);
router.post('/avatar', upload.single('avatar'), UserController.uploadAvatar);
router.delete('/avatar', UserController.deleteAvatar);
router.post('/change-password', validateRequest(changePasswordSchema), UserController.changePassword);
router.post('/change-email', validateRequest(changeEmailSchema), UserController.changeEmail);
router.get('/sessions', UserController.getSessions);
router.delete('/sessions/:id', UserController.revokeSession);
router.get('/oauth-accounts', UserController.getOAuthAccounts);
router.delete('/oauth-accounts/:id', UserController.unlinkOAuthAccount);
router.get('/export-data', UserController.exportData);
router.post('/delete-account', validateRequest(deleteAccountSchema), UserController.deleteAccount);

export const userRoutes = router;

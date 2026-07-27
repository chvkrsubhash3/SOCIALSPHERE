import { Router } from 'express';
import { getProfile, updateProfile, updateUserRole, followUser, changePassword } from '../controllers/usersController';
import { rbac } from '../middleware/rbac';

const router = Router();

router.get('/:username/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/:userId/follow', followUser);
router.put('/change-password', changePassword);
router.put('/:userId/role', rbac.requireAdmin(), updateUserRole);

export default router;

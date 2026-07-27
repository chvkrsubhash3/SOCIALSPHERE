import { Router } from 'express';
import { searchUsers, searchPosts, adminSearch } from '../controllers/searchController';
import { rbac } from '../middleware/rbac';

const router = Router();

router.get('/users', searchUsers);
router.get('/posts', searchPosts);
router.get('/admin', rbac.requireAdmin(), adminSearch);

export default router;

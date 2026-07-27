import { Router } from 'express';
import {
  createPost, getPost, deletePost, getFeed,
  likePost, getComments, createComment, sharePost,
} from '../controllers/postsController';

const router = Router();

router.get('/feed', getFeed);
router.post('/', createPost);
router.get('/:postId', getPost);
router.delete('/:postId', deletePost);
router.post('/:postId/like', likePost);
router.post('/:postId/share', sharePost);
router.get('/:postId/comments', getComments);
router.post('/:postId/comments', createComment);

export default router;

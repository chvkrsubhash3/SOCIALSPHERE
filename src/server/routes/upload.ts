import { Router, Request, Response } from 'express';
import multer from 'multer';
import { uploadAvatar, setAvatarFromUrl, downloadFile, importXml } from '../controllers/uploadController';

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 },  // 50MB
});

const router = Router();

router.post('/avatar', upload.single('avatar'), uploadAvatar);
router.post('/avatar-url', setAvatarFromUrl);
router.get('/download/:filename', downloadFile);
router.post('/import-xml', importXml);

export default router;

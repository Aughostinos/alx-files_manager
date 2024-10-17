import { Router } from 'express';
import AppController from '../controllers/AppController.js';
import AuthController from '../controllers/AuthController.js';
import UsersController from '../controllers/UsersController.js';
import FilesController from '../controllers/FilesController.js';

const router = Router();

router.get('/status', AppController.getStatus);

router.get('/stats', AppController.getStats);

router.post('/users', UsersController.postNew);

// Auth routes
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.getMe);

// upload file
router.post('/files', FilesController.postUpload);

export default router;

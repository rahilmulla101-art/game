import express from 'express';
import { register, login, adminLogin, me } from '../controllers/authController.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

// Public player register and login routes
router.post('/register', register);
router.post('/login', login);

// Admin credential login mapping routing path
router.post('/admin-login', adminLogin);

// Protected player self session/identity profile validation route
router.get('/me', verifyToken, me);

export default router;

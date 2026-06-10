import express from 'express';
import axios from 'axios';
import qs from 'qs';
import { register, login, adminLogin, me,sendOtp,adminSendOtp,forgotSendOtp, forgotResetPassword   ,changePasswordDirect, changePasswordSendOtp, changePasswordOtp } from '../controllers/authController.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

// Public player register and login routes
router.post('/register', register);
router.post('/login', login);

router.post('/admin-send-otp',adminSendOtp);
router.post('/send-otp', sendOtp);

router.post('/forgot-send-otp', forgotSendOtp);
router.post('/forgot-reset-password', forgotResetPassword);
router.post('/forgot-reset', forgotResetPassword);
// Protected routes for self password-changing management
router.post('/change-password-direct', verifyToken, changePasswordDirect);
router.post('/change-password-send-otp', verifyToken, changePasswordSendOtp);
router.post('/change-password-otp', verifyToken, changePasswordOtp);


// Admin credential login mapping routing path
router.post('/admin-login', adminLogin);

// Protected player self session/identity profile validation route
router.get('/me', verifyToken, me);

export default router;

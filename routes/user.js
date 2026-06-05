import express from 'express';
import verifyToken from '../middleware/verifyToken.js';
import {
  getUserProfile,
  updateUserProfile,
  getUserStats,
  getUserReferralsList,
  getLeaderboardAlltime,
  getLeaderboardWeekly,
  getLeaderboardToday
} from '../controllers/userController.js';

const router = express.Router();

// Profile operations (Protected)
router.get('/user/profile', verifyToken, getUserProfile);
router.put('/user/profile', verifyToken, updateUserProfile);

// Stats & Referrals (Protected)
router.get('/user/stats', verifyToken, getUserStats);
router.get('/user/referrals', verifyToken, getUserReferralsList);

// Leaderboards (Public)
router.get('/leaderboard/alltime', getLeaderboardAlltime);
router.get('/leaderboard/weekly', getLeaderboardWeekly);
router.get('/leaderboard/today', getLeaderboardToday);

export default router;

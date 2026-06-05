import express from 'express';
import isAdmin from '../middleware/isAdmin.js';
import {
  getDashboardStats,
  getDeposits,
  approveDeposit,
  rejectDeposit,
  getWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  getUsers,
  getUserDetail,
  toggleBanUser,
  manualAddBalance,
  getGameRoundsList,
  getSettings,
  updateSettings,
  getSupportTickets,
  replySupportTicket
} from '../controllers/adminController.js';

const router = express.Router();

// Apply administrative middleware checking to all endpoints in this router
router.use(isAdmin);

// 1. Dashboard Analytic
router.get('/dashboard', getDashboardStats);

// 2. Deposit Workflows
router.get('/deposits', getDeposits);
router.post('/deposits/:id/approve', approveDeposit);
router.post('/deposits/:id/reject', rejectDeposit);

// 3. Withdrawal Workflows
router.get('/withdrawals', getWithdrawals);
router.post('/withdrawals/:id/approve', approveWithdrawal);
router.post('/withdrawals/:id/reject', rejectWithdrawal);

// 4. User Base Management
router.get('/users', getUsers);
router.get('/users/:id', getUserDetail);
router.post('/users/:id/ban', toggleBanUser);
router.post('/users/:id/add-balance', manualAddBalance);

// 5. Game Round Monitoring
router.get('/game/rounds', getGameRoundsList);

// 6. Settings Registry
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// 7. Support Tickets Support
router.get('/tickets', getSupportTickets);
router.post('/tickets/:id/reply', replySupportTicket);

export default router;

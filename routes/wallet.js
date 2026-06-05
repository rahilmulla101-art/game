import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import verifyToken from '../middleware/verifyToken.js';
import {
  getBalance,
  getTransactions,
  submitDeposit,
  getDepositsHistory,
  requestWithdrawal,
  getWithdrawalsHistory,
  getUpiSettings
} from '../controllers/walletController.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pre-create specialized uploads directory securely
const depositsUploadDir = path.join(__dirname, '../public/uploads/deposits');
if (!fs.existsSync(depositsUploadDir)) {
  fs.mkdirSync(depositsUploadDir, { recursive: true });
}

// Map specialized Multer storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, depositsUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `screenshot-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Configure profile filter criteria constraints
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image standard. Only web-optimized image files (.jpg, .png, .jpeg, .webp) are accepted.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Strict 5MB Max Limit
});

// GET /api/wallet/balance - Retrieve wallet current balance state
router.get('/balance', verifyToken, getBalance);

// GET /api/wallet/transactions - Retrieve ledger transaction statements
router.get('/transactions', verifyToken, getTransactions);

// POST /api/deposits/submit - Process deposit screenshots
router.post('/deposits/submit', verifyToken, upload.single('screenshot'), submitDeposit);

// GET /api/deposits/history - Retrieve user's own deposits paginated list
router.get('/deposits/history', verifyToken, getDepositsHistory);

// POST /api/withdrawals/request - Initiate bank withdrawals request
router.post('/withdrawals/request', verifyToken, requestWithdrawal);

// GET /api/withdrawals/history - Retrieve payout withdrawals history
router.get('/withdrawals/history', verifyToken, getWithdrawalsHistory);

// GET /api/settings/upi - Public credentials setting details (UPI target address)
router.get('/settings/upi', getUpiSettings);

export default router;

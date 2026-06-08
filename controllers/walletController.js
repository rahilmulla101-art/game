import path from 'path';
import fs from 'fs';
import pool from '../config/db.js';
import walletService from '../services/walletService.js';

// Helper to retrieve site settings key values from database dynamically
const getSiteSettingValue = async (key, defaultValue) => {
  try {
    const [rows] = await pool.query('SELECT setting_value FROM site_settings WHERE setting_key = ?', [key]);
    if (rows && rows.length > 0) {
      return rows[0].setting_value;
    }
  } catch (error) {
    console.error(`Error reading settings key ${key}:`, error.message);
  }
  return defaultValue;
};

export const getWithdrawalSettings = async (req, res) => {
  try {
    const minWithdrawal = await getSiteSettingValue(
      'min_withdrawal',
      '10'
    );

    const maxWithdrawal = await getSiteSettingValue(
      'max_withdrawal',
      '50000'
    );
     const minDeposit = await getSiteSettingValue(
      'min_deposit',
      '200'
    );

    return res.json({
      success: true,
      data: {
        minimum_withdrawal: parseFloat(minWithdrawal),
        maximum_withdrawal: parseFloat(maxWithdrawal),
        minimum_deposit: parseFloat(minDeposit)
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


/**
 * GET /api/wallet/balance
 */
export const getBalance = async (req, res) => {
  try {
    const balance = await walletService.getBalance(req.user.id);
    return res.json({
      success: true,
      message: 'Wallet balance fetched successfully.',
      data: { wallet_balance: balance }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      data: {}
    });
  }
};

/**
 * GET /api/wallet/transactions
 */
export const getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, type = null } = req.query;

    const recordData = await walletService.getTransactions(userId, page, limit, type);
    return res.json({
      success: true,
      message: 'Paginated user transactions retrieved.',
      data: recordData
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve transactions: ' + error.message,
      data: {}
    });
  }
};

/**
 * POST /api/deposits/submit
 * Expects Multipart Form Upload: { amount, utr_number } + File: screenshot
 */
export const submitDeposit = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, utr_number } = req.body;

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid deposit numeric amount larger than zero.'
      });
    }

    if (!utr_number || utr_number.trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: 'A valid UTR/Reference number (minimum 6 digits or matching Indian UPI specs) is required.'
      });
    }

    // Check min_deposit settings
    const minDepositSetting = await getSiteSettingValue('min_deposit', '100');
    const minDeposit = parseFloat(minDepositSetting);
    if (parseFloat(amount) < minDeposit) {
      return res.status(400).json({
        success: false,
        message: `The minimum deposit amount limit allowed is ₹${minDeposit}.`
      });
    }

    // Verify uploaded ticket file screenshot
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please attach a valid screenshot receipt file proof of the digital UPI transfer.'
      });
    }

    // Ensure unique UTR to avoid fraud
    const [existing_utr] = await pool.query('SELECT id FROM deposits WHERE utr_number = ?', [utr_number]);
    if (existing_utr && existing_utr.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This UTR transaction reference code has already been uploaded previously.'
      });
    }

    // Save formatted static routing link prefix to store link paths
    const relativeUrlPath = `/uploads/deposits/${req.file.filename}`;

    const [insertResult] = await pool.query(
      'INSERT INTO deposits (user_id, amount, screenshot_url, utr_number, status) VALUES (?, ?, ?, ?, ?)',
      [userId, parseFloat(amount), relativeUrlPath, utr_number.trim(), 'pending']
    );

    return res.status(201).json({
      success: true,
      message: 'Deposit payment screenshot uploaded successfully. A site administrator will verify your transfer shortly.',
      data: {
        deposit_id: insertResult.insertId,
        amount: parseFloat(amount),
        utr_number,
        screenshot_url: relativeUrlPath
      }
    });

  } catch (error) {
    // Remove the file if insertion fails to save space
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {
        console.error('File unlink error:', unlinkErr);
      }
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to upload deposit slip context: ' + error.message,
      data: {}
    });
  }
};

/**
 * GET /api/deposits/history
 */
export const getDepositsHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 10);
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(
      'SELECT id, amount, screenshot_url, utr_number, status, admin_note, submitted_at, reviewed_at FROM deposits WHERE user_id = ? ORDER BY submitted_at DESC LIMIT ? OFFSET ?',
      [userId, limit, offset]
    );

    const [countRows] = await pool.query('SELECT COUNT(id) as total FROM deposits WHERE user_id = ?', [userId]);
    const total = countRows[0].total;

    return res.json({
      success: true,
      message: 'User deposit requests history listed.',
      data: {
        deposits: rows,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving deposit history: ' + error.message,
      data: {}
    });
  }
};

/**
 * POST /api/withdrawals/request
 * Payload: { amount, upi_id, account_name, account_number, ifsc_code }
 */
export const requestWithdrawal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, upi_id, account_name, account_number, ifsc_code } = req.body;

    const requestedAmount = parseFloat(amount || 0);

    if (isNaN(requestedAmount) || requestedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please mention a valid numeric withdrawal amount.'
      });
    }

    if (!account_name || !account_number || !ifsc_code) {
      return res.status(400).json({
        success: false,
        message: 'Comprehensive bank particulars (Holder Name, Account Number, and IFSC routing code) are required.'
      });
    }

    // 1. Check double request attempts (Single pending allowed)
    const [existingPending] = await pool.query(
      'SELECT id FROM withdrawals WHERE user_id = ? AND status IN (?, ?)',
      [userId, 'pending', 'processing']
    );

    // if (existingPending && existingPending.length > 0) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'You already have an active withdrawal request under processing. Please wait until finished.'
    //   });
    // }

    // 2. Fetch system configuration limits
    const minWithdrawalValue = parseFloat(await getSiteSettingValue('min_withdrawal', '200'));
    const maxWithdrawalValue = parseFloat(await getSiteSettingValue('max_withdrawal', '50000'));

    if (requestedAmount < minWithdrawalValue) {
      return res.status(400).json({
        success: false,
        message: `Min. allowed withdrawal threshold limit is ₹${minWithdrawalValue}.`
      });
    }

    if (requestedAmount > maxWithdrawalValue) {
      return res.status(400).json({
        success: false,
        message: `Max. individual daily payout withdrawal allowed limit is ₹${maxWithdrawalValue}.`
      });
    }

    // 3. Query the user's withdraw_wallet first to inspect available unlocked winnings
    const [userRows] = await pool.query(
      'SELECT withdraw_wallet FROM users WHERE id = ?',
      [userId]
    );

    if (!userRows || userRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    const currentWithdrawWallet = parseFloat(userRows[0].withdraw_wallet || 0);

    // 4. Strict check against only withdrawable winnings column
    if (currentWithdrawWallet < requestedAmount) {
      return res.status(400).json({
        success: false,
        message: 'Your withdraw wallet has less funds for the process. Please play and win to unlock the withdraw money.'
      });
    }

    // 5. Conduct custom transaction logic: atomic deduction & insertion 
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Deduct specifically from the withdraw_wallet column (and leave wallet_balance untouched!)
      await connection.query(
        'UPDATE users SET withdraw_wallet = withdraw_wallet - ? WHERE id = ?',
        [requestedAmount, userId]
      );

      // Save the payout transaction request inside your withdrawals table
      const [insertResult] = await connection.query(
        'INSERT INTO withdrawals (user_id, amount, upi_id, account_name, account_number, ifsc_code, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, requestedAmount, upi_id || null, account_name.trim(), account_number.trim(), ifsc_code.trim(), 'pending']
      );

      await connection.commit();

      return res.json({
        success: true,
        message: 'Your payout withdrawal request has been logged successfully and was debited from your withdraw wallet.',
        data: {
          withdrawal_id: insertResult.insertId,
          amount: requestedAmount,
          new_withdraw_wallet: currentWithdrawWallet - requestedAmount
        }
      });

    } catch (transactionError) {
      await connection.rollback();
      return res.status(500).json({
        success: false,
        message: 'Failed to write transaction updates to the database: ' + transactionError.message
      });
    } finally {
      connection.release();
    }

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Global server crash registering withdrawal payout: ' + error.message,
      data: {}
    });
  }
};

/**
 * GET /api/withdrawals/history
 */
export const getWithdrawalsHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 10);
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(
      'SELECT id, amount, upi_id, account_name, account_number, ifsc_code, status, admin_note, requested_at, processed_at FROM withdrawals WHERE user_id = ? ORDER BY requested_at DESC LIMIT ? OFFSET ?',
      [userId, limit, offset]
    );

    const [countRows] = await pool.query('SELECT COUNT(id) as total FROM withdrawals WHERE user_id = ?', [userId]);
    const total = countRows[0].total;

    return res.json({
      success: true,
      message: 'User withdrawal history listed successfully.',
      data: {
        withdrawals: rows,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server failed retrieving withdrawals history: ' + error.message,
      data: {}
    });
  }
};

/**
 * GET /api/settings/upi
 */
export const getUpiSettings = async (req, res) => {
  try {
    const upiId = await getSiteSettingValue('upi_id', 'pay@dragonvstiger');
    // Generically fallback link to a standard generated qr mockup (Utilizes premium styling with custom qr lookup)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=${encodeURIComponent(upiId)}%26pn=DragonVsTigerCasino%26tn=WalletDeposit`;

    return res.json({
      success: true,
      message: 'System active payments UPI details retrieved successfully.',
      data: {
        upi_id: upiId,
        upi_qr_url: qrUrl
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error gathering system credentials settings: ' + error.message,
      data: {}
    });
  }
};

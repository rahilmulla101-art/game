import pool from '../config/db.js';
import walletService from '../services/walletService.js';

/**
 * GET /api/admin/dashboard
 * Aggregated platform metrics and analytics
 */
export const getDashboardStats = async (req, res) => {
  try {
    // 1. Total users
    const [totalUsersRows] = await pool.query('SELECT COUNT(id) as total FROM users');
    const totalUsers = totalUsersRows[0]?.total || 0;

    // 2. New users today
    const [newUsersRows] = await pool.query(
      'SELECT COUNT(id) as total FROM users WHERE DATE(created_at) = CURDATE()'
    );
    const newUsersToday = newUsersRows[0]?.total || 0;

    // 3. Active users today (placed bet today)
    const [activeUsersRows] = await pool.query(
      'SELECT COUNT(DISTINCT user_id) as total FROM bets WHERE DATE(created_at) = CURDATE()'
    );
    const activeUsersToday = activeUsersRows[0]?.total || 0;

    // 4. Total deposits today (approved only, sum)
    const [depositsRows] = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM deposits WHERE status = 'approved' AND DATE(submitted_at) = CURDATE()"
    );
    const totalDepositsToday = parseFloat(depositsRows[0]?.total || 0);

    // 5. Total withdrawals today (approved only, sum)
    const [withdrawalsRows] = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM withdrawals WHERE status = 'approved' AND DATE(requested_at) = CURDATE()"
    );
    const totalWithdrawalsToday = parseFloat(withdrawalsRows[0]?.total || 0);

    // 6. House profit today (sum of house wins/payout losses: bet_amount - payout_amount)
    const [houseProfitRows] = await pool.query(
      "SELECT COALESCE(SUM(bet_amount - payout_amount), 0) as profit FROM bets WHERE DATE(created_at) = CURDATE() AND status NOT IN ('pending', 'cancelled')"
    );
    const houseProfitToday = parseFloat(houseProfitRows[0]?.profit || 0);

    // 7. Pending deposits count
    const [pendingDepsRows] = await pool.query(
      "SELECT COUNT(id) as total FROM deposits WHERE status = 'pending'"
    );
    const pendingDepositsCount = pendingDepsRows[0]?.total || 0;

    // 8. Pending withdrawals count
    const [pendingWithsRows] = await pool.query(
      "SELECT COUNT(id) as total FROM withdrawals WHERE status = 'pending'"
    );
    const pendingWithdrawalsCount = pendingWithsRows[0]?.total || 0;

    // 9. Total bets today count
    const [totalBetsRows] = await pool.query(
      'SELECT COUNT(id) as total FROM bets WHERE DATE(created_at) = CURDATE()'
    );
    const totalBetsTodayCount = totalBetsRows[0]?.total || 0;

    return res.json({
      success: true,
      message: 'Dashboard stats compiled successfully.',
      data: {
        totalUsers,
        newUsersToday,
        activeUsersToday,
        totalDepositsToday,
        totalWithdrawalsToday,
        houseProfitToday,
        pendingDepositsCount,
        pendingWithdrawalsCount,
        totalBetsTodayCount
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to compile stats dashboard: ' + error.message,
      data: {}
    });
  }
};

/**
 * GET /api/admin/deposits
 * Query: status, page, limit, search(mobile)
 */
export const getDeposits = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const offset = (parsedPage - 1) * parsedLimit;

    let query = `
      SELECT d.id, d.user_id, d.amount, d.screenshot_url, d.utr_number, d.status, 
             d.admin_note, d.submitted_at, d.reviewed_at,
             u.full_name as user_full_name, u.mobile as user_mobile, u.username as user_username
      FROM deposits d
      JOIN users u ON d.user_id = u.id
      WHERE 1=1
    `;
    const queryParams = [];

    if (status) {
      query += ' AND d.status = ?';
      queryParams.push(status);
    }

    if (search) {
      query += ' AND (u.mobile LIKE ? OR u.full_name LIKE ? OR d.utr_number LIKE ?)';
      const searchWildcard = `%${search}%`;
      queryParams.push(searchWildcard, searchWildcard, searchWildcard);
    }

    query += ' ORDER BY d.submitted_at DESC LIMIT ? OFFSET ?';
    queryParams.push(parsedLimit, offset);

    const [rows] = await pool.query(query, queryParams);

    // Build count query
    let countQuery = `
      SELECT COUNT(d.id) as total
      FROM deposits d
      JOIN users u ON d.user_id = u.id
      WHERE 1=1
    `;
    const countParams = [];

    if (status) {
      countQuery += ' AND d.status = ?';
      countParams.push(status);
    }

    if (search) {
      countQuery += ' AND (u.mobile LIKE ? OR u.full_name LIKE ? OR d.utr_number LIKE ?)';
      const searchWildcard = `%${search}%`;
      countParams.push(searchWildcard, searchWildcard, searchWildcard);
    }

    const [countRows] = await pool.query(countQuery, countParams);
    const total = countRows[0]?.total || 0;

    return res.json({
      success: true,
      message: 'Deposits ledger loaded successfully.',
      data: {
        deposits: rows,
        pagination: {
          total,
          page: parsedPage,
          limit: parsedLimit,
          totalPages: Math.ceil(total / parsedLimit)
        }
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch deposits: ' + error.message,
      data: {}
    });
  }
};

/**
 * POST /api/admin/deposits/:id/approve
 */
export const approveDeposit = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const depositId = req.params.id;
    const adminId = req.admin.id;

    await connection.beginTransaction();

    // 1. Fetch deposit mapping with transaction lock
    const [deposits] = await connection.query(
      'SELECT id, user_id, amount, status, utr_number FROM deposits WHERE id = ? FOR UPDATE',
      [depositId]
    );

    if (!deposits || deposits.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Deposit transaction record not found.'
      });
    }

    const targetDeposit = deposits[0];

    if (targetDeposit.status !== 'pending') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `This deposit request has already been ${targetDeposit.status}.`
      });
    }

    // 2. Commit internal database lock before calling cross-module balance operations
    await connection.commit();

    // 3. Credit wallet balance using centralized walletService
    const depositAmount = parseFloat(targetDeposit.amount);
    let newBalanceInfo;
    try {
      newBalanceInfo = await walletService.addBalance(
        targetDeposit.user_id,
        depositAmount,
        'deposit',
        depositId,
        `Approved deposit of ₹${depositAmount.toFixed(2)} (UTR: ${targetDeposit.utr_number})`
      );
    } catch (balanceErr) {
      return res.status(400).json({
        success: false,
        message: 'Balance addition failed: ' + balanceErr.message
      });
    }

    // 4. Update the deposit status inside transactions safely
    await pool.query(
      'UPDATE deposits SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['approved', adminId, depositId]
    );

    return res.json({
      success: true,
      message: `Deposit of size ₹${depositAmount.toFixed(2)} successfully credited to user's wallet.`,
      data: {
        deposit_id: depositId,
        new_balance: newBalanceInfo.newBalance
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to approve deposit slip: ' + error.message,
      data: {}
    });
  } finally {
    connection.release();
  }
};

/**
 * POST /api/admin/deposits/:id/reject
 * Payload: { note }
 */
export const rejectDeposit = async (req, res) => {
  try {
    const depositId = req.params.id;
    const { note } = req.body;
    const adminId = req.admin.id;

    const [deposits] = await pool.query(
      'SELECT id, status, amount FROM deposits WHERE id = ?',
      [depositId]
    );

    if (!deposits || deposits.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Deposit transaction record not found.'
      });
    }

    const targetDeposit = deposits[0];

    if (targetDeposit.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This deposit has already been processed with status: ${targetDeposit.status}.`
      });
    }

    await pool.query(
      'UPDATE deposits SET status = ?, admin_note = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['rejected', note || 'Invalid or missing transfer confirmation proof.', adminId, depositId]
    );

    return res.json({
      success: true,
      message: 'Deposit request has been rejected successfully.',
      data: { deposit_id: depositId }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to reject deposit ticket: ' + error.message,
      data: {}
    });
  }
};

/**
 * GET /api/admin/withdrawals
 * Query: status, page, limit, search
 */
export const getWithdrawals = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const offset = (parsedPage - 1) * parsedLimit;

    let query = `
      SELECT w.id, w.user_id, w.amount, w.upi_id, w.account_name, w.account_number, 
             w.ifsc_code, w.status, w.admin_note, w.requested_at, w.processed_at,
             u.full_name as user_full_name, u.mobile as user_mobile, u.username as user_username
      FROM withdrawals w
      JOIN users u ON w.user_id = u.id
      WHERE 1=1
    `;
    const queryParams = [];

    if (status) {
      query += ' AND w.status = ?';
      queryParams.push(status);
    }

    if (search) {
      query += ' AND (u.mobile LIKE ? OR u.full_name LIKE ? OR w.account_number LIKE ?)';
      const searchWildcard = `%${search}%`;
      queryParams.push(searchWildcard, searchWildcard, searchWildcard);
    }

    query += ' ORDER BY w.requested_at DESC LIMIT ? OFFSET ?';
    queryParams.push(parsedLimit, offset);

    const [rows] = await pool.query(query, queryParams);

    // Build count
    let countQuery = `
      SELECT COUNT(w.id) as total
      FROM withdrawals w
      JOIN users u ON w.user_id = u.id
      WHERE 1=1
    `;
    const countParams = [];

    if (status) {
      countQuery += ' AND w.status = ?';
      countParams.push(status);
    }

    if (search) {
      countQuery += ' AND (u.mobile LIKE ? OR u.full_name LIKE ? OR w.account_number LIKE ?)';
      const searchWildcard = `%${search}%`;
      countParams.push(searchWildcard, searchWildcard, searchWildcard);
    }

    const [countRows] = await pool.query(countQuery, countParams);
    const total = countRows[0]?.total || 0;

    return res.json({
      success: true,
      message: 'Withdrawals ledger fetched successfully.',
      data: {
        withdrawals: rows,
        pagination: {
          total,
          page: parsedPage,
          limit: parsedLimit,
          totalPages: Math.ceil(total / parsedLimit)
        }
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to extract withdrawals list: ' + error.message,
      data: {}
    });
  }
};

/**
 * POST /api/admin/withdrawals/:id/approve
 */
export const approveWithdrawal = async (req, res) => {
  try {
    const withdrawalId = req.params.id;

    const [withdrawals] = await pool.query(
      'SELECT id, status, amount FROM withdrawals WHERE id = ?',
      [withdrawalId]
    );

    if (!withdrawals || withdrawals.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal payout target record not found.'
      });
    }

    const targetWithdrawal = withdrawals[0];

    if (targetWithdrawal.status !== 'pending' && targetWithdrawal.status !== 'processing') {
      return res.status(400).json({
        success: false,
        message: `This payout request has already been processed with status: ${targetWithdrawal.status}.`
      });
    }

    await pool.query(
      'UPDATE withdrawals SET status = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['approved', withdrawalId]
    );

    return res.json({
      success: true,
      message: 'payout withdrawal has been marked as approved & successfully executed.',
      data: { withdrawal_id: withdrawalId }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error approving withdrawal: ' + error.message,
      data: {}
    });
  }
};

/**
 * POST /api/admin/withdrawals/:id/reject
 * Payload: { note }
 */
export const rejectWithdrawal = async (req, res) => {
  try {
    const withdrawalId = req.params.id;
    const { note } = req.body;

    const [withdrawals] = await pool.query(
      'SELECT id, user_id, amount, status FROM withdrawals WHERE id = ?',
      [withdrawalId]
    );

    if (!withdrawals || withdrawals.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal record not found.'
      });
    }

    const targetWithdrawal = withdrawals[0];

    if (targetWithdrawal.status !== 'pending' && targetWithdrawal.status !== 'processing') {
      return res.status(400).json({
        success: false,
        message: `This payout request is not in editable state. Status is: ${targetWithdrawal.status}.`
      });
    }

    // Since withdrawal was debited at the time of request, we refund the user's funds
    const refundAmount = parseFloat(targetWithdrawal.amount);
    let refundBalanceInfo;
    try {
      refundBalanceInfo = await walletService.addBalance(
        targetWithdrawal.user_id,
        refundAmount,
        'withdrawal_refund',
        withdrawalId,
        `Rejected withdrawal payout refund: ${note || 'Admin rejection'}`
      );
    } catch (refundErr) {
      return res.status(100).json({
        success: false,
        message: 'Could not credit the refunded balance back: ' + refundErr.message
      });
    }

    await pool.query(
      'UPDATE withdrawals SET status = ?, admin_note = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['rejected', note || 'Payout transfer credentials verification mismatch.', withdrawalId]
    );

    return res.json({
      success: true,
      message: `Withdrawal rejected successfully & ₹${refundAmount.toFixed(2)} was refunded back to user's wallet.`,
      data: {
        withdrawal_id: withdrawalId,
        new_balance: refundBalanceInfo.newBalance
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server failed to reject payout: ' + error.message,
      data: {}
    });
  }
};

/**
 * GET /api/admin/users
 * Query: search, status, page, limit
 */
export const getUsers = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const offset = (parsedPage - 1) * parsedLimit;

    let query = `
      SELECT id, mobile, full_name, username, wallet_balance, referral_code, 
             referred_by, is_banned, status, created_at,
             (SELECT COUNT(id) FROM bets WHERE user_id = users.id) as total_bets,
             (SELECT COALESCE(SUM(amount), 0) FROM deposits WHERE user_id = users.id AND status = 'approved') as total_deposited,
             (SELECT COALESCE(SUM(amount), 0) FROM withdrawals WHERE user_id = users.id AND status = 'approved') as total_withdrawn
      FROM users
      WHERE 1=1
    `;
    const queryParams = [];

    if (status) {
      if (status === 'banned') {
        query += ' AND is_banned = 1';
      } else if (status === 'active') {
        query += ' AND is_banned = 0 AND status = "active"';
      }
    }

    if (search) {
      query += ' AND (mobile LIKE ? OR full_name LIKE ? OR username LIKE ?)';
      const searchWildcard = `%${search}%`;
      queryParams.push(searchWildcard, searchWildcard, searchWildcard);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(parsedLimit, offset);

    const [rows] = await pool.query(query, queryParams);

    // Get count
    let countQuery = 'SELECT COUNT(id) as total FROM users WHERE 1=1';
    const countParams = [];

    if (status) {
      if (status === 'banned') {
        countQuery += ' AND is_banned = 1';
      } else if (status === 'active') {
        countQuery += ' AND is_banned = 0 AND status = "active"';
      }
    }

    if (search) {
      countQuery += ' AND (mobile LIKE ? OR full_name LIKE ? OR username LIKE ?)';
      const searchWildcard = `%${search}%`;
      countParams.push(searchWildcard, searchWildcard, searchWildcard);
    }

    const [countRows] = await pool.query(countQuery, countParams);
    const total = countRows[0]?.total || 0;

    return res.json({
      success: true,
      message: 'Platform players list loaded successfully.',
      data: {
        users: rows,
        pagination: {
          total,
          page: parsedPage,
          limit: parsedLimit,
          totalPages: Math.ceil(total / parsedLimit)
        }
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve platform users: ' + error.message,
      data: {}
    });
  }
};

/**
 * GET /api/admin/users/:id
 * full user profile analysis
 */
export const getUserDetail = async (req, res) => {
  try {
    const userId = req.params.id;

    // 1. Core Profile Details
    const [users] = await pool.query(
      `SELECT id, mobile, full_name, username, wallet_balance, referral_code, 
              referred_by, is_banned, status, created_at,
              (SELECT COUNT(id) FROM bets WHERE user_id = ?) as total_bets,
              (SELECT COALESCE(SUM(bet_amount), 0) FROM bets WHERE user_id = ?) as total_bet_amount,
              (SELECT COALESCE(SUM(payout_amount), 0) FROM bets WHERE user_id = ? AND status = 'won') as total_payout_returned,
              (SELECT COALESCE(SUM(amount), 0) FROM deposits WHERE user_id = ? AND status = 'approved') as total_deposited,
              (SELECT COALESCE(SUM(amount), 0) FROM withdrawals WHERE user_id = ? AND status = 'approved') as total_withdrawn
       FROM users WHERE id = ?`,
      [userId, userId, userId, userId, userId, userId]
    );

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No user registered matching this ID.'
      });
    }

    const coreUserObj = users[0];

    // 2. Recent bets (last 10)
    const [bets] = await pool.query(
      `SELECT b.id, b.bet_on, b.bet_amount, b.payout_amount, b.status, b.created_at,
              g.round_number, g.result, g.dragon_card, g.tiger_card
       FROM bets b
       JOIN game_rounds g ON b.round_id = g.id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC LIMIT 10`,
      [userId]
    );

    // 3. Recent deposits (last 5)
    const [deposits] = await pool.query(
      'SELECT id, amount, screenshot_url, utr_number, status, admin_note, submitted_at FROM deposits WHERE user_id = ? ORDER BY submitted_at DESC LIMIT 5',
      [userId]
    );

    // 4. Recent withdrawals (last 5)
    const [withdrawals] = await pool.query(
      'SELECT id, amount, upi_id, account_name, account_number, ifsc_code, status, admin_note, requested_at FROM withdrawals WHERE user_id = ? ORDER BY requested_at DESC LIMIT 5',
      [userId]
    );

    return res.json({
      success: true,
      message: 'Detailed analytics for user loaded successfully.',
      data: {
        user: coreUserObj,
        recentBets: bets,
        recentDeposits: deposits,
        recentWithdrawals: withdrawals
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error searching user detail specs: ' + error.message,
      data: {}
    });
  }
};

/**
 * POST /api/admin/users/:id/ban
 */
export const toggleBanUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const [users] = await pool.query('SELECT id, is_banned, status FROM users WHERE id = ?', [userId]);
    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User profile target not found.'
      });
    }

    const currentBanStatus = users[0].is_banned;
    const nextBanStatus = currentBanStatus === 1 ? 0 : 1;
    const nextStatusText = nextBanStatus === 1 ? 'banned' : 'active';

    await pool.query(
      'UPDATE users SET is_banned = ?, status = ? WHERE id = ?',
      [nextBanStatus, nextStatusText, userId]
    );

    return res.json({
      success: true,
      message: `User ban parameter successfully changed to: ${nextBanStatus === 1 ? 'BANNED' : 'ACTIVE'}.`,
      data: {
        user_id: userId,
        is_banned: nextBanStatus,
        status: nextStatusText
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to toggle player status limits: ' + error.message,
      data: {}
    });
  }
};

/**
 * POST /api/admin/users/:id/add-balance
 * Payload: { amount, note }
 */
export const manualAddBalance = async (req, res) => {
  try {
    const userId = req.params.id;
    const { amount, note } = req.body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please mention a valid non-zero amount.'
      });
    }

    let resultBalanceInfo;
    if (parsedAmount > 0) {
      // Credit bonus to user
      resultBalanceInfo = await walletService.addBalance(
        userId,
        parsedAmount,
        'bonus',
        null,
        note || `Administrative manual credit adjustment: ₹${parsedAmount.toFixed(2)}`
      );
    } else {
      // Deduct balance manually (using absolute size of negative number)
      resultBalanceInfo = await walletService.deductBalance(
        userId,
        Math.abs(parsedAmount),
        'withdrawal',
        null, // No reference receipt
        note || `Administrative manual debit adjustment of ₹${Math.abs(parsedAmount).toFixed(2)}`
      );
    }

    return res.json({
      success: true,
      message: `Administrative balance adjustment of ₹${parsedAmount.toFixed(2)} processed successfully.`,
      data: {
        user_id: userId,
        amount: parsedAmount,
        new_balance: resultBalanceInfo.newBalance
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed manual balance modification step: ' + error.message,
      data: {}
    });
  }
};

/**
 * GET /api/admin/game/rounds
 * Paginated game rounds lists with total bet statistics
 */
export const getGameRoundsList = async (req, res) => {
  try {
    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 10);
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(
      `SELECT id, round_number, status, result, dragon_card, tiger_card, seed_hash, seed, 
              total_bets_dragon, total_bets_tiger, total_bets_tie, created_at,
              (SELECT COUNT(id) FROM bets WHERE round_id = game_rounds.id) as total_bets_placed
       FROM game_rounds
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [countRows] = await pool.query('SELECT COUNT(id) as total FROM game_rounds');
    const total = countRows[0]?.total || 0;

    return res.json({
      success: true,
      message: 'Rounds statistics dashboard loaded.',
      data: {
        rounds: rows,
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
      message: 'Failed to aggregate rounds list: ' + error.message,
      data: {}
    });
  }
};

/**
 * GET /api/admin/settings
 * Map Site Config arrays to simple JSON output KV pairs
 */
export const getSettings = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM site_settings');
    
    // Map list of key value pairs directly into single object
    const keyValuePair = {};
    rows.forEach(item => {
      keyValuePair[item.setting_key] = item.setting_value;
    });

    return res.json({
      success: true,
      message: 'Active configurations listed.',
      data: keyValuePair
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to look up system settings: ' + error.message,
      data: {}
    });
  }
};

/**
 * PUT /api/admin/settings
 * Update existing settings key pair
 */
export const updateSettings = async (req, res) => {
  try {
    const changesObj = req.body;

    if (!changesObj || typeof changesObj !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid payload format. Expected setting keys to values object mapping.'
      });
    }

    // Execute bulk upsert statements securely
    for (const [key, val] of Object.entries(changesObj)) {
      await pool.query(
        'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
        [key, String(val)]
      );
    }

    return res.json({
      success: true,
      message: 'Configuration variables updated successfully.',
      data: {}
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed updating configuration registries: ' + error.message,
      data: {}
    });
  }
};

/**
 * GET /api/admin/tickets
 * Query: status, page, limit
 */
export const getSupportTickets = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const offset = (parsedPage - 1) * parsedLimit;

    let query = `
      SELECT t.id, t.user_id, t.subject, t.message, t.status, t.admin_reply, t.created_at,
             u.full_name as user_full_name, u.mobile as user_mobile, u.username as user_username
      FROM support_tickets t
      JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const queryParams = [];

    if (status) {
      query += ' AND t.status = ?';
      queryParams.push(status);
    }

    query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(parsedLimit, offset);

    const [rows] = await pool.query(query, queryParams);

    // Count tickets
    let countQuery = `
      SELECT COUNT(t.id) as total
      FROM support_tickets t
      JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const countParams = [];

    if (status) {
      countQuery += ' AND t.status = ?';
      countParams.push(status);
    }

    const [countRows] = await pool.query(countQuery, countParams);
    const total = countRows[0]?.total || 0;

    return res.json({
      success: true,
      message: 'Support tickets loaded successfully.',
      data: {
        tickets: rows,
        pagination: {
          total,
          page: parsedPage,
          limit: parsedLimit,
          totalPages: Math.ceil(total / parsedLimit)
        }
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve support queries: ' + error.message,
      data: {}
    });
  }
};

/**
 * POST /api/admin/tickets/:id/reply
 * Payload: { reply }
 */
export const replySupportTicket = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { reply } = req.body;

    if (!reply || reply.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please include a standard non-empty reply message.'
      });
    }

    const [tickets] = await pool.query('SELECT id FROM support_tickets WHERE id = ?', [ticketId]);
    if (!tickets || tickets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No support ticket registered under this ID.'
      });
    }

    await pool.query(
      'UPDATE support_tickets SET admin_reply = ?, status = ? WHERE id = ?',
      [reply.trim(), 'resolved', ticketId]
    );

    return res.json({
      success: true,
      message: 'Support query ticket resolved and reply submitted successfully.',
      data: { ticket_id: ticketId }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed replying to support ticket query: ' + error.message,
      data: {}
    });
  }
};

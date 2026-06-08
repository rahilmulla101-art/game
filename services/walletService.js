import pool from '../config/db.js';

/**
 * atomic wallet balance addition handler utilizing MySQL transactions.
 * Lock the user row using FOR UPDATE to prevent concurrency/race condition hazards.
 */
export const addBalance = async (userId, amount, type, referenceId = null, description = null) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Fetch & lock the user profile row
    const [userRows] = await connection.query(
      'SELECT id, wallet_balance FROM users WHERE id = ? FOR UPDATE',
      [userId]
    );

    if (!userRows || userRows.length === 0) {
      throw new Error('User account not found.');
    }

    const balanceBefore = parseFloat(userRows[0].wallet_balance);
    const balanceAfter = balanceBefore + parseFloat(amount);

    // 2. Perform the update operation
    await connection.query(
      'UPDATE users SET wallet_balance = ? WHERE id = ?',
      [balanceAfter, userId]
    );

    // 3. Log the audit transaction ledger row
    const [txnResult] = await connection.query(
      'INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, reference_id, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, type, amount, balanceBefore, balanceAfter, referenceId, description]
    );

    await connection.commit();
    return {
      newBalance: balanceAfter,
      transactionId: txnResult.insertId
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * atomic wallet balance deduction handler utilizing MySQL transactions.
 * Lock the user row using FOR UPDATE to prevent concurrency/race condition hazards.
 */
export const deductBalance = async (userId, amount, type, referenceId = null, description = null) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Fetch & lock the user profile row
    const [userRows] = await connection.query(
      'SELECT id, wallet_balance FROM users WHERE id = ? FOR UPDATE',
      [userId]
    );

    if (!userRows || userRows.length === 0) {
      throw new Error('User account not found.');
    }

    const balanceBefore = parseFloat(userRows[0].wallet_balance);
    const deductAmount = parseFloat(amount);

    if (balanceBefore < deductAmount) {
      throw new Error('Insufficient wallet balance to perform this operation.');
    }

    const balanceAfter = balanceBefore - deductAmount;

    // 2. Perform the update operation
    await connection.query(
      'UPDATE users SET wallet_balance = ? WHERE id = ?',
      [balanceAfter, userId]
    );

    // 3. Log the audit transaction ledger row
    const [txnResult] = await connection.query(
      'INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, reference_id, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, type, deductAmount, balanceBefore, balanceAfter, referenceId, description]
    );

    await connection.commit();
    return {
      newBalance: balanceAfter,
      transactionId: txnResult.insertId
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Fetch a user's wallet balance directly without transactions
 */
export const getBalance = async (userId) => {
  const [rows] = await pool.query(
    'SELECT wallet_balance, withdraw_wallet FROM users WHERE id = ?', 
    [userId]
  );
  if (!rows || rows.length === 0) {
    throw new Error('User profile not found.');
  }
  return {
    wallet_balance: parseFloat(rows[0].wallet_balance),
    withdraw_wallet: parseFloat(rows[0].withdraw_wallet || 0)
  };
};

/**
 * Retrieve paginated transaction ledger list filtering by optional types
 */
export const getTransactions = async (userId, page = 1, limit = 10, type = null) => {
  const offset = (page - 1) * limit;
  let query = 'SELECT id, type, amount, balance_before, balance_after, reference_id, description, created_at FROM transactions WHERE user_id = ?';
  const queryParams = [userId];

  if (type) {
    query += ' AND type = ?';
    queryParams.push(type);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  queryParams.push(parseInt(limit), parseInt(offset));

  const [rows] = await pool.query(query, queryParams);

  // Get total count
  let countQuery = 'SELECT COUNT(id) as total FROM transactions WHERE user_id = ?';
  const countParams = [userId];
  if (type) {
    countQuery += ' AND type = ?';
    countParams.push(type);
  }
  const [countRows] = await pool.query(countQuery, countParams);
  const total = countRows[0].total;

  return {
    transactions: rows,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    }
  };
};

export default {
  addBalance,
  deductBalance,
  getBalance,
  getTransactions
};

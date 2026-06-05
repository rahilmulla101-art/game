import pool from '../config/db.js';
import walletService from '../services/walletService.js';
import gameEngine from '../services/gameEngine.js';
import { emitToAll } from '../socket/socketHandler.js';

/**
 * POST /api/bets/place
 * Request payload: { round_id, bet_on, bet_amount }
 */
export const placeBet = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.user.id;
    const { round_id, bet_on, bet_amount } = req.body;

    const parsedAmount = parseFloat(bet_amount);

    // 1. Validation checklist checks
    if (!round_id || !bet_on || isNaN(parsedAmount)) {
      return res.status(400).json({
        success: false,
        message: 'Missing or invalid parameters: round_id, bet_on, and bet_amount are required.'
      });
    }

    if (!['dragon', 'tiger', 'tie'].includes(bet_on)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target selection. Bet position must be: dragon, tiger, or tie.'
      });
    }

    if (parsedAmount < 10) {
      return res.status(400).json({
        success: false,
        message: 'Minimum allowed betting deposit INR limit is ₹10.00.'
      });
    }

    await connection.beginTransaction();

    // 2. Fetch round status with LOCK to prevent race conditions
    const [rounds] = await connection.query(
      'SELECT id, status, total_bets_dragon, total_bets_tiger, total_bets_tie FROM game_rounds WHERE id = ? FOR UPDATE',
      [round_id]
    );

    if (!rounds || rounds.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'The requested game round was not found in active database.'
      });
    }

    const targetRound = rounds[0];

    if (targetRound.status !== 'betting_open') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Betting is closed for this round. Status is currently: ${targetRound.status}.`
      });
    }

    // 3. Confirm user has not already bet on this specific outcome (unique constraint safeguard check)
    const [existingBet] = await connection.query(
      'SELECT id FROM bets WHERE user_id = ? AND round_id = ? AND bet_on = ?',
      [userId, round_id, bet_on]
    );

    if (existingBet && existingBet.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `You already placed a bet on ${bet_on.toUpperCase()} in this round. Please select another option.`
      });
    }

    // 4. Deduct wallet balance atomically utilizing transactions inside db
    try {
      // Release connection temporarily or run directly on connection
      await connection.commit(); // commit current lock block so service can do transaction safely
    } catch (txnErr) {
      console.error(txnErr);
    }
    
    // Call deduct balance service
    let deductionData;
    try {
      deductionData = await walletService.deductBalance(
        userId,
        parsedAmount,
        'bet_placed',
        null,
        `Placed ₹${parsedAmount} bet on ${bet_on.toUpperCase()} for round ID: ${round_id}`
      );
    } catch (deductErr) {
      return res.status(400).json({
        success: false,
        message: 'Failed to debit wallet: ' + deductErr.message
      });
    }

    // 5. Re-acquire transactional integrity lock to insert bet securely
    await connection.beginTransaction();

    const [betInsert] = await connection.query(
      'INSERT INTO bets (user_id, round_id, bet_on, bet_amount, status) VALUES (?, ?, ?, ?, ?)',
      [userId, round_id, bet_on, parsedAmount, 'pending']
    );

    const insertedBetId = betInsert.insertId;

    // 6. Update round betting pool aggregates column
    let targetColumn = 'total_bets_dragon';
    if (bet_on === 'tiger') targetColumn = 'total_bets_tiger';
    if (bet_on === 'tie') targetColumn = 'total_bets_tie';

    await connection.query(
      `UPDATE game_rounds SET ${targetColumn} = ${targetColumn} + ? WHERE id = ?`,
      [parsedAmount, round_id]
    );

    // Fetch refreshed totals
    const [updatedTotals] = await connection.query(
      'SELECT total_bets_dragon, total_bets_tiger, total_bets_tie FROM game_rounds WHERE id = ?',
      [round_id]
    );

    await connection.commit();

    // Attach reference id to transaction
    try {
      await pool.query(
        'UPDATE transactions SET reference_id = ? WHERE id = ?',
        [insertedBetId, deductionData.transactionId]
      );
    } catch (uErr) {
      console.error('Non-critical: Reference ID mapping log warning:', uErr.message);
    }

    // 7. Emit active betting volume update to all live players
    const io = global.io; // reference mapped globally in server initialization
    if (io && updatedTotals && updatedTotals.length > 0) {
      emitToAll(io, 'round_update', {
        round_id,
        total_dragon: parseFloat(updatedTotals[0].total_bets_dragon),
        total_tiger: parseFloat(updatedTotals[0].total_bets_tiger),
        total_tie: parseFloat(updatedTotals[0].total_bets_tie),
        total_bets_pool: parseFloat(updatedTotals[0].total_bets_dragon) + parseFloat(updatedTotals[0].total_bets_tiger) + parseFloat(updatedTotals[0].total_bets_tie)
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Bet placed successfully inside verified game ledger.',
      data: {
        bet_id: insertedBetId,
        round_id,
        bet_on,
        bet_amount: parsedAmount,
        wallet_balance: deductionData.newBalance
      }
    });

  } catch (error) {
    await connection.rollback();
    return res.status(500).json({
      success: false,
      message: 'Server failed to process wagering transaction: ' + error.message,
      data: {}
    });
  } finally {
    connection.release();
  }
};

/**
 * GET /api/bets/history
 */
export const getMyBetsHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 10);
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(
      `SELECT b.id, b.bet_on, b.bet_amount, b.payout_amount, b.status, b.created_at,
              g.round_number, g.result, g.dragon_card, g.tiger_card, g.seed_hash, g.seed
       FROM bets b
       JOIN game_rounds g ON b.round_id = g.id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    const [countRows] = await pool.query('SELECT COUNT(id) as total FROM bets WHERE user_id = ?', [userId]);
    const total = countRows[0].total;

    return res.json({
      success: true,
      message: 'Fetched customer bets ledger successfully.',
      data: {
        bets: rows,
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
      message: 'Failed to harvest bet history logs: ' + error.message,
      data: {}
    });
  }
};

/**
 * GET /api/game/current-round
 */
export const getCurrentRoundData = async (req, res) => {
  try {
    const activeRound = gameEngine.getCurrentRound();
    if (activeRound) {
      return res.json({
        success: true,
        message: 'Active room cycle status harvested.',
        data: activeRound
      });
    }

    // Dynamic database fallback search in case engine loop is cold-starting
    const [rows] = await pool.query(
      'SELECT id, round_number, status, seed_hash, total_bets_dragon, total_bets_tiger, total_bets_tie, betting_closes_at FROM game_rounds ORDER BY created_at DESC LIMIT 1'
    );

    if (rows && rows.length > 0) {
      const dbRound = rows[0];
      const diff = new Date(dbRound.betting_closes_at).getTime() - Date.now();
      const timeLeft = Math.max(0, Math.ceil(diff / 1000));

      return res.json({
        success: true,
        message: 'Active room cycle status harvested from database registry.',
        data: {
          round_id: dbRound.id,
          round_number: dbRound.round_number,
          seed_hash: dbRound.seed_hash,
          betting_closes_at: dbRound.betting_closes_at,
          status: dbRound.status,
          total_dragon: parseFloat(dbRound.total_bets_dragon),
          total_tiger: parseFloat(dbRound.total_bets_tiger),
          total_tie: parseFloat(dbRound.total_bets_tie),
          timeLeft
        }
      });
    }

    return res.status(404).json({
      success: false,
      message: 'No rounds instantiated in database yet.',
      data: null
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to access active lobby status: ' + error.message,
      data: null
    });
  }
};

/**
 * GET /api/game/rounds
 */
export const getLastCompletedRounds = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, round_number, result, dragon_card, tiger_card, seed_hash, seed, 
              total_bets_dragon, total_bets_tiger, total_bets_tie, created_at
       FROM game_rounds
       WHERE status = ?
       ORDER BY created_at DESC
       LIMIT 20`,
      ['completed']
    );

    return res.json({
      success: true,
      message: 'Retrieved last 20 completed match ledger logs.',
      data: rows
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve completed rounds ledger: ' + error.message,
      data: []
    });
  }
};

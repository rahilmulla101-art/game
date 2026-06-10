import pool from '../config/db.js';

/**
 * GET /api/user/profile
 * Returns the logged-in user's profile details.
 */
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT id, mobile, full_name, username, wallet_balance, referral_code, 
              (SELECT COUNT(id) FROM bets WHERE user_id = users.id) as total_bets,
              created_at, status
       FROM users WHERE id = ?`,
      [userId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
        data: {}
      });
    }

    return res.json({
      success: true,
      message: 'Profile retrieved successfully.',
      data: rows[0]
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile: ' + error.message,
      data: {}
    });
  }
};

/**
 * PUT /api/user/profile
 * Updates the user's name or username.
 */
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, username } = req.body;

    if (!full_name && !username) {
      return res.status(400).json({
        success: false,
        message: 'Provide at least full_name or username to update.'
      });
    }

    // Uniqueness validation if username is updated
    if (username) {
      const cleanUsername = username.trim();
      const [existingUser] = await pool.query(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [cleanUsername, userId]
      );
      if (existingUser && existingUser.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken by another player.'
        });
      }
    }

    // Dynamically build the UPDATE query
    let updateFields = [];
    let queryParams = [];

    if (full_name) {
      updateFields.push('full_name = ?');
      queryParams.push(full_name.trim());
    }
    if (username) {
      updateFields.push('username = ?');
      queryParams.push(username.trim());
    }

    queryParams.push(userId);

    await pool.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      queryParams
    );

    // Fetch updated user profile
    const [rows] = await pool.query(
      `SELECT id, mobile, full_name, username, wallet_balance, referral_code, created_at, status 
       FROM users WHERE id = ?`,
      [userId]
    );

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: rows[0]
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Profile update failed: ' + error.message,
      data: {}
    });
  }
};

/**
 * GET /api/user/stats
 * Aggregates and returns personal gamer stats and streaks.
 */
export const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Fetch aggregated stats from bets (integrating won filter for total wins & highest payout)
    const [statsRows] = await pool.query(
      `SELECT 
         COUNT(id) as total_bets,
         COALESCE(SUM(CASE WHEN status = 'won' THEN payout_amount ELSE 0 END), 0) as total_won,
         COALESCE(SUM(CASE WHEN status = 'lost' THEN bet_amount ELSE 0 END), 0) as total_lost,
         COALESCE(MAX(CASE WHEN status = 'won' THEN payout_amount ELSE 0 END), 0) as biggest_win
       FROM bets 
       WHERE user_id = ?`,
      [userId]
    );

    const stats = statsRows[0] || { total_bets: 0, total_won: 0, total_lost: 0, biggest_win: 0 };
    const totalBets = parseInt(stats.total_bets);

    // 2. Compute dynamic win rate
    let winRate = 0;
    if (totalBets > 0) {
      const [winsCountRows] = await pool.query(
        "SELECT COUNT(id) as wins_count FROM bets WHERE user_id = ? AND status = 'won'",
        [userId]
      );
      const winsCount = winsCountRows[0]?.wins_count || 0;
      winRate = parseFloat(((winsCount / totalBets) * 100).toFixed(2));
    }

    // 3. Streak tracker logic (most recent consecutive wins)
    const [recentBets] = await pool.query(
      "SELECT status FROM bets WHERE user_id = ? AND status IN ('won', 'lost') ORDER BY created_at DESC LIMIT 50",
      [userId]
    );

    let currentStreak = 0;
    for (const bet of recentBets) {
      if (bet.status === 'won') {
        currentStreak++;
      } else if (bet.status === 'lost') {
        break; // Streak is broken on the latest loss
      }
    }

    // 4. Fetch Referrals counters
    const [referralCountRows] = await pool.query(
      'SELECT COUNT(id) as total_referrals FROM referrals WHERE referrer_id = ?',
      [userId]
    );
    const totalReferrals = referralCountRows[0]?.total_referrals || 0;

    const [referralEarningsRows] = await pool.query(
      "SELECT COALESCE(SUM(bonus_amount), 0) as referral_earnings FROM referrals WHERE referrer_id = ? AND bonus_credited = 1",
      [userId]
    );
    const totalReferralEarnings = parseFloat(referralEarningsRows[0]?.referral_earnings || 0);

    // 5. Retain exact diagnostic keys to keep client side intact
    return res.json({
      success: true,
      message: 'Gamification stats aggregated.',
      data: {
        total_bets: totalBets,
        total_won: parseFloat(stats.total_won),
        total_lost: parseFloat(stats.total_lost),
        win_rate_pct: winRate,
        biggest_single_win: parseFloat(stats.biggest_win),
        current_win_streak: currentStreak,
        total_referrals: totalReferrals,
        total_referral_earnings: totalReferralEarnings
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to aggregate statistics: ' + error.message,
      data: {}
    });
  }
};

/**
 * GET /api/user/referrals
 * List of users referred by this platform user.
 */
export const getUserReferralsList = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT u.username, u.created_at as joined_date, r.bonus_amount as bonus_earned
       FROM referrals r
       JOIN users u ON r.referred_id = u.id
       WHERE r.referrer_id = ?
       ORDER BY r.created_at DESC`,
      [userId]
    );

    return res.json({
      success: true,
      message: 'Referred affiliates list retrieved.',
      data: {
        referrals: rows
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching referrals: ' + error.message,
      data: {}
    });
  }
};

/**
 * Common builder helper function for Leaderboards
 */
const buildLeaderboard = async (timeframeCondition, timeframeParams = []) => {
  let query = `
    SELECT 
      u.username,
      COALESCE(SUM(b.payout_amount), 0) as total_won,
      COUNT(b.id) as total_bets,
      COALESCE(ROUND((COUNT(CASE WHEN b.status = 'won' THEN 1 END) / COUNT(b.id)) * 100, 2), 0) as win_rate
    FROM users u
    JOIN bets b ON u.id = b.user_id
    WHERE b.status = 'won'
  `;

  if (timeframeCondition) {
    query += ` AND ${timeframeCondition}`;
  }

  query += `
    GROUP BY u.id, u.username
    ORDER BY total_won DESC
    LIMIT 100
  `;

  const [rows] = await pool.query(query, timeframeParams);
  
  // Format rank indices
  const rankedItems = rows.map((item, idx) => ({
    rank: idx + 1,
    username: item.username,
    total_won: parseFloat(item.total_won),
    total_bets: parseInt(item.total_bets),
    win_rate: parseFloat(item.win_rate)
  }));

  return rankedItems;
};

/**
 * GET /api/leaderboard/alltime
 */
export const getLeaderboardAlltime = async (req, res) => {
  try {
    const data = await buildLeaderboard(null);
    return res.json({
      success: true,
      message: 'All-time platform leaderboards structured successfully.',
      data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed loading leaderboards: ' + error.message,
      data: []
    });
  }
};

/**
 * GET /api/leaderboard/weekly
 */
export const getLeaderboardWeekly = async (req, res) => {
  try {
    // Bets placed in the last 7 calendar days
    const data = await buildLeaderboard('b.created_at >= DATE_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)');
    return res.json({
      success: true,
      message: 'Weekly platform leaderboards structured successfully.',
      data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed loading leaderboards: ' + error.message,
      data: []
    });
  }
};

/**
 * GET /api/leaderboard/today
 */
export const getLeaderboardToday = async (req, res) => {
  try {
    // Bets placed today
    const data = await buildLeaderboard('DATE(b.created_at) = CURDATE()');
    return res.json({
      success: true,
      message: 'Daily platform leaderboards structured successfully.',
      data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed loading leaderboards: ' + error.message,
      data: []
    });
  }
};

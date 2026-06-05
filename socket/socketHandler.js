import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

// Track active sockets mapped by userId simple tracking
const userSockets = new Map();

// Track round bet totals for real-time broadcasting
let roundBetTotals = new Map();

// Track dummy/simulated bet totals (for UI display only, separate from real bets)
let roundDummyBetTotals = new Map();

// Track dummy betting intervals to prevent concurrent timers
let dummyBettingIntervals = new Map();

export const emitToAll = (io, event, data) => {
  if (io) {
    io.to('game_room').emit(event, data);
  }
};

export const emitToUser = (io, userId, event, data) => {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
  }
};

export const initRoundBetTotals = (roundId) => {
  roundBetTotals.set(roundId, { dragon: 0, tiger: 0, tie: 0 });
};

export const clearRoundBetTotals = (roundId) => {
  roundBetTotals.delete(roundId);
};

export const getRoundBetTotals = (roundId) => {
  return roundBetTotals.get(roundId) || { dragon: 0, tiger: 0, tie: 0 };
};

export const initRoundDummyBetTotals = (roundId) => {
  roundDummyBetTotals.set(roundId, { dragon: 0, tiger: 0, tie: 0 });
};

export const getRoundDummyBetTotals = (roundId) => {
  return roundDummyBetTotals.get(roundId) || { dragon: 0, tiger: 0, tie: 0 };
};

export const clearRoundDummyBetTotals = (roundId) => {
  roundDummyBetTotals.delete(roundId);
};

/**
 * Start dummy/simulated betting that runs every 0.25 seconds during betting window
 * Randomly selects amount and side, adds to dummy totals (displayed to players)
 * Real totals remain untouched for winner calculation
 */
export const startDummyBetting = (roundId) => {
  // Prevent multiple dummy betting timers for same round
  if (dummyBettingIntervals.has(roundId)) {
    return;
  }

  const CHIP_VALUES = [10, 50, 100, 500, 1000];
  const SIDES = ['dragon', 'tiger', 'tie'];

  const interval = setInterval(() => {
    const randomAmount = CHIP_VALUES[Math.floor(Math.random() * CHIP_VALUES.length)];
    const randomSide = SIDES[Math.floor(Math.random() * SIDES.length)];

    const dummyTotals = getRoundDummyBetTotals(roundId);
    dummyTotals[randomSide] += randomAmount;

    // console.log(`🤖 DUMMY BET: ${randomSide.toUpperCase()} +₹${randomAmount} | Total Dummy Bets - Dragon: ₹${dummyTotals.dragon}, Tiger: ₹${dummyTotals.tiger}, Tie: ₹${dummyTotals.tie}`);
  }, 250); // Every 0.25 seconds

  dummyBettingIntervals.set(roundId, interval);
};

/**
 * Stop dummy betting for a round (called when betting closes)
 */
export const stopDummyBetting = (roundId) => {
  if (dummyBettingIntervals.has(roundId)) {
    clearInterval(dummyBettingIntervals.get(roundId));
    dummyBettingIntervals.delete(roundId);
  }
};

export const initSocketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Cyber Casino WebSocket client connected: ${socket.id}`);

    // Join general game lobby room immediately for public broadcasts
    socket.join('game_room');

    /**
     * Authenticate socket client and map to a distinct user channel
     */
    socket.on('join_game', async (payload) => {
      try {
        const token = payload?.token;
        if (!token) {
          socket.emit('socket_error', { message: 'Missing authenticating token.' });
          return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_dragon_vs_tiger_key');
        const userId = decoded.id;

        // Associate user to discrete channels for secure point-to-point emissions
        socket.join(`user_${userId}`);
        userSockets.set(userId, socket.id);

        console.log(`🎮 Player connected real-time. UserID: ${userId} joined room user_${userId}`);
        
        socket.emit('joined_successfully', {
          success: true,
          userId,
          message: 'Secure channel connection established.'
        });

      } catch (err) {
        socket.emit('socket_error', { message: 'Failed to verify auth signature: ' + err.message });
      }
    });

    /**
     * Handle bet placement from client
     */
    socket.on('place_bet', async (payload) => {
      try {
        const { token, round_id, bet_side, bet_amount } = payload;

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_dragon_vs_tiger_key');
        const userId = decoded.id;

        // Validate bet_side
        if (!['dragon', 'tiger', 'tie'].includes(bet_side)) {
          socket.emit('bet_error', { message: 'Invalid bet side.' });
          return;
        }

        // Validate bet_amount
        if (!bet_amount || bet_amount <= 0) {
          socket.emit('bet_error', { message: 'Invalid bet amount.' });
          return;
        }

        // Check if betting is still open
        const [roundData] = await pool.query(
          'SELECT id, status FROM game_rounds WHERE id = ?',
          [round_id]
        );

        if (!roundData || roundData.length === 0) {
          socket.emit('bet_error', { message: 'Round not found.' });
          return;
        }

        if (roundData[0].status !== 'betting_open') {
          socket.emit('bet_error', { message: 'Betting is closed for this round.' });
          return;
        }

        // Check user balance
        const [userWallet] = await pool.query(
          'SELECT wallet_balance FROM users WHERE id = ?',
          [userId]
        );

        if (!userWallet || userWallet.length === 0 || userWallet[0].wallet_balance < bet_amount) {
          socket.emit('bet_error', { message: 'Insufficient balance.' });
          return;
        }

        // Place bet in database
        await pool.query(
          'INSERT INTO bets (user_id, round_id, bet_on, bet_amount, status) VALUES (?, ?, ?, ?, ?)',
          [userId, round_id, bet_side, bet_amount, 'pending']
        );

        // Deduct from user balance immediately
        await pool.query(
          'UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?',
          [bet_amount, userId]
        );

        // Update round bet totals
        const totals = getRoundBetTotals(round_id);
        totals[bet_side] += bet_amount;

        // 📊 SERVER-SIDE LOGGING
        console.log(`💰 BET PLACED:
   User ID: ${userId}
   Round ID: ${round_id}
   Bet Side: ${bet_side.toUpperCase()}
   Bet Amount: ₹${bet_amount}
   Timestamp: ${new Date().toISOString()}
   ─────────────────────────────
   ROUND TOTALS:
   🐉 Dragon: ₹${totals.dragon}
   🐅 Tiger: ₹${totals.tiger}
   🤝 Tie: ₹${totals.tie}
   ═════════════════════════════`);

        // Fetch updated balance
        const [updatedUser] = await pool.query(
          'SELECT wallet_balance FROM users WHERE id = ?',
          [userId]
        );
        const userBalance = updatedUser[0]?.wallet_balance || 0;

        // Confirm bet to user with updated balance
        socket.emit('bet_confirmed', {
          success: true,
          round_id,
          bet_side,
          bet_amount,
          user_balance: parseFloat(userBalance),
          message: `Bet placed on ${bet_side.toUpperCase()}!`
        });

        // Broadcast updated totals to all players (display dummy + real combined)
        io.to('game_room').emit('totals_updated', {
          round_id,
          dragon: totals.dragon,
          tiger: totals.tiger,
          tie: totals.tie
        });

      } catch (err) {
        console.error('❌ Bet placement error:', err.message);
        socket.emit('bet_error', { message: 'Failed to place bet: ' + err.message });
      }
    });

    socket.on('disconnect', () => {
      // Find and remove socket trace safely
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          console.log(`💼 User ${userId} disconnected from custom socket channels.`);
          break;
        }
      }
      console.log(`🔌 WebSocket client disconnected: ${socket.id}`);
    });
  });

  // Color game is handled by color_server.js. Do not start colorSocketHandler.js here,
  // otherwise two engines decide results on the same /color namespace.
};

export default {
  initSocketHandler,
  emitToAll,
  emitToUser,
  initRoundBetTotals,
  clearRoundBetTotals,
  getRoundBetTotals,
  initRoundDummyBetTotals,
  getRoundDummyBetTotals,
  clearRoundDummyBetTotals,
  startDummyBetting,
  stopDummyBetting
};

/**
 * Color Game Engine
 * Manages game rounds, color selection, payout logic
 */

import pool from '../config/db.js';

const COLOR_CHOICES = ['red', 'green', 'violet'];
const BETTING_WINDOW = 30; // seconds
const RESULT_WAIT_TIME = 3; // seconds before showing result

class ColorGameEngine {
  constructor() {
    this.currentRoundId = null;
    this.roundStartTime = null;
    this.roundTimer = null;
    this.bettingClosed = false;
  }

  /**
   * Initialize color game - create first round
   */
  async initializeGame() {
    try {
      const periodNumber = Math.floor(Date.now() / 1000);
      
      const [result] = await pool.query(
        `INSERT INTO color_rounds (period_number, status, betting_open_at)
         VALUES (?, 'betting_open', NOW())`,
        [periodNumber]
      );

      this.currentRoundId = result.insertId;
      this.roundStartTime = Date.now();
      this.bettingClosed = false;

      console.log(`✅ Color Round ${periodNumber} Started - Round ID: ${this.currentRoundId}`);
      return this.currentRoundId;
    } catch (error) {
      console.error('Error initializing color game:', error);
      throw error;
    }
  }

  /**
   * Start betting countdown for a round
   */
  startBettingCountdown(io, roundDuration = BETTING_WINDOW) {
    if (this.roundTimer) {
      clearInterval(this.roundTimer);
    }

    let timeRemaining = roundDuration;
    const roundId = this.currentRoundId;

    this.roundTimer = setInterval(() => {
      timeRemaining--;

      // Emit time update to all clients
      if (io) {
        io.to('/color').emit('timeUpdate', {
          timeRemaining: timeRemaining,
          round: this.currentRoundId
        });
      }

      // When time runs out
      if (timeRemaining <= 0) {
        clearInterval(this.roundTimer);
        this.bettingClosed = true;
        
        // Emit betting closed event
        if (io) {
          io.to('/color').emit('bettingClosed', {
            round: roundId
          });
        }

        console.log(`⏱️ Betting closed for Round ${roundId}`);
        
        // Wait and then declare result
        setTimeout(() => {
          this.declareResult(io, roundId);
        }, RESULT_WAIT_TIME * 1000);
      }
    }, 1000);
  }

  /**
   * Select random winning color and process results
   */
  async declareResult(io, roundId) {
    try {
      const winningColor = COLOR_CHOICES[Math.floor(Math.random() * COLOR_CHOICES.length)];
      const winningNumber = Math.floor(Math.random() * 10); // 0-9 for number bets

      console.log(`🎲 Result - Round ${roundId}: ${winningColor.toUpperCase()}`);

      const connection = await pool.getConnection();
      await connection.beginTransaction();

      // Update round with result
      await connection.query(
        `UPDATE color_rounds SET status = 'result_declared', winning_color = ?, 
         winning_number = ?, result_declared_at = NOW() WHERE id = ?`,
        [winningColor, winningNumber, roundId]
      );

      // Get all bets for this round
      const [bets] = await connection.query(
        `SELECT cb.id, cb.user_id, cb.bet_on, cb.bet_amount, u.wallet_balance, cb.bet_type
         FROM color_bets cb
         JOIN users u ON cb.user_id = u.id
         WHERE cb.round_id = ? AND cb.status = 'pending'`,
        [roundId]
      );

      let totalWinners = 0;
      let totalWinningsPaid = 0;
      const winnersList = [];

      // Process each bet
      if (bets && bets.length > 0) {
        for (const bet of bets) {
          let betWon = false;
          let payout = 0;

          // Check if bet matches winning color
          if (bet.bet_type === 'color' && bet.bet_on === winningColor) {
            betWon = true;
            // Color bets pay 2:1
            payout = bet.bet_amount * 2;
          }
          // Check if bet matches winning number
          else if (bet.bet_type === 'number' && bet.bet_on === winningNumber.toString()) {
            betWon = true;
            // Number bets pay 9:1
            payout = bet.bet_amount * 9;
          }

          if (betWon) {
            // Mark bet as won
            await connection.query(
              `UPDATE color_bets SET status = 'won', winnings = ? WHERE id = ?`,
              [payout, bet.id]
            );

            // Add payout to wallet
            await connection.query(
              `UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?`,
              [payout, bet.user_id]
            );

            // Update stats
            await connection.query(
              `UPDATE user_color_stats SET total_winnings = total_winnings + ?, 
               wins = wins + 1 WHERE user_id = ?`,
              [payout, bet.user_id]
            );

            totalWinners++;
            totalWinningsPaid += payout;

            winnersList.push({
              userId: bet.user_id,
              betOn: bet.bet_on,
              amount: bet.bet_amount,
              payout: payout
            });

            console.log(`✅ Winner: User ${bet.user_id} won ₹${payout} on ${bet.bet_on}`);
          } else {
            // Mark bet as lost
            await connection.query(
              `UPDATE color_bets SET status = 'lost' WHERE id = ?`,
              [bet.id]
            );

            // Update stats
            await connection.query(
              `UPDATE user_color_stats SET losses = losses + 1 WHERE user_id = ?`,
              [bet.user_id]
            );
          }
        }
      }

      // Calculate house profit
      const [roundTotals] = await connection.query(
        `SELECT (total_bets_red + total_bets_green + total_bets_violet + total_bets_number) as total_bets
         FROM color_rounds WHERE id = ?`,
        [roundId]
      );

      const totalBets = roundTotals[0]?.total_bets || 0;
      const houseProfit = totalBets - totalWinningsPaid;

      // Store result in history
      await connection.query(
        `INSERT INTO color_results_history (round_id, winning_color, winning_number, total_winners, total_winnings_paid, house_profit)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [roundId, winningColor, winningNumber, totalWinners, totalWinningsPaid, houseProfit]
      );

      await connection.commit();
      connection.release();

      // Emit result to all clients
      if (io) {
        io.to('/color').emit('gameResult', {
          round: roundId,
          winning_color: winningColor,
          winning_number: winningNumber,
          total_winners: totalWinners,
          total_payouts: totalWinningsPaid,
          winners: winnersList
        });
      }

      // Start next round after delay
      setTimeout(() => {
        this.startNewRound(io);
      }, 5000);

    } catch (error) {
      console.error('Error declaring result:', error);
    }
  }

  /**
   * Start a new round
   */
  async startNewRound(io) {
    try {
      await this.initializeGame();
      
      if (io) {
        const [round] = await pool.query(
          'SELECT id, period_number FROM color_rounds WHERE id = ?',
          [this.currentRoundId]
        );

        io.to('/color').emit('newRoundStarted', {
          round_id: round[0].id,
          period_number: round[0].period_number,
          betting_duration: BETTING_WINDOW
        });
      }

      // Start countdown
      this.startBettingCountdown(io, BETTING_WINDOW);
    } catch (error) {
      console.error('Error starting new round:', error);
    }
  }

  /**
   * Emit number array (previous results)
   */
  async emitNumberArray(io) {
    try {
      const [results] = await pool.query(
        `SELECT COALESCE(crh.winning_number, 
                CASE 
                  WHEN crh.winning_color = 'red' THEN 0
                  WHEN crh.winning_color = 'green' THEN 1
                  WHEN crh.winning_color = 'violet' THEN 2
                  ELSE 0
                END) as result
         FROM color_results_history crh
         ORDER BY crh.declared_at DESC LIMIT 10`,
      );

      const numberArray = results.map(r => r.result);

      if (io) {
        io.to('/color').emit('numberArray', {
          gameResults: numberArray.reverse()
        });
      }
    } catch (error) {
      console.error('Error emitting number array:', error);
    }
  }

  /**
   * Stop game timers
   */
  stopGame() {
    if (this.roundTimer) {
      clearInterval(this.roundTimer);
    }
  }

  /**
   * Get current game state
   */
  async getGameState() {
    try {
      const [round] = await pool.query(
        `SELECT * FROM color_rounds WHERE id = ? LIMIT 1`,
        [this.currentRoundId]
      );

      return round[0] || null;
    } catch (error) {
      console.error('Error getting game state:', error);
      return null;
    }
  }
}

export default new ColorGameEngine();

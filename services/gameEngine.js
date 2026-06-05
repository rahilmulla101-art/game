import crypto from 'crypto';
import pool from '../config/db.js';
import walletService from './walletService.js';
import { 
  emitToAll, 
  emitToUser, 
  initRoundBetTotals, 
  clearRoundBetTotals,
  initRoundDummyBetTotals,
  clearRoundDummyBetTotals,
  startDummyBetting,
  stopDummyBetting
} from '../socket/socketHandler.js';

// Game parameters configurations
const HOUSE_EDGE = 0.0964; // Default setting database fallback

// Store active timer reference to prevent concurrent scheduling overlaps
let gameLoopTimeout = null;
let currentRoundData = null;

/**
 * Generate cryptographically secure random bytes seed and matching SHA256 seed_hash value
 */
export const generateSeed = () => {
  const seed = crypto.randomBytes(32).toString('hex');
  const seed_hash = crypto.createHash('sha256').update(seed).digest('hex');
  return { seed, seed_hash };
};

/**
 * Determine deterministic card values drawn based on seed and winner side
 * Winner's card will ALWAYS be higher value than loser
 */
export const determineResult = (seed, winnerSide) => {
  const hash = crypto.createHash('sha256').update(seed).digest('hex');

  const CARD_VALUES = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  const SUITS = ['♠', '♥', '♦', '♣'];

  // Generate winner card (high value: J, Q, K)
  const winnerValIdx = parseInt(hash.substring(0, 8), 16) % 3 + 10; // 10=J, 11=Q, 12=K
  const winnerSuitIdx = parseInt(hash.substring(8, 16), 16) % 4;

  // Generate loser card (low value: A-10)
  let loserValIdx = parseInt(hash.substring(16, 24), 16) % 10; // 0=A, 1-9=2-10
  let loserSuitIdx = parseInt(hash.substring(24, 32), 16) % 4;

  // Ensure different suits for visual variety
  if (loserSuitIdx === winnerSuitIdx) {
    loserSuitIdx = (loserSuitIdx + 1) % 4;
  }

  let dragon_card, tiger_card;

  if (winnerSide === 'dragon') {
    dragon_card = `${CARD_VALUES[winnerValIdx]}${SUITS[winnerSuitIdx]}`;
    tiger_card = `${CARD_VALUES[loserValIdx]}${SUITS[loserSuitIdx]}`;
  } else if (winnerSide === 'tiger') {
    tiger_card = `${CARD_VALUES[winnerValIdx]}${SUITS[winnerSuitIdx]}`;
    dragon_card = `${CARD_VALUES[loserValIdx]}${SUITS[loserSuitIdx]}`;
  } else {
    // Tie: both get high cards
    dragon_card = `${CARD_VALUES[winnerValIdx]}${SUITS[winnerSuitIdx]}`;
    tiger_card = `${CARD_VALUES[winnerValIdx]}${SUITS[(winnerSuitIdx + 1) % 4]}`;
  }

  return {
    result: winnerSide,
    dragon_card,
    tiger_card
  };
};

/**
 * Determine winner based on betting totals (underdog/lowest total wins)
 * Only considers sides with actual bets placed
 * Multipliers: Dragon=2x, Tiger=2x, Tie=5x
 */
export const determineResultByBettingTotals = (dragonTotal, tigerTotal, tieTotal) => {
  const DRAGON_MULTIPLIER = 2;
  const TIGER_MULTIPLIER = 2;
  const TIE_MULTIPLIER = 5;

  // Filter out sides with 0 bets
  const sidesWithBets = [];
  if (dragonTotal > 0) sidesWithBets.push({ side: 'dragon', total: dragonTotal * DRAGON_MULTIPLIER, raw: dragonTotal });
  if (tigerTotal > 0) sidesWithBets.push({ side: 'tiger', total: tigerTotal * TIGER_MULTIPLIER, raw: tigerTotal });
  if (tieTotal > 0) sidesWithBets.push({ side: 'tie', total: tieTotal * TIE_MULTIPLIER, raw: tieTotal });

  // If no bets placed at all, default to dragon
  if (sidesWithBets.length === 0) {
    console.log(`⚠️  NO BETS PLACED - Defaulting to DRAGON`);
    return 'dragon';
  }

  // If only one side has bets, that side LOSES - underdog (no bets) wins
  if (sidesWithBets.length === 1) {
    const allSides = ['dragon', 'tiger', 'tie'];
    const underdog = allSides.filter(side => side !== sidesWithBets[0].side);
    const winner = underdog[Math.floor(Math.random() * underdog.length)];
    console.log(`⚠️  ONLY ${sidesWithBets[0].side.toUpperCase()} HAS BETS - ${winner.toUpperCase()} WINS (Underdog with 0 bets)!`);
    return winner;
  }

  // Sort by adjusted total (ascending) - lowest wins (underdog)
  sidesWithBets.sort((a, b) => a.total - b.total);

  console.log(`📊 BETTING TOTALS ANALYSIS:
   🐉 Dragon: ${dragonTotal > 0 ? `₹${dragonTotal} × ${DRAGON_MULTIPLIER} = ${dragonTotal * DRAGON_MULTIPLIER}` : '₹0 (NO BETS)'}
   🐅 Tiger: ${tigerTotal > 0 ? `₹${tigerTotal} × ${TIGER_MULTIPLIER} = ${tigerTotal * TIGER_MULTIPLIER}` : '₹0 (NO BETS)'}
   🤝 Tie: ${tieTotal > 0 ? `₹${tieTotal} × ${TIE_MULTIPLIER} = ${tieTotal * TIE_MULTIPLIER}` : '₹0 (NO BETS)'}
   ────────────────────────────────────────`);

  const winner = sidesWithBets[0].side;
  console.log(`🏆 WINNER: ${winner.toUpperCase()} (Lowest adjusted total: ${sidesWithBets[0].total})`);
  
  return winner;
};

/**
 * Perform bulk payouts checks, balance additions, and transactional updates atomically of active round bets
 */
export const settleBets = async (roundId, result, io) => {
  try {
    // 1. Fetch all pending place-bets related to this round
    const [bets] = await pool.query(
      'SELECT id, user_id, bet_on, bet_amount FROM bets WHERE round_id = ? AND status = ?',
      [roundId, 'pending']
    );

    if (!bets || bets.length === 0) {
      console.log(`ℹ️ No bets registered to resolve for round ID: ${roundId}`);
      return;
    }

    console.log(`🎯 Resolving ${bets.length} recorded bets for round ID: ${roundId} with result: ${result.toUpperCase()}`);

    for (const bet of bets) {
      const { id: betId, user_id: userId, bet_on: betOn, bet_amount: betAmount } = bet;
      const parsedAmount = parseFloat(betAmount);

      try {
        if (betOn === result) {
          // USER WON DRAGON/TIGER MATCH
          let payoutMultiplier = 2; // Dragon and Tiger standard multiplier factor
          if (result === 'tie') {
            payoutMultiplier = 7; // Tie standard specified payout multiplier
          }

          const payout = parsedAmount * payoutMultiplier * (1 - HOUSE_EDGE);
          
          // Deposit credits back into customer wallet
          await walletService.addBalance(
            userId,
            payout,
            'bet_won',
            betId,
            `Bet won on round ID: ${roundId} (Outcome: ${result.toUpperCase()})`
          );

          // Record win status details
          await pool.query(
            'UPDATE bets SET status = ?, payout_amount = ? WHERE id = ?',
            ['won', payout, betId]
          );

          // Notify consumer securely via WebSocket
          emitToUser(io, userId, 'bet_settled', {
            won: true,
            betId,
            award: payout,
            message: `Congratulations! Your bet on ${betOn.toUpperCase()} won. Awarded ₹${payout.toFixed(2)}.`
          });

        } else if (result === 'tie' && betOn !== 'tie') {
          // TIE REFUND INITIATIVE (Refund standard stake in full)
          await walletService.addBalance(
            userId,
            parsedAmount,
            'tie_refund',
            betId,
            `Full tie refund on round ID: ${roundId}`
          );

          await pool.query(
            'UPDATE bets SET status = ?, payout_amount = ? WHERE id = ?',
            ['tie_refund', parsedAmount, betId]
          );

          emitToUser(io, userId, 'bet_settled', {
            won: false,
            refund: true,
            betId,
            award: parsedAmount,
            message: `Game outcome is TIE. Your bet placed on ${betOn.toUpperCase()} was refunded in full.`
          });

        } else {
          // USER LOST
          await pool.query('UPDATE bets SET status = ? WHERE id = ?', ['lost', betId]);

          emitToUser(io, userId, 'bet_settled', {
            won: false,
            betId,
            message: `Your bet placed on ${betOn.toUpperCase()} lost.`
          });
        }
      } catch (betError) {
        console.error(`❌ Failed resolving bet ID: ${betId} for user ID: ${userId}:`, betError.message);
      }
    }
  } catch (err) {
    console.error('❌ Failed executing settleBets engine workflow block:', err.message);
  }
};

/**
 * Handle recursive orchestrating game state lifecycle (betting_open -> betting_closed -> reveal)
 * New complete cycles happen sequentially every 30 seconds
 */
export const startNewRound = async (io) => {
  try {
    // 1. Calculate next sequential daily identifier number
    let round_number = '';
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const date = String(today.getDate()).padStart(2, '0');
      const dateStr = `${year}${month}${date}`;

      const [rows] = await pool.query(
        "SELECT COUNT(id) as today_rounds FROM game_rounds WHERE DATE(created_at) = CURDATE()"
      );
      const nextSeq = (rows[0]?.today_rounds || 0) + 1;
      round_number = `RD-${dateStr}-${String(nextSeq).padStart(3, '0')}`;
    } catch (dbErr) {
      round_number = `RD-${Date.now()}`;
    }

    const { seed, seed_hash } = generateSeed();
    const betting_closes_at = new Date(Date.now() + 20 * 1000); // 20 seconds betting duration

    // 2. Insert into system DB
    const [insertResult] = await pool.query(
      'INSERT INTO game_rounds (round_number, status, seed, seed_hash, betting_closes_at) VALUES (?, ?, ?, ?, ?)',
      [round_number, 'betting_open', seed, seed_hash, betting_closes_at]
    );

    const roundId = insertResult.insertId;

    // Initialize bet totals tracking for this round
    initRoundBetTotals(roundId);

    // Initialize dummy bet totals for this round
    initRoundDummyBetTotals(roundId);

    // Start dummy/simulated betting (4 bets per second)
    startDummyBetting(roundId);

    currentRoundData = {
      round_id: roundId,
      round_number,
      seed_hash,
      betting_closes_at: betting_closes_at.toISOString(),
      status: 'betting_open',
      timeLeft: 20
    };

    console.log(`🎲 Starting Round: ${round_number} (ID: ${roundId}) with seed hash: ${seed_hash}`);

    // Emit live round details via Socket IO
    emitToAll(io, 'round_start', currentRoundData);

    // Sequence Event 1: Close active betting slips after 20 seconds
    gameLoopTimeout = setTimeout(async () => {
      try {
        await pool.query(
          "UPDATE game_rounds SET status = ? WHERE id = ?",
          ['betting_closed', roundId]
        );

        if (currentRoundData) {
          currentRoundData.status = 'betting_closed';
          currentRoundData.timeLeft = 0;
        }

        console.log(`🔒 Betting doors closed for Round: ${round_number}`);
        emitToAll(io, 'betting_closed', { round_id: roundId });

        // Stop dummy betting when betting closes
        stopDummyBetting(roundId);

        // Sequence Event 2: Calculate, save and reveal results after 5 additional seconds animation delay
        gameLoopTimeout = setTimeout(async () => {
          try {
            // Get the betting totals for this round
            const { getRoundBetTotals } = await import('../socket/socketHandler.js');
            const betTotals = getRoundBetTotals(roundId);

            // Determine winner based on betting totals (underdog wins)
            const { determineResultByBettingTotals } = await import('./gameEngine.js');
            const result = determineResultByBettingTotals(
              betTotals.dragon,
              betTotals.tiger,
              betTotals.tie
            );

            // Generate cards with winner-specific card values (winner gets higher cards)
            const { dragon_card, tiger_card } = determineResult(seed, result);

            await pool.query(
              'UPDATE game_rounds SET status = ?, result = ?, dragon_card = ?, tiger_card = ? WHERE id = ?',
              ['completed', result, dragon_card, tiger_card, roundId]
            );

            console.log(`🏆 Round ${round_number} Finished! Winner: ${result.toUpperCase()}, Cards: DRG: ${dragon_card} | TGR: ${tiger_card}`);

            emitToAll(io, 'round_result', {
              round_id: roundId,
              result,
              dragon_card,
              tiger_card,
              seed // Provably fair revealed seed
            });

            // Trigger settlement workflows
            await settleBets(roundId, result, io);

            // Clear bet totals after round completes
            clearRoundBetTotals(roundId);
            
            // Clear dummy totals after round completes
            clearRoundDummyBetTotals(roundId);

            // Sequence Event 3: Restart matching recursion step after 5 more seconds transition delay (Total cycle: 30 seconds)
            gameLoopTimeout = setTimeout(() => {
              startNewRound(io);
            }, 5 * 1000);

          } catch (resErr) {
            console.error('Error closing game result values:', resErr);
            // Self-healing attempt
            setTimeout(() => startNewRound(io), 5000);
          }
        }, 5 * 1000);

      } catch (closeErr) {
        console.error('Error locking betting window:', closeErr);
        setTimeout(() => startNewRound(io), 5000);
      }
    }, 20 * 1000);

  } catch (error) {
    console.error('❌ Failed creating round state sequence:', error.message);
    // Restart fallback trigger
    gameLoopTimeout = setTimeout(() => startNewRound(io), 5000);
  }
};

/**
 * Accessor callback to reveal currently operational active round configuration parameters
 */
export const getCurrentRound = () => {
  if (currentRoundData) {
    const diff = new Date(currentRoundData.betting_closes_at).getTime() - Date.now();
    currentRoundData.timeLeft = Math.max(0, Math.ceil(diff / 1000));
  }
  return currentRoundData;
};

/**
 * Start/Bootstrap database game loops context
 */
export const initGameEngine = (io) => {
  if (gameLoopTimeout) {
    clearTimeout(gameLoopTimeout);
  }
  console.log('🎰 Game engine loop initialized successfully.');
  startNewRound(io);
};

export default {
  initGameEngine,
  getCurrentRound,
  determineResult,
  determineResultByBettingTotals,
  generateSeed,
  settleBets
};

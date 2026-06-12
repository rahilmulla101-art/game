// Color Game Module
import jwt from 'jsonwebtoken';

export function initColorGame(io, con) {
   const db = con.promise ? con.promise() : con;
   
  const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_dragon_vs_tiger_key';
  var number = [5, 8, 7, 5, 3, 4, 6, 8, 6, 3];
  const userPastBetsMap = new Map();
  let colorGameState = {
    currentColor: null,
    timeRemaining: 30,
    round : 569897871323,
    bets: {
      red: new Map(),
      violet: new Map(),
      green: new Map(),
      0: new Map(),
      1: new Map(),
      2: new Map(),
      3: new Map(),
      4: new Map(),
      5: new Map(),
      6: new Map(),
      7: new Map(),
      8: new Map(),
      9: new Map()
    },
    totalBets: {
      red: 0,
      violet: 0,
      green: 0,
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
      7: 0,
      8: 0,
      9: 0
    },
    isSpinning: false
  };
  var color_won;
  var number_won;
  const colorNamespace = io.of('/color');

  function recordPastBet(userId, round, side, amount, winnings, isWin) {
    const pastList = userPastBetsMap.get(userId) || [];
    const timeString = new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour12: false });
    
    pastList.unshift({
      round: String(round),
      side: String(side).toUpperCase(),
      amount: Number(amount),
      result: isWin ? `+₹${Number(winnings).toFixed(2)}` : `-₹${Number(amount).toFixed(2)}`,
      isWin: isWin,
      time: timeString
    });
    
    // Limit log size to last 50 entries
    if (pastList.length > 50) pastList.splice(50);
    userPastBetsMap.set(userId, pastList);

    // Emit live updates back to this user if online
    const userSocket = Array.from(colorNamespace.sockets.values()).find(s => s.userId === userId);
    if (userSocket) {
      userSocket.emit("userCurrentBets", []);
      userSocket.emit("userPreviousBets", pastList);
    }
  }

  // Helper to construct a user's current round active bets
  function getUserCurrentBets(userId) {
    const current = [];
    for (const [key, map] of Object.entries(colorGameState.bets)) {
      if (map && map.has(userId)) {
        current.push({
          round: String(colorGameState.round),
          side: String(key).toUpperCase(),
          amount: Number(map.get(userId))
        });
      }
    }
    return current;
  }

  colorNamespace.on('connection', (socket) => {
    colorNamespace.emit('numberArray', number);
    console.log('A client connected to Color game namespace', socket.id);

    const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_dragon_vs_tiger_key';;

    socket.on('setUserId', async (token) => {
      console.log('Received token for authentication:', token);
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.userId = decoded.id;
        socket.userData = decoded;
        
        console.log('User authenticated:', socket.userId);

        socket.emit('auth_success', {
          userId: socket.userId
        });

      } catch (error) {
        console.error('❌ Invalid token:', error.message);
        socket.emit('auth_error', {
          message: 'Invalid token'
        });
        socket.disconnect();
        return;
      }

      const userId = socket.userId;
      console.log("Color game user connected:", userId);
      const userPastHistory = userPastBetsMap.get(userId) || [];
      const userActiveBets = getUserCurrentBets(userId);
      socket.emit("userCurrentBets", userActiveBets);
      socket.emit("userPreviousBets", userPastHistory);

      try {
        const connection = await con.getConnection();
        console.log("✅ Got database connection for user:", userId);

        try {
          // --- MODIFICATION 1: Fetching both balances and tracking them on the socket ---
          const [result] = await connection.query(
            "SELECT wallet_balance, withdraw_wallet FROM users WHERE id = ?",
            [userId]
          );

          if (result && result.length > 0) {
            const balance = Number(result[0].wallet_balance || 0);
            const withdraw = Number(result[0].withdraw_wallet || 0);
            
            socket.wallet_balance = balance;
            socket.withdraw_wallet = withdraw;
            socket.wallet = balance + withdraw; 
            
            socket.emit('updateWallet', socket.wallet);
            console.log(`💰 User ${userId} wallet: Total=${socket.wallet} (Balance=${balance}, Withdraw=${withdraw})`);
          } else {
            console.log(`❌ User ${userId} not found in database.`);
            socket.emit('walletError', { message: 'User not found' });
          }
        } catch (queryError) {
          console.error("❌ Error executing wallet query:", queryError.message);
          socket.emit('walletError', { message: 'Failed to fetch wallet' });
        } finally {
          connection.release();
        }
      } catch (connectionError) {
        console.error("❌ Error getting database connection:", connectionError.message);
        socket.emit('walletError', { message: 'Database connection error' });
      }
    });

    socket.on('placeBet', async (data) => {
      console.log('Received placeBet event:', data);
      const { colorOrNumber, amount } = data;
      
      if (colorGameState.isSpinning) {
        socket.emit('betError', 'Cannot place bet while wheel is spinning');
        return;
      }

      const userId = socket.userId;
      
      if (!userId) {
        socket.emit('betError', 'User not authenticated');
        return;
      }

      console.log(`User ${userId} placed bet: ${amount} on ${colorOrNumber}`);

      // Validate inputs
      if (!['red', 'violet', 'green', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(colorOrNumber)) {
        socket.emit('betError', 'Invalid color or number');
        return;
      }

      try {
        const connection = await con.getConnection();
        console.log("✅ Got database connection for bet placement");

        try {
          // --- MODIFICATION 2: Single select & logical split deduction (Solves 'result already declared' bug!) ---
          const [result] = await connection.query(
            "SELECT wallet_balance, withdraw_wallet FROM users WHERE id = ?",
            [userId]
          );

          if (!result || result.length === 0) {
            socket.emit('betError', 'User not found');
            return;
          }

          const wallet_balance = Number(result[0].wallet_balance || 0);
          const withdraw_wallet = Number(result[0].withdraw_wallet || 0);
          const total_balance = wallet_balance + withdraw_wallet;
          
          console.log(`User ${userId} - Balance: ${wallet_balance}, Withdraw Wallet: ${withdraw_wallet} (Total: ${total_balance})`);

          // Perform validation against combined balance
          if (total_balance < amount) {
            socket.emit('betError', 'Insufficient funds');
            console.log(`❌ User ${userId} insufficient balance to place bet of ${amount}`);
            return;
          }

          // Fetch current active round id
          const [activeRounds] = await connection.query(
            `SELECT id FROM color_rounds WHERE status = 'betting_open' ORDER BY id DESC LIMIT 1`
          );

          if (!activeRounds || activeRounds.length === 0) {
            socket.emit('betError', 'No active betting round found');
            console.log(`❌ No active round found for user ${userId}`);
            return;
          }

          const roundId = activeRounds[0].id;

          // Place the bet in game state
          colorGameState.bets[colorOrNumber].set(userId, (colorGameState.bets[colorOrNumber].get(userId) || 0) + amount);
          colorGameState.totalBets[colorOrNumber] += amount;
          console.log(`✅ Bet placed. Total bets on ${colorOrNumber}: ${colorGameState.totalBets[colorOrNumber]}`);

          // Split logic: standard wallet balance first, leftover goes to withdraw wallet
          let new_wallet_balance = wallet_balance;
          let new_withdraw_wallet = withdraw_wallet;

          if (wallet_balance >= amount) {
            new_wallet_balance -= amount;
          } else {
            const leftover = amount - wallet_balance;
            new_wallet_balance = 0;
            new_withdraw_wallet -= leftover;
          }

          // Cache on Socket instance state
          socket.wallet_balance = new_wallet_balance;
          socket.withdraw_wallet = new_withdraw_wallet;
          socket.wallet = new_wallet_balance + new_withdraw_wallet;

          // Update DB with splits
          await connection.query(
            "UPDATE users SET wallet_balance = ?, withdraw_wallet = ? WHERE id = ?",
            [new_wallet_balance, new_withdraw_wallet, userId]
          );
          
          console.log(`✅ User ${userId} wallet updated in DB. Remaining Balance: ${new_wallet_balance}, Remaining Withdraw: ${new_withdraw_wallet}`);

          // Insert bet record into the color_bets table
          const betType = ['red', 'violet', 'green'].includes(colorOrNumber) ? 'color' : 'number';
          await connection.query(
            `INSERT INTO color_bets 
             (round_id, user_id, bet_type, bet_on, bet_amount, status, winnings, placed_at, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
            [roundId, userId, betType, colorOrNumber, amount, 'pending', 0.00]
          );
          
          console.log(`✅ Bet recorded in color_bets table for user ${userId} on round ${roundId}`);

          // Emit events
          socket.emit('betPlaced', { colorOrNumber, amount });
          socket.emit('updateWallet', socket.wallet);
          colorNamespace.emit('updateTotalBets', colorGameState.totalBets);

        } catch (queryError) {
          console.error("❌ Error executing bet query:", queryError.message);
          socket.emit('betError', 'Database error during bet placement');
        } finally {
          connection.release();
        }
      } catch (connectionError) {
        console.error("❌ Error getting database connection:", connectionError.message);
        socket.emit('betError', 'Database connection error');
      }
    });

    // Get current round data (read-only)
    socket.on('getCurrentRound', async (callback) => {
      try {
        const connection = await con.getConnection();
        console.log("✅ Got database connection for getCurrentRound");

        try {
          const [result] = await connection.query(
            `SELECT id, period_number, status, total_bets_red, total_bets_green, 
                    total_bets_violet, total_bets_number, betting_open_at, betting_close_at
             FROM color_rounds WHERE status = 'betting_open' ORDER BY id DESC LIMIT 1`
          );

          if (result && result.length > 0) {
            callback({ success: true, round: result[0] });
          } else {
            callback({ success: false, message: 'No active round found' });
          }
        } catch (queryError) {
          console.error("❌ Error fetching current round:", queryError.message);
          callback({ success: false, message: 'Error fetching round data' });
        } finally {
          connection.release();
        }
      } catch (connectionError) {
        console.error("❌ Error getting database connection:", connectionError.message);
        callback({ success: false, message: 'Database connection error' });
      }
    });

    // Get game results history (read-only)
    socket.on('getGameHistory', async (limit, callback) => {
      const queryLimit = Math.min(parseInt(limit) || 20, 100);
      
      try {
        const connection = await con.getConnection();
        console.log("✅ Got database connection for getGameHistory");

        try {
          const [result] = await connection.query(
            `SELECT r.period_number, crh.winning_color, crh.winning_number, crh.total_winners, 
                    crh.total_winnings_paid, crh.declared_at
             FROM color_results_history crh
             JOIN color_rounds r ON crh.round_id = r.id
             ORDER BY crh.declared_at DESC LIMIT ?`,
            [queryLimit]
          );

          callback({ success: true, results: result || [] });
        } catch (queryError) {
          console.error("❌ Error fetching game history:", queryError.message);
          callback({ success: false, message: 'Error fetching history' });
        } finally {
          connection.release();
        }
      } catch (connectionError) {
        console.error("❌ Error getting database connection:", connectionError.message);
        callback({ success: false, message: 'Database connection error' });
      }
    });

    // Get user's color bets history (read-only)
    socket.on('getUserBets', async (callback) => {
      const userId = socket.userId;
      if (!userId) {
        callback({ success: false, message: 'User not authenticated' });
        return;
      }

      try {
        const connection = await con.getConnection();
        console.log("✅ Got database connection for getUserBets");

        try {
          const [result] = await connection.query(
            `SELECT cb.id, r.period_number, cb.bet_type, cb.bet_on, cb.bet_amount, 
                    cb.status, cb.winnings, cb.placed_at
             FROM color_bets cb
             JOIN color_rounds r ON cb.round_id = r.id
             WHERE cb.user_id = ?
             ORDER BY cb.placed_at DESC LIMIT 50`,
            [userId]
          );

          callback({ success: true, bets: result || [] });
        } catch (queryError) {
          console.error("❌ Error fetching user bets:", queryError.message);
          callback({ success: false, message: 'Error fetching bets' });
        } finally {
          connection.release();
        }
      } catch (connectionError) {
        console.error("❌ Error getting database connection:", connectionError.message);
        callback({ success: false, message: 'Database connection error' });
      }
    });

    // Get user color game stats (read-only)
    socket.on('getUserStats', async (callback) => {
      const userId = socket.userId;
      if (!userId) {
        callback({ success: false, message: 'User not authenticated' });
        return;
      }

      try {
        const connection = await con.getConnection();
        console.log("✅ Got database connection for getUserStats");

        try {
          const [result] = await connection.query(
            `SELECT total_bets_placed, total_bet_amount, total_winnings, wins, losses, last_bet_at
             FROM user_color_stats WHERE user_id = ?`,
            [userId]
          );

          if (result && result.length > 0) {
            callback({ success: true, stats: result[0] });
          } else {
            callback({
              success: true,
              stats: {
                total_bets_placed: 0,
                total_bet_amount: 0,
                total_winnings: 0,
                wins: 0,
                losses: 0,
                last_bet_at: null
              }
            });
          }
        } catch (queryError) {
          console.error("❌ Error fetching user stats:", queryError.message);
          callback({ success: false, message: 'Error fetching stats' });
        } finally {
          connection.release();
        }
      } catch (connectionError) {
        console.error("❌ Error getting database connection:", connectionError.message);
        callback({ success: false, message: 'Database connection error' });
      }
    });
  });

  async function startColorGame() {
    colorGameState.round++;
     const connection =  await con.getConnection();
  try {
    // 1. Generate a Period Number (Format: YYYYMMDD + sequence)
    // Example: 202310270001
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    
    // Get count of rounds today to increment sequence
    const [rows] = await
     connection.query(
      "SELECT COUNT(*) as count FROM color_rounds WHERE DATE(created_at) = CURDATE()"
    );
    const sequence = (rows[0].count + 1).toString().padStart(4, '0');
    const periodNumber = dateStr + sequence;

    // 2. Insert the new round into the database
    const [result] =  await connection.query(
      `INSERT INTO color_rounds (period_number, status, betting_open_at, created_at, updated_at) 
       VALUES (?, 'betting_open', NOW(), NOW(), NOW())`,
      [periodNumber]
    );

    // Update local state with the DB ID and Period Number
    colorGameState.dbId = result.insertId; 
    colorGameState.round = periodNumber; 
    
    console.log(`🚀 New Round Started: ID ${colorGameState.dbId}, Period ${periodNumber}`);

  } catch (err) {
    console.error("❌ Error starting new round in DB:", err);
  } finally {
    connection.release();
  }
    colorNamespace.emit('numberArray', number);
    colorGameState.timeRemaining = 30;
    colorGameState.isSpinning = false;
    colorNamespace.emit('bettingOpen');
    var period = colorGameState.round;
    const timer = setInterval(() => {
      const connectedUsers = colorNamespace.sockets.size;
      if (connectedUsers > 0) {
        const gameResults = Array.from({ length: 3 }, () => {
          const userId = Math.floor(Math.random() * 10000000000); // 10-digit user ID
          const number = Math.floor(Math.random() * 10);
          const color = ['green', 'red', 'violet'][Math.floor(Math.random() * 3)];
          const bet = Math.random() < 0.5 ? color : number.toString();
          const amount = (Math.floor(Math.random() * 50) + 900) * 10  ; // Random 3-digit number

          return { period, userId, bet, amount };
        });

        colorNamespace.emit('gameResultsArray', { gameResults });
      }
      
      colorGameState.timeRemaining--;
      colorNamespace.emit('timeUpdate', { timeRemaining: colorGameState.timeRemaining, round: colorGameState.round });
      if (colorGameState.timeRemaining <= 0) {
        clearInterval(timer);
        spinWheel();
      }
    }, 1000);
  } 
  async function spinWheel() {
    colorGameState.isSpinning = true;
    colorNamespace.emit('wheelSpinning');
          const winningNumber = await determineWinningColor();
          colorGameState.currentColor = winningNumber;

    if (colorGameState.dbId) {
    await processWinnings(winningNumber, colorGameState.dbId);
  }



    const result = winningNumber;
    colorGameState.currentColor = winningNumber;
    
    // await processWinnings(result);
    
    setTimeout(() => {
      colorNamespace.emit('gameResult', result);
      console.log(`✅ Game result: ${result}`);
      
      setTimeout(() => {
        resetGameState();
      }, 1000);
      
      setTimeout(startColorGame, 5000);
    }, 2000);
  }
async function getMultipliers() {
  try {
    const connection = await con.getConnection();
    // Querying based on setting_key
    const [rows] = await connection.query(
      "SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ('colors_multiplier', 'number_multiplier')"
    );
    connection.release();
    console.log("✅ Fetched multipliers from DB:", rows);

    // Default values
    let multipliers = { color: 2, number: 9 };

    if (rows && rows.length > 0) {
      rows.forEach(row => {
        if (row.setting_key === 'colors_multiplier') multipliers.color = Number(row.setting_value);
        if (row.setting_key === 'number_multiplier') multipliers.number = Number(row.setting_value);
      });
    }
    return multipliers;
  } catch (err) {
    console.error("❌ Error fetching multipliers from DB:", err);
    return { color: 2, number: 9 }; // Emergency fallback
  }
}

async function determineWinningColor() {
  const settings = await getMultipliers();
  const numMult = settings.number; 
  const colMult = settings.color;  
  
  // Ratios for special numbers 0 and 5
  const violetSplit = (numMult / 2) + 0.5; // e.g. 5 if numMult is 9
  const colorSplit = 0.5;                  // 0.5x win for red/green on 0/5

  const numberToColor = {
    0: 'violet', 1: 'green', 2: 'red', 3: 'green', 4: 'red',
    5: 'violet', 6: 'red', 7: 'green', 8: 'red', 9: 'green'
  };

  const potentialPayouts = Array(10).fill(0);

  for (let i = 0; i < 10; i++) {
    const totalBetsByNumber = Array.from(colorGameState.bets[i.toString()].values()).reduce((a, b) => a + b, 0);

    if (i === 0) {
      potentialPayouts[i] = (totalBetsByNumber * numMult) + 
                            (colorGameState.totalBets.violet * violetSplit) + 
                            (colorGameState.totalBets.red * colorSplit);
    } else if (i === 5) {
      potentialPayouts[i] = (totalBetsByNumber * numMult) + 
                            (colorGameState.totalBets.violet * violetSplit) + 
                            (colorGameState.totalBets.green * colorSplit);
    } else {
      const associatedColor = numberToColor[i];
      potentialPayouts[i] = (totalBetsByNumber * numMult) + 
                            (colorGameState.totalBets[associatedColor] * colMult);
    }
  }

  const minPayout = Math.min(...potentialPayouts);
  const numbersWithMinPayout = potentialPayouts
    .map((payout, index) => (payout === minPayout ? index : -1))
    .filter(index => index !== -1);

  const winningNumber = numbersWithMinPayout[Math.floor(Math.random() * numbersWithMinPayout.length)];
  
  // Assign to global variables
  color_won = numberToColor[winningNumber];
  number_won = winningNumber;

  number.shift();
  number.push(winningNumber);

  return winningNumber;
}

async function processWinnings(winningNumber, roundId) {
  const settings = await getMultipliers();
  const numMult = settings.number;
  const colMult = settings.color;

  const violetSplit = (numMult / 2) + 0.5;
  const colorSplit = 0.5;

  const numberToColor = {
    0: 'violet', 1: 'green', 2: 'red', 3: 'green', 4: 'red',
    5: 'violet', 6: 'red', 7: 'green', 8: 'red', 9: 'green'
  };

  const winningColor = numberToColor[winningNumber];
   const connection = await con.getConnection();
  try {
    await connection.beginTransaction();

    // STEP 1: Mark ALL bets for this round as 'loss' by default
    // This is faster than iterating through every loser
    await connection.query(
      "UPDATE color_bets SET status = 'loss', winnings = 0 WHERE round_id = ?",
      [roundId]
    );

  // 1. Process Number Wins
  // Safety check: ensure the map exists before iterating
  const numberBets = colorGameState.bets[winningNumber.toString()];
  if (numberBets && numberBets instanceof Map) {
    for (const [userId, betAmount] of numberBets) {
      const winnings = betAmount * numMult;
      await updateUserWallet(userId, winnings);
      await connection.query(
          "UPDATE color_bets SET status = 'win', winnings = ? WHERE round_id = ? AND user_id = ? AND bet_on = ?",
          [winnings, roundId, userId, winningNumber.toString()]
        );
      emitWin(userId, { number: winningNumber, betAmount, winnings });
       recordPastBet(userId, colorGameState.round, winningNumber, betAmount, winnings, true);
    }
  }

  // 2. Process Color Wins
  let colorPayouts = {};
  if (winningNumber === 0) {
    colorPayouts = { violet: violetSplit, red: colorSplit };
  } else if (winningNumber === 5) {
    colorPayouts = { violet: violetSplit, green: colorSplit };
  } else {
    colorPayouts = { [winningColor]: colMult };
  }

  for (const [colorName, multiplier] of Object.entries(colorPayouts)) {
    const colorBets = colorGameState.bets[colorName];
    if (colorBets && colorBets instanceof Map) {
      for (const [userId, betAmount] of colorBets) {
        const winnings = betAmount * multiplier;
        await updateUserWallet(userId, winnings);
         await connection.query(
            "UPDATE color_bets SET status = 'win', winnings = ? WHERE round_id = ? AND user_id = ? AND bet_on = ?",
            [winnings, roundId, userId, colorName]
          );
        emitWin(userId, { color: colorName, betAmount, winnings });
      }
    }
  }
  await connection.query(
      "UPDATE color_rounds SET status = 'finished', winning_number = ?, winning_color = ?, betting_close_at = NOW() WHERE id = ?",
      [winningNumber, winningColor, roundId]
    );
        await connection.query(
      `INSERT INTO color_results_history (round_id, winning_color, winning_number, declared_at) 
       VALUES (?, ?, ?, NOW())`,
      [roundId, winningColor, winningNumber]
    );

    await connection.commit();
    console.log(`✅ Round ${roundId} results saved to database.`);

}
catch (error) {
    await connection.rollback();
    console.error("❌ SQL Error in processWinnings:", error);
  } finally {
    connection.release();
  }
}

// Helper to keep code clean
 function emitWin(userId, data) {
  const userSocket = Array.from(colorNamespace.sockets.values()).find(s => s.userId === userId);
  if (userSocket) {
    userSocket.emit('winResult', data);
  }
}

  // --- MODIFICATION 3: Added winning payouts solely directly to withdraw_wallet ---
  async function updateUserWallet(userId, amount) {
    try {
      const connection = await con.getConnection();
      console.log(`✅ Got connection to update wallet for user ${userId}`);

      try {
        await connection.query(
          "UPDATE users SET withdraw_wallet = withdraw_wallet + ? WHERE id = ?",
          [amount, userId]
        );
        console.log(`✅ Wallet updated for user ${userId}. Amount: ${amount} added to withdraw_wallet`);

        const socket = Array.from(colorNamespace.sockets.values()).find(s => s.userId === userId);
        if (socket) {
          socket.withdraw_wallet = (socket.withdraw_wallet || 0) + amount;
          socket.wallet = (socket.wallet_balance || 0) + socket.withdraw_wallet;
          socket.emit('updateWallet', socket.wallet);
          console.log(`💰 Emitted wallet update to user ${userId}: Combined Total=${socket.wallet}`);
        }
      } catch (queryError) {
        console.error(`❌ Error updating wallet for user ${userId}:`, queryError.message);
      } finally {
        connection.release();
      }
    } catch (connectionError) {
      console.error(`❌ Error getting database connection:`, connectionError.message);
    }
  }

  function resetGameState() {
    colorGameState.bets = {
      '0': new Map(), '1': new Map(), '2': new Map(), '3': new Map(), '4': new Map(),
      '5': new Map(), '6': new Map(), '7': new Map(), '8': new Map(), '9': new Map(),
      red: new Map(), violet: new Map(), green: new Map()
    };
    colorGameState.totalBets = {
      red: 0,
      violet: 0,
      green: 0
    };
    for (let i = 0; i <= 9; i++) {
      colorGameState.bets[i] = new Map();
      colorGameState.totalBets[i] = 0;
    }
  }

  // Start the color game loop
  startColorGame();
}
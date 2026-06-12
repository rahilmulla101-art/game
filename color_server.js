// Color Game Module
import jwt from 'jsonwebtoken';

export function initColorGame(io, con) {
  
  // 1. FIX: Database Promise Wrapper (Prevents "TypeError: connection.query is not a function")
  const db = con.promise ? con.promise() : con;

  const JWT_SECRET = 'super_secret_dragon_vs_tiger_key'; // Hardcoded for Render stability
  var number = [5, 8, 7, 5, 3, 4, 6, 8, 6, 3];
  const userPastBetsMap = new Map();
  
  let colorGameState = {
    dbId: null, // Critical: stores the MySQL ID of the current round
    currentColor: null,
    timeRemaining: 30,
    round : 569897871323,
    bets: {
      red: new Map(), violet: new Map(), green: new Map(),
      0: new Map(), 1: new Map(), 2: new Map(), 3: new Map(), 4: new Map(),
      5: new Map(), 6: new Map(), 7: new Map(), 8: new Map(), 9: new Map()
    },
    totalBets: {
      red: 0, violet: 0, green: 0,
      0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0
    },
    isSpinning: false
  };

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
    if (pastList.length > 50) pastList.splice(50);
    userPastBetsMap.set(userId, pastList);

    const userSocket = Array.from(colorNamespace.sockets.values()).find(s => s.userId === userId);
    if (userSocket) {
      userSocket.emit("userCurrentBets", []);
      userSocket.emit("userPreviousBets", pastList);
    }
  }

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

    socket.on('setUserId', async (token) => {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.userId = decoded.id;
        socket.emit('auth_success', { userId: socket.userId });

        const userId = socket.userId;
        const userPastHistory = userPastBetsMap.get(userId) || [];
        const userActiveBets = getUserCurrentBets(userId);
        socket.emit("userCurrentBets", userActiveBets);
        socket.emit("userPreviousBets", userPastHistory);

        // MODIFICATION: Use promise-based query
        const [result] = await db.query("SELECT wallet_balance, withdraw_wallet FROM users WHERE id = ?", [userId]);

        if (result && result.length > 0) {
          socket.wallet_balance = Number(result[0].wallet_balance || 0);
          socket.withdraw_wallet = Number(result[0].withdraw_wallet || 0);
          socket.wallet = socket.wallet_balance + socket.withdraw_wallet; 
          socket.emit('updateWallet', socket.wallet);
        }
      } catch (error) {
        socket.emit('auth_error', { message: 'Invalid token' });
      }
    });

    socket.on('placeBet', async (data) => {
      const { colorOrNumber, amount } = data;
      if (colorGameState.isSpinning) return socket.emit('betError', 'Cannot place bet while wheel is spinning');
      const userId = socket.userId;
      if (!userId) return socket.emit('betError', 'User not authenticated');

      try {
        const [result] = await db.query("SELECT wallet_balance, withdraw_wallet FROM users WHERE id = ?", [userId]);
        const wallet_balance = Number(result[0].wallet_balance || 0);
        const withdraw_wallet = Number(result[0].withdraw_wallet || 0);
        const total_balance = wallet_balance + withdraw_wallet;

        if (total_balance < amount) return socket.emit('betError', 'Insufficient funds');

        const roundId = colorGameState.dbId; // Link to the current DB round
        if (!roundId) return socket.emit('betError', 'No active round found');

        colorGameState.bets[colorOrNumber].set(userId, (colorGameState.bets[colorOrNumber].get(userId) || 0) + amount);
        colorGameState.totalBets[colorOrNumber] += amount;

        let new_wallet_balance = wallet_balance;
        let new_withdraw_wallet = withdraw_wallet;
        if (wallet_balance >= amount) { new_wallet_balance -= amount; } 
        else { const leftover = amount - wallet_balance; new_wallet_balance = 0; new_withdraw_wallet -= leftover; }

        socket.wallet_balance = new_wallet_balance;
        socket.withdraw_wallet = new_withdraw_wallet;
        socket.wallet = new_wallet_balance + new_withdraw_wallet;

        await db.query("UPDATE users SET wallet_balance = ?, withdraw_wallet = ? WHERE id = ?", [new_wallet_balance, new_withdraw_wallet, userId]);
        
        const betType = ['red', 'violet', 'green'].includes(colorOrNumber) ? 'color' : 'number';
        await db.query(
          `INSERT INTO color_bets (round_id, user_id, bet_type, bet_on, bet_amount, status, winnings, placed_at, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, 'pending', 0, NOW(), NOW(), NOW())`,
          [roundId, userId, betType, colorOrNumber, amount]
        );

        socket.emit('betPlaced', { colorOrNumber, amount });
        socket.emit('updateWallet', socket.wallet);
        colorNamespace.emit('updateTotalBets', colorGameState.totalBets);
      } catch (e) { console.error("Bet Placement Error:", e.message); }
    });

    // ... Read-only events (getGameHistory etc) would go here ...
  });

  async function startColorGame() {
    try {
      // 1. FIX: DB creation with proper await
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
      const [rows] = await db.query("SELECT COUNT(*) as count FROM color_rounds WHERE DATE(created_at) = CURDATE()");
      const sequence = (rows[0].count + 1).toString().padStart(4, '0');
      const periodNumber = dateStr + sequence;

      const [result] = await db.query(
        `INSERT INTO color_rounds (period_number, status, betting_open_at, created_at, updated_at) VALUES (?, 'betting_open', NOW(), NOW(), NOW())`,
        [periodNumber]
      );

      colorGameState.dbId = result.insertId;
      colorGameState.round = periodNumber;
      console.log(`🚀 New Round Started: ${periodNumber}`);

    } catch (err) {
      console.error("❌ Error starting round:", err.message);
    }

    colorNamespace.emit('numberArray', number);
    colorGameState.timeRemaining = 30;
    colorGameState.isSpinning = false;
    colorNamespace.emit('bettingOpen');

    const timer = setInterval(() => {
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

    setTimeout(() => {
      // FIX: Changed 'result' to 'winningNumber' to avoid ReferenceError
      colorNamespace.emit('gameResult', winningNumber);
      console.log(`✅ Game result: ${winningNumber}`);
      
      setTimeout(() => { resetGameState(); }, 1000);
      setTimeout(startColorGame, 5000);
    }, 2000);
  }

  async function getMultipliers() {
    try {
      const [rows] = await db.query("SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ('colors_multiplier', 'number_multiplier')");
      let multipliers = { color: 2, number: 9 };
      if (rows && rows.length > 0) {
        rows.forEach(row => {
          if (row.setting_key === 'colors_multiplier') multipliers.color = Number(row.setting_value);
          if (row.setting_key === 'number_multiplier') multipliers.number = Number(row.setting_value);
        });
      }
      return multipliers;
    } catch (err) { return { color: 2, number: 9 }; }
  }

  async function determineWinningColor() {
    const settings = await getMultipliers();
    const numMult = settings.number; 
    const colMult = settings.color;  
    const violetSplit = (numMult / 2) + 0.5;
    const colorSplit = 0.5;

    const numberToColor = { 0: 'violet', 1: 'green', 2: 'red', 3: 'green', 4: 'red', 5: 'violet', 6: 'red', 7: 'green', 8: 'red', 9: 'green' };
    const potentialPayouts = Array(10).fill(0);

    for (let i = 0; i < 10; i++) {
      const totalBetsByNumber = Array.from(colorGameState.bets[i.toString()].values()).reduce((a, b) => a + b, 0);
      if (i === 0) {
        potentialPayouts[i] = (totalBetsByNumber * numMult) + (colorGameState.totalBets.violet * violetSplit) + (colorGameState.totalBets.red * colorSplit);
      } else if (i === 5) {
        potentialPayouts[i] = (totalBetsByNumber * numMult) + (colorGameState.totalBets.violet * violetSplit) + (colorGameState.totalBets.green * colorSplit);
      } else {
        potentialPayouts[i] = (totalBetsByNumber * numMult) + (colorGameState.totalBets[numberToColor[i]] * colMult);
      }
    }

    const minPayout = Math.min(...potentialPayouts);
    const numbersWithMinPayout = potentialPayouts.map((p, i) => (p === minPayout ? i : -1)).filter(i => i !== -1);
    const winningNumber = numbersWithMinPayout[Math.floor(Math.random() * numbersWithMinPayout.length)];
    
    number.shift();
    number.push(winningNumber);
    return winningNumber;
  }

  async function processWinnings(winningNumber, roundId) {
    const settings = await getMultipliers();
    const numMult = settings.number;
    const colMult = settings.color;
    const numberToColor = { 0: 'violet', 1: 'green', 2: 'red', 3: 'green', 4: 'red', 5: 'violet', 6: 'red', 7: 'green', 8: 'red', 9: 'green' };
    const winningColor = numberToColor[winningNumber];

    try {
      // 1. Mark all as loss initially
      await db.query("UPDATE color_bets SET status = 'loss', winnings = 0 WHERE round_id = ?", [roundId]);

      // 2. Process Number Wins
      const numberBets = colorGameState.bets[winningNumber.toString()];
      if (numberBets instanceof Map) {
        for (const [userId, betAmount] of numberBets) {
          const winnings = betAmount * numMult;
          await updateUserWallet(userId, winnings);
          await db.query("UPDATE color_bets SET status = 'win', winnings = ? WHERE round_id = ? AND user_id = ? AND bet_on = ?", [winnings, roundId, userId, winningNumber.toString()]);
          emitWin(userId, { number: winningNumber, betAmount, winnings });
          recordPastBet(userId, colorGameState.round, winningNumber, betAmount, winnings, true);
        }
      }

      // 3. Process Color Wins
      let colorPayouts = {};
      if (winningNumber === 0) colorPayouts = { violet: (numMult / 2) + 0.5, red: 0.5 };
      else if (winningNumber === 5) colorPayouts = { violet: (numMult / 2) + 0.5, green: 0.5 };
      else colorPayouts = { [winningColor]: colMult };

      for (const [colorName, multiplier] of Object.entries(colorPayouts)) {
        const colorBets = colorGameState.bets[colorName];
        if (colorBets instanceof Map) {
          for (const [userId, betAmount] of colorBets) {
            const winnings = betAmount * multiplier;
            await updateUserWallet(userId, winnings);
            await db.query("UPDATE color_bets SET status = 'win', winnings = ? WHERE round_id = ? AND user_id = ? AND bet_on = ?", [winnings, roundId, userId, colorName]);
            emitWin(userId, { color: colorName, betAmount, winnings });
            recordPastBet(userId, colorGameState.round, colorName, betAmount, winnings, true);
          }
        }
      }

      // 4. Finalize Round in DB
      await db.query("UPDATE color_rounds SET status = 'finished', winning_number = ?, winning_color = ?, betting_close_at = NOW() WHERE id = ?", [winningNumber, winningColor, roundId]);
      await db.query("INSERT INTO color_results_history (round_id, winning_color, winning_number, declared_at) VALUES (?, ?, ?, NOW())", [roundId, winningColor, winningNumber]);

    } catch (error) {
      console.error("❌ SQL Error in processWinnings:", error.message);
    }
  }

  function emitWin(userId, data) {
    const userSocket = Array.from(colorNamespace.sockets.values()).find(s => s.userId === userId);
    if (userSocket) userSocket.emit('winResult', data);
  }

  async function updateUserWallet(userId, amount) {
    try {
      await db.query("UPDATE users SET withdraw_wallet = withdraw_wallet + ? WHERE id = ?", [amount, userId]);
      const socket = Array.from(colorNamespace.sockets.values()).find(s => s.userId === userId);
      if (socket) {
        socket.withdraw_wallet = (socket.withdraw_wallet || 0) + amount;
        socket.wallet = (socket.wallet_balance || 0) + socket.withdraw_wallet;
        socket.emit('updateWallet', socket.wallet);
      }
    } catch (e) { console.error(`❌ Error updating wallet:`, e.message); }
  }

  function resetGameState() {
    colorGameState.bets = { '0': new Map(), '1': new Map(), '2': new Map(), '3': new Map(), '4': new Map(), '5': new Map(), '6': new Map(), '7': new Map(), '8': new Map(), '9': new Map(), red: new Map(), violet: new Map(), green: new Map() };
    colorGameState.totalBets = { red: 0, violet: 0, green: 0, 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
  }

  startColorGame();
}
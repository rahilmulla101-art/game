// Dragon vs Tiger Game Module
import jwt from 'jsonwebtoken';

export function initDragonTiger(io, con) {

  const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_dragon_vs_tiger_key';
  
  // Game data - SHARED between all users
  const dataToSend = ["D", "D", "T","T","D","T","D","D","T","T"];
  var userSockets = new Map();
  var Tiger_side = new Map();
  var Dragon_side = new Map();
  var Disconnected_socket = new Map();
  var BetTiger = 0;
  var BetDragon = 0;
  var g_dragon_card = 0;
  var g_tiger_card = 0;
  var A = 20;
  var C = 47023354564;
  
  // Game state variables for round management
  var real_small = 0;
  var real_big = 0;
  var dragon_card = 0;
  var tiger_card = 0;
  var dragon_card_type = '';
  var tiger_card_type = '';
  var winningSide = '';
  var bettingOpen = false;

  io.on('connection', (socket) => {


    if(A > 8){
      socket.emit("round_start");
    }
    
    console.log('A client connected');
    socket.emit("dataToClients", dataToSend);

    // Handle messages from client
    socket.on('clientMessage', (data) => {
      console.log('Received message from client:', data);
    });

    socket.on("setUserId", async (token) => {
      console.log("Received setUserId event");

      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user_Id = decoded.id; // Local to this function scope

        if (!user_Id) {
            throw new Error('Invalid user ID');
        }

        socket.userId = user_Id; // Store ID on the socket
        userSockets.set(user_Id, socket); // Map user ID to this socket

        console.log('Authenticated User ID:', user_Id);

        // Reconnection logic
        if (Disconnected_socket.has(user_Id)) {
          const specificUserSocketData = Disconnected_socket.get(user_Id);
          socket.dragon_side_bet = specificUserSocketData.dragon_side_bet || 0;
          socket.tiger_side_bet = specificUserSocketData.tiger_side_bet || 0;
          console.log(`User ${user_Id} reconnected`);
        } else {
          socket.dragon_side_bet = 0;
          socket.tiger_side_bet = 0;
        }

        // Wallet Logic
        // Wallet Logic
        if (!con) {
          console.error("❌ Database pool missing!");
          return;
        }

        const connection = await con.getConnection();
        try {
          const [result] = await connection.query("SELECT wallet_balance, withdraw_wallet FROM users WHERE id = ?", [user_Id]);
          if (result && result.length > 0) {
            socket.wallet_balance = parseFloat(result[0].wallet_balance || 0);
            socket.withdraw_wallet = parseFloat(result[0].withdraw_wallet || 0);
            socket.wallet = socket.wallet_balance + socket.withdraw_wallet;

            socket.emit('walet', { data: socket.wallet });
            socket.emit('currentBetting', { 
              dragon_side: Dragon_side.has(user_Id) ? Dragon_side.get(user_Id).betAmount : 0, 
              tiger_side: Tiger_side.has(user_Id) ? Tiger_side.get(user_Id).betAmount : 0 
            });
          }
        } finally {
          connection.release();
        }

      } catch (error) {
        console.error('Authentication failed:', error.message);
        socket.disconnect();
      }
    });
  
    socket.on('betting', async (data) => {
      const user_Id = socket.userId;
      if (!user_Id) return;

      try {
        const betAmount = parseInt(data.inputValue);
        const betSide = data.side.toLowerCase();

        // Check if combined balances are enough
        if (socket.wallet_balance + socket.withdraw_wallet >= betAmount) {
          const betInfo = {
            socket: socket,
            betAmount: betAmount,
            userId: user_Id
          };

          if (betSide === 'tiger') {
            BetTiger += betAmount;
            if (Tiger_side.has(user_Id)) {
              let existing = Tiger_side.get(user_Id);
              existing.betAmount += betAmount;
              Tiger_side.set(user_Id, existing);
            } else {
              Tiger_side.set(user_Id, betInfo);
            }
          } else if (betSide === 'dragon') {
            BetDragon += betAmount;
            if (Dragon_side.has(user_Id)) {
              let existing = Dragon_side.get(user_Id);
              existing.betAmount += betAmount;
              Dragon_side.set(user_Id, existing);
            } else {
              Dragon_side.set(user_Id, betInfo);
            }
          }

          // Deduct from wallet_balance first. Leftover from withdraw_wallet
          if (socket.wallet_balance >= betAmount) {
            socket.wallet_balance -= betAmount;
          } else {
            const leftover = betAmount - socket.wallet_balance;
            socket.wallet_balance = 0;
            socket.withdraw_wallet -= leftover;
          }
          
          socket.wallet = socket.wallet_balance + socket.withdraw_wallet;

          const connection = await con.getConnection();
          try {
            await connection.query(
              "UPDATE users SET wallet_balance = ?, withdraw_wallet = ? WHERE id = ?",
              [socket.wallet_balance, socket.withdraw_wallet, user_Id]
            );
            
                        await connection.query(
              `INSERT INTO bets (user_id, round_id, bet_amount, bet_on, status, payout_amount) 
               VALUES (?, ?, ?, ?, 'pending', 0.00)`,
              [user_Id, C, betAmount, betSide]
            );

            // Commit modifications
            await connection.commit();

            // Success responses
            socket.emit('walet', { data: socket.wallet });
            socket.emit('currentBetting', {
              dragon_side: Dragon_side.has(user_Id) ? Dragon_side.get(user_Id).betAmount : 0,
              tiger_side: Tiger_side.has(user_Id) ? Tiger_side.get(user_Id).betAmount : 0
            });
          } finally {
            connection.release();
          }
        } else {
          socket.emit('insuf');
        }
      } catch (error) {
        console.error('Betting error:', error.message);
      }
    });

    socket.on("disconnect", () => {
      const userId = socket.userId;
      if (userId) {
          const disconnectedUserData = {
              dragon_side_bet: Dragon_side.has(userId) ? Dragon_side.get(userId).betAmount : 0,
              tiger_side_bet: Tiger_side.has(userId) ? Tiger_side.get(userId).betAmount : 0
          };
          Disconnected_socket.set(userId, disconnectedUserData);
          userSockets.delete(userId);
          console.log("User disconnected and bet state cached:", userId);
      }
    });
  });

  // ==================== GAME LOOP ====================
  let coinSpawnInterval = null;
  
  function add() {
    A--;
    io.emit('count', { A: A, C: C });
    
    if(A === 19){
      console.log("Round Started");
      io.emit("dataToClients", dataToSend);
    }
    
    // Coin spawning interval logic
    if (A > 2 && A < 18 && !coinSpawnInterval) {
      coinSpawnInterval = setInterval(() => {
        if (A <= 2) {
          clearInterval(coinSpawnInterval);
          coinSpawnInterval = null;
          return;
        }
        const coinValues = [10, 50, 100, 500];
        const coinValue = coinValues[Math.floor(Math.random() * coinValues.length)];
        const side = Math.random() < 0.5 ? 'dragon' : 'tiger';
        io.emit('coinSpawned', {
          value: coinValue,
          side: side,
          position: Math.random() * 64 + 18 
        });
      }, 500);
    }
    
    if (A === 0) {
      io.emit("clear_batting");
      io.emit("disable");
      bettingOpen = false;
    }
    
    if (A === 10) {
      // Card Generation Logic
      var number1 = Math.floor(Math.random() * 13) + 1;
      var number2 = Math.floor(Math.random() * 12) + 2;
      if (number1 === number2) number1 = number2 - 1;
      real_small = Math.min(number1, number2);
      real_big = Math.max(number1, number2);

      var type = ["A", "B", "C", "D"];
      dragon_card_type = type[Math.floor(Math.random() * type.length)];
      tiger_card_type = type.filter(t => t !== dragon_card_type)[Math.floor(Math.random() * (type.length - 1))];
    }
    
    if (A === -1) {
      // House Win Logic (Underdog wins)
      if (BetDragon < BetTiger) {
        tiger_card = real_small;
        dragon_card = real_big;
        winningSide = "Dragon";
      } else if (BetDragon > BetTiger) {
        tiger_card = real_big;
        dragon_card = real_small;
        winningSide = "Tiger";
      } else {
        const choice = Math.random() < 0.5 ? 'Dragon' : 'Tiger';
        winningSide = choice;
        dragon_card = choice === 'Dragon' ? real_big : real_small;
        tiger_card = choice === 'Tiger' ? real_big : real_small;
      }
    }

    if (A === -3) {
      io.emit("round_result", { 
        L: tiger_card, 
        M: dragon_card,
        N: dragon_card_type, 
        O: tiger_card_type,
        result: winningSide.toLowerCase()
      });
    }
    
    if (A === -5) {
      io.emit("winning_side", winningSide.toLowerCase());
      
      const processPayouts = async () => {
        const winners = winningSide === "Dragon" ? Dragon_side : Tiger_side;
        
        for (const [userId, betInfo] of winners.entries()) {
          const connection = await con.getConnection();

          const [settingRows] = await connection.query(
            `
            SELECT setting_value
            FROM site_settings
            WHERE setting_key = ?
            `,
            ['dragon_multiplier']
          );
          console.log("Multiplier Setting:", settingRows.length > 0 ? settingRows[0].setting_value : "Not Set");

          const multiplier =
            settingRows.length > 0
              ? parseFloat(settingRows[0].setting_value): 2;

              const payout =
              betInfo.betAmount * multiplier;

            const referralCommission =betInfo.betAmount * (2 - multiplier);
            if (referralCommission > 0) {

    const [winnerRows] =
      await connection.query(
        `
        SELECT
          username,
          referred_by
        FROM users
        WHERE id = ?
        `,
        [userId]
      );

    if (
      winnerRows.length > 0 &&
      winnerRows[0].referred_by
    ) {

      const winner =
        winnerRows[0];

      // Credit referrer
      await connection.query(
        `
        UPDATE users
        SET wallet_balance =
            wallet_balance + ?
        WHERE id = ?
        `,
        [
          referralCommission,
          winner.referred_by
        ]
      );

      // Log referral earning
      await connection.query(
        `
        INSERT INTO referral_payouts
        (
          user_id,
          credited_username,
          amount,
          game_name,
          betting_type,
          round_id
        )
        VALUES
        (
          ?,
          ?,
          ?,
          ?,
          ?,
          ?
        )
        `,
        [
          winner.referred_by, // referrer id
          winner.username,    // winner username
          referralCommission,
          'Dragon vs Tiger',
          winningSide,
          C      // replace with your round variable
        ]
      );

    }

}
              const userSocket = userSockets.get(userId);
          
          if (userSocket) {
            // Add winning payout directly to withdraw_wallet
            userSocket.withdraw_wallet += payout;
            userSocket.wallet = userSocket.wallet_balance + userSocket.withdraw_wallet;
            try {
              const connection = await con.getConnection();
              await connection.query(
                "UPDATE users SET wallet_balance = ?, withdraw_wallet = ? WHERE id = ?", 
                [userSocket.wallet_balance, userSocket.withdraw_wallet, userId]
              );
              connection.release();
              
              userSocket.emit('walet', { data: userSocket.wallet });
              userSocket.emit('winningAmount', { amount: payout, side: winningSide });
            } catch (err) { console.error("DB Payout Error:", err); }
          }
        }
      };

      processPayouts().then(() => {
        // Reset Shared States
        Dragon_side.clear();
        Tiger_side.clear();
        dataToSend.shift();
        dataToSend.push(winningSide.charAt(0));
        BetDragon = 0;
        BetTiger = 0;
      });
    }
    
    if(A === -10){
      A = 20; 
      C++;
      Disconnected_socket.clear();
      io.emit("clear_batting");
      io.emit("round_start");
    }
  }

  function data() {
    io.emit("data", { D: A, F: C, G: g_dragon_card, H: g_tiger_card });
  }

  setInterval(add, 1000);
  setInterval(data, 1000);
}
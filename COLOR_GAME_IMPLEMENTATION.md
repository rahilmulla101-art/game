# Color Game Implementation Checklist

## ✅ COMPLETED COMPONENTS

### 1. **Database Schema** ✅
- File: `database/colorGameSchema.sql`
- Tables Created:
  - `color_rounds` - Track game rounds/periods
  - `color_bets` - Store individual bets
  - `color_results_history` - Maintain result records
  - `user_color_stats` - User betting statistics

**Action Required:** Run this SQL file to create tables
```bash
mysql -u root -D dragonvstiger_db < database/colorGameSchema.sql
```

### 2. **Color Controller** ✅
- File: `controllers/colorController.js`
- Functions:
  - `placeColorBet()` - Handle bet placement with validation
  - `getCurrentColorRound()` - Get active round data
  - `getColorGameHistory()` - Get past results
  - `getUserColorBets()` - Get user's betting history
  - `getUserColorStats()` - Get user statistics

### 3. **Color Routes** ✅
- File: `routes/color.js`
- Endpoints:
  - `POST /api/color/bets/place` - Place a bet (Protected)
  - `GET /api/color/current-round` - Get current round (Public)
  - `GET /api/color/history` - Get history (Public)
  - `GET /api/color/bets/my-bets` - Get user bets (Protected)
  - `GET /api/color/stats` - Get user stats (Protected)

### 4. **Color Game Engine** ✅
- File: `services/colorGameEngine.js`
- Functions:
  - `initializeGame()` - Create new round
  - `startBettingCountdown()` - 30-second betting timer
  - `declareResult()` - Process winners and losers
  - `startNewRound()` - Cycle to next round
  - Game Logic:
    - Color payout: 2:1 (bet on Red, Green, or Violet)
    - Number payout: 9:1 (bet on 0-9)
    - Auto-refund on tie (if implemented)

### 5. **Color Socket.IO Handler** ✅
- File: `socket/colorSocketHandler.js`
- Events:
  - **Client → Server:**
    - `setUserId` - Register user
    - `placeBet` - Submit bet with amount
  - **Server → Client:**
    - `gameStateUpdate` - Send current round state
    - `betResponse` - Confirm bet placed
    - `betPlaced` - Show bet notification
    - `updateWallet` - Update user balance
    - `timeUpdate` - Countdown timer
    - `betTotalsUpdate` - Broadcast live totals
    - `gameResult` - Announce winners
    - `numberArray` - Previous results

### 6. **Server Integration** ✅
- `server.js` Updated:
  - Imported color routes
  - Mounted at `/api/color`
- `socket/socketHandler.js` Updated:
  - Imported color socket handler
  - Initialized on server startup

---

## 🔧 NEXT STEPS (Manual Setup Required)

### Step 1: Create Database Tables
```bash
# SSH/Local MySQL access
mysql -u root -p
USE dragonvstiger_db;
SOURCE database/colorGameSchema.sql;
```

### Step 2: Start Color Game Engine
Add to `server.js` or create game initialization:

```javascript
// In startAppServer() function, after initGameEngine:
import colorGameEngine from './services/colorGameEngine.js';

// Initialize color game
try {
  await colorGameEngine.initializeGame();
  colorGameEngine.startBettingCountdown(io, 30);
  console.log('🎨 Color Game Engine initialized');
} catch (error) {
  console.error('Error initializing color game:', error);
}
```

### Step 3: Update color.html to use correct paths
- Ensure Socket.IO connects to `/color` namespace
- Already set in `public/color.js` ✅

### Step 4: Test the Implementation
```bash
# Start server
npm run dev

# Access game
http://localhost:3000/color.html?userId=USER_ID
```

---

## 📊 BET STRUCTURE

### Color Betting
- Options: Red, Green, Violet
- Min Bet: ₹10
- Payout: 2:1 (₹100 bet = ₹200 win)

### Number Betting  
- Options: 0-9
- Min Bet: ₹10
- Payout: 9:1 (₹100 bet = ₹900 win)

---

## 🎮 GAME FLOW

```
1. Server: Initialize Round (Period Number)
           ↓
2. Client: Show betting UI for 30 seconds
           ↓
3. Users: Place bets (deducted from wallet immediately)
           ↓
4. Server: Close betting → Select random color/number
           ↓
5. Server: Calculate winners → Update wallets
           ↓
6. Clients: Show winners + animations
           ↓
7. Repeat: Start new round
```

---

## 🔌 SOCKET EVENTS REFERENCE

### Connect to Color Game
```javascript
const socket = io('/color');
socket.emit('setUserId', userId);
```

### Place a Bet
```javascript
socket.emit('placeBet', {
  colorOrNumber: 'red',  // or 'green', 'violet', '0'-'9'
  amount: 100           // minimum ₹10
});
```

### Listen for Results
```javascript
socket.on('gameResult', (data) => {
  // data: {round, winning_color, winning_number, total_winners, total_payouts}
});

socket.on('betPlaced', (data) => {
  // data: {color, amount}
});

socket.on('updateWallet', (newBalance) => {
  // Update wallet display
});
```

---

## ✨ FEATURES INCLUDED

- ✅ Real-time betting with wallet deduction
- ✅ Automatic payout calculation
- ✅ Duplicate bet prevention (1 bet per color per round)
- ✅ User statistics tracking
- ✅ Game history retention
- ✅ Live bet totals broadcast
- ✅ Proper transaction handling (rollback on error)
- ✅ JWT authentication on sensitive endpoints

---

## 📝 API EXAMPLES

### Place a Bet (Protected)
```bash
curl -X POST http://localhost:3000/api/color/bets/place \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "round_id": 1,
    "bet_on": "red",
    "bet_amount": 100
  }'
```

### Get Current Round (Public)
```bash
curl http://localhost:3000/api/color/current-round
```

### Get User Stats (Protected)
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/color/stats
```

---

## ⚠️ IMPORTANT NOTES

1. **Database Must Be Created First** - Run the SQL schema before starting server
2. **Wallet Service Integration** - Ensure `walletService.js` is properly configured
3. **Socket.IO Namespace** - Game runs on `/color` namespace (not default `/`)
4. **JWT Secret** - Must match between `server.js` and authentication middleware
5. **CORS Settings** - Check server.js CORS config allows color game domain

---

**Status: READY FOR TESTING** 🚀

All backend components are created. Execute the steps above to activate the color game!

# 🎮 Color Game - Socket.IO Room Integration

## Overview

The color game now features comprehensive Socket.IO room tracking with real-time notifications for user join/leave events and active player counts.

---

## ✨ Features Implemented

### 1. **Server-Side Tracking** 
- Logs every user join/leave with detailed info
- Tracks active users with timestamps
- Maintains user metadata (username, wallet, mobile)
- Broadcasts room statistics to all players

### 2. **Client-Side Notifications**
- Shows active player count in real-time
- Toast notifications when users join/leave
- Live updates to UI elements

### 3. **Real-Time Events**
- `userJoined` - Broadcasts when new player enters
- `userLeft` - Broadcasts when player disconnects  
- `roomStats` - Sends current room stats to all players

---

## 🖥️ Server-Side Console Output

When a user joins the color game, you'll see:

```
============================================================
🟢 USER JOINED COLOR GAME ROOM
============================================================
  Socket ID: abc123def456
  User ID: 42
  Join Time: 2026-06-01T20:22:30.123Z
  Namespace: /color
  Username: john_doe
  Mobile: 9876543210
  Wallet Balance: ₹5000
============================================================
```

When a user leaves:

```
============================================================
🔴 USER LEFT COLOR GAME ROOM
============================================================
  Socket ID: abc123def456
  User ID: 42
  Username: john_doe
  Leave Time: 2026-06-01T20:25:45.456Z
  Session Duration: 195s
  Namespace: /color
============================================================

📊 Color Room Stats: 5 active players
```

---

## 🎯 Event Flow

```
User Opens /color.html
         ↓
JWT Cookie Retrieved
         ↓
Socket.IO Connection Established
         ↓
Server Validates JWT
         ↓
User Added to activeUsers Map
         ↓
🟢 USER JOINED LOG DISPLAYED
         ↓
userJoined Event Broadcast
         ↓
roomStats Event Broadcast
         ↓
UI Updated with Player Count
```

---

## 📨 Socket Events

### Server → Client Events

#### 1. **roomStats**
Sent when room state changes
```javascript
socket.on('roomStats', (stats) => {
  // stats.activePlayerCount - number of online players
  // stats.userList - array of user objects
  // stats.timestamp - when stats were generated
});
```

#### 2. **userJoined**
Sent when new player joins
```javascript
socket.on('userJoined', (data) => {
  // data.userId - the new player's ID
  // data.username - the new player's username
  // data.totalPlayersNow - total active players
  // data.timestamp - join time
});
```

#### 3. **userLeft**
Sent when player disconnects
```javascript
socket.on('userLeft', (data) => {
  // data.userId - the left player's ID
  // data.username - the left player's username
  // data.totalPlayersNow - total remaining players
  // data.timestamp - leave time
});
```

---

## 🎨 UI Changes

### New Element in color.html

```html
<div class="balance-parent">
  <b class="timer-">Players</b>
  <div class="text-group">
    <div class="text1"></div>
    <b class="b4" id="active_players">0 Players Online</b>
  </div>
</div>
```

This displays:
- Real-time count of active players
- Updates when users join/leave
- Shows: "X Players Online"

---

## 💾 Data Tracked

For each user in the room, the server tracks:

```javascript
{
  userId: 42,
  username: "john_doe",
  mobile: "9876543210",
  socketId: "abc123def456",
  joinedAt: "2026-06-01T20:22:30.123Z",
  walletBalance: 5000
}
```

---

## 🔧 Implementation Details

### 1. **activeUsers Map** (colorSocketHandler.js)
```javascript
const activeUsers = new Map(); // socketId → userObject
```

### 2. **Room Stats Function**
```javascript
const getRoomStats = (namespace) => {
  // Returns: { activePlayerCount, userList, timestamp }
};

const broadcastRoomStats = (namespace) => {
  // Emits to all clients: roomStats event
};
```

### 3. **Helper Exports**
```javascript
export const getActiveColorUsers() // Get list of active users
export const getActivePlayerCount() // Get player count
```

---

## 📊 Console Logging

Server console shows:

1. **Authentication**: 
   ```
   🔐 User 42 authenticated for color game
   ```

2. **Join**:
   ```
   🟢 USER JOINED COLOR GAME ROOM
   ... details ...
   ```

3. **Room Updates**:
   ```
   📊 Color Room Stats: 5 active players
   ```

4. **Leave**:
   ```
   🔴 USER LEFT COLOR GAME ROOM
   ... details ...
   ```

---

## 🧪 Testing

### Test User Join:
1. Login to app
2. Open 2 browser windows
3. Login with different users
4. Open /color.html in both
5. Watch server logs for join events
6. Check UI for player count updates

### Test User Leave:
1. While both players in room
2. Close one browser
3. Watch server logs for leave event
4. See player count decrease in other browser

---

## 🔐 Security

- ✅ JWT required for socket connection
- ✅ User identity verified before tracking
- ✅ User data fetched from database
- ✅ No hardcoded user info
- ✅ Session-based connection tracking

---

## 🚀 Next Steps

1. ✅ Socket.IO integration complete
2. ✅ Room tracking implemented
3. ✅ User join/leave notifications added
4. ⏳ Database persistence (optional)
5. ⏳ Admin dashboard to view active rooms

---

## 📞 API Reference

### Get Active Users (Backend)
```javascript
import { getActiveColorUsers } from './socket/colorSocketHandler.js';

const activeUsers = getActiveColorUsers();
// Returns: [{ userId, username, mobile, joinedAt, walletBalance }, ...]
```

### Get Player Count (Backend)
```javascript
import { getActivePlayerCount } from './socket/colorSocketHandler.js';

const count = getActivePlayerCount();
// Returns: number
```

---

**✨ Color game now has real-time room awareness!** 🎮👥

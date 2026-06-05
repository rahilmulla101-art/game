import express from 'express';
import verifyToken from '../middleware/verifyToken.js';
import {
  placeBet,
  getMyBetsHistory,
  getCurrentRoundData,
  getLastCompletedRounds
} from '../controllers/gameController.js';

const router = express.Router();

// Bets placing and history lines (Protected)
router.post('/bets/place', verifyToken, placeBet);
router.get('/bets/history', verifyToken, getMyBetsHistory);

// Game statistics endpoints (Public)
router.get('/game/current-round', getCurrentRoundData);
router.get('/game/rounds', getLastCompletedRounds);

export default router;

import express from 'express';
import verifyToken from '../middleware/verifyToken.js';
import { createTicket, getMyTickets } from '../controllers/supportController.js';

const router = express.Router();

// Support ticket routing rules (Protected)
router.post('/support/ticket', verifyToken, createTicket);
router.get('/support/tickets', verifyToken, getMyTickets);

export default router;

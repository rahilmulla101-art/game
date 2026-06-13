import express from 'express';
import { checkSession } from '../controllers/sessionController.js';

const router = express.Router();

router.post(
    '/check-session',
    checkSession
);

router.post(
    '/check-token',
    checkToken
);

export default router;
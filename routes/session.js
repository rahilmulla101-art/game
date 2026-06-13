import express from 'express';
import { checkToken } from '../controllers/sessionController.js';

const router = express.Router();

router.post(
    '/check-token',
    checkToken
);

export default router;
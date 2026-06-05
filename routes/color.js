/**
 * Color Game Routes
 * Note: All color game logic is now handled via Socket.IO in color_server.js
 * This file is kept for backwards compatibility but endpoints are deprecated
 */

import express from 'express';

const router = express.Router();

// All color game operations now use Socket.IO
// Remove REST endpoints and direct clients to Socket.IO instead

export default router;

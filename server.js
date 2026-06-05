/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

// Database config
import pool, { testConnection } from './config/db.js';

// Auth routing configuration
import authRoutes from './routes/auth.js';
import walletRoutes from './routes/wallet.js';
import gameRoutes from './routes/game.js';
import colorRoutes from './routes/color.js';
import adminRoutes from './routes/admin.js';
import userRoutes from './routes/user.js';
import supportRoutes from './routes/support.js';

// Socket and Game loop services
import { initSocketHandler } from './socket/socketHandler.js';
// import { initGameEngine } from './services/gameEngine.js';
// import colorGameEngine from './services/colorGameEngine.js';
import { initColorGame } from './color_server.js';
import { initDragonTiger } from './dragonvstiger.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const app = express();
const server = createServer(app);

// Pre-create upload directories securely
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Global Middlewares
app.use(cors({
  origin: '*', // Adjust to match allowed clients/Cors in production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mounted API Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api', gameRoutes);
app.use('/api/color', colorRoutes);
app.use('/api', userRoutes);
app.use('/api', supportRoutes);
app.use('/api/admin', adminRoutes);

// Serve absolute public upload route safely
app.use('/uploads', express.static(uploadDir));

// Base status verification endpoint (API Namespace)
app.get('/api/health-check', async (req, res) => {
  res.json({
    app: 'Dragon vs Tiger Casino Server',
    status: 'online',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Configure Multer engine default storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB Upload Limit
});

// Initialize Socket.IO server on top of HTTP server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Set global handle reference for easy service actions
global.io = io;

// Socket-driven match coordination, presence and authentication
initSocketHandler(io);

// Setup schedule interval jobs utilizing node-cron
// Showcase: Clean cron structure for managing round timing systems
cron.schedule('*/30 * * * * *', () => {
  // Standard routine checking: can broadcast countdown alerts to players here
});

// Start the unified backend & front-end asset orchestration
async function startAppServer() {
  // 1. Authenticate with backend database pool gracefully (Non-blocking)
  await testConnection();

  // 2. Initialize the Casino Game Engine Loops
  // initGameEngine(io);

  // 2b. Initialize Color Game
  initColorGame(io, pool);

  // 2c. Initialize Dragon vs Tiger Game
  initDragonTiger(io, pool);

  // 3. Vite asset hot-reloading support (Express fallback router)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('⚡ Vite developer runtime loaded as inline Express middleware.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('📦 Serving compiled production-build static pages.');
  }

  // 3. Listen to incoming requests on Port 3000
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Dragon vs Tiger server listening on port ${PORT}`);
    console.log(`🌐 Accessible local context: http://localhost:${PORT}`);
  });
}

startAppServer().catch((err) => {
  console.error('🔥 Server start failure:', err);
});

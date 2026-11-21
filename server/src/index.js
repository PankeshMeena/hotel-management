import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db.js';

// Routes
import authRoutes from './routes/auth.js';
import settingsRoutes from './routes/settings.js';
import roomTypesRoutes from './routes/roomTypes.js';
import roomsRoutes from './routes/rooms.js';
import guestsRoutes from './routes/guests.js';
import reservationsRoutes from './routes/reservations.js';
import transactionsRoutes from './routes/transactions.js';
import housekeepingRoutes from './routes/housekeeping.js';
import expensesRoutes from './routes/expenses.js';
import staffRoutes from './routes/staff.js';
import activityLogsRoutes from './routes/activityLogs.js';
import resetRoutes from './routes/reset.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl.startsWith('/api')) {
      console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    database: 'MySQL / MariaDB',
    connectedDatabase: process.env.DB_NAME || 'hotel_pms',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/room-types', roomTypesRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/guests', guestsRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/housekeeping', housekeepingRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/activity-logs', activityLogsRoutes);
app.use('/api/reset-demo', resetRoutes);

// Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

// Start Server
async function start() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 UjjainStay Express Backend running on: http://localhost:${PORT}`);
      console.log(`📦 Database: MySQL (Database: "${process.env.DB_NAME || 'hotel_pms'}")`);
      console.log(`🌐 API Health Check: http://localhost:${PORT}/api/health`);
      console.log(`======================================================\n`);
    });
  } catch (err) {
    console.error('Failed to initialize database / start server:', err);
    process.exit(1);
  }
}

start();

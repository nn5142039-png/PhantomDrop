import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createSecretRoutes } from './routes/secrets.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'DELETE'],
}));
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'operational', timestamp: new Date().toISOString() });
});

// Mount secret routes
async function start() {
  const secretRoutes = await createSecretRoutes();
  app.use('/api', secretRoutes);

  app.listen(PORT, '127.0.0.1', () => {
    console.log(`\n🔒 Phantom Drop Server`);
    console.log(`   Port: ${PORT}`);
    console.log(`   Host: 127.0.0.1`);
    console.log(`   Status: Operational\n`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

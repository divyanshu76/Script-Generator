import express from 'express';
import dotenv from 'dotenv';
import aiRoutes from './routes/ai.js';

// Load environment variables from .env.local first, then fallback to .env
dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Routes
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

export default app;

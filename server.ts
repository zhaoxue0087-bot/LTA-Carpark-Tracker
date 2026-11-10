import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import healthHandler from './api/health.ts';
import carparkAvailabilityHandler from './api/carparkavailability.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 1. Health check serverless route
app.all('/api/health', healthHandler);

// 2. CarParkAvailability serverless route (LTA DataMall CarParkAvailabilityv2)
app.all('/api/carparkavailability', carparkAvailabilityHandler);
app.all('/api/carparks/live', carparkAvailabilityHandler); // Alias for frontend compatibility

// 3. Optional endpoint to test / verify an LTA AccountKey
app.post('/api/carparks/test-key', async (req, res) => {
  const accountKey = req.body?.accountKey || process.env.LTA_ACCOUNT_KEY || process.env.LTA_DATAMALL_KEY;
  if (!accountKey) {
    return res.status(400).json({
      success: false,
      message: 'AccountKey is required to verify with LTA DataMall.',
    });
  }

  try {
    const testUrl = 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2?$top=2';
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        AccountKey: accountKey.trim(),
        accept: 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return res.json({
        success: true,
        message: 'AccountKey successfully verified with LTA DataMall!',
        sampleCount: data?.value?.length || 0,
      });
    } else {
      const text = await response.text();
      return res.status(response.status).json({
        success: false,
        message: `LTA DataMall rejected key with HTTP ${response.status}: ${text || response.statusText}`,
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: `Failed to connect to LTA DataMall: ${error.message || error}`,
    });
  }
});

// Vite middleware in development; static production assets in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

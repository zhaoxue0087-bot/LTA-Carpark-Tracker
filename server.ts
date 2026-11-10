import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// In-memory cache for LTA DataMall carpark availability
interface LTACache {
  data: any[];
  timestamp: number;
}
let ltaCache: LTACache | null = null;
const CACHE_TTL_MS = 30 * 1000; // 30-second cache

interface LTACarparkRaw {
  CarParkID: string;
  Area: string;
  Development: string;
  Location: string; // e.g. "1.29375 103.85718"
  AvailableLots: number;
  LotType: string; // 'C' (Cars), 'M' or 'Y' (Motorcycles), 'H' (Heavy)
  Agency: string; // 'HDB', 'URA', 'LTA'
}

/**
 * Fetch carpark lots from LTA DataMall
 * Handles pagination up to multiple 500-item pages
 */
async function fetchLTADataMallCarparks(accountKey: string): Promise<LTACarparkRaw[]> {
  const baseUrl = 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2';
  const allResults: LTACarparkRaw[] = [];
  
  // Fetch up to 4 pages (up to 2000 carparks)
  const maxPages = 4;
  for (let i = 0; i < maxPages; i++) {
    const skip = i * 500;
    const url = `${baseUrl}?$skip=${skip}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        AccountKey: accountKey,
        accept: 'application/json',
      },
    });

    if (!response.ok) {
      if (allResults.length > 0) break; // Return what we got
      const errorText = await response.text();
      throw new Error(`LTA DataMall HTTP ${response.status}: ${errorText || response.statusText}`);
    }

    const json = await response.json();
    const batch: LTACarparkRaw[] = json?.value || [];
    allResults.push(...batch);

    // If batch size is less than 500, we've reached the end
    if (batch.length < 500) {
      break;
    }
  }

  return allResults;
}

/**
 * Helper to normalize raw LTA lots into structured record
 */
function normalizeLtaData(rawList: LTACarparkRaw[]) {
  const grouped: Record<string, any> = {};

  for (const item of rawList) {
    const id = item.CarParkID;
    if (!grouped[id]) {
      // Parse coordinates: "1.29375 103.85718"
      let lat = 1.3521;
      let lng = 103.8198;
      if (item.Location && typeof item.Location === 'string') {
        const parts = item.Location.trim().split(/\s+/);
        if (parts.length >= 2) {
          const parsedLat = parseFloat(parts[0]);
          const parsedLng = parseFloat(parts[1]);
          if (!isNaN(parsedLat) && !isNaN(parsedLng) && parsedLat > 1.1 && parsedLat < 1.5) {
            lat = parsedLat;
            lng = parsedLng;
          }
        }
      }

      const agency = (item.Agency?.toUpperCase() || 'LTA') as 'HDB' | 'URA' | 'LTA' | 'COMMERCIAL';

      grouped[id] = {
        id: `lta-${id.toLowerCase()}`,
        carparkNumber: id,
        name: item.Development || `Carpark ${id}`,
        address: `${item.Development || id}, Singapore`,
        agency: agency === 'LTA' ? 'COMMERCIAL' : agency,
        carparkType: 'MULTI_STOREY',
        parkingSystem: 'ELECTRONIC',
        latitude: lat,
        longitude: lng,
        maxHeightMeters: 2.1,
        evCharging: {
          available: false,
          count: 0,
          operator: 'None',
        },
        rates: {
          weekdayRateDay: agency === 'HDB' ? '$0.60 / 30 mins' : '$1.20 / 30 mins',
          weekdayRateNight: '$0.60 / 30 mins, max $5.00',
          weekendRate: agency === 'HDB' ? '$0.60 / 30 mins' : '$1.20 / 30 mins',
          gracePeriodMinutes: 15,
          sundayFreeParking: agency === 'HDB',
          nightParking: true,
          centralArea: item.Area?.toLowerCase() === 'marina' || item.Area?.toLowerCase() === 'orchard',
        },
        lots: {
          C: { totalLots: 0, lotsAvailable: 0, lotType: 'C', updateDatetime: new Date().toISOString() },
          M: { totalLots: 0, lotsAvailable: 0, lotType: 'M', updateDatetime: new Date().toISOString() },
          H: { totalLots: 0, lotsAvailable: 0, lotType: 'H', updateDatetime: new Date().toISOString() },
        },
        planningArea: item.Area || 'Central',
        lastUpdated: new Date().toISOString(),
      };
    }

    // Map LotType
    let typeKey: 'C' | 'M' | 'H' = 'C';
    if (item.LotType === 'M' || item.LotType === 'Y') {
      typeKey = 'M';
    } else if (item.LotType === 'H') {
      typeKey = 'H';
    }

    const available = Number(item.AvailableLots) || 0;
    // Estimate total lots if not provided by LTA (LTA only supplies AvailableLots)
    const currentTotal = grouped[id].lots[typeKey].totalLots;
    const estimatedTotal = currentTotal > 0 ? currentTotal : Math.max(available + 20, Math.round(available * 1.35));

    grouped[id].lots[typeKey] = {
      totalLots: estimatedTotal,
      lotsAvailable: available,
      lotType: typeKey,
      updateDatetime: new Date().toISOString(),
    };
  }

  return Object.values(grouped);
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasLtaKeyConfigured: Boolean(process.env.LTA_ACCOUNT_KEY || process.env.LTA_DATAMALL_KEY),
  });
});

// 2. Validate/Test LTA Account Key
app.post('/api/carparks/test-key', async (req, res) => {
  const accountKey = req.body?.accountKey || process.env.LTA_ACCOUNT_KEY || process.env.LTA_DATAMALL_KEY;
  if (!accountKey) {
    return res.status(400).json({
      success: false,
      message: 'AccountKey is required. Provide it in body or set LTA_ACCOUNT_KEY environment variable.',
    });
  }

  try {
    const testUrl = 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2?$top=3';
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
        message: 'LTA DataMall AccountKey is valid and active!',
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

// 3. Live Carpark Availability Endpoint from LTA DataMall
app.get('/api/carparks/live', async (req, res) => {
  const clientKey = req.headers['x-account-key'] as string;
  const accountKey = (clientKey || process.env.LTA_ACCOUNT_KEY || process.env.LTA_DATAMALL_KEY || '').trim();

  // If cached and valid, return cache
  const now = Date.now();
  if (ltaCache && now - ltaCache.timestamp < CACHE_TTL_MS && !clientKey) {
    return res.json({
      source: 'lta_datamall',
      cached: true,
      cacheAgeSecs: Math.round((now - ltaCache.timestamp) / 1000),
      count: ltaCache.data.length,
      carparks: ltaCache.data,
      lastUpdated: new Date(ltaCache.timestamp).toISOString(),
    });
  }

  if (!accountKey) {
    return res.json({
      source: 'missing_key_fallback',
      message: 'No LTA_ACCOUNT_KEY provided. Configure your AccountKey to stream direct from LTA DataMall.',
      cached: false,
      count: 0,
      carparks: [],
    });
  }

  try {
    const rawItems = await fetchLTADataMallCarparks(accountKey);
    const normalized = normalizeLtaData(rawItems);

    // Save to cache
    ltaCache = {
      data: normalized,
      timestamp: now,
    };

    return res.json({
      source: 'lta_datamall',
      cached: false,
      count: normalized.length,
      rawCount: rawItems.length,
      carparks: normalized,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching LTA DataMall:', error);
    return res.status(500).json({
      source: 'error',
      message: error.message || 'Failed to fetch from LTA DataMall',
      cached: false,
      carparks: [],
    });
  }
});

// Vite middleware in dev; static assets in production
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

import { Carpark, VehicleType, AvailabilityLevel } from '../types/carpark';
import { INITIAL_CARPARKS } from '../data/singaporeCarparks';

/**
 * Calculates Haversine distance in kilometers between two GPS coordinates
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Categorize lot availability into high, medium, low, full
 */
export function getAvailabilityLevel(
  lotsAvailable: number,
  totalLots: number
): AvailabilityLevel {
  if (lotsAvailable <= 0 || totalLots === 0) return 'full';
  const percentage = (lotsAvailable / totalLots) * 100;
  if (percentage >= 25 || lotsAvailable >= 50) return 'high';
  if (percentage >= 8 || lotsAvailable >= 10) return 'medium';
  return 'low';
}

export function getAvailabilityBadgeProps(level: AvailabilityLevel): {
  text: string;
  badgeClass: string;
  dotColor: string;
} {
  switch (level) {
    case 'high':
      return {
        text: 'Plenty of Lots',
        badgeClass: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60',
        dotColor: '#10b981',
      };
    case 'medium':
      return {
        text: 'Filling Fast',
        badgeClass: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60',
        dotColor: '#f59e0b',
      };
    case 'low':
      return {
        text: 'Limited Lots',
        badgeClass: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60',
        dotColor: '#f43f5e',
      };
    case 'full':
      return {
        text: 'Carpark Full',
        badgeClass: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
        dotColor: '#64748b',
      };
  }
}

const BOOKMARK_STORAGE_KEY = 'sg_parklive_saved_carparks';

export function getSavedCarparkIds(): string[] {
  try {
    const raw = localStorage.getItem(BOOKMARK_STORAGE_KEY);
    return raw ? JSON.parse(raw) : ['hdb-acb-amk712', 'mbs-01'];
  } catch {
    return ['hdb-acb-amk712', 'mbs-01'];
  }
}

export function saveCarparkIds(ids: string[]): void {
  try {
    localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(ids));
  } catch (err) {
    console.error('Failed to save bookmarks:', err);
  }
}

export function toggleCarparkBookmark(id: string): string[] {
  const current = getSavedCarparkIds();
  const next = current.includes(id)
    ? current.filter((item) => item !== id)
    : [...current, id];
  saveCarparkIds(next);
  return next;
}

/**
 * Realistic Singapore Carpark Availability Simulation Engine
 * Generates realistic fluctuations simulating real-world gantry telemetry
 */
export function simulateLotUpdates(carparks: Carpark[]): Carpark[] {
  const now = new Date().toISOString();
  return carparks.map((cp) => {
    // 60% chance to have a minor delta in car lots
    const shouldChange = Math.random() < 0.6;
    if (!shouldChange) return cp;

    const carLots = cp.lots.C;
    // Jitter by -4 to +4 lots
    const delta = Math.floor(Math.random() * 9) - 4;
    const newCarAvailable = Math.max(
      0,
      Math.min(carLots.totalLots, carLots.lotsAvailable + delta)
    );

    // Minor motorbike delta
    const motoLots = cp.lots.M;
    const motoDelta = Math.floor(Math.random() * 5) - 2;
    const newMotoAvailable = Math.max(
      0,
      Math.min(motoLots.totalLots, motoLots.lotsAvailable + motoDelta)
    );

    return {
      ...cp,
      lastUpdated: now,
      lots: {
        ...cp.lots,
        C: {
          ...carLots,
          lotsAvailable: newCarAvailable,
          updateDatetime: now,
        },
        M: {
          ...motoLots,
          lotsAvailable: newMotoAvailable,
          updateDatetime: now,
        },
      },
    };
  });
}

/**
 * Connector configuration for LTA DataMall & public feeds
 */
export interface BackendConnectionConfig {
  backendUrl: string;
  apiKey?: string;
  sourceType: 'LTA_DATAMALL' | 'SIMULATION' | 'DATAGOV' | 'CUSTOM_API';
  autoRefreshIntervalSecs: number; // 0 = disabled, 15, 30, 60
}

const CONFIG_STORAGE_KEY = 'sg_parklive_backend_config';

export function getBackendConfig(): BackendConnectionConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error(err);
  }
  return {
    backendUrl: '/api/carparks/live',
    apiKey: '',
    sourceType: 'LTA_DATAMALL',
    autoRefreshIntervalSecs: 30,
  };
}

export function saveBackendConfig(config: BackendConnectionConfig): void {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error(err);
  }
}

/**
 * Fetch live carparks from server route connected to LTA DataMall
 */
export async function fetchLiveLTAData(accountKey?: string): Promise<{
  success: boolean;
  carparks: Carpark[];
  message: string;
  source: string;
  cached?: boolean;
}> {
  try {
    const headers: Record<string, string> = {};
    if (accountKey) {
      headers['x-account-key'] = accountKey.trim();
    }

    const response = await fetch('/api/carparkavailability', {
      method: 'GET',
      headers,
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        carparks: [],
        message: data.message || `Server responded with ${response.status}`,
        source: data.source || 'error',
      };
    }

    if (data.source === 'missing_key_notice' || data.source === 'missing_key_fallback') {
      return {
        success: false,
        carparks: [],
        message: data.message || 'No LTA_ACCOUNT_KEY configured yet.',
        source: 'missing_key_notice',
      };
    }

    return {
      success: true,
      carparks: data.carparks || [],
      message: `Fetched ${data.count || 0} carparks from LTA DataMall`,
      source: data.source || 'lta_datamall',
      cached: data.cached,
    };
  } catch (error: any) {
    return {
      success: false,
      carparks: [],
      message: error.message || 'Network request failed',
      source: 'network_error',
    };
  }
}

/**
 * Validate an LTA AccountKey
 */
export async function validateLtaAccountKey(accountKey: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const response = await fetch('/api/carparks/test-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountKey }),
    });

    const data = await response.json();
    return {
      success: data.success || response.ok,
      message: data.message || (response.ok ? 'AccountKey is valid' : 'Failed to validate key'),
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to connect to verification server',
    };
  }
}

/**
 * Merge live LTA DataMall records with base rich curated carparks
 */
export function mergeLtaWithCuratedCarparks(
  curated: Carpark[],
  liveLtaList: Carpark[]
): Carpark[] {
  if (!liveLtaList || liveLtaList.length === 0) return curated;

  const ltaMap = new Map<string, Carpark>();
  for (const item of liveLtaList) {
    ltaMap.set(item.carparkNumber.toUpperCase(), item);
    // Also index by sanitized name
    ltaMap.set(item.name.toLowerCase().trim(), item);
  }

  // 1. Update curated carparks with real live lot counts if matching
  const updatedCurated = curated.map((base) => {
    const live = ltaMap.get(base.carparkNumber.toUpperCase()) || ltaMap.get(base.name.toLowerCase().trim());
    if (live) {
      // Remove from map so we know it's merged
      ltaMap.delete(base.carparkNumber.toUpperCase());
      ltaMap.delete(base.name.toLowerCase().trim());

      return {
        ...base,
        lastUpdated: live.lastUpdated || new Date().toISOString(),
        lots: {
          C: live.lots.C?.lotsAvailable !== undefined
            ? {
                ...base.lots.C,
                lotsAvailable: live.lots.C.lotsAvailable,
                totalLots: Math.max(base.lots.C.totalLots, live.lots.C.lotsAvailable),
                updateDatetime: live.lots.C.updateDatetime,
              }
            : base.lots.C,
          M: live.lots.M?.lotsAvailable !== undefined
            ? {
                ...base.lots.M,
                lotsAvailable: live.lots.M.lotsAvailable,
                totalLots: Math.max(base.lots.M.totalLots, live.lots.M.lotsAvailable),
                updateDatetime: live.lots.M.updateDatetime,
              }
            : base.lots.M,
          H: live.lots.H?.lotsAvailable !== undefined
            ? {
                ...base.lots.H,
                lotsAvailable: live.lots.H.lotsAvailable,
                totalLots: Math.max(base.lots.H.totalLots, live.lots.H.lotsAvailable),
                updateDatetime: live.lots.H.updateDatetime,
              }
            : base.lots.H,
        },
      };
    }
    return base;
  });

  // 2. Append all newly discovered carparks from LTA DataMall
  const newLtaItems: Carpark[] = [];
  const addedIds = new Set(updatedCurated.map((c) => c.carparkNumber.toUpperCase()));

  for (const item of liveLtaList) {
    if (!addedIds.has(item.carparkNumber.toUpperCase())) {
      addedIds.add(item.carparkNumber.toUpperCase());
      newLtaItems.push(item);
    }
  }

  return [...updatedCurated, ...newLtaItems];
}

/**
 * Format CSV export of carpark listings
 */
export function exportCarparksToCsv(
  carparks: Carpark[],
  vehicleType: VehicleType = 'C'
): void {
  const headers = [
    'Carpark Number',
    'Name',
    'Address',
    'Agency',
    'Carpark Type',
    'Available Lots',
    'Total Lots',
    'Occupancy %',
    'Weekday Rate Day',
    'Weekend Rate',
    'Sunday Free Parking',
    'Clearance (m)',
    'EV Chargers',
    'Latitude',
    'Longitude',
    'Last Updated',
  ];

  const rows = carparks.map((cp) => {
    const lot = cp.lots[vehicleType];
    const occ =
      lot.totalLots > 0
        ? Math.round(((lot.totalLots - lot.lotsAvailable) / lot.totalLots) * 100)
        : 0;

    return [
      `"${cp.carparkNumber}"`,
      `"${cp.name.replace(/"/g, '""')}"`,
      `"${cp.address.replace(/"/g, '""')}"`,
      `"${cp.agency}"`,
      `"${cp.carparkType}"`,
      lot.lotsAvailable,
      lot.totalLots,
      `${occ}%`,
      `"${cp.rates.weekdayRateDay.replace(/"/g, '""')}"`,
      `"${cp.rates.weekendRate.replace(/"/g, '""')}"`,
      cp.rates.sundayFreeParking ? 'YES' : 'NO',
      cp.maxHeightMeters ?? 'N/A',
      cp.evCharging.available ? `${cp.evCharging.count} (${cp.evCharging.operator})` : 'NO',
      cp.latitude,
      cp.longitude,
      `"${cp.lastUpdated}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `singapore_carparks_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

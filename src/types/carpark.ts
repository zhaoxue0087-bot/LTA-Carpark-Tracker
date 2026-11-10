export type CarparkAgency = 'HDB' | 'URA' | 'LTA' | 'MALL' | 'COMMERCIAL';

export type VehicleType = 'C' | 'M' | 'H'; // C: Car, M: Motorcycle, H: Heavy Vehicle

export type CarparkType = 
  | 'MULTI_STOREY' 
  | 'SURFACE' 
  | 'BASEMENT' 
  | 'MECHANIZED' 
  | 'COVERED';

export type ParkingSystem = 'ELECTRONIC' | 'COUPON' | 'GANTRYLESS';

export type AvailabilityLevel = 'high' | 'medium' | 'low' | 'full';

export interface LotAvailability {
  totalLots: number;
  lotsAvailable: number;
  lotType: VehicleType;
  updateDatetime: string;
}

export interface CarparkRate {
  weekdayRateDay: string; // e.g. "$0.60 / 30 mins" or "$1.20 / 30 mins (Central)"
  weekdayRateNight: string; // e.g. "$0.60 / 30 mins, max $5.00"
  weekendRate: string; // e.g. "$0.60 / 30 mins"
  gracePeriodMinutes: number; // e.g. 10 or 15
  sundayFreeParking: boolean;
  nightParking: boolean;
  centralArea: boolean;
  notes?: string;
}

export interface EVChargerInfo {
  available: boolean;
  count: number;
  operator: string; // e.g. "SP Mobility", "Shell Recharge", "CDG ENGIE"
  powerKw?: number;
  connectorType?: string; // e.g. "Type 2 / CCS2"
}

export interface Carpark {
  id: string;
  carparkNumber: string; // e.g. "ACB", "TP21", "MBS01"
  name: string;
  address: string;
  agency: CarparkAgency;
  carparkType: CarparkType;
  parkingSystem: ParkingSystem;
  latitude: number;
  longitude: number;
  maxHeightMeters?: number; // e.g. 2.1, 1.9
  evCharging: EVChargerInfo;
  rates: CarparkRate;
  lots: Record<VehicleType, LotAvailability>;
  planningArea: string; // e.g. "Downtown Core", "Orchard", "Ang Mo Kio", "Tampines"
  nearestMrt?: string;
  lastUpdated: string;
  // Computed client-side
  distanceKm?: number;
}

export interface FilterState {
  searchQuery: string;
  selectedVehicleType: VehicleType;
  agency: CarparkAgency | 'ALL';
  availabilityFilter: 'ALL' | 'AVAILABLE' | 'HIGH' | 'FULL';
  hasEVOnly: boolean;
  freeSundayOnly: boolean;
  minHeightClearance: number; // 0 means no filter, otherwise 1.9, 2.0, 2.1 etc.
  planningArea: string; // 'ALL' or specific area
  sortOption: 'distance_asc' | 'lots_desc' | 'lots_asc' | 'rate_asc' | 'name_asc';
}

export interface UserCoordinates {
  latitude: number;
  longitude: number;
  name: string;
}

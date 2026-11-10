import React, { useState } from 'react';
import { 
  Carpark, 
  VehicleType 
} from '../types/carpark';
import { 
  getAvailabilityLevel, 
  getAvailabilityBadgeProps 
} from '../services/carparkService';
import { 
  X, 
  Navigation, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Zap, 
  Bookmark, 
  BookmarkCheck,
  Check, 
  Copy, 
  ExternalLink,
  Car,
  Bike,
  Truck,
  AlertTriangle
} from 'lucide-react';

interface CarparkDetailModalProps {
  carpark: Carpark | null;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  selectedVehicleType: VehicleType;
}

export const CarparkDetailModal: React.FC<CarparkDetailModalProps> = ({
  carpark,
  onClose,
  isBookmarked,
  onToggleBookmark,
  selectedVehicleType,
}) => {
  const [copied, setCopied] = useState(false);

  if (!carpark) return null;

  const currentLot = carpark.lots[selectedVehicleType] || carpark.lots.C;
  const level = getAvailabilityLevel(currentLot.lotsAvailable, currentLot.totalLots);
  const badge = getAvailabilityBadgeProps(level);
  const occupancyPercent = currentLot.totalLots > 0
    ? Math.min(100, Math.round(((currentLot.totalLots - currentLot.lotsAvailable) / currentLot.totalLots) * 100))
    : 100;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${carpark.name} (${carpark.carparkNumber})\n${carpark.address}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Google Maps, Apple Maps, Waze URLs
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${carpark.latitude},${carpark.longitude}`;
  const appleMapsUrl = `maps://maps.apple.com/?daddr=${carpark.latitude},${carpark.longitude}`;
  const wazeUrl = `https://waze.com/ul?ll=${carpark.latitude},${carpark.longitude}&navigate=yes`;

  // Simulated 24-hr occupancy pattern
  const hourlyOccupancy = [
    { hour: '12am', occ: 45 },
    { hour: '2am', occ: 42 },
    { hour: '4am', occ: 40 },
    { hour: '6am', occ: 48 },
    { hour: '8am', occ: 72 },
    { hour: '10am', occ: 85 },
    { hour: '12pm', occ: 95 },
    { hour: '2pm', occ: 88 },
    { hour: '4pm', occ: 78 },
    { hour: '6pm', occ: 92 },
    { hour: '8pm', occ: 86 },
    { hour: '10pm', occ: 64 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                {carpark.carparkNumber}
              </span>
              <span aria-hidden="true">·</span>
              <span>{carpark.agency}</span>
              <span aria-hidden="true">·</span>
              <span>{carpark.carparkType.replace('_', ' ')}</span>
              <span aria-hidden="true">·</span>
              <span>{carpark.planningArea}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {carpark.name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{carpark.address}</span>
            </p>
            {carpark.nearestMrt && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                MRT: {carpark.nearestMrt}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleBookmark}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark this carpark'}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-5 h-5 text-amber-500 fill-amber-500" />
              ) : (
                <Bookmark className="w-5 h-5 text-slate-500" />
              )}
            </button>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Real-Time Lot Hero Banner */}
        <div className="my-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
              Live Lot Availability
            </div>
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${badge.badgeClass}`}>
              {badge.text}
            </span>
          </div>

          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-4xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
              {currentLot.lotsAvailable}
            </span>
            <span className="text-sm font-mono text-slate-500 dark:text-slate-400">
              lots available out of {currentLot.totalLots} total lots
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden mb-2">
            <div
              className={`h-full transition-all duration-500 ${
                level === 'high' ? 'bg-emerald-500' : level === 'medium' ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${occupancyPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
            <span>{occupancyPercent}% Occupancy</span>
            <span>Last Telemetry: {new Date(carpark.lastUpdated).toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Vehicle Lots Breakdown Table */}
        <div className="mb-5">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Lots Breakdown by Vehicle Class
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {/* Cars */}
            <div className={`p-3 rounded-xl border text-center ${
              selectedVehicleType === 'C' ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-800'
            }`}>
              <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                <Car className="w-4 h-4 text-emerald-600" />
                <span>Cars (C)</span>
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                {carpark.lots.C.lotsAvailable}
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                / {carpark.lots.C.totalLots} lots
              </div>
            </div>

            {/* Motorcycles */}
            <div className={`p-3 rounded-xl border text-center ${
              selectedVehicleType === 'M' ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-800'
            }`}>
              <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                <Bike className="w-4 h-4 text-blue-600" />
                <span>Motorcycles (M)</span>
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                {carpark.lots.M.lotsAvailable}
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                / {carpark.lots.M.totalLots} lots
              </div>
            </div>

            {/* Heavy Vehicles */}
            <div className={`p-3 rounded-xl border text-center ${
              selectedVehicleType === 'H' ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-800'
            }`}>
              <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                <Truck className="w-4 h-4 text-amber-600" />
                <span>Heavy Vehicles</span>
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                {carpark.lots.H.lotsAvailable}
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                / {carpark.lots.H.totalLots} lots
              </div>
            </div>
          </div>
        </div>

        {/* Parking Rates & Regulations */}
        <div className="mb-5">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Parking Rates & Charges
          </h3>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            <div className="flex justify-between p-3">
              <span className="text-slate-500 dark:text-slate-400">Weekday Day Rate</span>
              <span className="font-semibold text-slate-900 dark:text-white">{carpark.rates.weekdayRateDay}</span>
            </div>
            <div className="flex justify-between p-3">
              <span className="text-slate-500 dark:text-slate-400">Weekday Night Rate</span>
              <span className="font-semibold text-slate-900 dark:text-white">{carpark.rates.weekdayRateNight}</span>
            </div>
            <div className="flex justify-between p-3">
              <span className="text-slate-500 dark:text-slate-400">Weekend & Public Holidays</span>
              <span className="font-semibold text-slate-900 dark:text-white">{carpark.rates.weekendRate}</span>
            </div>
            <div className="flex justify-between p-3">
              <span className="text-slate-500 dark:text-slate-400">Grace Period</span>
              <span className="font-semibold font-mono text-emerald-600 dark:text-emerald-400">{carpark.rates.gracePeriodMinutes} mins</span>
            </div>
            <div className="flex justify-between p-3">
              <span className="text-slate-500 dark:text-slate-400">Sunday Free Parking Scheme</span>
              <span className={`font-semibold ${carpark.rates.sundayFreeParking ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                {carpark.rates.sundayFreeParking ? 'Active (7:30am - 10:30pm)' : 'Not applicable'}
              </span>
            </div>
            {carpark.rates.notes && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 text-xs">
                {carpark.rates.notes}
              </div>
            )}
          </div>
        </div>

        {/* Height Clearance & EV Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {/* Clearance */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Max Clearance Height</div>
              <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                {carpark.maxHeightMeters ? `${carpark.maxHeightMeters}m limit` : 'Open-air (No Height Cap)'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Check gantry clearance before entering with roof rack or MPV
              </div>
            </div>
          </div>

          {/* EV Charging */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">EV Charging Stations</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {carpark.evCharging.available
                  ? `${carpark.evCharging.count} Bays · ${carpark.evCharging.operator}`
                  : 'No EV Chargers Installed'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {carpark.evCharging.connectorType || 'Standard EPS parking'}
              </div>
            </div>
          </div>
        </div>

        {/* Typical Hourly Occupancy Chart */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Typical Daily Occupancy Pattern
            </h3>
            <span className="text-[11px] text-slate-400">Peak hours: 12pm & 7pm</span>
          </div>
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="h-20 flex items-end justify-between gap-1">
              {hourlyOccupancy.map((slot, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t transition-all ${
                      slot.occ > 85 ? 'bg-rose-400' : slot.occ > 65 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ height: `${(slot.occ / 100) * 60}px` }}
                    title={`${slot.hour}: ~${slot.occ}% full`}
                  />
                  <span className="text-[10px] font-mono text-slate-400">{slot.hour}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons: Navigate & Copy */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <Navigation className="w-4 h-4" />
            <span>Open in Google Maps</span>
          </a>

          <a
            href={wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Waze</span>
          </a>

          <button
            onClick={handleCopy}
            className="w-full sm:w-auto py-2.5 px-4 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy Address'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

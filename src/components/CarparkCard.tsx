import React from 'react';
import { 
  Carpark, 
  VehicleType 
} from '../types/carpark';
import { 
  getAvailabilityLevel, 
  getAvailabilityBadgeProps 
} from '../services/carparkService';
import { 
  Zap, 
  ArrowUpRight, 
  Bookmark, 
  BookmarkCheck, 
  ShieldCheck, 
  Clock, 
  CheckCircle2,
  Navigation,
  Sparkles
} from 'lucide-react';

interface CarparkCardProps {
  carpark: Carpark;
  selectedVehicleType: VehicleType;
  isSelected: boolean;
  isBookmarked: boolean;
  onSelect: () => void;
  onToggleBookmark: () => void;
  onOpenDetails: () => void;
}

export const CarparkCard: React.FC<CarparkCardProps> = ({
  carpark,
  selectedVehicleType,
  isSelected,
  isBookmarked,
  onSelect,
  onToggleBookmark,
  onOpenDetails,
}) => {
  const lot = carpark.lots[selectedVehicleType] || carpark.lots.C;
  const level = getAvailabilityLevel(lot.lotsAvailable, lot.totalLots);
  const badge = getAvailabilityBadgeProps(level);
  const occupancyPercent = lot.totalLots > 0 
    ? Math.min(100, Math.round(((lot.totalLots - lot.lotsAvailable) / lot.totalLots) * 100))
    : 100;
  
  // Progress bar color based on availability
  let progressColor = 'bg-emerald-500';
  if (level === 'medium') progressColor = 'bg-amber-500';
  if (level === 'low') progressColor = 'bg-rose-500';
  if (level === 'full') progressColor = 'bg-slate-400';

  const vehicleLabel = selectedVehicleType === 'C' ? 'Cars' : selectedVehicleType === 'M' ? 'Bikes' : 'Heavy';

  return (
    <div
      onClick={onSelect}
      className={`group relative rounded-xl border p-4 transition-all cursor-pointer ${
        isSelected
          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 ring-1 ring-emerald-500 shadow-sm'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
      }`}
    >
      {/* Top Metadata Line - Zero Pill Rule */}
      <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
            {carpark.carparkNumber}
          </span>
          <span aria-hidden="true">·</span>
          <span>{carpark.agency}</span>
          <span aria-hidden="true">·</span>
          <span>{carpark.planningArea}</span>
          {carpark.distanceKm !== undefined && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                {carpark.distanceKm} km away
              </span>
            </>
          )}
        </div>

        {/* Favorite Bookmark Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleBookmark();
          }}
          title={isBookmarked ? 'Remove from saved carparks' : 'Save carpark'}
          className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isBookmarked ? (
            <BookmarkCheck className="w-4 h-4 text-amber-500 fill-amber-500" />
          ) : (
            <Bookmark className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Carpark Name & Address */}
      <div className="mb-3">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
          {carpark.name}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
          {carpark.address}
        </p>
      </div>

      {/* Lot Availability Hero Numbers */}
      <div className="flex items-end justify-between gap-4 py-2 mb-2 border-y border-slate-100 dark:border-slate-800">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">
            Available {vehicleLabel} Lots
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight tabular-nums text-slate-900 dark:text-white">
              {lot.lotsAvailable}
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              / {lot.totalLots} total
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${badge.badgeClass}`}>
            {badge.text}
          </span>
          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
            {occupancyPercent}% Occupied
          </div>
        </div>
      </div>

      {/* Visual Capacity Meter Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mb-3">
        <div
          className={`h-full transition-all duration-500 ${progressColor}`}
          style={{ width: `${occupancyPercent}%` }}
        />
      </div>

      {/* Feature Highlights & Badges */}
      <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600 dark:text-slate-300 mb-3">
        {carpark.rates.sundayFreeParking && (
          <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded text-[11px] font-medium">
            <Sparkles className="w-3 h-3" />
            Free Sun/PH
          </span>
        )}

        {carpark.evCharging.available && (
          <span className="flex items-center gap-1 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded text-[11px] font-medium">
            <Zap className="w-3 h-3" />
            {carpark.evCharging.count} EV Chargers
          </span>
        )}

        {carpark.maxHeightMeters && (
          <span className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono">
            ↕ {carpark.maxHeightMeters}m limit
          </span>
        )}
      </div>

      {/* Bottom Rate & Details Action */}
      <div className="flex items-center justify-between text-xs pt-1">
        <div className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[200px]">
          {carpark.rates.weekdayRateDay}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails();
          }}
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1 transition-colors"
        >
          <span>Details & Rates</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { Carpark, VehicleType } from '../types/carpark';
import { getAvailabilityLevel } from '../services/carparkService';
import { Bookmark, ArrowRight, Car } from 'lucide-react';

interface FavoritesBarProps {
  favoriteCarparks: Carpark[];
  selectedVehicleType: VehicleType;
  onSelectCarpark: (cp: Carpark) => void;
  onViewAllFavorites: () => void;
}

export const FavoritesBar: React.FC<FavoritesBarProps> = ({
  favoriteCarparks,
  selectedVehicleType,
  onSelectCarpark,
  onViewAllFavorites,
}) => {
  if (favoriteCarparks.length === 0) return null;

  return (
    <div className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
          <Bookmark className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>Saved:</span>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto py-0.5">
          {favoriteCarparks.slice(0, 5).map((cp) => {
            const lot = cp.lots[selectedVehicleType] || cp.lots.C;
            const level = getAvailabilityLevel(lot.lotsAvailable, lot.totalLots);

            let dotColor = 'bg-emerald-500';
            if (level === 'medium') dotColor = 'bg-amber-500';
            if (level === 'low') dotColor = 'bg-rose-500';
            if (level === 'full') dotColor = 'bg-slate-400';

            return (
              <button
                key={cp.id}
                onClick={() => onSelectCarpark(cp)}
                className="flex items-center gap-2 py-1 px-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-lg hover:border-emerald-500 transition-all text-xs shrink-0 shadow-xs"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-200 max-w-[140px] truncate">
                  {cp.name}
                </span>
                <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />
                <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                  {lot.lotsAvailable}
                </span>
              </button>
            );
          })}
        </div>

        {favoriteCarparks.length > 5 && (
          <button
            onClick={onViewAllFavorites}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0 flex items-center gap-1"
          >
            <span>View all ({favoriteCarparks.length})</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};

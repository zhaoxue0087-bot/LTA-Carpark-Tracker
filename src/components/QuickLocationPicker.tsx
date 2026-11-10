import React from 'react';
import { PRESET_LOCATIONS } from '../data/singaporeCarparks';
import { UserCoordinates } from '../types/carpark';
import { MapPin, Navigation, Crosshair } from 'lucide-react';

interface QuickLocationPickerProps {
  currentLocation: UserCoordinates;
  onSelectLocation: (loc: UserCoordinates) => void;
  onUseCurrentGps: () => void;
  isLocating: boolean;
}

export const QuickLocationPicker: React.FC<QuickLocationPickerProps> = ({
  currentLocation,
  onSelectLocation,
  onUseCurrentGps,
  isLocating,
}) => {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 py-2 px-4 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span>Quick Area:</span>
        </div>

        {/* Location presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {PRESET_LOCATIONS.map((loc) => {
            const isActive = currentLocation.name === loc.name;
            return (
              <button
                key={loc.name}
                onClick={() => onSelectLocation(loc)}
                className={`px-2.5 py-1 text-xs rounded-md transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {loc.name}
              </button>
            );
          })}
        </div>

        {/* GPS Button */}
        <button
          onClick={onUseCurrentGps}
          disabled={isLocating}
          className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-emerald-600 rounded-md text-xs font-medium shrink-0 transition-colors shadow-xs"
        >
          <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-emerald-600' : ''}`} />
          <span>{isLocating ? 'Locating...' : 'My GPS'}</span>
        </button>
      </div>
    </div>
  );
};

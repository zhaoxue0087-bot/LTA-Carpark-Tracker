import React from 'react';
import { 
  FilterState, 
  VehicleType, 
  CarparkAgency 
} from '../types/carpark';
import { 
  Search, 
  X, 
  Car, 
  Bike, 
  Truck, 
  SlidersHorizontal, 
  Zap, 
  Sparkles,
  ArrowUpDown
} from 'lucide-react';

interface FilterBarProps {
  filterState: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  onResetFilters: () => void;
  totalFilteredCount: number;
  totalAllCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filterState,
  onFilterChange,
  onResetFilters,
  totalFilteredCount,
  totalAllCount,
}) => {
  const isFiltered =
    filterState.searchQuery !== '' ||
    filterState.agency !== 'ALL' ||
    filterState.availabilityFilter !== 'ALL' ||
    filterState.hasEVOnly ||
    filterState.freeSundayOnly ||
    filterState.minHeightClearance > 0 ||
    filterState.planningArea !== 'ALL';

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 transition-colors">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Row 1: Search + Vehicle Selector + Sort */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={filterState.searchQuery}
              onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
              placeholder="Search carpark code (e.g. ACB, TP21), name, or area (e.g. Orchard, AMK)..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
            />
            {filterState.searchQuery && (
              <button
                onClick={() => onFilterChange({ searchQuery: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Vehicle Type Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
            <button
              onClick={() => onFilterChange({ selectedVehicleType: 'C' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                filterState.selectedVehicleType === 'C'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Car className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Cars</span>
            </button>
            <button
              onClick={() => onFilterChange({ selectedVehicleType: 'M' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                filterState.selectedVehicleType === 'M'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Bike className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Motorcycles</span>
            </button>
            <button
              onClick={() => onFilterChange({ selectedVehicleType: 'H' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                filterState.selectedVehicleType === 'H'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Truck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Heavy</span>
            </button>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterState.sortOption}
              onChange={(e) => onFilterChange({ sortOption: e.target.value as any })}
              className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="distance_asc">Nearest Location</option>
              <option value="lots_desc">Most Available Lots</option>
              <option value="lots_asc">Fewest Available Lots</option>
              <option value="rate_asc">Cheapest Day Rate</option>
              <option value="name_asc">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Row 2: Secondary Quick Filter Controls */}
        <div className="flex items-center justify-between gap-3 flex-wrap text-xs pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Agency Filter */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg">
              {(['ALL', 'HDB', 'URA', 'COMMERCIAL'] as const).map((agencyKey) => (
                <button
                  key={agencyKey}
                  onClick={() => onFilterChange({ agency: agencyKey })}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap ${
                    filterState.agency === agencyKey
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {agencyKey === 'ALL' ? 'All Agencies' : agencyKey === 'COMMERCIAL' ? 'Malls/Comm' : agencyKey}
                </button>
              ))}
            </div>

            {/* Availability Filter */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg">
              <button
                onClick={() => onFilterChange({ availabilityFilter: 'ALL' })}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap ${
                  filterState.availabilityFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All Lots
              </button>
              <button
                onClick={() => onFilterChange({ availabilityFilter: 'AVAILABLE' })}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap ${
                  filterState.availabilityFilter === 'AVAILABLE'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 font-medium shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Available (&gt;0)
              </button>
              <button
                onClick={() => onFilterChange({ availabilityFilter: 'HIGH' })}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap ${
                  filterState.availabilityFilter === 'HIGH'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 font-medium shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Plenty (&gt;25%)
              </button>
            </div>

            {/* EV Chargers Toggle */}
            <button
              onClick={() => onFilterChange({ hasEVOnly: !filterState.hasEVOnly })}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap ${
                filterState.hasEVOnly
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-400'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3 h-3 text-blue-500" />
              <span>EV Charging</span>
            </button>

            {/* Free Sunday Parking Toggle */}
            <button
              onClick={() => onFilterChange({ freeSundayOnly: !filterState.freeSundayOnly })}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap ${
                filterState.freeSundayOnly
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3 h-3 text-emerald-500" />
              <span>Sunday Free Parking</span>
            </button>
          </div>

          {/* Results count & Clear */}
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
            <span>
              Showing <strong className="font-mono text-slate-800 dark:text-slate-200">{totalFilteredCount}</strong> of {totalAllCount} carparks
            </span>
            {isFiltered && (
              <button
                onClick={onResetFilters}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-medium ml-1"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

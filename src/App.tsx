import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Carpark, 
  FilterState, 
  UserCoordinates, 
  VehicleType 
} from './types/carpark';
import { INITIAL_CARPARKS, PRESET_LOCATIONS } from './data/singaporeCarparks';
import { 
  calculateDistanceKm, 
  simulateLotUpdates, 
  getSavedCarparkIds, 
  toggleCarparkBookmark, 
  exportCarparksToCsv, 
  getBackendConfig, 
  saveBackendConfig, 
  BackendConnectionConfig 
} from './services/carparkService';

import { Navbar } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { CarparkMap } from './components/CarparkMap';
import { CarparkCard } from './components/CarparkCard';
import { CarparkDetailModal } from './components/CarparkDetailModal';
import { FavoritesBar } from './components/FavoritesBar';
import { QuickLocationPicker } from './components/QuickLocationPicker';
import { BackendConnectorModal } from './components/BackendConnectorModal';

import { 
  Compass, 
  ListFilter, 
  Building2, 
  RefreshCw, 
  Car, 
  Info, 
  ArrowUpDown,
  Navigation,
  ExternalLink,
  Zap,
  Sparkles
} from 'lucide-react';

export default function App() {
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  // Core Data & State
  const [carparks, setCarparks] = useState<Carpark[]>(INITIAL_CARPARKS);
  const [selectedCarpark, setSelectedCarpark] = useState<Carpark | null>(null);
  const [detailModalCarpark, setDetailModalCarpark] = useState<Carpark | null>(null);
  const [savedCarparkIds, setSavedCarparkIds] = useState<string[]>(getSavedCarparkIds());
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'map' | 'list' | 'favorites' | 'api-guide'>('map');
  const [isBackendModalOpen, setIsBackendModalOpen] = useState<boolean>(false);
  const [backendConfig, setBackendConfig] = useState<BackendConnectionConfig>(getBackendConfig());

  // User Location
  const [userLocation, setUserLocation] = useState<UserCoordinates>(PRESET_LOCATIONS[0]);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Filters
  const [filterState, setFilterState] = useState<FilterState>({
    searchQuery: '',
    selectedVehicleType: 'C',
    agency: 'ALL',
    availabilityFilter: 'ALL',
    hasEVOnly: false,
    freeSundayOnly: false,
    minHeightClearance: 0,
    planningArea: 'ALL',
    sortOption: 'distance_asc',
  });

  const handleFilterChange = (updates: Partial<FilterState>) => {
    setFilterState((prev) => ({ ...prev, ...updates }));
  };

  const handleResetFilters = () => {
    setFilterState({
      searchQuery: '',
      selectedVehicleType: 'C',
      agency: 'ALL',
      availabilityFilter: 'ALL',
      hasEVOnly: false,
      freeSundayOnly: false,
      minHeightClearance: 0,
      planningArea: 'ALL',
      sortOption: 'distance_asc',
    });
  };

  // Toggle Bookmark
  const handleToggleBookmark = (id: string) => {
    const updated = toggleCarparkBookmark(id);
    setSavedCarparkIds([...updated]);
  };

  // Manual & Auto Refresh Simulation
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setCarparks((prev) => simulateLotUpdates(prev));
      const now = new Date().toISOString();
      setLastUpdated(now);
      setIsRefreshing(false);
    }, 400);
  }, []);

  // Periodic Auto-Refresh based on config
  useEffect(() => {
    if (backendConfig.autoRefreshIntervalSecs <= 0) return;
    const interval = setInterval(() => {
      setCarparks((prev) => simulateLotUpdates(prev));
      setLastUpdated(new Date().toISOString());
    }, backendConfig.autoRefreshIntervalSecs * 1000);

    return () => clearInterval(interval);
  }, [backendConfig.autoRefreshIntervalSecs]);

  // Geolocation Handler
  const handleUseCurrentGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          name: 'My Current Location (GPS)',
        });
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        // Fallback default to Orchard
        setUserLocation(PRESET_LOCATIONS[2]);
      },
      { timeout: 8000 }
    );
  };

  // Calculate distance for all carparks relative to current userLocation
  const carparksWithDistance = useMemo(() => {
    return carparks.map((cp) => ({
      ...cp,
      distanceKm: calculateDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        cp.latitude,
        cp.longitude
      ),
    }));
  }, [carparks, userLocation]);

  // Filter & Sort Pipeline
  const filteredCarparks = useMemo(() => {
    let result = [...carparksWithDistance];

    // Search Query
    if (filterState.searchQuery.trim()) {
      const q = filterState.searchQuery.toLowerCase().trim();
      result = result.filter(
        (cp) =>
          cp.carparkNumber.toLowerCase().includes(q) ||
          cp.name.toLowerCase().includes(q) ||
          cp.address.toLowerCase().includes(q) ||
          cp.planningArea.toLowerCase().includes(q) ||
          (cp.nearestMrt && cp.nearestMrt.toLowerCase().includes(q))
      );
    }

    // Agency
    if (filterState.agency !== 'ALL') {
      result = result.filter((cp) => cp.agency === filterState.agency);
    }

    // Availability Filter
    if (filterState.availabilityFilter === 'AVAILABLE') {
      result = result.filter(
        (cp) => cp.lots[filterState.selectedVehicleType]?.lotsAvailable > 0
      );
    } else if (filterState.availabilityFilter === 'HIGH') {
      result = result.filter((cp) => {
        const lot = cp.lots[filterState.selectedVehicleType];
        if (!lot || lot.totalLots === 0) return false;
        const pct = (lot.lotsAvailable / lot.totalLots) * 100;
        return pct >= 25 || lot.lotsAvailable >= 50;
      });
    } else if (filterState.availabilityFilter === 'FULL') {
      result = result.filter(
        (cp) => cp.lots[filterState.selectedVehicleType]?.lotsAvailable === 0
      );
    }

    // EV Charging
    if (filterState.hasEVOnly) {
      result = result.filter((cp) => cp.evCharging.available);
    }

    // Free Sunday Parking
    if (filterState.freeSundayOnly) {
      result = result.filter((cp) => cp.rates.sundayFreeParking);
    }

    // Min Height Clearance
    if (filterState.minHeightClearance > 0) {
      result = result.filter(
        (cp) => !cp.maxHeightMeters || cp.maxHeightMeters >= filterState.minHeightClearance
      );
    }

    // Sorting
    result.sort((a, b) => {
      const lotA = a.lots[filterState.selectedVehicleType]?.lotsAvailable || 0;
      const lotB = b.lots[filterState.selectedVehicleType]?.lotsAvailable || 0;

      switch (filterState.sortOption) {
        case 'distance_asc':
          return (a.distanceKm || 0) - (b.distanceKm || 0);
        case 'lots_desc':
          return lotB - lotA;
        case 'lots_asc':
          return lotA - lotB;
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'rate_asc':
          return a.rates.weekdayRateDay.localeCompare(b.rates.weekdayRateDay);
        default:
          return 0;
      }
    });

    return result;
  }, [carparksWithDistance, filterState]);

  // Favorite Carparks List
  const favoriteCarparks = useMemo(() => {
    return carparksWithDistance.filter((cp) => savedCarparkIds.includes(cp.id));
  }, [carparksWithDistance, savedCarparkIds]);

  const handleExportCsv = () => {
    exportCarparksToCsv(filteredCarparks, filterState.selectedVehicleType);
  };

  const handleSaveBackendConfig = (newConfig: BackendConnectionConfig) => {
    setBackendConfig(newConfig);
    saveBackendConfig(newConfig);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* 1. Top Navigation Bar adhering to Top Bar Contract */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        savedCount={savedCarparkIds.length}
        onExportCsv={handleExportCsv}
        onOpenBackendModal={() => setIsBackendModalOpen(true)}
      />

      {/* 2. Quick Location & Preset Switcher */}
      <QuickLocationPicker
        currentLocation={userLocation}
        onSelectLocation={setUserLocation}
        onUseCurrentGps={handleUseCurrentGps}
        isLocating={isLocating}
      />

      {/* 3. Saved Favorites Glance Bar */}
      {savedCarparkIds.length > 0 && activeTab !== 'favorites' && (
        <FavoritesBar
          favoriteCarparks={favoriteCarparks}
          selectedVehicleType={filterState.selectedVehicleType}
          onSelectCarpark={(cp) => {
            setSelectedCarpark(cp);
            setDetailModalCarpark(cp);
          }}
          onViewAllFavorites={() => setActiveTab('favorites')}
        />
      )}

      {/* 4. Filter Toolbar */}
      <FilterBar
        filterState={filterState}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalFilteredCount={filteredCarparks.length}
        totalAllCount={carparks.length}
      />

      {/* 5. Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Tab A: Live Map & Split View */}
        {activeTab === 'map' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Filterable Carpark Cards Feed */}
            <div className="lg:col-span-5 flex flex-col gap-3 order-2 lg:order-1">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Carparks near {userLocation.name}
                </span>
                <span className="font-mono">{filteredCarparks.length} results</span>
              </div>

              {filteredCarparks.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <Car className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    No carparks found
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    Try adjusting your search criteria or resetting filters.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors"
                  >
                    Reset all filters
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                  {filteredCarparks.map((cp) => (
                    <CarparkCard
                      key={cp.id}
                      carpark={cp}
                      selectedVehicleType={filterState.selectedVehicleType}
                      isSelected={selectedCarpark?.id === cp.id}
                      isBookmarked={savedCarparkIds.includes(cp.id)}
                      onSelect={() => setSelectedCarpark(cp)}
                      onToggleBookmark={() => handleToggleBookmark(cp.id)}
                      onOpenDetails={() => setDetailModalCarpark(cp)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Sticky Interactive Leaflet Map */}
            <div className="lg:col-span-7 sticky top-20 order-1 lg:order-2 h-[480px] lg:h-[calc(100vh-240px)]">
              <CarparkMap
                carparks={filteredCarparks}
                selectedCarpark={selectedCarpark}
                onSelectCarpark={(cp) => {
                  setSelectedCarpark(cp);
                  setDetailModalCarpark(cp);
                }}
                selectedVehicleType={filterState.selectedVehicleType}
                userLocation={userLocation}
                onLocateUser={handleUseCurrentGps}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        )}

        {/* Tab B: All Carparks Directory Table View */}
        {activeTab === 'list' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Singapore Carpark Directory
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time availability and tariff information across HDB, URA, and commercial operators
                </p>
              </div>
              <button
                onClick={handleExportCsv}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
              >
                <span>Export CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Code / Carpark</th>
                    <th className="py-3 px-4">Agency & Area</th>
                    <th className="py-3 px-4 text-right">Available Lots</th>
                    <th className="py-3 px-4 text-right">Total Capacity</th>
                    <th className="py-3 px-4">Daytime Rate</th>
                    <th className="py-3 px-4">Features</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCarparks.map((cp) => {
                    const lot = cp.lots[filterState.selectedVehicleType] || cp.lots.C;
                    return (
                      <tr 
                        key={cp.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-slate-700 dark:text-slate-300">
                            {cp.carparkNumber}
                          </div>
                          <div className="font-semibold text-slate-900 dark:text-white max-w-[200px] truncate">
                            {cp.name}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          <div>{cp.agency}</div>
                          <div className="text-[11px] text-slate-400">{cp.planningArea}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-sm tabular-nums">
                          <span className={lot.lotsAvailable > 30 ? 'text-emerald-600' : lot.lotsAvailable > 10 ? 'text-amber-600' : 'text-rose-600'}>
                            {lot.lotsAvailable}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-500 tabular-nums">
                          {lot.totalLots}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">
                          {cp.rates.weekdayRateDay}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {cp.rates.sundayFreeParking && (
                              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded font-medium">
                                Free Sun
                              </span>
                            )}
                            {cp.evCharging.available && (
                              <span className="text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded font-medium">
                                EV
                              </span>
                            )}
                            {cp.maxHeightMeters && (
                              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono">
                                {cp.maxHeightMeters}m
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setDetailModalCarpark(cp)}
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 transition-colors"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab C: Saved Favorites View */}
        {activeTab === 'favorites' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Your Saved Carparks ({favoriteCarparks.length})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Quick access to real-time lot availability for your frequently visited locations
                </p>
              </div>
            </div>

            {favoriteCarparks.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <Car className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  No saved carparks yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-sm mx-auto">
                  Click the bookmark icon on any carpark card to save it here for quick daily monitoring.
                </p>
                <button
                  onClick={() => setActiveTab('map')}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors"
                >
                  Explore Carparks Map
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favoriteCarparks.map((cp) => (
                  <CarparkCard
                    key={cp.id}
                    carpark={cp}
                    selectedVehicleType={filterState.selectedVehicleType}
                    isSelected={selectedCarpark?.id === cp.id}
                    isBookmarked={true}
                    onSelect={() => {
                      setSelectedCarpark(cp);
                      setActiveTab('map');
                    }}
                    onToggleBookmark={() => handleToggleBookmark(cp.id)}
                    onOpenDetails={() => setDetailModalCarpark(cp)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* 6. Carpark Detail Modal / Slide-Over */}
      <CarparkDetailModal
        carpark={detailModalCarpark}
        onClose={() => setDetailModalCarpark(null)}
        isBookmarked={detailModalCarpark ? savedCarparkIds.includes(detailModalCarpark.id) : false}
        onToggleBookmark={() => detailModalCarpark && handleToggleBookmark(detailModalCarpark.id)}
        selectedVehicleType={filterState.selectedVehicleType}
      />

      {/* 7. Backend Integration Connector Modal */}
      <BackendConnectorModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
        config={backendConfig}
        onSaveConfig={handleSaveBackendConfig}
      />
    </div>
  );
}

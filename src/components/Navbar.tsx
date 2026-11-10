import React from 'react';
import { 
  Compass, 
  RefreshCw, 
  Bookmark, 
  Code2, 
  Sun, 
  Moon, 
  Car,
  Download
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'map' | 'list' | 'favorites' | 'api-guide';
  setActiveTab: (tab: 'map' | 'list' | 'favorites' | 'api-guide') => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated: string;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  savedCount: number;
  onExportCsv: () => void;
  onOpenBackendModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onRefresh,
  isRefreshing,
  lastUpdated,
  isDarkMode,
  toggleDarkMode,
  savedCount,
  onExportCsv,
  onOpenBackendModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element brand wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <Car className="w-5 h-5 text-white" />
            </div>
            <a 
              href="/" 
              className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 flex items-center gap-2 hover:opacity-90"
              onClick={(e) => { e.preventDefault(); setActiveTab('map'); }}
            >
              SG ParkLive
              <span className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                SG REAL-TIME
              </span>
            </a>
          </div>

          {/* Zone 2: 4-5 concise single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <button
              onClick={() => setActiveTab('map')}
              className={`hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'map' ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 -mb-[2px] pb-1' : ''
              }`}
            >
              <Compass className="w-4 h-4" />
              Live Map & Lots
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'list' ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 -mb-[2px] pb-1' : ''
              }`}
            >
              All Carparks Directory
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'favorites' ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 -mb-[2px] pb-1' : ''
              }`}
            >
              <Bookmark className="w-4 h-4" />
              Saved Carparks ({savedCount})
            </button>
            <button
              onClick={onOpenBackendModal}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 text-slate-500 dark:text-slate-400"
            >
              <Code2 className="w-4 h-4" />
              Backend API Guide
            </button>
          </nav>

          {/* Zone 3: 1 primary action with quick controls */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden lg:flex items-center text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              <span>Updated: {new Date(lastUpdated).toLocaleTimeString('en-SG', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>

            <button
              onClick={onExportCsv}
              title="Export filtered carparks to CSV"
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={toggleDarkMode}
              title="Toggle Light / Dark mode"
              aria-label="Toggle theme"
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 active:scale-95 transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Lots</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-200 dark:border-slate-800 py-2 text-xs font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => setActiveTab('map')}
            className={`py-1 px-2 ${activeTab === 'map' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}`}
          >
            Live Map
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`py-1 px-2 ${activeTab === 'list' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}`}
          >
            List View
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`py-1 px-2 ${activeTab === 'favorites' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}`}
          >
            Saved ({savedCount})
          </button>
          <button
            onClick={onOpenBackendModal}
            className="py-1 px-2 text-slate-500"
          >
            API Docs
          </button>
        </div>
      </div>
    </header>
  );
};

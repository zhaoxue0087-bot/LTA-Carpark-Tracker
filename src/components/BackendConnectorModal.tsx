import React, { useState } from 'react';
import { 
  X, 
  Code2, 
  Check, 
  Copy, 
  Play, 
  ExternalLink, 
  Server, 
  Database,
  Radio,
  FileCode,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { BackendConnectionConfig } from '../services/carparkService';

interface BackendConnectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BackendConnectionConfig;
  onSaveConfig: (cfg: BackendConnectionConfig) => void;
}

export const BackendConnectorModal: React.FC<BackendConnectorModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'guide' | 'schema' | 'server-code'>('config');
  const [formData, setFormData] = useState<BackendConnectionConfig>(config);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<{ loading: boolean; message?: string; success?: boolean }>({
    loading: false,
  });

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const handleTestConnection = async () => {
    setTestStatus({ loading: true });
    try {
      const res = await fetch(formData.backendUrl, {
        headers: formData.apiKey ? { AccountKey: formData.apiKey } : {},
      });
      if (res.ok) {
        setTestStatus({
          loading: false,
          success: true,
          message: `Connection successful! Response status: ${res.status} (${res.statusText})`,
        });
      } else {
        setTestStatus({
          loading: false,
          success: false,
          message: `Endpoint responded with HTTP ${res.status}: ${res.statusText}`,
        });
      }
    } catch (err: any) {
      setTestStatus({
        loading: false,
        success: false,
        message: `Network error or CORS restriction: ${err.message || 'Failed to fetch'}. Note that for external APIs like DataMall, a backend proxy route is recommended.`,
      });
    }
  };

  const handleSave = () => {
    onSaveConfig(formData);
    onClose();
  };

  const sampleServerCode = `// server.ts - Example Express Backend Proxy for Singapore Carparks
import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Data.gov.sg Carpark Availability Endpoint (HDB & URA)
app.get('/api/carpark-availability/hdb', async (req, res) => {
  try {
    const response = await fetch('https://api.data.gov.sg/v1/transport/carpark-availability');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch from data.gov.sg', details: error.message });
  }
});

// 2. LTA DataMall CarPark Availability Endpoint (Malls, Commercial & Central)
app.get('/api/carpark-availability/lta', async (req, res) => {
  const LTA_KEY = process.env.LTA_DATAMALL_KEY; // Set in your .env
  try {
    const response = await fetch('https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2', {
      headers: { AccountKey: LTA_KEY || '' }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch from LTA DataMall', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(\`Singapore Carpark Proxy Server running on port \${PORT}\`);
});`;

  const sampleJsonSchema = `{
  "id": "hdb-acb-amk712",
  "carparkNumber": "ACB",
  "name": "Ang Mo Kio Central Blk 712 MSCP",
  "address": "Blk 712 Ang Mo Kio Avenue 6, Singapore 560712",
  "agency": "HDB",
  "carparkType": "MULTI_STOREY",
  "parkingSystem": "ELECTRONIC",
  "latitude": 1.3697,
  "longitude": 103.8485,
  "maxHeightMeters": 2.15,
  "evCharging": {
    "available": true,
    "count": 6,
    "operator": "CDG ENGIE"
  },
  "rates": {
    "weekdayRateDay": "$0.60 / 30 mins (7am-5pm)",
    "weekdayRateNight": "$0.60 / 30 mins, max $5.00",
    "weekendRate": "$0.60 / 30 mins",
    "gracePeriodMinutes": 15,
    "sundayFreeParking": true
  },
  "lots": {
    "C": { "totalLots": 580, "lotsAvailable": 164, "lotType": "C" },
    "M": { "totalLots": 110, "lotsAvailable": 52, "lotType": "M" },
    "H": { "totalLots": 12, "lotsAvailable": 3, "lotType": "H" }
  },
  "planningArea": "Ang Mo Kio",
  "nearestMrt": "Ang Mo Kio (NS16) - 180m",
  "lastUpdated": "2026-11-09T19:35:00.000Z"
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Backend Connection & API Architecture
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Front-end is fully decoupled and ready to connect to Data.gov.sg or your custom API
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 my-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'config'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            API Endpoint Settings
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'guide'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Singapore Public APIs
          </button>
          <button
            onClick={() => setActiveTab('server-code')}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'server-code'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Express Proxy Snippet
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'schema'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            JSON Contract Schema
          </button>
        </div>

        {/* Tab 1: Configuration Form */}
        {activeTab === 'config' && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-800 dark:text-emerald-300">
              <span className="font-bold">Current Active Mode:</span> Simulated Live Telemetry Engine.
              It generates realistic fluctuating lot counts for all HDB, URA, and Mall carparks across Singapore every 15–30 seconds.
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data Source Engine
              </label>
              <select
                value={formData.sourceType}
                onChange={(e) => setFormData({ ...formData, sourceType: e.target.value as any })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
              >
                <option value="SIMULATION">Simulated Live Gantry Telemetry (Default - Zero API Key Needed)</option>
                <option value="DATAGOV">Data.gov.sg Public Carpark Availability API</option>
                <option value="LTA_DATAMALL">LTA DataMall CarPark Availability v2</option>
                <option value="CUSTOM_API">Custom Node.js / Express Backend Proxy (/api/carparks)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Backend Endpoint URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.backendUrl}
                  onChange={(e) => setFormData({ ...formData, backendUrl: e.target.value })}
                  placeholder="https://api.data.gov.sg/v1/transport/carpark-availability or http://localhost:3000/api/carparks"
                  className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-xs"
                />
                <button
                  onClick={handleTestConnection}
                  disabled={testStatus.loading}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testStatus.loading ? 'animate-spin' : ''}`} />
                  <span>Test Connection</span>
                </button>
              </div>
            </div>

            {testStatus.message && (
              <div
                className={`p-3 rounded-lg text-xs font-mono ${
                  testStatus.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {testStatus.message}
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                LTA DataMall AccountKey (Optional for commercial/mall feeds)
              </label>
              <input
                type="password"
                value={formData.apiKey || ''}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder="Optional LTA AccountKey"
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Auto-Refresh Interval
              </label>
              <select
                value={formData.autoRefreshIntervalSecs}
                onChange={(e) => setFormData({ ...formData, autoRefreshIntervalSecs: Number(e.target.value) })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
              >
                <option value={15}>Every 15 Seconds (High frequency simulation)</option>
                <option value={30}>Every 30 Seconds (Recommended)</option>
                <option value={60}>Every 1 Minute (Official data.gov.sg update cadence)</option>
                <option value={0}>Manual Refresh Only</option>
              </select>
            </div>
          </div>
        )}

        {/* Tab 2: Singapore Public APIs Guide */}
        {activeTab === 'guide' && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">1. Data.gov.sg (HDB & URA)</span>
                <span className="text-[11px] font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                  Free / No Auth Required
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                Official API providing lot availability for over 2,000+ HDB and URA carparks updated every minute.
              </p>
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[11px] text-slate-800 dark:text-slate-200">
                GET https://api.data.gov.sg/v1/transport/carpark-availability
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">2. LTA DataMall (Malls, Marina Bay & Commercial)</span>
                <span className="text-[11px] font-mono text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
                  AccountKey Header Required
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                Covers commercial shopping malls (ION Orchard, Suntec City, VivoCity, Marina Bay Sands, Jem, etc.).
              </p>
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[11px] text-slate-800 dark:text-slate-200">
                GET https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Server Code */}
        {activeTab === 'server-code' && (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Ready-to-use Express Proxy Backend:</span>
              <button
                onClick={() => copyToClipboard(sampleServerCode, 'server')}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 hover:underline"
              >
                {copiedSnippet === 'server' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSnippet === 'server' ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed border border-slate-800 max-h-64">
              {sampleServerCode}
            </pre>
          </div>
        )}

        {/* Tab 4: JSON Contract Schema */}
        {activeTab === 'schema' && (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Expected Carpark Object JSON Schema:</span>
              <button
                onClick={() => copyToClipboard(sampleJsonSchema, 'schema')}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 hover:underline"
              >
                {copiedSnippet === 'schema' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSnippet === 'schema' ? 'Copied' : 'Copy Schema'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed border border-slate-800 max-h-64">
              {sampleJsonSchema}
            </pre>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-5 mt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-xs"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

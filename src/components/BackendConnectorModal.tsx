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
  RefreshCw,
  Key,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { BackendConnectionConfig, validateLtaAccountKey } from '../services/carparkService';

interface BackendConnectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BackendConnectionConfig;
  onSaveConfig: (cfg: BackendConnectionConfig) => void;
  onTriggerLiveSync: () => void;
  isLiveConnected: boolean;
  liveCarparkCount: number;
}

export const BackendConnectorModal: React.FC<BackendConnectorModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onTriggerLiveSync,
  isLiveConnected,
  liveCarparkCount,
}) => {
  const [activeTab, setActiveTab] = useState<'lta' | 'config' | 'guide' | 'schema'>('lta');
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

  const handleTestKey = async () => {
    if (!formData.apiKey?.trim()) {
      setTestStatus({
        loading: false,
        success: false,
        message: 'Please enter your LTA DataMall AccountKey before testing.',
      });
      return;
    }

    setTestStatus({ loading: true });
    const result = await validateLtaAccountKey(formData.apiKey.trim());
    setTestStatus({
      loading: false,
      success: result.success,
      message: result.message,
    });

    if (result.success) {
      onSaveConfig({
        ...formData,
        sourceType: 'LTA_DATAMALL',
      });
      onTriggerLiveSync();
    }
  };

  const handleSave = () => {
    onSaveConfig(formData);
    onTriggerLiveSync();
    onClose();
  };

  const sampleCurl = `curl -X GET "https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2" \\
  -H "AccountKey: ${formData.apiKey || 'YOUR_ACCOUNT_KEY'}" \\
  -H "accept: application/json"`;

  const sampleServerCode = `// server.ts - Proxy route connected to LTA DataMall
app.get('/api/carparks/live', async (req, res) => {
  const accountKey = req.headers['x-account-key'] || process.env.LTA_ACCOUNT_KEY;
  const url = 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2';
  
  const response = await fetch(url, {
    headers: {
      AccountKey: accountKey,
      accept: 'application/json'
    }
  });
  const data = await response.json();
  res.json(data);
});`;

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
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  LTA DataMall Serverless Live Connection
                </h2>
                {isLiveConnected ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Live Active ({liveCarparkCount} carparks)
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded-full">
                    Simulation Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pulls real-time lot availability (HDB + LTA + URA) directly from LTA DataMall
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 my-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('lta')}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'lta'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            LTA DataMall Setup
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'config'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Endpoint & Refresh Rate
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'guide'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            cURL & API Headers
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'schema'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Express Route Code
          </button>
        </div>

        {/* Tab 1: LTA DataMall Key & Sync */}
        {activeTab === 'lta' && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-emerald-600" />
                  Target LTA DataMall Endpoint
                </span>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded font-medium">
                  CarParkAvailabilityv2
                </span>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-200 select-all">
                https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                Returns real-time lot availability across all Singapore HDB, URA, and LTA commercial shopping malls.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                LTA DataMall AccountKey
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.apiKey || ''}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="Enter your LTA DataMall AccountKey (e.g. 5xZ...)"
                  className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <button
                  onClick={handleTestKey}
                  disabled={testStatus.loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testStatus.loading ? 'animate-spin' : ''}`} />
                  <span>Test & Connect</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Tip: You can get a free AccountKey from <a href="https://datamall.lta.gov.sg/content/datamall/en/request-api.html" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 underline inline-flex items-center gap-0.5">LTA DataMall portal <ExternalLink className="w-2.5 h-2.5" /></a> or configure it via the <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">LTA_ACCOUNT_KEY</code> environment secret.
              </p>
            </div>

            {testStatus.message && (
              <div
                className={`p-3 rounded-lg text-xs font-mono flex items-start gap-2 ${
                  testStatus.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {testStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{testStatus.message}</span>
              </div>
            )}

            <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">How Serverless Caching Works:</span>
              <p className="text-slate-500 dark:text-slate-400">
                To prevent rate limits and ensure sub-millisecond response times, the Express server proxies requests to LTA DataMall with an automatic 30-second in-memory cache and normalizes lots for Cars (C), Motorcycles (M), and Heavy Vehicles (H).
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Endpoint & Refresh Rate */}
        {activeTab === 'config' && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data Mode
              </label>
              <select
                value={formData.sourceType}
                onChange={(e) => setFormData({ ...formData, sourceType: e.target.value as any })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
              >
                <option value="LTA_DATAMALL">LTA DataMall Live Connection (/api/carparks/live)</option>
                <option value="SIMULATION">Simulated Live Gantry Telemetry (Offline Mode)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Local Proxy Route
              </label>
              <input
                type="text"
                value={formData.backendUrl}
                onChange={(e) => setFormData({ ...formData, backendUrl: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Live Auto-Refresh Interval
              </label>
              <select
                value={formData.autoRefreshIntervalSecs}
                onChange={(e) => setFormData({ ...formData, autoRefreshIntervalSecs: Number(e.target.value) })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
              >
                <option value={15}>Every 15 Seconds (Real-time rush)</option>
                <option value={30}>Every 30 Seconds (Recommended for LTA DataMall)</option>
                <option value={60}>Every 60 Seconds</option>
                <option value={0}>Manual Refresh Only</option>
              </select>
            </div>
          </div>
        )}

        {/* Tab 3: cURL Guide */}
        {activeTab === 'guide' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Direct LTA DataMall cURL Command:
              </span>
              <button
                onClick={() => copyToClipboard(sampleCurl, 'curl')}
                className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 hover:underline"
              >
                {copiedSnippet === 'curl' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSnippet === 'curl' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed border border-slate-800">
              {sampleCurl}
            </pre>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
              <strong>Header Format:</strong> LTA requires the custom HTTP header <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono font-bold">AccountKey: &lt;your-key&gt;</code> (not Bearer authorization).
            </div>
          </div>
        )}

        {/* Tab 4: Server Code */}
        {activeTab === 'schema' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Express Server Proxy Implementation (/api/carparks/live):
              </span>
              <button
                onClick={() => copyToClipboard(sampleServerCode, 'code')}
                className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 hover:underline"
              >
                {copiedSnippet === 'code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSnippet === 'code' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed border border-slate-800">
              {sampleServerCode}
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
            Save & Connect
          </button>
        </div>
      </div>
    </div>
  );
};

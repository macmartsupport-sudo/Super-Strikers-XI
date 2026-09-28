import { Shirt, Plus, Download, FileSpreadsheet, Settings, Cloud, Loader2 } from 'lucide-react';
import { TeamSettings } from '../types/jersey';

interface HeaderProps {
  settings: TeamSettings;
  isCloudSyncing: boolean;
  isLiveConnected: boolean;
  onOpenAddFriend: () => void;
  onOpenVendorSheet: () => void;
  onOpenSettings: () => void;
  onExportCSV: () => void;
}

export function Header({
  settings,
  isCloudSyncing,
  isLiveConnected,
  onOpenAddFriend,
  onOpenVendorSheet,
  onOpenSettings,
  onExportCSV,
}: HeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/90 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Shirt className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>{settings.teamName}</span>
              <span className="hidden sm:inline-block text-[11px] font-semibold text-slate-400 bg-slate-850 px-2 py-0.5 rounded-full border border-slate-700/60 font-mono">
                Kit '26
              </span>
            </h1>
          </div>
        </div>

        {/* Zone 2: Clean action / quick navigation links */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-slate-300">
          <button
            type="button"
            onClick={onOpenVendorSheet}
            className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-850 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
            <span>Vendor Sheet</span>
          </button>

          <button
            type="button"
            onClick={onExportCSV}
            className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-850 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-850 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions (Live Sync Indicator + Add Friend) */}
        <div className="flex items-center gap-2.5">
          {/* Live Firestore Sync Status Pill */}
          <div
            title={isLiveConnected ? 'Connected to Cloud Firestore' : 'Connecting to Cloud Firestore'}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300"
          >
            {isCloudSyncing ? (
              <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
            ) : isLiveConnected ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
            ) : (
              <Cloud className="w-3 h-3 text-slate-500" />
            )}
            <span className="hidden sm:inline font-medium">
              {isCloudSyncing ? 'Syncing...' : isLiveConnected ? 'Live Cloud' : 'Offline'}
            </span>
          </div>

          {/* Mobile secondary triggers */}
          <button
            type="button"
            onClick={onOpenVendorSheet}
            title="Vendor Sheet"
            className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-400" />
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            title="Settings"
            className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-400" />
          </button>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={onOpenAddFriend}
            className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Friend</span>
          </button>
        </div>
      </div>
    </header>
  );
}

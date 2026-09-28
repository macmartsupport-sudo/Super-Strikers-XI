import React, { useState } from 'react';
import { X, Settings, RotateCcw, Trash2, CheckCircle2 } from 'lucide-react';
import { TeamSettings } from '../types/jersey';

interface TeamSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TeamSettings;
  onSaveSettings: (settings: Partial<TeamSettings>) => void;
  onResetSampleData: () => void;
  onClearAll: () => void;
}

export function TeamSettingsModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onResetSampleData,
  onClearAll,
}: TeamSettingsModalProps) {
  const [teamName, setTeamName] = useState(settings.teamName);
  const [currency, setCurrency] = useState(settings.currency);
  const [defaultJerseyPrice, setDefaultJerseyPrice] = useState(settings.defaultJerseyPrice);
  const [upiId, setUpiId] = useState(settings.upiId || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      teamName: teamName.trim() || 'Cricket Team',
      currency,
      defaultJerseyPrice: Number(defaultJerseyPrice) || 0,
      upiId: upiId.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Team & Order Settings</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Team / Club Name
            </label>
            <input
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Royal Strikers XI"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Currency Symbol
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="₹">₹ (INR Rupee)</option>
                <option value="Rs. ">Rs. (Rupees)</option>
                <option value="$">$ (USD)</option>
                <option value="£">£ (GBP)</option>
                <option value="€">€ (EUR)</option>
                <option value="AED ">AED (Dirham)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Default Jersey Price
              </label>
              <input
                type="number"
                min="0"
                value={defaultJerseyPrice}
                onChange={(e) => setDefaultJerseyPrice(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono-num text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Captain UPI ID (For WhatsApp reminders)
            </label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g. captain@okaxis or 9876543210@paytm"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Quick Demo Data Controls */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Data Management
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Reset list to sample cricket squad?')) {
                    onResetSampleData();
                    onClose();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:text-white rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Sample Team</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Clear all friend jersey entries?')) {
                    onClearAll();
                    onClose();
                  }
                }}
                className="px-3 py-1.5 text-xs font-medium text-rose-400 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-500/20 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors shadow-md"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

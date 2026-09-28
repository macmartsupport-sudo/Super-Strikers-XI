import React, { useState } from 'react';
import { X, Copy, Check, Printer, Shirt, Download } from 'lucide-react';
import { FriendJerseyOrder } from '../types/jersey';
import { JERSEY_SIZES, exportToCSV } from '../utils/calculations';

interface VendorSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  friends: FriendJerseyOrder[];
  teamName: string;
}

export function VendorSheetModal({
  isOpen,
  onClose,
  friends,
  teamName,
}: VendorSheetModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Calculate size counts
  const sizeCounts = JERSEY_SIZES.reduce((acc, size) => {
    acc[size] = friends.filter((f) => f.jerseySize === size).length;
    return acc;
  }, {} as Record<string, number>);

  const handleCopyText = () => {
    let text = `🏏 *${teamName.toUpperCase()} - JERSEY ORDER SPECS*\n`;
    text += `Total Quantity: ${friends.length} jerseys\n\n`;
    text += `*SIZE BREAKDOWN:*\n`;
    JERSEY_SIZES.forEach((s) => {
      if (sizeCounts[s] > 0) {
        text += `• ${s}: ${sizeCounts[s]} pcs\n`;
      }
    });

    text += `\n*PLAYER PRINTING LIST:*\n`;
    friends.forEach((f, idx) => {
      text += `${idx + 1}. ${f.jerseyName || f.name} | #${f.jerseyNumber} | Size: ${f.jerseySize} (${f.name})\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Shirt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Vendor Order Sheet & Size Summary
              </h3>
              <p className="text-xs text-slate-400">
                Ready-to-print spec sheet for the jersey manufacturer & sublimation printer
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Size Distribution Cards */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Size Quantity Breakdown (Total: {friends.length} Jerseys)
            </h4>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {JERSEY_SIZES.map((size) => {
                const count = sizeCounts[size] || 0;
                return (
                  <div
                    key={size}
                    className={`p-2.5 rounded-xl border text-center ${
                      count > 0
                        ? 'bg-blue-950/40 border-blue-500/40 text-blue-300'
                        : 'bg-slate-950 border-slate-800 text-slate-600'
                    }`}
                  >
                    <span className="text-[11px] font-bold block">{size}</span>
                    <span className="text-lg font-black font-mono-num block mt-0.5">
                      {count}
                    </span>
                    <span className="text-[9px] uppercase tracking-wide text-slate-400 block">
                      pcs
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Table of Jersey Prints */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Sublimation Printing Roster ({friends.length} Players)
              </h4>
              <span className="text-xs text-slate-500">
                Sorted by Jersey Number
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Player Name</th>
                    <th className="py-2.5 px-3">Back Print Name</th>
                    <th className="py-2.5 px-3 text-center">Jersey No.</th>
                    <th className="py-2.5 px-3 text-center">Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {friends.map((f, i) => (
                    <tr key={f.id} className="hover:bg-slate-900/40">
                      <td className="py-2 px-3 text-center text-slate-500 font-mono-num">
                        {i + 1}
                      </td>
                      <td className="py-2 px-3 font-medium text-white">{f.name}</td>
                      <td className="py-2 px-3 font-jersey font-bold text-amber-400 tracking-wider">
                        {f.jerseyName || f.name}
                      </td>
                      <td className="py-2 px-3 text-center font-jersey font-extrabold text-amber-400">
                        #{f.jerseyNumber}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-bold text-slate-200">
                          {f.jerseySize}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 no-print">
            <button
              type="button"
              onClick={() => exportToCSV(friends, teamName)}
              className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Sheet</span>
              </button>

              <button
                type="button"
                onClick={handleCopyText}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-md flex items-center gap-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy for WhatsApp'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

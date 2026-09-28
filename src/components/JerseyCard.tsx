import React from 'react';
import { Edit3, Trash2, PlusCircle, Eye, MessageSquare, Phone, IndianRupee } from 'lucide-react';
import { FriendJerseyOrder } from '../types/jersey';
import { formatCurrency, getStatusConfig, generateWhatsAppLink } from '../utils/calculations';
import { JerseyPreview } from './JerseyPreview';

interface JerseyCardProps {
  friend: FriendJerseyOrder;
  currency: string;
  teamName: string;
  upiId?: string;
  onViewDetails: (friend: FriendJerseyOrder) => void;
  onAddPayment: (friend: FriendJerseyOrder) => void;
  onEdit: (friend: FriendJerseyOrder) => void;
  onDelete: (id: string) => void;
}

export function JerseyCard({
  friend,
  currency,
  teamName,
  upiId,
  onViewDetails,
  onAddPayment,
  onEdit,
  onDelete,
}: JerseyCardProps) {
  const statusInfo = getStatusConfig(friend.status);
  const waLink = generateWhatsAppLink(friend, teamName, currency, upiId);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all">
      {/* Top Header: Player & Jersey Information */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <JerseyPreview
            jerseyName={friend.jerseyName}
            jerseyNumber={friend.jerseyNumber}
            size="sm"
          />
          <div>
            <h4
              onClick={() => onViewDetails(friend)}
              className="font-bold text-white text-base hover:text-blue-400 cursor-pointer transition-colors"
            >
              {friend.name}
            </h4>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
              <span className="font-jersey text-amber-400 font-bold text-xs tracking-wider">
                {friend.jerseyName}
              </span>
              <span>·</span>
              <span className="font-jersey text-amber-400 font-bold">
                #{friend.jerseyNumber}
              </span>
              <span>·</span>
              <span className="font-semibold text-slate-300 px-1.5 py-0.2 bg-slate-800 rounded text-[10px]">
                {friend.jerseySize}
              </span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <span
          className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusInfo.badgeClass}`}
        >
          <span>{statusInfo.dot}</span>
          <span>{statusInfo.label}</span>
        </span>
      </div>

      {/* Financial Matrix (Total, Paid, Balance) */}
      <div className="my-4 grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-850 text-center">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-medium block">Total</span>
          <span className="text-sm font-bold font-mono-num text-white">
            {formatCurrency(friend.totalJerseyPrice, currency)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-emerald-400 uppercase font-medium block">Paid</span>
          <span className="text-sm font-bold font-mono-num text-emerald-400">
            {formatCurrency(friend.amountPaid, currency)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-rose-400 uppercase font-medium block">Balance</span>
          <span className="text-sm font-bold font-mono-num text-rose-400">
            {formatCurrency(friend.balance, currency)}
          </span>
        </div>
      </div>

      {/* Phone & Note metadata if present */}
      {(friend.phone || friend.notes) && (
        <div className="mb-3 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
          {friend.phone ? (
            <span className="font-mono-num">{friend.phone}</span>
          ) : (
            <span />
          )}
          {friend.notes && (
            <span className="truncate max-w-[160px] text-slate-400 italic">
              {friend.notes}
            </span>
          )}
        </div>
      )}

      {/* Actions Bar */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onViewDetails(friend)}
            title="View Details"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>

          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            title="WhatsApp Reminder"
            className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 rounded-lg transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
          </a>

          <button
            type="button"
            onClick={() => onEdit(friend)}
            title="Edit"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Delete ${friend.name}?`)) {
                onDelete(friend.id);
              }
            }}
            title="Delete"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Action: Add Payment */}
        <button
          type="button"
          onClick={() => onAddPayment(friend)}
          className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Add Payment</span>
        </button>
      </div>
    </div>
  );
}

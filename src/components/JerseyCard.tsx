import React from 'react';
import { Edit3, Trash2, PlusCircle, Eye, MessageSquare, AlertTriangle, ChevronDown } from 'lucide-react';
import { FriendJerseyOrder, PaymentStatus } from '../types/jersey';
import { formatCurrency, getStatusConfig, generateWhatsAppLink, getMoneyIssueLabel } from '../utils/calculations';
import { JerseyPreview } from './JerseyPreview';

interface JerseyCardProps {
  friend: FriendJerseyOrder;
  currency: string;
  teamName: string;
  upiId?: string;
  onViewDetails: (friend: FriendJerseyOrder) => void;
  onAddPayment: (friend: FriendJerseyOrder) => void;
  onOpenMoneyIssue: (friend: FriendJerseyOrder) => void;
  onEdit: (friend: FriendJerseyOrder) => void;
  onDelete: (id: string) => void;
  onQuickSetStatus?: (id: string, status: PaymentStatus) => void;
}

export function JerseyCard({
  friend,
  currency,
  teamName,
  upiId,
  onViewDetails,
  onAddPayment,
  onOpenMoneyIssue,
  onEdit,
  onDelete,
  onQuickSetStatus,
}: JerseyCardProps) {
  const statusInfo = getStatusConfig(friend.status);
  const waLink = generateWhatsAppLink(friend, teamName, currency, upiId);
  const hasIssue = friend.status === 'MONEY_ISSUE' || Boolean(friend.moneyIssue?.hasIssue);

  return (
    <div
      className={`bg-slate-900 border rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden flex flex-col justify-between transition-all ${
        hasIssue ? 'border-orange-500/50 ring-1 ring-orange-500/20' : 'border-slate-800 hover:border-slate-700'
      }`}
    >
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
              className="font-bold text-white text-base hover:text-blue-400 cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <span>{friend.name}</span>
              {hasIssue && (
                <span title="Money Issue Flagged" className="text-orange-400">
                  <AlertTriangle className="w-4 h-4" />
                </span>
              )}
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

        {/* Status Dropdown */}
        <div className="relative shrink-0">
          <select
            aria-label={`Status for ${friend.name}`}
            value={friend.status}
            onChange={(e) => {
              const val = e.target.value as PaymentStatus;
              if (val === 'MONEY_ISSUE') {
                onOpenMoneyIssue(friend);
              } else if (onQuickSetStatus) {
                onQuickSetStatus(friend.id, val);
              }
            }}
            className={`appearance-none text-xs font-bold py-1 pl-2.5 pr-6 rounded-full border cursor-pointer transition-all hover:scale-105 focus:outline-none focus:ring-1 focus:ring-blue-400 ${statusInfo.badgeClass}`}
          >
            <option value="PAID" className="bg-slate-900 text-emerald-400 font-bold">🟢 PAID</option>
            <option value="HALF_PAID" className="bg-slate-900 text-amber-400 font-bold">🟡 HALF PAID</option>
            <option value="NOT_PAID" className="bg-slate-900 text-rose-400 font-bold">🔴 NOT PAID</option>
            <option value="MONEY_ISSUE" className="bg-slate-900 text-orange-400 font-bold">⚠️ MONEY ISSUE</option>
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5 opacity-60">
            <ChevronDown className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* Money Issue details banner if present */}
      {hasIssue && (
        <div
          onClick={() => onOpenMoneyIssue(friend)}
          className="mt-3 p-2.5 rounded-xl bg-orange-950/40 border border-orange-500/30 text-xs text-orange-200 space-y-0.5 cursor-pointer hover:bg-orange-900/40 transition-colors"
        >
          <div className="flex items-center justify-between font-bold text-[11px] text-orange-400">
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{getMoneyIssueLabel(friend.moneyIssue?.issueType)}</span>
            </span>
            {friend.moneyIssue?.issueAmount ? (
              <span className="font-mono-num">{formatCurrency(friend.moneyIssue.issueAmount, currency)}</span>
            ) : null}
          </div>
          {friend.moneyIssue?.issueNote && (
            <p className="text-[10px] text-orange-300/80 truncate">{friend.moneyIssue.issueNote}</p>
          )}
        </div>
      )}

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

      {/* Quick 1-Tap Status Switcher: Paid, Half Paid, Not Paid, Money Issue */}
      <div className="my-2 p-1.5 rounded-xl bg-slate-950/80 border border-slate-800/80 grid grid-cols-4 gap-1 text-center">
        <button
          type="button"
          onClick={() => onQuickSetStatus && onQuickSetStatus(friend.id, 'PAID')}
          title="Mark Full Paid"
          className={`py-1 px-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
            friend.status === 'PAID'
              ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-sm'
              : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-800'
          }`}
        >
          🟢 Paid
        </button>
        <button
          type="button"
          onClick={() => onQuickSetStatus && onQuickSetStatus(friend.id, 'HALF_PAID')}
          title="Mark 50% Half Paid"
          className={`py-1 px-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
            friend.status === 'HALF_PAID'
              ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-sm'
              : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800'
          }`}
        >
          🟡 Half
        </button>
        <button
          type="button"
          onClick={() => onQuickSetStatus && onQuickSetStatus(friend.id, 'NOT_PAID')}
          title="Mark ₹0 Not Paid"
          className={`py-1 px-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
            friend.status === 'NOT_PAID'
              ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50 shadow-sm'
              : 'text-slate-400 hover:text-rose-300 hover:bg-slate-800'
          }`}
        >
          🔴 Unpaid
        </button>
        <button
          type="button"
          onClick={() => onOpenMoneyIssue(friend)}
          title="Flag or Manage Money Issue"
          className={`py-1 px-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
            friend.status === 'MONEY_ISSUE'
              ? 'bg-orange-500/25 text-orange-300 border border-orange-500/50 shadow-sm'
              : 'text-slate-400 hover:text-orange-300 hover:bg-slate-800'
          }`}
        >
          ⚠️ Issue
        </button>
      </div>

      {/* Actions Bar */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {/* Details */}
          <button
            type="button"
            onClick={() => onViewDetails(friend)}
            title="View Details"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Money Issue action */}
          <button
            type="button"
            onClick={() => onOpenMoneyIssue(friend)}
            title={hasIssue ? 'Resolve or Edit Money Issue' : 'Flag Money Issue'}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              hasIssue
                ? 'text-orange-400 bg-orange-950/40 hover:bg-orange-900/60'
                : 'text-slate-400 hover:text-orange-400 hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </button>

          {/* WhatsApp */}
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            title="WhatsApp Reminder"
            className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 rounded-lg transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
          </a>

          {/* Edit */}
          <button
            type="button"
            onClick={() => onEdit(friend)}
            title="Edit"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => onDelete(friend.id)}
            title="Delete"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Action: Add Payment */}
        <button
          type="button"
          onClick={() => onAddPayment(friend)}
          className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>+ Pay</span>
        </button>
      </div>
    </div>
  );
}

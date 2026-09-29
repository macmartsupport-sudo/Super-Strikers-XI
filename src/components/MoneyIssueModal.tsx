import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle2, ShieldAlert, RotateCcw } from 'lucide-react';
import { FriendJerseyOrder, MoneyIssueType, MoneyIssueDetails } from '../types/jersey';
import { formatCurrency, getMoneyIssueLabel } from '../utils/calculations';

interface MoneyIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  friend: FriendJerseyOrder | null;
  currency: string;
  onSaveIssue: (friendId: string, issue: MoneyIssueDetails | undefined) => void;
}

export function MoneyIssueModal({
  isOpen,
  onClose,
  friend,
  currency,
  onSaveIssue,
}: MoneyIssueModalProps) {
  if (!isOpen || !friend) return null;

  const currentIssue = friend.moneyIssue;
  const isOverpaid = friend.amountPaid > friend.totalJerseyPrice;
  const defaultAmount = isOverpaid
    ? friend.amountPaid - friend.totalJerseyPrice
    : currentIssue?.issueAmount || friend.balance || 0;

  const [issueType, setIssueType] = useState<MoneyIssueType>(
    currentIssue?.issueType || (isOverpaid ? 'OVERPAID' : 'UPI_FAILED_OR_PENDING')
  );
  const [issueAmount, setIssueAmount] = useState<number | ''>(defaultAmount);
  const [issueNote, setIssueNote] = useState(currentIssue?.issueNote || '');

  useEffect(() => {
    if (friend) {
      const overpaid = friend.amountPaid > friend.totalJerseyPrice;
      setIssueType(
        friend.moneyIssue?.issueType || (overpaid ? 'OVERPAID' : 'UPI_FAILED_OR_PENDING')
      );
      setIssueAmount(
        friend.moneyIssue?.issueAmount ??
          (overpaid ? friend.amountPaid - friend.totalJerseyPrice : friend.balance || 0)
      );
      setIssueNote(friend.moneyIssue?.issueNote || '');
    }
  }, [friend]);

  const handleFlagIssue = (e: React.FormEvent) => {
    e.preventDefault();
    const details: MoneyIssueDetails = {
      hasIssue: true,
      issueType,
      issueAmount: Number(issueAmount) || 0,
      issueNote: issueNote.trim(),
      flaggedAt: currentIssue?.flaggedAt || new Date().toISOString(),
    };
    onSaveIssue(friend.id, details);
    onClose();
  };

  const handleResolveIssue = () => {
    // Clearing the issue will recalculate status to PAID, HALF_PAID, or NOT_PAID
    onSaveIssue(friend.id, undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {currentIssue?.hasIssue ? 'Manage Money Issue' : 'Flag Money Issue'}
              </h3>
              <p className="text-xs text-slate-400">
                {friend.name} ({friend.jerseyName} #{friend.jerseyNumber})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleFlagIssue} className="p-6 space-y-4">
          {/* Quick Context Summary */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">Total Price</span>
              <span className="font-mono-num font-bold text-white text-sm">
                {formatCurrency(friend.totalJerseyPrice, currency)}
              </span>
            </div>
            <div>
              <span className="text-emerald-400 text-[10px] uppercase font-semibold block">Amount Paid</span>
              <span className="font-mono-num font-bold text-emerald-400 text-sm">
                {formatCurrency(friend.amountPaid, currency)}
              </span>
            </div>
            <div>
              <span className="text-rose-400 text-[10px] uppercase font-semibold block">Balance</span>
              <span className="font-mono-num font-bold text-rose-400 text-sm">
                {formatCurrency(friend.balance, currency)}
              </span>
            </div>
          </div>

          {/* Issue Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Select Money Issue Reason <span className="text-orange-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { type: 'UPI_FAILED_OR_PENDING' as const, label: '⏳ UPI Debited / Pending' },
                { type: 'OVERPAID' as const, label: '🔄 Overpaid (Refund Due)' },
                { type: 'PAYMENT_DISPUTE' as const, label: '❓ Payment Amount Dispute' },
                { type: 'WRONG_ACCOUNT' as const, label: '❌ Transferred to Wrong QR' },
                { type: 'REFUND_REQUESTED' as const, label: '💸 Refund Requested / Cancel' },
                { type: 'OTHER_ISSUE' as const, label: '📝 Other Money Discrepancy' },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setIssueType(item.type)}
                  className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${
                    issueType === item.type
                      ? 'bg-orange-500/20 border-orange-500/60 text-orange-200 font-bold shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Issue Amount */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Amount in Question (Rs)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono-num">
                Rs
              </span>
              <input
                type="number"
                min="0"
                value={issueAmount}
                onChange={(e) => setIssueAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 1200"
                className="w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white font-mono-num focus:outline-none focus:border-orange-500"
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Specify the disputed, pending, or refundable amount.
            </span>
          </div>

          {/* Issue Note */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Issue Explanation & Notes <span className="text-orange-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={issueNote}
              onChange={(e) => setIssueNote(e.target.value)}
              placeholder="e.g. Debited from player HDFC account on 24th Sept. Reference UTR 42398492. Captain verifying statement with bank."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            {currentIssue?.hasIssue ? (
              <button
                type="button"
                onClick={handleResolveIssue}
                className="px-3.5 py-2 text-xs font-semibold text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Issue Resolved</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 rounded-lg transition-colors shadow-lg shadow-orange-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>{currentIssue?.hasIssue ? 'Update Issue' : 'Flag as Money Issue'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

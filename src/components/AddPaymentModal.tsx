import React, { useState } from 'react';
import { X, PlusCircle, CheckCircle2, History, AlertTriangle } from 'lucide-react';
import { FriendJerseyOrder } from '../types/jersey';
import { calculateBalance, calculatePaymentStatus, formatCurrency, getStatusConfig, getMoneyIssueLabel } from '../utils/calculations';

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  friend: FriendJerseyOrder | null;
  currency: string;
  onAddPayment: (
    friendId: string,
    amount: number,
    method: 'UPI' | 'Cash' | 'Bank Transfer' | 'Other',
    notes: string,
    resolveMoneyIssue?: boolean
  ) => void;
  onDeleteTransaction?: (friendId: string, txId: string) => void;
}

export function AddPaymentModal({
  isOpen,
  onClose,
  friend,
  currency,
  onAddPayment,
  onDeleteTransaction,
}: AddPaymentModalProps) {
  if (!isOpen || !friend) return null;

  const hasActiveIssue = friend.status === 'MONEY_ISSUE' || Boolean(friend.moneyIssue?.hasIssue);

  const [paymentAmount, setPaymentAmount] = useState<number | ''>(
    friend.balance > 0 ? friend.balance : ''
  );
  const [method, setMethod] = useState<'UPI' | 'Cash' | 'Bank Transfer' | 'Other'>('UPI');
  const [notes, setNotes] = useState('');
  const [resolveIssue, setResolveIssue] = useState<boolean>(hasActiveIssue);
  const [error, setError] = useState<string | null>(null);

  const numericNewPayment = Number(paymentAmount) || 0;
  const simulatedTotalPaid = friend.amountPaid + numericNewPayment;
  const simulatedBalance = calculateBalance(friend.totalJerseyPrice, simulatedTotalPaid);
  const simulatedStatus = calculatePaymentStatus(
    friend.totalJerseyPrice,
    simulatedTotalPaid,
    hasActiveIssue && !resolveIssue
  );
  const simulatedStatusInfo = getStatusConfig(simulatedStatus);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericNewPayment <= 0) {
      setError('Please enter a valid payment amount greater than 0.');
      return;
    }

    onAddPayment(friend.id, numericNewPayment, method, notes, resolveIssue);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-400" />
              <span>Record Payment</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {friend.name} ({friend.jerseyName} #{friend.jerseyNumber})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Current Financial Summary (As per prompt Example) */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Current Payment Breakdown
            </div>
            <div className="grid grid-cols-3 gap-2 py-1 text-center">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Total</span>
                <span className="text-sm sm:text-base font-bold text-white font-mono-num">
                  {formatCurrency(friend.totalJerseyPrice, currency)}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Already Paid</span>
                <span className="text-sm sm:text-base font-bold text-emerald-400 font-mono-num">
                  {formatCurrency(friend.amountPaid, currency)}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Remaining</span>
                <span className="text-sm sm:text-base font-bold text-rose-400 font-mono-num">
                  {formatCurrency(friend.balance, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Input: New Payment Amount */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-200">
              New Payment ({currency}) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-sm text-slate-400 font-mono-num">
                {currency}
              </span>
              <input
                type="number"
                min="1"
                step="1"
                required
                autoFocus
                placeholder="Enter amount (e.g. 500)"
                value={paymentAmount}
                onChange={(e) => {
                  setError(null);
                  setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value));
                }}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-lg font-bold text-white font-mono-num focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Quick Fill Preset Buttons */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {friend.balance > 0 && (
                <button
                  type="button"
                  onClick={() => setPaymentAmount(friend.balance)}
                  className="px-2.5 py-1 text-xs font-semibold text-emerald-300 bg-emerald-950/70 border border-emerald-500/50 rounded-lg hover:bg-emerald-900/60 transition-colors cursor-pointer"
                >
                  🟢 Clear Full Balance ({formatCurrency(friend.balance, currency)})
                </button>
              )}
              {friend.amountPaid === 0 && friend.totalJerseyPrice > 0 && (
                <button
                  type="button"
                  onClick={() => setPaymentAmount(Math.round(friend.totalJerseyPrice / 2))}
                  className="px-2.5 py-1 text-xs font-semibold text-amber-300 bg-amber-950/70 border border-amber-500/50 rounded-lg hover:bg-amber-900/60 transition-colors cursor-pointer"
                >
                  🟡 50% Half Paid ({formatCurrency(Math.round(friend.totalJerseyPrice / 2), currency)})
                </button>
              )}
              <button
                type="button"
                onClick={() => setPaymentAmount(500)}
                className="px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:text-white transition-colors cursor-pointer"
              >
                + {currency}500
              </button>
              <button
                type="button"
                onClick={() => setPaymentAmount(1000)}
                className="px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:text-white transition-colors cursor-pointer"
              >
                + {currency}1,000
              </button>
              <button
                type="button"
                onClick={() => setPaymentAmount(200)}
                className="px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:text-white transition-colors cursor-pointer"
              >
                + {currency}200
              </button>
            </div>
          </div>

          {/* Active Money Issue Resolution Banner */}
          {hasActiveIssue && (
            <div className="p-3.5 rounded-xl bg-orange-950/30 border border-orange-500/40 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-orange-300">
                <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
                <span>Active Money Issue: {getMoneyIssueLabel(friend.moneyIssue?.issueType)}</span>
              </div>
              {friend.moneyIssue?.issueNote && (
                <p className="text-[11px] text-orange-300/80 pl-6 italic">
                  "{friend.moneyIssue.issueNote}"
                </p>
              )}
              <div className="pl-6 pt-1 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="resolveIssueCheckbox"
                  checked={resolveIssue}
                  onChange={(e) => setResolveIssue(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-900 border-slate-700 cursor-pointer"
                />
                <label
                  htmlFor="resolveIssueCheckbox"
                  className="text-xs text-slate-200 font-medium cursor-pointer"
                >
                  Mark this Money Issue as resolved with this payment
                </label>
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['UPI', 'Cash', 'Bank Transfer', 'Other'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                    method === m
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 font-semibold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Transaction Note */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Payment Note / Reference (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Received on PhonePe / Cash given at nets"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Real-Time Outcome Preview */}
          {numericNewPayment > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
              <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">
                After this payment:
              </span>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                <span className="text-slate-400">Total Paid:</span>
                <span className="font-mono-num font-bold text-emerald-400">
                  {formatCurrency(simulatedTotalPaid, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">New Balance:</span>
                <span className="font-mono-num font-bold text-rose-400">
                  {formatCurrency(simulatedBalance, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Updated Status:</span>
                <span className="font-bold flex items-center gap-1">
                  <span>{simulatedStatusInfo.dot}</span>
                  <span className={simulatedStatusInfo.textClass}>{simulatedStatusInfo.label}</span>
                </span>
              </div>
            </div>
          )}

          {/* Previous Payment History for this friend */}
          {friend.paymentHistory.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                <History className="w-3.5 h-3.5" />
                <span>Past Installments ({friend.paymentHistory.length})</span>
              </div>
              <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                {friend.paymentHistory.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between text-[11px] p-2 bg-slate-950/70 rounded-lg border border-slate-800/60"
                  >
                    <div>
                      <span className="font-semibold text-emerald-400 font-mono-num">
                        +{formatCurrency(tx.amount, currency)}
                      </span>
                      <span className="text-slate-500 ml-1.5">({tx.method})</span>
                      {tx.notes && <span className="text-slate-400 ml-1.5">· {tx.notes}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">
                        {new Date(tx.date).toLocaleDateString()}
                      </span>
                      {onDeleteTransaction && (
                        <button
                          type="button"
                          onClick={() => onDeleteTransaction(friend.id, tx.id)}
                          title="Delete this installment"
                          className="text-slate-500 hover:text-rose-400 p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

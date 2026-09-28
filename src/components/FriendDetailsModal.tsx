import React from 'react';
import { X, Phone, MessageSquare, PlusCircle, Edit3, Trash2, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { FriendJerseyOrder } from '../types/jersey';
import { formatCurrency, getStatusConfig, generateWhatsAppLink } from '../utils/calculations';
import { JerseyPreview } from './JerseyPreview';

interface FriendDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  friend: FriendJerseyOrder | null;
  currency: string;
  teamName: string;
  upiId?: string;
  onOpenAddPayment: (friend: FriendJerseyOrder) => void;
  onOpenEdit: (friend: FriendJerseyOrder) => void;
  onDelete: (id: string) => void;
}

export function FriendDetailsModal({
  isOpen,
  onClose,
  friend,
  currency,
  teamName,
  upiId,
  onOpenAddPayment,
  onOpenEdit,
  onDelete,
}: FriendDetailsModalProps) {
  if (!isOpen || !friend) return null;

  const statusInfo = getStatusConfig(friend.status);
  const waLink = generateWhatsAppLink(friend, teamName, currency, upiId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>{friend.name}</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${statusInfo.badgeClass}`}>
                {statusInfo.dot} {statusInfo.label}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Jersey Order & Payment Summary
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

        <div className="p-6 space-y-6">
          {/* Visual Jersey Showcase & Core Order Specs */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="shrink-0">
              <JerseyPreview
                jerseyName={friend.jerseyName}
                jerseyNumber={friend.jerseyNumber}
                jerseySize={friend.jerseySize}
                size="md"
              />
            </div>

            <div className="flex-1 w-full space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Jersey Back Name:</span>
                <span className="font-jersey font-bold text-amber-400 text-sm tracking-wider">
                  {friend.jerseyName}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Jersey Number:</span>
                <span className="font-jersey font-bold text-amber-400 text-base">
                  #{friend.jerseyNumber}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Size:</span>
                <span className="font-bold text-white px-2 py-0.5 bg-slate-800 rounded">
                  {friend.jerseySize}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Phone:</span>
                <span className="font-mono-num text-slate-200">
                  {friend.phone || '—'}
                </span>
              </div>
              {friend.notes && (
                <div className="pt-1 text-slate-400">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Notes:</span>
                  <span className="italic">{friend.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Financial Breakdown (User requirement 1 & 4) */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block font-medium">Total Jersey Price</span>
              <span className="text-lg font-bold font-mono-num text-white mt-0.5 block">
                {formatCurrency(friend.totalJerseyPrice, currency)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-center">
              <span className="text-[11px] text-emerald-400 block font-medium">Amount Paid</span>
              <span className="text-lg font-bold font-mono-num text-emerald-400 mt-0.5 block">
                {formatCurrency(friend.amountPaid, currency)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 text-center">
              <span className="text-[11px] text-rose-400 block font-medium">Remaining Balance</span>
              <span className="text-lg font-bold font-mono-num text-rose-400 mt-0.5 block">
                {formatCurrency(friend.balance, currency)}
              </span>
            </div>
          </div>

          {/* Payment History Timeline */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Payment Transaction History
            </h4>
            {friend.paymentHistory.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-500">
                No payments recorded yet (🔴 NOT PAID)
              </div>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {friend.paymentHistory.map((tx, idx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                        #{idx + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-white">
                          <span className="text-emerald-400 font-mono-num font-bold">
                            +{formatCurrency(tx.amount, currency)}
                          </span>
                          <span className="text-slate-400 font-normal ml-2">via {tx.method}</span>
                        </div>
                        {tx.notes && <p className="text-[11px] text-slate-400 mt-0.5">{tx.notes}</p>}
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono-num">
                      {new Date(tx.date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick WhatsApp Reminder CTA */}
          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500 text-slate-950 font-bold">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Send WhatsApp Reminder</p>
                <p className="text-[11px] text-slate-400">
                  {friend.balance > 0
                    ? `Remind to clear pending balance of ${formatCurrency(friend.balance, currency)}`
                    : 'Send payment receipt & confirmation'}
                </p>
              </div>
            </div>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 text-xs font-semibold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap shadow-sm"
            >
              Open WhatsApp
            </a>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                onDelete(friend.id);
                onClose();
              }}
              className="px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEdit(friend);
                }}
                className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAddPayment(friend);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Payment</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Edit3, Trash2, PlusCircle, Eye, MessageSquare, AlertTriangle, ChevronDown } from 'lucide-react';
import { FriendJerseyOrder, PaymentStatus } from '../types/jersey';
import { formatCurrency, getStatusConfig, generateWhatsAppLink, getMoneyIssueLabel } from '../utils/calculations';
import { JerseyPreview } from './JerseyPreview';

interface JerseyTableProps {
  friends: FriendJerseyOrder[];
  currency: string;
  teamName: string;
  upiId?: string;
  onViewDetails: (friend: FriendJerseyOrder) => void;
  onAddPayment: (friend: FriendJerseyOrder) => void;
  onOpenMoneyIssue: (friend: FriendJerseyOrder) => void;
  onEdit: (friend: FriendJerseyOrder) => void;
  onDelete: (id: string) => void;
  onQuickMarkPaid?: (id: string) => void;
  onQuickSetStatus?: (id: string, status: PaymentStatus) => void;
}

export function JerseyTable({
  friends,
  currency,
  teamName,
  upiId,
  onViewDetails,
  onAddPayment,
  onOpenMoneyIssue,
  onEdit,
  onDelete,
  onQuickSetStatus,
}: JerseyTableProps) {
  if (friends.length === 0) {
    return null;
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 shadow-lg">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
          <tr>
            <th scope="col" className="py-3.5 px-4">Player & Jersey</th>
            <th scope="col" className="py-3.5 px-3">Phone</th>
            <th scope="col" className="py-3.5 px-3 text-center">Size</th>
            <th scope="col" className="py-3.5 px-3 text-center">No.</th>
            <th scope="col" className="py-3.5 px-3 text-right">Total</th>
            <th scope="col" className="py-3.5 px-3 text-right">Paid</th>
            <th scope="col" className="py-3.5 px-3 text-right">Balance</th>
            <th scope="col" className="py-3.5 px-4 text-center">Status</th>
            <th scope="col" className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 text-slate-200">
          {friends.map((friend) => {
            const statusInfo = getStatusConfig(friend.status);
            const waLink = generateWhatsAppLink(friend, teamName, currency, upiId);
            const hasIssue = friend.status === 'MONEY_ISSUE' || Boolean(friend.moneyIssue?.hasIssue);

            return (
              <tr
                key={friend.id}
                className={`hover:bg-slate-800/40 transition-colors group ${
                  hasIssue ? 'bg-orange-950/10' : ''
                }`}
              >
                {/* Name & Jersey Preview */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <JerseyPreview
                      jerseyName={friend.jerseyName}
                      jerseyNumber={friend.jerseyNumber}
                      size="sm"
                    />
                    <div>
                      <button
                        type="button"
                        onClick={() => onViewDetails(friend)}
                        className="font-bold text-white hover:text-blue-400 text-left transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{friend.name}</span>
                        {hasIssue && (
                          <span
                            title={friend.moneyIssue?.issueNote || 'Money Issue'}
                            className="inline-flex items-center text-orange-400"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </button>
                      <div className="text-[11px] text-amber-400 font-jersey tracking-wide mt-0.5">
                        {friend.jerseyName}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Phone */}
                <td className="py-3 px-3 text-slate-400 whitespace-nowrap font-mono-num text-[11px]">
                  {friend.phone || '—'}
                </td>

                {/* Jersey Size */}
                <td className="py-3 px-3 text-center whitespace-nowrap">
                  <span className="inline-block px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-bold text-slate-200 text-[11px]">
                    {friend.jerseySize}
                  </span>
                </td>

                {/* Jersey Number */}
                <td className="py-3 px-3 text-center whitespace-nowrap">
                  <span className="font-jersey font-extrabold text-amber-400 text-sm">
                    #{friend.jerseyNumber}
                  </span>
                </td>

                {/* Total */}
                <td className="py-3 px-3 text-right whitespace-nowrap font-mono-num text-slate-200 font-semibold">
                  {formatCurrency(friend.totalJerseyPrice, currency)}
                </td>

                {/* Paid */}
                <td className="py-3 px-3 text-right whitespace-nowrap font-mono-num text-emerald-400 font-bold">
                  {formatCurrency(friend.amountPaid, currency)}
                  {friend.amountPaid > friend.totalJerseyPrice && (
                    <span className="block text-[10px] text-orange-400 font-semibold">
                      +{formatCurrency(friend.amountPaid - friend.totalJerseyPrice, currency)} extra
                    </span>
                  )}
                </td>

                {/* Balance */}
                <td className="py-3 px-3 text-right whitespace-nowrap font-mono-num font-bold">
                  <span className={friend.balance > 0 ? 'text-rose-400' : 'text-slate-500'}>
                    {formatCurrency(friend.balance, currency)}
                  </span>
                </td>

                {/* Status (🟢 Paid, 🟡 Half Paid, 🔴 Not Paid, 🟠 Money Issue) */}
                <td className="py-3 px-4 text-center whitespace-nowrap">
                  <div className="inline-flex flex-col items-center">
                    <div className="relative inline-block text-left">
                      <select
                        aria-label={`Change status for ${friend.name}`}
                        value={friend.status}
                        onChange={(e) => {
                          const val = e.target.value as PaymentStatus;
                          if (val === 'MONEY_ISSUE') {
                            onOpenMoneyIssue(friend);
                          } else if (onQuickSetStatus) {
                            onQuickSetStatus(friend.id, val);
                          }
                        }}
                        className={`appearance-none text-[11px] font-bold py-1 pl-2.5 pr-6 rounded-full border cursor-pointer transition-all hover:scale-105 focus:outline-none focus:ring-1 focus:ring-blue-400 ${statusInfo.badgeClass}`}
                      >
                        <option value="PAID" className="bg-slate-900 text-emerald-400 font-bold">🟢 PAID (Full)</option>
                        <option value="HALF_PAID" className="bg-slate-900 text-amber-400 font-bold">🟡 HALF PAID (50%)</option>
                        <option value="NOT_PAID" className="bg-slate-900 text-rose-400 font-bold">🔴 NOT PAID (Rs 0)</option>
                        <option value="MONEY_ISSUE" className="bg-slate-900 text-orange-400 font-bold">⚠️ MONEY ISSUE...</option>
                      </select>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5 opacity-60">
                        <ChevronDown className="w-3 h-3" />
                      </span>
                    </div>

                    {hasIssue && friend.moneyIssue?.issueType && (
                      <button
                        type="button"
                        onClick={() => onOpenMoneyIssue(friend)}
                        title="Click to view or edit money issue details"
                        className="text-[9px] text-orange-400 hover:text-orange-300 font-medium mt-1 truncate max-w-[130px] underline cursor-pointer"
                      >
                        {getMoneyIssueLabel(friend.moneyIssue.issueType)}
                      </button>
                    )}
                  </div>
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    {/* Direct 1-Click Paid Button */}
                    {friend.balance > 0 ? (
                      <button
                        type="button"
                        onClick={() => onQuickSetStatus && onQuickSetStatus(friend.id, 'PAID')}
                        title={`Mark ${friend.name} as Paid in full`}
                        className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-lg transition-all shadow-sm shadow-emerald-900/30 flex items-center gap-1 cursor-pointer"
                      >
                        <span>✓ Paid</span>
                      </button>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 rounded-lg">
                        ✓ Paid
                      </span>
                    )}

                    {/* Add Partial Payment Button */}
                    <button
                      type="button"
                      onClick={() => onAddPayment(friend)}
                      title="Add Payment"
                      className="px-2 py-1 text-[11px] font-medium text-slate-300 bg-slate-800 hover:text-white hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-blue-400" />
                      <span>+ Pay</span>
                    </button>

                    {/* Money Issue Button */}
                    <button
                      type="button"
                      onClick={() => onOpenMoneyIssue(friend)}
                      title={hasIssue ? 'Resolve or Edit Money Issue' : 'Flag as Money Issue'}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        hasIssue
                          ? 'text-orange-400 bg-orange-950/40 hover:bg-orange-900/60 border border-orange-500/30'
                          : 'text-slate-400 hover:text-orange-400 hover:bg-slate-800'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </button>

                    {/* View Details */}
                    <button
                      type="button"
                      onClick={() => onViewDetails(friend)}
                      title="View Details"
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* WhatsApp Reminder */}
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="WhatsApp Reminder"
                      className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 rounded-lg transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </a>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => onEdit(friend)}
                      title="Edit"
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => onDelete(friend.id)}
                      title="Delete"
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

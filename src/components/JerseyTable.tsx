import React from 'react';
import { Edit3, Trash2, PlusCircle, Eye, MessageSquare, Check, Phone } from 'lucide-react';
import { FriendJerseyOrder } from '../types/jersey';
import { formatCurrency, getStatusConfig, generateWhatsAppLink } from '../utils/calculations';
import { JerseyPreview } from './JerseyPreview';

interface JerseyTableProps {
  friends: FriendJerseyOrder[];
  currency: string;
  teamName: string;
  upiId?: string;
  onViewDetails: (friend: FriendJerseyOrder) => void;
  onAddPayment: (friend: FriendJerseyOrder) => void;
  onEdit: (friend: FriendJerseyOrder) => void;
  onDelete: (id: string) => void;
  onQuickMarkPaid: (id: string) => void;
}

export function JerseyTable({
  friends,
  currency,
  teamName,
  upiId,
  onViewDetails,
  onAddPayment,
  onEdit,
  onDelete,
  onQuickMarkPaid,
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

            return (
              <tr
                key={friend.id}
                className="hover:bg-slate-800/40 transition-colors group"
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
                        className="font-bold text-white hover:text-blue-400 text-left transition-colors flex items-center gap-1.5"
                      >
                        <span>{friend.name}</span>
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
                </td>

                {/* Balance */}
                <td className="py-3 px-3 text-right whitespace-nowrap font-mono-num font-bold">
                  <span className={friend.balance > 0 ? 'text-rose-400' : 'text-slate-500'}>
                    {formatCurrency(friend.balance, currency)}
                  </span>
                </td>

                {/* Status */}
                <td className="py-3 px-4 text-center whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${statusInfo.badgeClass}`}
                  >
                    <span>{statusInfo.dot}</span>
                    <span>{statusInfo.label}</span>
                  </span>
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    {/* Add Payment Button (Prompt requirement) */}
                    <button
                      type="button"
                      onClick={() => onAddPayment(friend)}
                      title="Add Payment"
                      className="px-2.5 py-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ Pay</span>
                    </button>

                    {/* View Details */}
                    <button
                      type="button"
                      onClick={() => onViewDetails(friend)}
                      title="View Details"
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
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
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
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

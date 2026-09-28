import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { FriendJerseyOrder, JerseySize } from '../types/jersey';
import { JERSEY_SIZES, calculateBalance, calculatePaymentStatus, formatCurrency, getStatusConfig } from '../utils/calculations';
import { JerseyPreview } from './JerseyPreview';

interface AddEditFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    phone: string;
    jerseySize: JerseySize;
    jerseyNumber: string;
    jerseyName: string;
    totalJerseyPrice: number;
    amountPaid: number;
    notes: string;
    initialPaymentMethod?: 'UPI' | 'Cash' | 'Bank Transfer' | 'Other';
  }) => void;
  initialData?: FriendJerseyOrder | null;
  defaultJerseyPrice: number;
  currency: string;
}

export function AddEditFriendModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultJerseyPrice,
  currency,
}: AddEditFriendModalProps) {
  const isEditing = Boolean(initialData);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [jerseySize, setJerseySize] = useState<JerseySize>('M');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [jerseyName, setJerseyName] = useState('');
  const [totalPrice, setTotalPrice] = useState<number>(defaultJerseyPrice);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash' | 'Bank Transfer' | 'Other'>('UPI');
  const [error, setError] = useState<string | null>(null);

  // Sync state when opened or initialData changes
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setPhone(initialData.phone);
      setJerseySize(initialData.jerseySize);
      setJerseyNumber(initialData.jerseyNumber);
      setJerseyName(initialData.jerseyName);
      setTotalPrice(initialData.totalJerseyPrice);
      setAmountPaid(initialData.amountPaid);
      setNotes(initialData.notes || '');
    } else {
      setName('');
      setPhone('');
      setJerseySize('M');
      setJerseyNumber('');
      setJerseyName('');
      setTotalPrice(defaultJerseyPrice);
      setAmountPaid(0);
      setNotes('');
      setPaymentMethod('UPI');
    }
    setError(null);
  }, [initialData, defaultJerseyPrice, isOpen]);

  // Real-time calculated values
  const currentBalance = calculateBalance(totalPrice, amountPaid);
  const currentStatus = calculatePaymentStatus(totalPrice, amountPaid);
  const statusInfo = getStatusConfig(currentStatus);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter friend name.');
      return;
    }

    if (totalPrice < 0) {
      setError('Jersey price cannot be negative.');
      return;
    }

    if (amountPaid < 0) {
      setError('Amount paid cannot be negative.');
      return;
    }

    onSave({
      name: name.trim(),
      phone: phone.trim(),
      jerseySize,
      jerseyNumber: jerseyNumber.trim() || '00',
      jerseyName: (jerseyName || name).trim().toUpperCase(),
      totalJerseyPrice: Number(totalPrice),
      amountPaid: Number(amountPaid),
      notes: notes.trim(),
      initialPaymentMethod: paymentMethod,
    });

    onClose();
  };

  const handleNameChange = (val: string) => {
    setName(val);
    // If user hasn't typed a custom jersey name yet, mirror the first name
    if (!isEditing && (!jerseyName || jerseyName.toLowerCase() === name.toLowerCase())) {
      setJerseyName(val.split(' ')[0] || val);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div>
            <h3 className="text-lg font-bold text-white">
              {isEditing ? 'Edit Friend Details' : 'Add New Friend for Jersey'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter jersey specifications & payment details
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
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Top Split: Live Preview & Player Identity */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
            {/* Jersey visual preview */}
            <div className="flex flex-col items-center justify-center">
              <JerseyPreview
                jerseyName={jerseyName || name || 'PLAYER'}
                jerseyNumber={jerseyNumber || '00'}
                jerseySize={jerseySize}
                size="md"
              />
              <span className="text-[10px] text-slate-400 mt-1.5 font-medium">
                Live Jersey Back Preview
              </span>
            </div>

            {/* Quick Details Fields */}
            <div className="md:col-span-2 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Friend Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Virat Kohli"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Jersey Name (Back Print)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. VIRAT"
                    value={jerseyName}
                    onChange={(e) => setJerseyName(e.target.value.toUpperCase())}
                    maxLength={15}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm font-jersey tracking-wider uppercase text-amber-400 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Jersey Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 18"
                    value={jerseyNumber}
                    onChange={(e) => setJerseyNumber(e.target.value.slice(0, 3))}
                    maxLength={3}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm font-jersey text-amber-400 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Phone Number (for WhatsApp reminders)
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Jersey Size Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Select Jersey Size <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {JERSEY_SIZES.map((size) => {
                const isSelected = jerseySize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setJerseySize(size)}
                    className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all text-center ${
                      isSelected
                        ? 'bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-600/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pricing & Real-Time Payment Calculation Section */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>Payment Details & Automated Balance</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Total Jersey Price ({currency}) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono-num">
                    {currency}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={totalPrice}
                    onChange={(e) => setTotalPrice(Number(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-mono-num focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Amount Paid ({currency}) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono-num">
                    {currency}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-mono-num focus:outline-none focus:border-blue-500"
                  />
                </div>
                {/* Quick Presets for Amount Paid */}
                <div className="flex gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setAmountPaid(0)}
                    className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700"
                  >
                    ₹0 (Unpaid)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmountPaid(Math.round(totalPrice / 2))}
                    className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700"
                  >
                    50% Advance
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmountPaid(totalPrice)}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30"
                  >
                    Full Paid
                  </button>
                </div>
              </div>
            </div>

            {/* If paid > 0 and registering new friend, prompt for payment method */}
            {!isEditing && amountPaid > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Payment Mode for Initial Paid Amount
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['UPI', 'Cash', 'Bank Transfer', 'Other'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-1.5 text-xs rounded-lg border text-center transition-all ${
                        paymentMethod === m
                          ? 'bg-slate-800 border-blue-500 text-blue-400 font-semibold'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* AUTOMATED CALCULATION CALLOUT BANNER (User requirement #3 & #5) */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 grid grid-cols-2 gap-3 items-center">
              <div>
                <span className="text-[11px] text-slate-400 block">Remaining Balance</span>
                <span className="text-xl font-bold font-mono-num text-rose-400">
                  {formatCurrency(currentBalance, currency)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  ({formatCurrency(totalPrice, currency)} - {formatCurrency(amountPaid, currency)})
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block">Auto Determined Status</span>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-base">{statusInfo.dot}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusInfo.badgeClass}`}>
                    {statusInfo.label}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Calculated automatically from paid amount
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Paid token advance at cricket ground"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

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
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/30"
            >
              {isEditing ? 'Save Changes' : 'Add Friend'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

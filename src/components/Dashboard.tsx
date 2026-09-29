import { Users, CheckCircle2, AlertCircle, XCircle, AlertTriangle, Wallet, TrendingUp } from 'lucide-react';
import { FriendJerseyOrder, StatusFilter } from '../types/jersey';
import { formatCurrency } from '../utils/calculations';

interface DashboardProps {
  friends: FriendJerseyOrder[];
  currency: string;
  activeStatusFilter: StatusFilter;
  onSelectFilter: (filter: StatusFilter) => void;
}

export function Dashboard({
  friends,
  currency,
  activeStatusFilter,
  onSelectFilter,
}: DashboardProps) {
  const totalFriends = friends.length;
  const paidCount = friends.filter((f) => f.status === 'PAID').length;
  const halfPaidCount = friends.filter((f) => f.status === 'HALF_PAID').length;
  const notPaidCount = friends.filter((f) => f.status === 'NOT_PAID').length;
  const moneyIssueCount = friends.filter((f) => f.status === 'MONEY_ISSUE').length;

  const totalJerseyAmount = friends.reduce((sum, f) => sum + f.totalJerseyPrice, 0);
  const totalCollected = friends.reduce((sum, f) => sum + f.amountPaid, 0);
  const totalBalance = friends.reduce((sum, f) => sum + f.balance, 0);

  const collectionPercent =
    totalJerseyAmount > 0 ? Math.round((totalCollected / totalJerseyAmount) * 100) : 0;

  return (
    <section aria-label="Dashboard Overview" className="space-y-4">
      {/* Top Banner / Collection Progress Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Jersey Collection Progress</h2>
              <p className="text-xs text-slate-400">
                {paidCount} of {totalFriends} players fully cleared ({collectionPercent}% collected)
                {moneyIssueCount > 0 && (
                  <span className="text-orange-400 font-medium ml-2">
                    · ⚠️ {moneyIssueCount} payment {moneyIssueCount === 1 ? 'issue' : 'issues'} flagged
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-baseline gap-2 self-start sm:self-auto">
            <span className="text-2xl font-bold font-mono-num text-white">
              {collectionPercent}%
            </span>
            <span className="text-xs text-slate-400 font-mono-num">
              ({formatCurrency(totalCollected, currency)} / {formatCurrency(totalJerseyAmount, currency)})
            </span>
          </div>
        </div>

        {/* Progress Track */}
        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-500 ease-out shadow-[0_0_12px_rgba(16,185,129,0.5)]"
            style={{ width: `${Math.min(100, Math.max(0, collectionPercent))}%` }}
          />
        </div>
      </div>

      {/* Grid of Key Status Cards (Requested: Paid, Half Paid, Not Paid, Money Issue) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Friends */}
        <button
          type="button"
          onClick={() => onSelectFilter('ALL')}
          className={`text-left p-3.5 sm:p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
            activeStatusFilter === 'ALL'
              ? 'bg-slate-800/90 border-blue-500/50 ring-1 ring-blue-500/30 shadow-md'
              : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-400">Total Squad</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white font-mono-num tracking-tight">
            {totalFriends}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            All players registered
          </div>
        </button>

        {/* 1. Paid (🟢) */}
        <button
          type="button"
          onClick={() => onSelectFilter(activeStatusFilter === 'PAID' ? 'ALL' : 'PAID')}
          className={`text-left p-3.5 sm:p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
            activeStatusFilter === 'PAID'
              ? 'bg-emerald-950/50 border-emerald-500/60 ring-1 ring-emerald-500/40 shadow-md'
              : 'bg-slate-900/60 border-slate-800/80 hover:bg-emerald-950/20 hover:border-emerald-500/30'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🟢</span>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Paid</span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono-num tracking-tight">
            {paidCount}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-0.5">
            Full amount cleared
          </div>
        </button>

        {/* 2. Half Paid (🟡) */}
        <button
          type="button"
          onClick={() => onSelectFilter(activeStatusFilter === 'HALF_PAID' ? 'ALL' : 'HALF_PAID')}
          className={`text-left p-3.5 sm:p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
            activeStatusFilter === 'HALF_PAID'
              ? 'bg-amber-950/50 border-amber-500/60 ring-1 ring-amber-500/40 shadow-md'
              : 'bg-slate-900/60 border-slate-800/80 hover:bg-amber-950/20 hover:border-amber-500/30'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🟡</span>
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Half Paid</span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-400 font-mono-num tracking-tight">
            {halfPaidCount}
          </div>
          <div className="text-[11px] text-amber-400/80 mt-0.5">
            Advance paid, balance left
          </div>
        </button>

        {/* 3. Not Paid (🔴) */}
        <button
          type="button"
          onClick={() => onSelectFilter(activeStatusFilter === 'NOT_PAID' ? 'ALL' : 'NOT_PAID')}
          className={`text-left p-3.5 sm:p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
            activeStatusFilter === 'NOT_PAID'
              ? 'bg-rose-950/50 border-rose-500/60 ring-1 ring-rose-500/40 shadow-md'
              : 'bg-slate-900/60 border-slate-800/80 hover:bg-rose-950/20 hover:border-rose-500/30'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🔴</span>
              <span className="text-xs font-semibold text-rose-400 uppercase tracking-wide">Not Paid</span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
              <XCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-rose-400 font-mono-num tracking-tight">
            {notPaidCount}
          </div>
          <div className="text-[11px] text-rose-400/80 mt-0.5">
            Pending Rs 0 advance
          </div>
        </button>

        {/* 4. Money Issue (🟠 ⚠️ Requested Category) */}
        <button
          type="button"
          onClick={() => onSelectFilter(activeStatusFilter === 'MONEY_ISSUE' ? 'ALL' : 'MONEY_ISSUE')}
          className={`col-span-2 sm:col-span-1 text-left p-3.5 sm:p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
            activeStatusFilter === 'MONEY_ISSUE'
              ? 'bg-orange-950/60 border-orange-500/70 ring-1 ring-orange-500/50 shadow-md shadow-orange-500/20'
              : 'bg-slate-900/60 border-slate-800/80 hover:bg-orange-950/30 hover:border-orange-500/40'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">⚠️</span>
              <span className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Money Issue</span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-orange-500/15 flex items-center justify-center text-orange-400">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-orange-400 font-mono-num tracking-tight">
            {moneyIssueCount}
          </div>
          <div className="text-[11px] text-orange-400/80 mt-0.5">
            UPI failed, refund, dispute
          </div>
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Jersey Amount */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Total Jersey Cost</span>
            <div className="text-xl sm:text-2xl font-bold text-slate-100 font-mono-num mt-1">
              {formatCurrency(totalJerseyAmount, currency)}
            </div>
            <span className="text-[11px] text-slate-400">Total squad kit bill</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 border border-slate-700/50">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Total Collected */}
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-400 font-medium">Total Collected</span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono-num mt-1">
              {formatCurrency(totalCollected, currency)}
            </div>
            <span className="text-[11px] text-emerald-300/80">Funds in hand / UPI</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/40">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Total Balance */}
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-rose-400 font-medium">Remaining Balance</span>
            <div className="text-xl sm:text-2xl font-bold text-rose-400 font-mono-num mt-1">
              {formatCurrency(totalBalance, currency)}
            </div>
            <span className="text-[11px] text-rose-300/80">Pending to collect</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 border border-rose-500/40">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>
    </section>
  );
}

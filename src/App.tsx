import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  LayoutGrid,
  Table as TableIcon,
  Shirt,
  RotateCcw,
} from 'lucide-react';
import {
  FriendJerseyOrder,
  StatusFilter,
  SortOption,
  MoneyIssueDetails,
} from './types/jersey';
import { useJerseyTracker } from './hooks/useJerseyTracker';
import { exportToCSV, JERSEY_SIZES } from './utils/calculations';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { JerseyTable } from './components/JerseyTable';
import { JerseyCard } from './components/JerseyCard';
import { AddEditFriendModal } from './components/AddEditFriendModal';
import { AddPaymentModal } from './components/AddPaymentModal';
import { FriendDetailsModal } from './components/FriendDetailsModal';
import { MoneyIssueModal } from './components/MoneyIssueModal';
import { VendorSheetModal } from './components/VendorSheetModal';
import { TeamSettingsModal } from './components/TeamSettingsModal';
import { ConfirmModal } from './components/ConfirmModal';

export default function App() {
  const {
    friends,
    settings,
    isCloudSyncing,
    isLiveConnected,
    cloudError,
    addFriend,
    updateFriend,
    deleteFriend,
    addPayment,
    quickMarkPaid,
    quickSetStatus,
    deletePaymentTransaction,
    setFriendMoneyIssue,
    resetSampleData,
    clearAllData,
    updateTeamSettings,
  } = useJerseyTracker();

  // Search, filter & sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sizeFilter, setSizeFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('balance_desc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingFriend, setEditingFriend] = useState<FriendJerseyOrder | null>(null);

  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [paymentFriend, setPaymentFriend] = useState<FriendJerseyOrder | null>(null);

  const [isMoneyIssueOpen, setIsMoneyIssueOpen] = useState(false);
  const [moneyIssueFriend, setMoneyIssueFriend] = useState<FriendJerseyOrder | null>(null);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsFriend, setDetailsFriend] = useState<FriendJerseyOrder | null>(null);

  const [isVendorSheetOpen, setIsVendorSheetOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [friendToDelete, setFriendToDelete] = useState<FriendJerseyOrder | null>(null);
  const [isErrorDismissed, setIsErrorDismissed] = useState(false);

  // Dynamically resolve latest friend data from state so modal actions like "Paid" immediately reflect
  const currentDetailsFriend = detailsFriend ? friends.find((f) => f.id === detailsFriend.id) || detailsFriend : null;
  const currentPaymentFriend = paymentFriend ? friends.find((f) => f.id === paymentFriend.id) || paymentFriend : null;
  const currentMoneyIssueFriend = moneyIssueFriend ? friends.find((f) => f.id === moneyIssueFriend.id) || moneyIssueFriend : null;

  // Filtered & sorted list
  const filteredFriends = useMemo(() => {
    return friends
      .filter((friend) => {
        // Status filter (PAID, HALF_PAID, NOT_PAID, MONEY_ISSUE)
        if (statusFilter !== 'ALL' && friend.status !== statusFilter) {
          return false;
        }

        // Size filter
        if (sizeFilter !== 'ALL' && friend.jerseySize !== sizeFilter) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = friend.name.toLowerCase().includes(q);
          const matchesJerseyName = friend.jerseyName.toLowerCase().includes(q);
          const matchesNumber = friend.jerseyNumber.toLowerCase().includes(q);
          const matchesPhone = friend.phone.toLowerCase().includes(q);
          const matchesNotes = friend.notes.toLowerCase().includes(q);
          const matchesIssue =
            friend.moneyIssue?.issueNote?.toLowerCase().includes(q) || false;
          return (
            matchesName ||
            matchesJerseyName ||
            matchesNumber ||
            matchesPhone ||
            matchesNotes ||
            matchesIssue
          );
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'balance_desc') {
          return b.balance - a.balance;
        }
        if (sortBy === 'name_asc') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'jersey_asc') {
          return Number(a.jerseyNumber || 0) - Number(b.jerseyNumber || 0);
        }
        if (sortBy === 'paid_desc') {
          return b.amountPaid - a.amountPaid;
        }
        if (sortBy === 'created_desc') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
      });
  }, [friends, statusFilter, sizeFilter, searchQuery, sortBy]);

  // Status counts for tabs (Paid, Half Paid, Not Paid, Money Issue)
  const counts = useMemo(() => {
    return {
      all: friends.length,
      paid: friends.filter((f) => f.status === 'PAID').length,
      halfPaid: friends.filter((f) => f.status === 'HALF_PAID').length,
      notPaid: friends.filter((f) => f.status === 'NOT_PAID').length,
      moneyIssue: friends.filter((f) => f.status === 'MONEY_ISSUE').length,
    };
  }, [friends]);

  // Handlers
  const handleOpenAddFriend = () => {
    setEditingFriend(null);
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (friend: FriendJerseyOrder) => {
    setEditingFriend(friend);
    setIsAddEditOpen(true);
  };

  const handleOpenAddPayment = (friend: FriendJerseyOrder) => {
    setPaymentFriend(friend);
    setIsAddPaymentOpen(true);
  };

  const handleOpenMoneyIssue = (friend: FriendJerseyOrder) => {
    setMoneyIssueFriend(friend);
    setIsMoneyIssueOpen(true);
  };

  const handleOpenDetails = (friend: FriendJerseyOrder) => {
    setDetailsFriend(friend);
    setIsDetailsOpen(true);
  };

  const handleSaveFriend = (data: Parameters<typeof addFriend>[0]) => {
    if (editingFriend) {
      updateFriend(editingFriend.id, data);
    } else {
      addFriend(data);
    }
  };

  const handleSaveMoneyIssue = (
    friendId: string,
    issue: MoneyIssueDetails | undefined
  ) => {
    setFriendMoneyIssue(friendId, issue);
  };

  const handleExportCSV = () => {
    exportToCSV(friends, settings.teamName);
  };

  const handleRequestDelete = (id: string) => {
    const friend = friends.find((f) => f.id === id);
    if (friend) {
      setFriendToDelete(friend);
    } else {
      deleteFriend(id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* 3-Zone Clean Header */}
      <Header
        settings={settings}
        isCloudSyncing={isCloudSyncing}
        isLiveConnected={isLiveConnected}
        onOpenAddFriend={handleOpenAddFriend}
        onOpenVendorSheet={() => setIsVendorSheetOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExportCSV={handleExportCSV}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {cloudError && !isErrorDismissed && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center justify-between animate-in fade-in">
            <span>{cloudError}</span>
            <button
              type="button"
              onClick={() => setIsErrorDismissed(true)}
              className="text-amber-400 hover:text-white font-semibold cursor-pointer ml-3 px-2 py-0.5 rounded bg-amber-500/20"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Section: Dashboard Metrics with 4 Categories: Paid, Half Paid, Not Paid, Money Issue */}
        <Dashboard
          friends={friends}
          currency={settings.currency}
          activeStatusFilter={statusFilter}
          onSelectFilter={(newFilter) => setStatusFilter(newFilter)}
        />

        {/* Section: Filter Bar and Friends Payment List */}
        <section aria-label="Friends Payment List" className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
            {/* Status Filter Tabs (Paid, Half Paid, Not Paid, Money Issue) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === 'ALL'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  All Players ({counts.all})
                </button>

                {/* 1. Paid */}
                <button
                  type="button"
                  onClick={() => setStatusFilter('PAID')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    statusFilter === 'PAID'
                      ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-sm'
                      : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
                  }`}
                >
                  <span>🟢</span>
                  <span>Paid ({counts.paid})</span>
                </button>

                {/* 2. Half Paid */}
                <button
                  type="button"
                  onClick={() => setStatusFilter('HALF_PAID')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    statusFilter === 'HALF_PAID'
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-sm'
                      : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
                  }`}
                >
                  <span>🟡</span>
                  <span>Half Paid ({counts.halfPaid})</span>
                </button>

                {/* 3. Not Paid */}
                <button
                  type="button"
                  onClick={() => setStatusFilter('NOT_PAID')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    statusFilter === 'NOT_PAID'
                      ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50 shadow-sm'
                      : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                  }`}
                >
                  <span>🔴</span>
                  <span>Not Paid ({counts.notPaid})</span>
                </button>

                {/* 4. Money Issue (Requested) */}
                <button
                  type="button"
                  onClick={() => setStatusFilter('MONEY_ISSUE')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    statusFilter === 'MONEY_ISSUE'
                      ? 'bg-orange-500/25 text-orange-300 border border-orange-500/60 shadow-sm shadow-orange-500/20'
                      : 'text-slate-400 hover:text-orange-400 hover:bg-slate-800'
                  }`}
                >
                  <span>⚠️</span>
                  <span>Money Issue ({counts.moneyIssue})</span>
                </button>
              </div>

              {/* View Mode Toggle (Desktop only) */}
              <div className="hidden md:flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  title="Table view"
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-slate-800 text-blue-400 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <TableIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  title="Card view"
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-slate-800 text-blue-400 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search, Size Filter & Sort Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              {/* Search input */}
              <div className="sm:col-span-6 relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search player, jersey name, #number, phone, issue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-slate-500 hover:text-white absolute right-3 top-2.5 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Size filter dropdown */}
              <div className="sm:col-span-3">
                <select
                  value={sizeFilter}
                  onChange={(e) => setSizeFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">All Jersey Sizes</option>
                  {JERSEY_SIZES.map((size) => (
                    <option key={size} value={size}>
                      Size: {size}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort by dropdown */}
              <div className="sm:col-span-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="balance_desc">Sort: Highest Balance Pending</option>
                  <option value="name_asc">Sort: Player Name (A-Z)</option>
                  <option value="jersey_asc">Sort: Jersey Number (#)</option>
                  <option value="paid_desc">Sort: Highest Paid First</option>
                  <option value="created_desc">Sort: Recently Added</option>
                </select>
              </div>
            </div>
          </div>

          {/* Friends List Rendering */}
          {friends.length === 0 ? (
            <div className="text-center py-16 px-4 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 space-y-4">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-amber-500 rounded-2xl blur opacity-50"></div>
                <img
                  src="/src/assets/images/cricket_jersey_logo_1790667442860.jpg"
                  alt={`${settings.teamName} Emblem`}
                  referrerPolicy="no-referrer"
                  className="relative w-20 h-20 rounded-2xl object-cover border border-slate-700 shadow-xl"
                />
              </div>
              <div className="max-w-sm mx-auto space-y-1">
                <h3 className="text-base font-bold text-white">No Players in Jersey Order</h3>
                <p className="text-xs text-slate-400">
                  Track payments, sizes, and money issues for your cricket squad.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetSampleData}
                  className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:text-white rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Load Sample Squad</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenAddFriend}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Friend</span>
                </button>
              </div>
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-900/30 rounded-2xl border border-slate-800 space-y-3">
              <p className="text-sm font-semibold text-slate-300">
                No matching players found for selected filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setSizeFilter('ALL');
                }}
                className="px-3.5 py-1.5 text-xs text-blue-400 bg-blue-950/40 border border-blue-500/30 rounded-lg hover:bg-blue-900/40 transition-colors cursor-pointer"
              >
                Reset Search & Filters
              </button>
            </div>
          ) : (
            <div>
              {/* Desktop Table View */}
              <div className={viewMode === 'table' ? 'hidden md:block' : 'hidden'}>
                <JerseyTable
                  friends={filteredFriends}
                  currency={settings.currency}
                  teamName={settings.teamName}
                  upiId={settings.upiId}
                  onViewDetails={handleOpenDetails}
                  onAddPayment={handleOpenAddPayment}
                  onOpenMoneyIssue={handleOpenMoneyIssue}
                  onEdit={handleOpenEdit}
                  onDelete={handleRequestDelete}
                  onQuickMarkPaid={quickMarkPaid}
                  onQuickSetStatus={quickSetStatus}
                />
              </div>

              {/* Mobile Card Grid */}
              <div
                className={
                  viewMode === 'cards'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                    : 'grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden'
                }
              >
                {filteredFriends.map((friend) => (
                  <JerseyCard
                    key={friend.id}
                    friend={friend}
                    currency={settings.currency}
                    teamName={settings.teamName}
                    upiId={settings.upiId}
                    onViewDetails={handleOpenDetails}
                    onAddPayment={handleOpenAddPayment}
                    onOpenMoneyIssue={handleOpenMoneyIssue}
                    onEdit={handleOpenEdit}
                    onDelete={handleRequestDelete}
                    onQuickSetStatus={quickSetStatus}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img
              src="/src/assets/images/cricket_jersey_logo_1790667442860.jpg"
              alt="Logo icon"
              referrerPolicy="no-referrer"
              className="w-5 h-5 rounded-md object-cover border border-slate-700"
            />
            <span>{settings.teamName} · Official Cricket Jersey Payment Tracker</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsVendorSheetOpen(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Vendor Order Sheet
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={handleExportCSV}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Export CSV
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Settings
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AddEditFriendModal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        onSave={handleSaveFriend}
        initialData={editingFriend}
        defaultJerseyPrice={settings.defaultJerseyPrice}
        currency={settings.currency}
      />

      <AddPaymentModal
        isOpen={isAddPaymentOpen}
        onClose={() => setIsAddPaymentOpen(false)}
        friend={currentPaymentFriend}
        currency={settings.currency}
        onAddPayment={addPayment}
        onDeleteTransaction={deletePaymentTransaction}
      />

      <MoneyIssueModal
        isOpen={isMoneyIssueOpen}
        onClose={() => setIsMoneyIssueOpen(false)}
        friend={currentMoneyIssueFriend}
        currency={settings.currency}
        onSaveIssue={handleSaveMoneyIssue}
      />

      <FriendDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        friend={currentDetailsFriend}
        currency={settings.currency}
        teamName={settings.teamName}
        upiId={settings.upiId}
        onQuickSetStatus={(id, status) => {
          quickSetStatus(id, status);
        }}
        onOpenAddPayment={(f) => {
          setIsDetailsOpen(false);
          handleOpenAddPayment(f);
        }}
        onOpenMoneyIssue={(f) => {
          setIsDetailsOpen(false);
          handleOpenMoneyIssue(f);
        }}
        onOpenEdit={(f) => {
          setIsDetailsOpen(false);
          handleOpenEdit(f);
        }}
        onDelete={handleRequestDelete}
      />

      <VendorSheetModal
        isOpen={isVendorSheetOpen}
        onClose={() => setIsVendorSheetOpen(false)}
        friends={friends}
        teamName={settings.teamName}
      />

      <TeamSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={updateTeamSettings}
        onResetSampleData={resetSampleData}
        onClearAll={clearAllData}
      />

      {/* In-app safe deletion confirmation */}
      <ConfirmModal
        isOpen={Boolean(friendToDelete)}
        title="Remove Friend from Order"
        message={
          friendToDelete
            ? `Are you sure you want to remove "${friendToDelete.name}" (${friendToDelete.jerseyName} #${friendToDelete.jerseyNumber}) from the cricket jersey order? This action cannot be undone.`
            : ''
        }
        confirmLabel="Yes, Remove"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          if (friendToDelete) {
            deleteFriend(friendToDelete.id);
            setFriendToDelete(null);
          }
        }}
        onCancel={() => setFriendToDelete(null)}
      />
    </div>
  );
}

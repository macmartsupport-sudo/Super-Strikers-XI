import { useState, useEffect } from 'react';
import { FriendJerseyOrder, TeamSettings, JerseySize, PaymentStatus } from '../types/jersey';
import { calculateBalance, calculatePaymentStatus } from '../utils/calculations';
import { INITIAL_SAMPLE_FRIENDS } from '../utils/sampleData';
import {
  db,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  doc,
  handleFirestoreError,
  OperationType,
} from '../firebase';

const STORAGE_KEY_FRIENDS = 'cricket_jersey_friends_v1';
const STORAGE_KEY_SETTINGS = 'cricket_jersey_settings_v1';
const SETTINGS_DOC_ID = 'main_team_settings';

const DEFAULT_SETTINGS: TeamSettings = {
  teamName: 'Super Strikers XI',
  currency: 'Rs',
  defaultJerseyPrice: 1200,
  upiId: 'captain@upi',
};

export function useJerseyTracker() {
  const [isCloudSyncing, setIsCloudSyncing] = useState(true);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);

  // Local state initialized from localStorage
  const [friends, setFriends] = useState<FriendJerseyOrder[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_FRIENDS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load friends from localStorage', e);
    }
    return INITIAL_SAMPLE_FRIENDS;
  });

  const [settings, setSettings] = useState<TeamSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          currency: 'Rs',
        };
      }
    } catch (e) {
      console.error('Failed to load settings from localStorage', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Realtime Firestore synchronization for all cricket squad members (no login needed)
  useEffect(() => {
    setIsCloudSyncing(true);
    const ordersCol = collection(db, 'jersey_orders');

    const unsubscribeOrders = onSnapshot(
      ordersCol,
      (snapshot) => {
        setIsLiveConnected(true);
        setCloudError(null);
        const cloudFriends: FriendJerseyOrder[] = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as FriendJerseyOrder;
          cloudFriends.push({
            ...data,
            id: docSnap.id,
          });
        });

        if (cloudFriends.length > 0) {
          setFriends(cloudFriends);
        } else if (snapshot.empty) {
          // If Firestore is empty, seed with initial sample friends
          seedInitialSquadToCloud(INITIAL_SAMPLE_FRIENDS);
        }
        setIsCloudSyncing(false);
      },
      (error) => {
        setIsCloudSyncing(false);
        setIsLiveConnected(false);
        const errCode = (error as { code?: string })?.code;
        const errMsg = error instanceof Error ? error.message : String(error);
        const isOfflineOrUnavailable =
          errCode === 'unavailable' ||
          errMsg.includes('unavailable') ||
          errMsg.includes('offline') ||
          errMsg.includes('Could not reach Cloud Firestore backend');

        if (!isOfflineOrUnavailable) {
          setCloudError('Unable to sync live with Cloud Firestore. Using local storage.');
          handleFirestoreError(error, OperationType.GET, 'jersey_orders');
        } else {
          console.warn('Firestore is connecting or operating in offline mode.');
        }
      }
    );

    // Sync team settings in real-time
    const settingsDocRef = doc(db, 'team_settings', SETTINGS_DOC_ID);
    const unsubscribeSettings = onSnapshot(
      settingsDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const cloudSettings = docSnap.data() as TeamSettings;
          setSettings((prev) => ({
            ...prev,
            ...cloudSettings,
            currency: 'Rs',
          }));
          if (cloudSettings.currency !== 'Rs') {
            setDoc(settingsDocRef, { ...cloudSettings, currency: 'Rs' }, { merge: true }).catch(() => {});
          }
        } else {
          // Initialize settings document in cloud
          setDoc(settingsDocRef, {
            ...settings,
            currency: 'Rs',
            updatedAt: new Date().toISOString(),
          }).catch((err) => {
            const errCode = (err as { code?: string })?.code;
            const errMsg = err instanceof Error ? err.message : String(err);
            if (errCode !== 'unavailable' && !errMsg.includes('unavailable')) {
              handleFirestoreError(err, OperationType.WRITE, `team_settings/${SETTINGS_DOC_ID}`);
            }
          });
        }
      },
      (error) => {
        const errCode = (error as { code?: string })?.code;
        const errMsg = error instanceof Error ? error.message : String(error);
        if (errCode !== 'unavailable' && !errMsg.includes('unavailable')) {
          handleFirestoreError(error, OperationType.GET, `team_settings/${SETTINGS_DOC_ID}`);
        }
      }
    );

    return () => {
      unsubscribeOrders();
      unsubscribeSettings();
    };
  }, []);

  // Persist friends to localStorage as offline cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FRIENDS, JSON.stringify(friends));
    } catch (e) {
      console.error('Failed to save friends to localStorage', e);
    }
  }, [friends]);

  // Persist settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  }, [settings]);

  // Sanitize object for Firestore to guarantee no undefined fields are passed
  const sanitizeForFirestore = <T extends Record<string, any>>(obj: T): T => {
    const clean: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val !== undefined) {
        clean[key] = val;
      }
    }
    return clean as T;
  };

  // Safe Firestore write helper that ensures offline/unavailable states do not cause fatal errors
  const safeFirestoreWrite = async (
    fn: () => Promise<void>,
    operationType: OperationType,
    path: string
  ) => {
    try {
      await fn();
    } catch (error) {
      const errCode = (error as { code?: string })?.code;
      const errMsg = error instanceof Error ? error.message : String(error);
      const isOfflineOrUnavailable =
        errCode === 'unavailable' ||
        errMsg.includes('unavailable') ||
        errMsg.includes('offline') ||
        errMsg.includes('Could not reach Cloud Firestore backend');
      if (!isOfflineOrUnavailable) {
        handleFirestoreError(error, operationType, path);
      } else {
        console.warn(`Firestore write queued in local cache for ${path}:`, errMsg);
      }
    }
  };

  // Seed sample team into Firestore
  const seedInitialSquadToCloud = async (ordersToSync: FriendJerseyOrder[]) => {
    for (const friend of ordersToSync) {
      const orderRef = doc(db, 'jersey_orders', friend.id);
      await safeFirestoreWrite(
        () =>
          setDoc(orderRef, {
            ...friend,
            updatedAt: new Date().toISOString(),
          }),
        OperationType.WRITE,
        `jersey_orders/${friend.id}`
      );
    }
  };

  // Add a new friend
  const addFriend = async (data: {
    name: string;
    phone: string;
    jerseySize: JerseySize;
    jerseyNumber: string;
    jerseyName: string;
    totalJerseyPrice: number;
    amountPaid: number;
    notes: string;
    initialPaymentMethod?: 'UPI' | 'Cash' | 'Bank Transfer' | 'Other';
    moneyIssue?: FriendJerseyOrder['moneyIssue'];
  }) => {
    const totalJerseyPrice = Math.max(0, Number(data.totalJerseyPrice) || 0);
    const amountPaid = Math.max(0, Number(data.amountPaid) || 0);
    const hasIssue = Boolean(data.moneyIssue?.hasIssue);
    const balance = calculateBalance(totalJerseyPrice, amountPaid);
    const status = calculatePaymentStatus(totalJerseyPrice, amountPaid, hasIssue);
    const now = new Date().toISOString();
    const friendId = `friend-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const paymentHistory = [];
    if (amountPaid > 0) {
      paymentHistory.push({
        id: `pay-${Date.now()}`,
        amount: amountPaid,
        date: now,
        method: data.initialPaymentMethod || 'UPI',
        notes: data.notes || 'Initial payment on registration',
      });
    }

    const newFriend: FriendJerseyOrder = {
      id: friendId,
      name: data.name.trim(),
      phone: data.phone.trim(),
      jerseySize: data.jerseySize,
      jerseyNumber: (data.jerseyNumber || '').trim(),
      jerseyName: (data.jerseyName || data.name).trim().toUpperCase(),
      totalJerseyPrice,
      amountPaid,
      balance,
      status,
      notes: data.notes.trim(),
      moneyIssue: data.moneyIssue,
      createdAt: now,
      updatedAt: now,
      paymentHistory,
    };

    // Optimistic local update
    setFriends((prev) => [newFriend, ...prev]);

    // Save directly to Firestore
    await safeFirestoreWrite(
      () => setDoc(doc(db, 'jersey_orders', friendId), sanitizeForFirestore(newFriend)),
      OperationType.WRITE,
      `jersey_orders/${friendId}`
    );

    return newFriend;
  };

  // Edit existing friend
  const updateFriend = async (
    id: string,
    data: {
      name: string;
      phone: string;
      jerseySize: JerseySize;
      jerseyNumber: string;
      jerseyName: string;
      totalJerseyPrice: number;
      amountPaid: number;
      notes: string;
      moneyIssue?: FriendJerseyOrder['moneyIssue'];
    }
  ) => {
    const totalJerseyPrice = Math.max(0, Number(data.totalJerseyPrice) || 0);
    const amountPaid = Math.max(0, Number(data.amountPaid) || 0);
    const hasIssue = Boolean(data.moneyIssue?.hasIssue);
    const balance = calculateBalance(totalJerseyPrice, amountPaid);
    const status = calculatePaymentStatus(totalJerseyPrice, amountPaid, hasIssue);
    const now = new Date().toISOString();

    let updatedFriend: FriendJerseyOrder | null = null;

    setFriends((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const candidate: FriendJerseyOrder = {
          ...item,
          name: data.name.trim(),
          phone: data.phone.trim(),
          jerseySize: data.jerseySize,
          jerseyNumber: data.jerseyNumber.trim(),
          jerseyName: (data.jerseyName || data.name).trim().toUpperCase(),
          totalJerseyPrice,
          amountPaid,
          balance,
          status,
          notes: data.notes.trim(),
          updatedAt: now,
        };
        if (data.moneyIssue) {
          candidate.moneyIssue = data.moneyIssue;
        } else {
          delete candidate.moneyIssue;
        }
        updatedFriend = candidate;
        return candidate;
      })
    );

    const fallback = friends.find((f) => f.id === id);
    const finalFriend = updatedFriend || fallback;

    if (finalFriend) {
      await safeFirestoreWrite(
        () => setDoc(doc(db, 'jersey_orders', id), sanitizeForFirestore(finalFriend)),
        OperationType.WRITE,
        `jersey_orders/${id}`
      );
    }
  };

  // Flag or resolve a money issue on a friend
  const setFriendMoneyIssue = async (
    friendId: string,
    issue: FriendJerseyOrder['moneyIssue']
  ) => {
    let updatedFriend: FriendJerseyOrder | null = null;
    const now = new Date().toISOString();

    setFriends((prev) =>
      prev.map((item) => {
        if (item.id !== friendId) return item;
        const hasIssue = Boolean(issue?.hasIssue);
        const newStatus = calculatePaymentStatus(item.totalJerseyPrice, item.amountPaid, hasIssue);

        const candidate: FriendJerseyOrder = {
          ...item,
          status: newStatus,
          updatedAt: now,
        };
        if (issue) {
          candidate.moneyIssue = issue;
        } else {
          delete candidate.moneyIssue;
        }
        updatedFriend = candidate;
        return candidate;
      })
    );

    const fallback = friends.find((f) => f.id === friendId);
    const finalFriend = updatedFriend || fallback;

    if (finalFriend) {
      await safeFirestoreWrite(
        () => setDoc(doc(db, 'jersey_orders', friendId), sanitizeForFirestore(finalFriend)),
        OperationType.WRITE,
        `jersey_orders/${friendId}`
      );
    }
  };

  // Delete friend
  const deleteFriend = async (id: string) => {
    setFriends((prev) => prev.filter((item) => item.id !== id));

    await safeFirestoreWrite(
      () => deleteDoc(doc(db, 'jersey_orders', id)),
      OperationType.DELETE,
      `jersey_orders/${id}`
    );
  };

  // Record an additional payment installment
  const addPayment = async (
    friendId: string,
    newPaymentAmount: number,
    method: 'UPI' | 'Cash' | 'Bank Transfer' | 'Other' = 'UPI',
    notes = '',
    resolveMoneyIssue = false
  ) => {
    const safeAmount = Math.max(0, Number(newPaymentAmount) || 0);
    if (safeAmount <= 0) return;

    const now = new Date().toISOString();
    let computedFriend: FriendJerseyOrder | null = null;

    setFriends((prev) =>
      prev.map((friend) => {
        if (friend.id !== friendId) return friend;

        const updatedAmountPaid = friend.amountPaid + safeAmount;
        const newBalance = calculateBalance(friend.totalJerseyPrice, updatedAmountPaid);
        const shouldResolve = resolveMoneyIssue || (friend.moneyIssue?.issueType === 'UPI_FAILED_OR_PENDING' && updatedAmountPaid >= friend.totalJerseyPrice);
        const hasIssue = shouldResolve ? false : Boolean(friend.moneyIssue?.hasIssue);
        const newStatus = calculatePaymentStatus(friend.totalJerseyPrice, updatedAmountPaid, hasIssue);

        const newTx = {
          id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          amount: safeAmount,
          date: now,
          method,
          notes: notes.trim() || `Payment received via ${method}`,
        };

        const candidate: FriendJerseyOrder = {
          ...friend,
          amountPaid: updatedAmountPaid,
          balance: newBalance,
          status: newStatus,
          updatedAt: now,
          paymentHistory: [newTx, ...friend.paymentHistory],
        };

        if (!shouldResolve && friend.moneyIssue) {
          candidate.moneyIssue = friend.moneyIssue;
        } else {
          delete candidate.moneyIssue;
        }

        computedFriend = candidate;
        return candidate;
      })
    );

    const fallbackTarget = friends.find((f) => f.id === friendId);
    const finalFriend = computedFriend || fallbackTarget;

    if (finalFriend) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_FRIENDS);
        const list = stored ? JSON.parse(stored) : [];
        const nextList = list.map((f: FriendJerseyOrder) => f.id === friendId ? finalFriend : f);
        localStorage.setItem(STORAGE_KEY_FRIENDS, JSON.stringify(nextList));
      } catch {}

      await safeFirestoreWrite(
        () => setDoc(doc(db, 'jersey_orders', friendId), sanitizeForFirestore(finalFriend)),
        OperationType.WRITE,
        `jersey_orders/${friendId}`
      );
    }
  };

  // Quick set status directly: PAID, HALF_PAID, NOT_PAID, or MONEY_ISSUE
  const quickSetStatus = async (
    friendId: string,
    targetStatus: PaymentStatus,
    issueDetails?: FriendJerseyOrder['moneyIssue']
  ) => {
    const now = new Date().toISOString();
    let computedFriend: FriendJerseyOrder | null = null;

    setFriends((prev) =>
      prev.map((friend) => {
        if (friend.id !== friendId) return friend;

        let newAmountPaid = friend.amountPaid;
        let newBalance = friend.balance;
        let newStatus: PaymentStatus = targetStatus;
        let newIssue: FriendJerseyOrder['moneyIssue'] | undefined = undefined;
        let newHistory = [...friend.paymentHistory];

        if (targetStatus === 'PAID') {
          const diff = Math.max(0, friend.totalJerseyPrice - friend.amountPaid);
          newAmountPaid = friend.totalJerseyPrice;
          newBalance = 0;
          newStatus = 'PAID';
          newIssue = undefined;
          if (diff > 0) {
            newHistory = [
              {
                id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                amount: diff,
                date: now,
                method: 'UPI',
                notes: 'Cleared full payment',
              },
              ...newHistory,
            ];
          }
        } else if (targetStatus === 'HALF_PAID') {
          const half = Math.round(friend.totalJerseyPrice / 2);
          newAmountPaid = half;
          newBalance = calculateBalance(friend.totalJerseyPrice, half);
          newStatus = 'HALF_PAID';
          newIssue = undefined;
          newHistory = [
            {
              id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              amount: half,
              date: now,
              method: 'UPI',
              notes: '50% advance installment',
            },
          ];
        } else if (targetStatus === 'NOT_PAID') {
          newAmountPaid = 0;
          newBalance = friend.totalJerseyPrice;
          newStatus = 'NOT_PAID';
          newIssue = undefined;
          newHistory = [];
        } else if (targetStatus === 'MONEY_ISSUE') {
          newStatus = 'MONEY_ISSUE';
          newIssue = issueDetails || {
            hasIssue: true,
            issueType: friend.amountPaid > friend.totalJerseyPrice ? 'OVERPAID' : 'UPI_FAILED_OR_PENDING',
            issueAmount: friend.balance || friend.totalJerseyPrice,
            issueNote: 'Payment discrepancy flagged by captain',
            flaggedAt: now,
          };
        }

        const candidate: FriendJerseyOrder = {
          ...friend,
          amountPaid: newAmountPaid,
          balance: newBalance,
          status: newStatus,
          updatedAt: now,
          paymentHistory: newHistory,
        };

        if (newIssue) {
          candidate.moneyIssue = newIssue;
        } else {
          delete candidate.moneyIssue;
        }

        computedFriend = candidate;
        return candidate;
      })
    );

    const fallbackTarget = friends.find((f) => f.id === friendId);
    let finalFriend: FriendJerseyOrder | null = computedFriend;

    if (!finalFriend && fallbackTarget) {
      const diff = Math.max(0, fallbackTarget.totalJerseyPrice - fallbackTarget.amountPaid);
      const fallbackFriend: FriendJerseyOrder = {
        ...fallbackTarget,
        amountPaid: targetStatus === 'PAID' ? fallbackTarget.totalJerseyPrice : fallbackTarget.amountPaid,
        balance: targetStatus === 'PAID' ? 0 : fallbackTarget.balance,
        status: targetStatus,
        updatedAt: now,
        paymentHistory: targetStatus === 'PAID' && diff > 0 ? [
          {
            id: `pay-${Date.now()}`,
            amount: diff,
            date: now,
            method: 'UPI',
            notes: 'Cleared full payment',
          },
          ...fallbackTarget.paymentHistory,
        ] : fallbackTarget.paymentHistory,
      };
      if (targetStatus === 'PAID' || targetStatus === 'NOT_PAID' || targetStatus === 'HALF_PAID') {
        delete fallbackFriend.moneyIssue;
      }
      finalFriend = fallbackFriend;
    }

    if (finalFriend) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_FRIENDS);
        const list = stored ? JSON.parse(stored) : [];
        const nextList = list.map((f: FriendJerseyOrder) => f.id === friendId ? finalFriend : f);
        localStorage.setItem(STORAGE_KEY_FRIENDS, JSON.stringify(nextList));
      } catch {}

      await safeFirestoreWrite(
        () => setDoc(doc(db, 'jersey_orders', friendId), sanitizeForFirestore(finalFriend!)),
        OperationType.WRITE,
        `jersey_orders/${friendId}`
      );
    }
  };

  // Quick mark fully paid
  const quickMarkPaid = async (friendId: string) => {
    await quickSetStatus(friendId, 'PAID');
  };

  // Delete an individual payment transaction
  const deletePaymentTransaction = async (friendId: string, txId: string) => {
    let updatedFriend: FriendJerseyOrder | null = null;

    setFriends((prev) =>
      prev.map((friend) => {
        if (friend.id !== friendId) return friend;

        const targetTx = friend.paymentHistory.find((t) => t.id === txId);
        if (!targetTx) return friend;

        const remainingHistory = friend.paymentHistory.filter((t) => t.id !== txId);
        const newAmountPaid = Math.max(0, friend.amountPaid - targetTx.amount);
        const newBalance = calculateBalance(friend.totalJerseyPrice, newAmountPaid);
        const newStatus = calculatePaymentStatus(friend.totalJerseyPrice, newAmountPaid);

        updatedFriend = {
          ...friend,
          amountPaid: newAmountPaid,
          balance: newBalance,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          paymentHistory: remainingHistory,
        };

        return updatedFriend;
      })
    );

    const fallback = friends.find((f) => f.id === friendId);
    const finalFriend = updatedFriend || fallback;

    if (finalFriend) {
      await safeFirestoreWrite(
        () => setDoc(doc(db, 'jersey_orders', friendId), sanitizeForFirestore(finalFriend)),
        OperationType.WRITE,
        `jersey_orders/${friendId}`
      );
    }
  };

  const resetSampleData = async () => {
    setFriends(INITIAL_SAMPLE_FRIENDS);
    seedInitialSquadToCloud(INITIAL_SAMPLE_FRIENDS);
  };

  const clearAllData = async () => {
    for (const f of friends) {
      await safeFirestoreWrite(
        () => deleteDoc(doc(db, 'jersey_orders', f.id)),
        OperationType.DELETE,
        `jersey_orders/${f.id}`
      );
    }
    setFriends([]);
  };

  const updateTeamSettings = async (newSettings: Partial<TeamSettings>) => {
    const updated: TeamSettings = { ...settings, ...newSettings, currency: 'Rs' };
    setSettings(updated);

    await safeFirestoreWrite(
      () =>
        setDoc(doc(db, 'team_settings', SETTINGS_DOC_ID), {
          ...updated,
          updatedAt: new Date().toISOString(),
        }),
      OperationType.WRITE,
      `team_settings/${SETTINGS_DOC_ID}`
    );
  };

  return {
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
  };
}

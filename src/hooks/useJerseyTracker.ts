import { useState, useEffect } from 'react';
import { FriendJerseyOrder, TeamSettings, JerseySize } from '../types/jersey';
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
  currency: '₹',
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
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
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
        setCloudError('Unable to sync live with Cloud Firestore. Using local storage.');
        handleFirestoreError(error, OperationType.GET, 'jersey_orders');
      }
    );

    // Sync team settings in real-time
    const settingsDocRef = doc(db, 'team_settings', SETTINGS_DOC_ID);
    const unsubscribeSettings = onSnapshot(
      settingsDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const cloudSettings = docSnap.data() as TeamSettings;
          setSettings((prev) => ({ ...prev, ...cloudSettings }));
        } else {
          // Initialize settings document in cloud
          setDoc(settingsDocRef, {
            ...settings,
            updatedAt: new Date().toISOString(),
          }).catch((err) => {
            handleFirestoreError(err, OperationType.WRITE, `team_settings/${SETTINGS_DOC_ID}`);
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `team_settings/${SETTINGS_DOC_ID}`);
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

  // Seed sample team into Firestore
  const seedInitialSquadToCloud = async (ordersToSync: FriendJerseyOrder[]) => {
    try {
      for (const friend of ordersToSync) {
        const orderRef = doc(db, 'jersey_orders', friend.id);
        await setDoc(orderRef, {
          ...friend,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'jersey_orders');
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
  }) => {
    const totalJerseyPrice = Math.max(0, Number(data.totalJerseyPrice) || 0);
    const amountPaid = Math.max(0, Number(data.amountPaid) || 0);
    const balance = calculateBalance(totalJerseyPrice, amountPaid);
    const status = calculatePaymentStatus(totalJerseyPrice, amountPaid);
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
      createdAt: now,
      updatedAt: now,
      paymentHistory,
    };

    // Optimistic local update
    setFriends((prev) => [newFriend, ...prev]);

    // Save directly to Firestore
    try {
      await setDoc(doc(db, 'jersey_orders', friendId), newFriend);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `jersey_orders/${friendId}`);
    }

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
    }
  ) => {
    const totalJerseyPrice = Math.max(0, Number(data.totalJerseyPrice) || 0);
    const amountPaid = Math.max(0, Number(data.amountPaid) || 0);
    const balance = calculateBalance(totalJerseyPrice, amountPaid);
    const status = calculatePaymentStatus(totalJerseyPrice, amountPaid);
    const now = new Date().toISOString();

    let updatedFriend: FriendJerseyOrder | null = null;

    setFriends((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        updatedFriend = {
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
        return updatedFriend;
      })
    );

    if (updatedFriend) {
      try {
        await setDoc(doc(db, 'jersey_orders', id), updatedFriend);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `jersey_orders/${id}`);
      }
    }
  };

  // Delete friend
  const deleteFriend = async (id: string) => {
    setFriends((prev) => prev.filter((item) => item.id !== id));

    try {
      await deleteDoc(doc(db, 'jersey_orders', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `jersey_orders/${id}`);
    }
  };

  // Record an additional payment installment
  const addPayment = async (
    friendId: string,
    newPaymentAmount: number,
    method: 'UPI' | 'Cash' | 'Bank Transfer' | 'Other' = 'UPI',
    notes = ''
  ) => {
    const safeAmount = Math.max(0, Number(newPaymentAmount) || 0);
    if (safeAmount <= 0) return;

    const now = new Date().toISOString();
    let updatedFriend: FriendJerseyOrder | null = null;

    setFriends((prev) =>
      prev.map((friend) => {
        if (friend.id !== friendId) return friend;

        const updatedAmountPaid = friend.amountPaid + safeAmount;
        const newBalance = calculateBalance(friend.totalJerseyPrice, updatedAmountPaid);
        const newStatus = calculatePaymentStatus(friend.totalJerseyPrice, updatedAmountPaid);

        const newTx = {
          id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          amount: safeAmount,
          date: now,
          method,
          notes: notes.trim() || `Payment received via ${method}`,
        };

        updatedFriend = {
          ...friend,
          amountPaid: updatedAmountPaid,
          balance: newBalance,
          status: newStatus,
          updatedAt: now,
          paymentHistory: [newTx, ...friend.paymentHistory],
        };

        return updatedFriend;
      })
    );

    if (updatedFriend) {
      try {
        await setDoc(doc(db, 'jersey_orders', friendId), updatedFriend);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `jersey_orders/${friendId}`);
      }
    }
  };

  // Quick mark fully paid
  const quickMarkPaid = async (friendId: string) => {
    let updatedFriend: FriendJerseyOrder | null = null;

    setFriends((prev) =>
      prev.map((friend) => {
        if (friend.id !== friendId) return friend;
        const remaining = friend.balance;
        if (remaining <= 0) return friend;

        const now = new Date().toISOString();
        const newTx = {
          id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          amount: remaining,
          date: now,
          method: 'UPI' as const,
          notes: 'Marked full payment',
        };

        updatedFriend = {
          ...friend,
          amountPaid: friend.totalJerseyPrice,
          balance: 0,
          status: 'PAID' as const,
          updatedAt: now,
          paymentHistory: [newTx, ...friend.paymentHistory],
        };

        return updatedFriend;
      })
    );

    if (updatedFriend) {
      try {
        await setDoc(doc(db, 'jersey_orders', friendId), updatedFriend);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `jersey_orders/${friendId}`);
      }
    }
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

    if (updatedFriend) {
      try {
        await setDoc(doc(db, 'jersey_orders', friendId), updatedFriend);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `jersey_orders/${friendId}`);
      }
    }
  };

  const resetSampleData = async () => {
    setFriends(INITIAL_SAMPLE_FRIENDS);
    seedInitialSquadToCloud(INITIAL_SAMPLE_FRIENDS);
  };

  const clearAllData = async () => {
    for (const f of friends) {
      try {
        await deleteDoc(doc(db, 'jersey_orders', f.id));
      } catch (e) {
        // continue
      }
    }
    setFriends([]);
  };

  const updateTeamSettings = async (newSettings: Partial<TeamSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    try {
      await setDoc(doc(db, 'team_settings', SETTINGS_DOC_ID), {
        ...updated,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `team_settings/${SETTINGS_DOC_ID}`);
    }
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
    deletePaymentTransaction,
    resetSampleData,
    clearAllData,
    updateTeamSettings,
  };
}
